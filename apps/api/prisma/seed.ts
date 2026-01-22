import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Upsert Admin User
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
            name: 'Administrator',
            email: 'admin@haoyu.com',
            role: 'ADMIN',
        },
    });

    console.log('Created admin user:', admin.username);

    // Create some projects
    const projects = [
        {
            name: 'Haoyu Enterprise Migration',
            description: 'Migrating Haoyu to an enterprise architecture.',
            status: 'active',
            priority: 'P0',
            startDate: new Date(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            creatorId: admin.id,
            managerId: admin.id,
        },
        {
            name: 'AI Enhanced Analytics',
            description: 'Implementing AI-driven decision support.',
            status: 'planning',
            priority: 'P1',
            startDate: new Date(),
            endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
            creatorId: admin.id,
            managerId: admin.id,
        },
    ];

    for (const p of projects) {
        const project = await prisma.project.create({
            data: p,
        });
        console.log('Created project:', project.name);
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
