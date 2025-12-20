
import { PrismaClient } from '@prisma/client';

// Hardcoding for the script execution context since .env is blocked
// Standard local dev or docker url usually works if service is up
// Using the url found in schema.prisma usually requires env var
// I will try to assign process.env.DATABASE_URL if not set

if (!process.env.DATABASE_URL) {
    // Try to use a default local connection string often used in this project setup
    // Or rely on the environment where `npm run dev` is running having it set?
    // `npx ts-node` might not inherit it if not explicitly passed.
    // Let's assume standard docker postgres port 5432
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/myapp?schema=public";
}

const prisma = new PrismaClient();

async function main() {
    console.log('Starting role migration...');

    // Update ADMIN -> admin
    const updateAdmin = await prisma.user.updateMany({
        where: { role: 'ADMIN' as any }, // Cast as any because schemas might be strictly typed to Enum
        data: { role: 'admin' as any }
    });
    console.log(`Updated ${updateAdmin.count} users from ADMIN to admin`);

    // Update USER -> staff_1
    // Note: Previous migration might have failed or not covered all cases
    const updateUser = await prisma.user.updateMany({
        where: { role: 'USER' as any },
        data: { role: 'staff_1' as any }
    });
    console.log(`Updated ${updateUser.count} users from USER to staff_1`);

    // Verify
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    console.log('Current users:', users);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
