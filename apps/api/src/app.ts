import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "./db";
import { authenticate, allowRoles } from "./middleware";

export const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN?.split(",") || true }));
app.use(express.json({ limit: "2mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 180 }));
app.get("/health", (_req, res) => res.json({ status: "ok", service: "clientsphere-api" }));
app.get("/api-docs", (_req, res) => res.json({ openapi: "3.0.0", info: { title: "ClientSphere API", version: "1.0.0" }, note: "Use the README route list; interactive Swagger UI can be added for deployment." }));

app.post("/api/auth/login", async (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Valid email and password are required" });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return res.status(401).json({ error: "Invalid credentials" });
  const expiresIn = (process.env.JWT_EXPIRES_IN || "8h") as jwt.SignOptions["expiresIn"];
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || "dev-only-secret", { expiresIn });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post("/api/auth/register", async (req, res) => {
  const parsed = z.object({ name: z.string().min(2).max(100), email: z.string().email(), password: z.string().min(8) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter your name, a valid email, and a password with at least 8 characters." });
  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "An account with this email already exists. Sign in instead." });
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({ data: { name: parsed.data.name, email, passwordHash } });
  const expiresIn = (process.env.JWT_EXPIRES_IN || "8h") as jwt.SignOptions["expiresIn"];
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || "dev-only-secret", { expiresIn });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
app.use("/api", authenticate);

app.get("/api/me", (req, res) => res.json({ user: req.user }));

const leadSchema = z.object({
  firstName: z.string().min(1), lastName: z.string().min(1),
  email: z.string().email().transform(v => v.toLowerCase()),
  phone: z.string().optional(), source: z.string().optional(),
  status: z.enum(["NEW","CONTACTED","QUALIFIED","UNQUALIFIED","CONVERTED"]).optional()
});
app.get("/api/leads", async (req, res) => {
  const q = String(req.query.q || "");
  const leads = await prisma.lead.findMany({
    where: q ? { OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {},
    include: { owner: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 100
  });
  res.json({ data: leads });
});
app.post("/api/leads", async (req, res) => {
  const p = leadSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid lead", details: p.error.flatten() });
  try {
    const lead = await prisma.lead.create({ data: { ...p.data, ownerId: req.user!.id, score: scoreLead(p.data) } });
    await prisma.auditLog.create({ data: { actorId: req.user!.id, entity: "Lead", entityId: lead.id, action: "CREATE" } });
    res.status(201).json({ data: lead });
  } catch (e: any) {
    if (e.code === "P2002") return res.status(409).json({ error: "A lead with this email already exists" });
    throw e;
  }
});
app.get("/api/leads/:id", async (req, res) => {
  const lead = await prisma.lead.findUnique({ where: { id: req.params.id }, include: { owner: { select: { name: true } } } });
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  if (req.user!.role === "SALES" && lead.ownerId !== req.user!.id) return res.status(403).json({ error: "You do not own this lead" });
  res.json({ data: lead });
});
app.patch("/api/leads/:id", async (req, res) => {
  const existing = await prisma.lead.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Lead not found" });
  if (req.user!.role === "SALES" && existing.ownerId !== req.user!.id) return res.status(403).json({ error: "You do not own this lead" });
  const p = leadSchema.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid lead", details: p.error.flatten() });
  const updated = await prisma.lead.update({ where: { id: existing.id }, data: p.data });
  await prisma.auditLog.create({ data: { actorId: req.user!.id, entity: "Lead", entityId: updated.id, action: "UPDATE" } });
  res.json({ data: updated });
});
app.delete("/api/leads/:id", allowRoles("ADMIN","MANAGER"), async (req, res) => {
  try { await prisma.lead.delete({ where: { id: req.params.id } }); res.status(204).send(); }
  catch { res.status(404).json({ error: "Lead not found" }); }
});

app.get("/api/contacts", async (_req, res) => res.json({ data: await prisma.contact.findMany({ include: { companies: { include: { company: true } } }, take: 100, orderBy: { createdAt: "desc" } }) }));
app.post("/api/contacts", async (req, res) => {
  const p = z.object({ firstName:z.string().min(1), lastName:z.string().min(1), email:z.string().email().optional(), phone:z.string().optional(), title:z.string().optional() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error:"Invalid contact", details:p.error.flatten() });
  res.status(201).json({ data: await prisma.contact.create({ data:p.data }) });
});
app.get("/api/companies", async (_req,res) => res.json({ data: await prisma.company.findMany({ include:{ contacts:{include:{contact:true}} }, take:100 }) }));
app.post("/api/companies", async (req,res) => {
  const p=z.object({name:z.string().min(1),website:z.string().url().optional(),industry:z.string().optional()}).safeParse(req.body);
  if(!p.success) return res.status(400).json({error:"Invalid company",details:p.error.flatten()});
  res.status(201).json({data:await prisma.company.create({data:p.data})});
});
app.get("/api/opportunities", async (_req,res) => res.json({data:await prisma.opportunity.findMany({include:{company:true},orderBy:{updatedAt:"desc"}})}));
app.post("/api/opportunities", async (req,res) => {
  const p=z.object({name:z.string().min(1),amount:z.coerce.number().nonnegative(),probability:z.number().int().min(0).max(100).optional(),stage:z.enum(["PROSPECTING","QUALIFICATION","PROPOSAL","NEGOTIATION","WON","LOST"]).optional(),companyId:z.string().optional(),expectedClose:z.string().datetime().optional()}).safeParse(req.body);
  if(!p.success) return res.status(400).json({error:"Invalid opportunity",details:p.error.flatten()});
  const data={...p.data,expectedClose:p.data.expectedClose?new Date(p.data.expectedClose):undefined};
  res.status(201).json({data:await prisma.opportunity.create({data})});
});
app.patch("/api/opportunities/:id", async(req,res)=>{
  const p=z.object({stage:z.enum(["PROSPECTING","QUALIFICATION","PROPOSAL","NEGOTIATION","WON","LOST"]).optional(),probability:z.number().int().min(0).max(100).optional(),amount:z.number().nonnegative().optional()}).safeParse(req.body);
  if(!p.success) return res.status(400).json({error:"Invalid update"});
  try { res.json({data:await prisma.opportunity.update({where:{id:req.params.id},data:p.data})}); }
  catch { res.status(404).json({error:"Opportunity not found"}); }
});
app.get("/api/activities", async (_req,res)=>res.json({data:await prisma.activity.findMany({include:{contact:true,user:{select:{name:true}}},orderBy:{createdAt:"desc"},take:100})}));
app.post("/api/activities", async(req,res)=>{
  const p=z.object({type:z.enum(["CALL","EMAIL","MEETING","TASK","NOTE"]),subject:z.string().min(1),description:z.string().optional(),dueAt:z.string().datetime().optional(),contactId:z.string().optional()}).safeParse(req.body);
  if(!p.success) return res.status(400).json({error:"Invalid activity",details:p.error.flatten()});
  res.status(201).json({data:await prisma.activity.create({data:{...p.data,dueAt:p.data.dueAt?new Date(p.data.dueAt):undefined,userId:req.user!.id}})});
});
app.get("/api/dashboard/summary", async (_req,res)=>{
  const [leads,contacts,companies,opportunities,won]=await Promise.all([
    prisma.lead.count(),prisma.contact.count(),prisma.company.count(),prisma.opportunity.findMany(),prisma.opportunity.aggregate({where:{stage:"WON"},_sum:{amount:true}})
  ]);
  const pipeline=opportunities.reduce((s,o)=>s+Number(o.amount),0);
  const weighted=opportunities.reduce((s,o)=>s+Number(o.amount)*o.probability/100,0);
  res.json({data:{leads,contacts,companies,opportunities:opportunities.length,pipelineValue:pipeline,weightedForecast:weighted,wonValue:Number(won._sum.amount||0)}});
});
app.post("/api/imports/leads", async(req,res)=>{
  const p=z.object({rows:z.array(z.any()).max(5000)}).safeParse(req.body);
  if(!p.success) return res.status(400).json({error:"Provide rows array (maximum 5000)"});
  const accepted:any[]=[], rejected:any[]=[];
  for(let i=0;i<p.data.rows.length;i++){
    const row=p.data.rows[i];
    const parsed=leadSchema.safeParse({firstName:row.firstName,lastName:row.lastName,email:row.email,phone:row.phone,source:row.source});
    if(!parsed.success){rejected.push({row:i+1,reason:"Missing or invalid required fields"});continue;}
    try { accepted.push(await prisma.lead.create({data:{...parsed.data,ownerId:req.user!.id,score:scoreLead(parsed.data)}})); }
    catch(e:any){rejected.push({row:i+1,reason:e.code==="P2002"?"Duplicate email":"Could not import row"});}
  }
  res.json({data:{imported:accepted.length,rejected:rejected.length,errors:rejected}});
});
app.get("/api/workflows", async(_req,res)=>res.json({data:await prisma.workflow.findMany({orderBy:{createdAt:"desc"}})}));
app.post("/api/workflows", allowRoles("ADMIN","MANAGER"), async(req,res)=>{
  const p=z.object({name:z.string().min(1),trigger:z.string().min(1),condition:z.string().min(1),action:z.enum(["CREATE_FOLLOWUP","LOG_ONLY"])}).safeParse(req.body);
  if(!p.success)return res.status(400).json({error:"Invalid workflow"});
  res.status(201).json({data:await prisma.workflow.create({data:p.data})});
});
app.use((err:any,_req:any,res:any,_next:any)=>{ console.error(err); res.status(500).json({error:"Internal server error"}); });

function scoreLead(lead:{email:string;phone?:string;source?:string}) {
  return Math.min(100, 30 + (lead.phone?20:0) + (lead.source?15:0) + (lead.email.includes("company")?10:0));
}
