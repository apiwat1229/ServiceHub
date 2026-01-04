import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start syncing role IDs...');

    // 1. Fetch all roles to map name -> id
    const roles = await prisma.role.findMany();
    const roleMap = new Map<string, string>();
    const roleIds = new Set<string>();

    roles.forEach(r => {
        // Normalize role name comparison if needed, but assuming exact match or case-insensitive
        roleMap.set(r.name, r.id);
        roleMap.set(r.name.toLowerCase(), r.id);
        roleIds.add(r.id);
        console.log(`Found Role: ${r.name} -> ${r.id}`);
    });

    // Admin mapping fallback if name differs (e.g. 'admin' vs 'Administrator')
    // "Administrator" is standard, "Admin" might be used in user table

    // 2. Fetch all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        if (!user.role) {
            console.log(`User ${user.email} has no role string. Skipping.`);
            continue;
        }

        // Check if user.role IS ALREADY an ID
        let roleId: string | undefined = undefined;

        if (roleIds.has(user.role)) {
            console.log(`User ${user.email} has raw Role ID in role field.`);
            roleId = user.role;
        } else {
            // Try to find matching role by name
            roleId = roleMap.get(user.role) || roleMap.get(user.role.toLowerCase());
        }


        // Fallback for common mismatches
        if (!roleId) {
            if (user.role.toLowerCase() === 'admin' || user.role.toLowerCase() === 'administrator') {
                // Try searching for 'Administrator' or 'Admin' in roles
                const adminRole = roles.find(r => r.name.toLowerCase().includes('admin'));
                if (adminRole) roleId = adminRole.id;
            }
        }

        if (roleId) {
            if (user.roleId !== roleId) {
                console.log(`Updating User ${user.email}: role '${user.role}' -> roleId ${roleId}`);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { roleId: roleId }
                });
            } else {
                console.log(`User ${user.email} already has correct roleId.`);
            }
        } else {
            console.warn(`WARNING: Could not find Role ID for user ${user.email} with role string '${user.role}'`);
        }
    }

    console.log('Sync complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
