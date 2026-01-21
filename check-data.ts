import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.rawMaterialPlan.count();
    console.log(`Total RawMaterialPlan records: ${count}`);
    if (count > 0) {
        const latest = await prisma.rawMaterialPlan.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { planNo: true, status: true, creator: true }
        });
        console.log('Latest record:', latest);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
