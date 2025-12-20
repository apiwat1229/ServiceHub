
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const username = 'apiwat.s';
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { username: username },
                { email: username } // Check if they tried logging in with email context but provided username
            ]
        }
    });

    if (user) {
        console.log('User found:', user);
        console.log('Role:', user.role);
        console.log('Status:', user.status);
    } else {
        console.log('User NOT found:', username);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
