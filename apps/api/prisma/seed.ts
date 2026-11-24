import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@clientsphere.local" },
    update: {},
    create: { name: "Demo Admin", email: "admin@clientsphere.local", passwordHash, role: Role.ADMIN }
  });
  const company = await prisma.company.upsert({
    where: { id: "demo-company" }, update: {},
    create: { id: "demo-company", name: "Northstar Systems", website: "https://example.com", industry: "Technology" }
  });
  await prisma.lead.upsert({
    where: { email: "rahul@example.com" }, update: {},
    create: { firstName: "Rahul", lastName: "Sharma", email: "rahul@example.com", source: "Website", score: 72, ownerId: admin.id }
  });
  await prisma.opportunity.createMany({ data: [
    { name: "Northstar CRM rollout", amount: 25000, probability: 60, stage: "PROPOSAL", companyId: company.id },
    { name: "Expansion package", amount: 12000, probability: 30, stage: "QUALIFICATION", companyId: company.id }
  ], skipDuplicates: true });
}
main().finally(() => prisma.$disconnect());
