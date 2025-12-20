
import { PrismaClient } from '@my-app/database';
import * as bcrypt from 'bcrypt';

async function main() {
    const prisma = new PrismaClient();

    try {
        const username = 'apiwat.s';
        const password = 'Copterida@1229';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Resetting user: ${username}`);

        const user = await prisma.user.upsert({
            where: { username: username },
            update: {
                password: hashedPassword,
                role: 'admin',
                status: 'ACTIVE'
            },
            create: {
                username: username,
                password: hashedPassword,
                email: 'apiwat.s@ytrc.co.th', // Assuming this email, or dummy
                firstName: 'Apiwat',
                lastName: 'S',
                role: 'admin',
                status: 'ACTIVE',
                position: 'Administrator',
                department: 'IT'
            }
        });

        console.log('✅ User successfully reset/created:', {
            id: user.id,
            username: user.username,
            role: user.role,
            status: user.status
        });

    } catch (error) {
        console.error('❌ Failed to reset user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
