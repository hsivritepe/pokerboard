#!/usr/bin/env node

/**
 * Supabase Database Seeding Script
 *
 * This script seeds the Supabase database with initial data.
 * Run this script with the Supabase DATABASE_URL:
 *
 * DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres" node seed-supabase.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Supabase database seeding...');

    try {
        // Create admin users
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admins = [
            { name: 'Hakan Sivritepe', email: 'hakan@sivritepe.com' },
            { name: 'Serkan Demirkol', email: 'serkan@demirkol.com' },
        ];

        console.log('👤 Creating admin users...');
        for (const adminData of admins) {
            const admin = await prisma.user.upsert({
                where: { email: adminData.email },
                update: {},
                create: {
                    name: adminData.name,
                    email: adminData.email,
                    password: adminPassword,
                    isAdmin: true,
                },
            });
            console.log('✅ Admin user created:', admin.email);
        }

        // Get the first admin for the sample session
        const firstAdmin = await prisma.user.findUnique({
            where: { email: admins[0].email },
        });

        if (!firstAdmin) {
            throw new Error('First admin user not found');
        }

        // Create test players
        const players = [
            { name: 'Halil Zurnacı', email: 'halil@zurnaci.com' },
            { name: 'Murat Can', email: 'murat@can.com' },
            { name: 'Tolga Öz', email: 'tolga@oz.com' },
            { name: 'Gökhan Uzun', email: 'gokhan@uzun.com' },
            { name: 'Cengiz Aksu', email: 'cengiz@aksu.com' },
            { name: 'Tuğberk Özdemir', email: 'tugberk@ozdemir.com' },
            { name: 'Bülent Sezer', email: 'bulent@sezer.com' },
            { name: 'Armağan Uysal', email: 'armagan@uysal.com' },
            { name: 'Tolga Sivritepe', email: 'tolga@sivritepe.com' },
        ];

        console.log('👥 Creating test players...');
        const defaultPassword = await bcrypt.hash('password123', 10);

        for (const playerData of players) {
            const player = await prisma.user.upsert({
                where: { email: playerData.email },
                update: {},
                create: {
                    name: playerData.name,
                    email: playerData.email,
                    password: defaultPassword,
                    isAdmin: false,
                },
            });
            console.log('✅ Player created:', player.email);
        }

        // Create a sample game session
        console.log('🎮 Creating sample game session...');
        const sampleSession = await prisma.gameSession.upsert({
            where: { id: 'sample-session-001' },
            update: {},
            create: {
                id: 'sample-session-001',
                date: new Date('2025-09-25T15:00:00Z'),
                location: 'Allsancak Tontiş Bar',
                gameType: "No Limit Hold'em",
                status: 'COMPLETED',
                buyIn: 40000,
                sessionCost: 27700,
                discount: 0,
                hostId: firstAdmin.id,
            },
        });
        console.log('✅ Sample session created:', sampleSession.id);

        // Create player sessions for the sample session
        console.log('🎯 Creating player sessions...');
        const playerSessionsData = [
            {
                userId: 'halil@zurnaci.com',
                buyIn: 40000,
                cashOut: 65000,
            },
            { userId: 'murat@can.com', buyIn: 40000, cashOut: 20000 },
            { userId: 'tolga@oz.com', buyIn: 40000, cashOut: 30000 },
            {
                userId: 'gokhan@uzun.com',
                buyIn: 40000,
                cashOut: 55000,
            },
            {
                userId: 'cengiz@aksu.com',
                buyIn: 40000,
                cashOut: 15000,
            },
            {
                userId: 'tugberk@ozdemir.com',
                buyIn: 40000,
                cashOut: 25000,
            },
            {
                userId: 'bulent@sezer.com',
                buyIn: 40000,
                cashOut: 10000,
            },
            {
                userId: 'armagan@uysal.com',
                buyIn: 40000,
                cashOut: 35000,
            },
            {
                userId: 'tolga@sivritepe.com',
                buyIn: 40000,
                cashOut: 45000,
            },
        ];

        for (const sessionData of playerSessionsData) {
            const user = await prisma.user.findUnique({
                where: { email: sessionData.userId },
            });

            if (user) {
                const playerSession =
                    await prisma.playerSession.findFirst({
                        where: {
                            sessionId: sampleSession.id,
                            userId: user.id,
                        },
                    });

                if (!playerSession) {
                    await prisma.playerSession.create({
                        data: {
                            sessionId: sampleSession.id,
                            userId: user.id,
                            buyIn: sessionData.buyIn,
                            cashOut: sessionData.cashOut,
                        },
                    });
                    console.log(
                        `✅ Player session created for ${user.name}`
                    );
                }
            }
        }

        // Create some transactions
        console.log('💰 Creating sample transactions...');
        const transactionData = [
            {
                userId: 'halil@zurnaci.com',
                amount: 40000,
                type: 'BUY_IN',
            },
            {
                userId: 'halil@zurnaci.com',
                amount: 25000,
                type: 'BUY_IN',
            },
            {
                userId: 'halil@zurnaci.com',
                amount: 65000,
                type: 'CASH_OUT',
            },
            {
                userId: 'murat@can.com',
                amount: 40000,
                type: 'BUY_IN',
            },
            {
                userId: 'murat@can.com',
                amount: 20000,
                type: 'CASH_OUT',
            },
        ];

        for (const txData of transactionData) {
            const user = await prisma.user.findUnique({
                where: { email: txData.userId },
            });

            if (user) {
                await prisma.transaction.create({
                    data: {
                        userId: user.id,
                        sessionId: sampleSession.id,
                        amount: txData.amount,
                        type: txData.type,
                        description: `${
                            txData.type === 'BUY_IN'
                                ? 'Buy-in'
                                : 'Cash-out'
                        } for ${user.name}`,
                    },
                });
            }
        }

        console.log(
            '🎉 Supabase database seeding completed successfully!'
        );
        console.log('');
        console.log('📋 Login Credentials:');
        console.log('Admin 1: hakan@sivritepe.com / admin123');
        console.log('Admin 2: serkan@demirkol.com / admin123');
        console.log('');
        console.log('👥 Test Players (password: password123):');
        players.forEach((player) => {
            console.log(`- ${player.name}: ${player.email}`);
        });
    } catch (error) {
        console.error('❌ Error seeding Supabase database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
