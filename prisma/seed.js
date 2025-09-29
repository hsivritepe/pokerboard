const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    try {
        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await prisma.user.upsert({
            where: { email: 'hakan@sivritepe.com' },
            update: {},
            create: {
                name: 'Hakan Sivritepe',
                email: 'hakan@sivritepe.com',
                password: adminPassword,
                isAdmin: true,
            },
        });
        console.log('✅ Admin user created:', admin.email);

        // Create test players
        const players = [
            { name: 'Halil Zurnacı', email: 'halil@zurnaci.com' },
            { name: 'Serkan Demirkol', email: 'serkan@demirkol.com' },
            { name: 'Murat Can', email: 'murat@can.com' },
            { name: 'Tolga Öz', email: 'tolga@oz.com' },
            { name: 'Gökhan Uzun', email: 'gokhan@uzun.com' },
            { name: 'Cengiz Aksu', email: 'cengiz@aksu.com' },
            { name: 'Tuğberk Özdemir', email: 'tugberk@ozdemir.com' },
            { name: 'Bülent Sezer', email: 'bulent@sezer.com' },
            { name: 'Armağan Uysal', email: 'armagan@uysal.com' },
            { name: 'Tolga Sivritepe', email: 'tolga@sivritepe.com' },
        ];

        const defaultPassword = await bcrypt.hash('password123', 10);

        for (const player of players) {
            const user = await prisma.user.upsert({
                where: { email: player.email },
                update: {},
                create: {
                    name: player.name,
                    email: player.email,
                    password: defaultPassword,
                    isAdmin: player.email === 'admin@pokerboard.com',
                },
            });
            console.log(
                `✅ Player created: ${user.name} (${user.email})`
            );
        }

        // Create a sample completed session
        const sampleSession = await prisma.gameSession.upsert({
            where: { id: 'sample-session-001' },
            update: {},
            create: {
                id: 'sample-session-001',
                date: new Date('2025-09-25T15:00:00Z'),
                location: 'Allsancak',
                gameType: "No Limit Hold'em",
                status: 'COMPLETED',
                buyIn: 40000,
                sessionCost: 27700,
                hostId: admin.id,
            },
        });
        console.log(
            '✅ Sample session created:',
            sampleSession.location
        );

        // Create player sessions for the sample session
        const playerSessions = [
            {
                userId: 'halil@zurnaci.com',
                initialBuyIn: 40000,
                currentStack: 86400,
                status: 'CASHED_OUT',
            },
            {
                userId: 'serkan@demirkol.com',
                initialBuyIn: 40000,
                currentStack: 115900,
                status: 'CASHED_OUT',
            },
            {
                userId: 'murat@can.com',
                initialBuyIn: 40000,
                currentStack: 36500,
                status: 'CASHED_OUT',
            },
            {
                userId: 'tolga@oz.com',
                initialBuyIn: 40000,
                currentStack: 70000,
                status: 'CASHED_OUT',
            },
            {
                userId: 'gokhan@uzun.com',
                initialBuyIn: 40000,
                currentStack: 75700,
                status: 'CASHED_OUT',
            },
            {
                userId: 'cengiz@aksu.com',
                initialBuyIn: 80000,
                currentStack: 0,
                status: 'CASHED_OUT',
            },
            {
                userId: 'tugberk@ozdemir.com',
                initialBuyIn: 80000,
                currentStack: 0,
                status: 'CASHED_OUT',
            },
            {
                userId: 'hakan@sivritepe.com',
                initialBuyIn: 40000,
                currentStack: 55500,
                status: 'CASHED_OUT',
            },
            {
                userId: 'bulent@sezer.com',
                initialBuyIn: 40000,
                currentStack: 0,
                status: 'CASHED_OUT',
            },
            {
                userId: 'armagan@uysal.com',
                initialBuyIn: 120000,
                currentStack: 120000,
                status: 'CASHED_OUT',
            },
        ];

        for (const playerSession of playerSessions) {
            const user = await prisma.user.findUnique({
                where: { email: playerSession.userId },
            });

            if (user) {
                // Check if player session already exists
                const existingSession =
                    await prisma.playerSession.findFirst({
                        where: {
                            sessionId: sampleSession.id,
                            userId: user.id,
                        },
                    });

                if (!existingSession) {
                    await prisma.playerSession.create({
                        data: {
                            sessionId: sampleSession.id,
                            userId: user.id,
                            initialBuyIn: playerSession.initialBuyIn,
                            currentStack: playerSession.currentStack,
                            status: playerSession.status,
                        },
                    });
                    console.log(
                        `✅ Player session created: ${user.name}`
                    );
                } else {
                    console.log(
                        `⏭️ Player session already exists: ${user.name}`
                    );
                }
            }
        }

        // Create sample transactions
        const transactions = [
            {
                email: 'halil@zurnaci.com',
                type: 'BUY_IN',
                amount: 40000,
            },
            {
                email: 'serkan@demirkol.com',
                type: 'BUY_IN',
                amount: 40000,
            },
            { email: 'murat@can.com', type: 'BUY_IN', amount: 40000 },
            { email: 'tolga@oz.com', type: 'BUY_IN', amount: 40000 },
            {
                email: 'gokhan@uzun.com',
                type: 'BUY_IN',
                amount: 40000,
            },
            {
                email: 'cengiz@aksu.com',
                type: 'BUY_IN',
                amount: 40000,
            },
            {
                email: 'cengiz@aksu.com',
                type: 'REBUY',
                amount: 40000,
            },
            {
                email: 'tugberk@ozdemir.com',
                type: 'BUY_IN',
                amount: 40000,
            },
            {
                email: 'tugberk@ozdemir.com',
                type: 'REBUY',
                amount: 40000,
            },
            {
                email: 'hakan@sivritepe.com',
                type: 'BUY_IN',
                amount: 40000,
            },
            {
                email: 'bulent@sezer.com',
                type: 'BUY_IN',
                amount: 40000,
            },
            {
                email: 'armagan@uysal.com',
                type: 'BUY_IN',
                amount: 40000,
            },
            {
                email: 'armagan@uysal.com',
                type: 'REBUY',
                amount: 40000,
            },
            {
                email: 'armagan@uysal.com',
                type: 'REBUY',
                amount: 40000,
            },
        ];

        for (const transaction of transactions) {
            const user = await prisma.user.findUnique({
                where: { email: transaction.email },
            });

            if (user) {
                const playerSession =
                    await prisma.playerSession.findFirst({
                        where: {
                            sessionId: sampleSession.id,
                            userId: user.id,
                        },
                    });

                if (playerSession) {
                    await prisma.transaction.create({
                        data: {
                            playerSessionId: playerSession.id,
                            sessionId: sampleSession.id,
                            userId: user.id,
                            type: transaction.type,
                            amount: transaction.amount,
                        },
                    });
                    console.log(
                        `✅ Transaction created: ${user.name} - ${transaction.type} ${transaction.amount}`
                    );
                }
            }
        }

        console.log('🎉 Database seeding completed successfully!');
        console.log('');
        console.log('🔑 Login Credentials:');
        console.log('Admin: admin@pokerboard.com / admin123');
        console.log('Players: [email] / password123');
        console.log('');
        console.log('📊 Sample Session:');
        console.log(`Session ID: ${sampleSession.id}`);
        console.log('Location: Allsancak');
        console.log('Status: COMPLETED');
        console.log('Session Cost: ₺27,700');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
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
