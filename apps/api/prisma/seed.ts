import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
async function main() {
  const company = await prisma.company.upsert({
    where: { id: "demo-company" }, update: {},
    create: { id: "demo-company", name: "Northstar Systems", website: "https://example.com", industry: "Technology" }
  });
  await prisma.opportunity.createMany({ data: [
    { name: "Northstar CRM rollout", amount: 25000, probability: 60, stage: "PROPOSAL", companyId: company.id },
    { name: "Expansion package", amount: 12000, probability: 30, stage: "QUALIFICATION", companyId: company.id }
  ], skipDuplicates: true });
}
main().finally(() => prisma.$disconnect());
