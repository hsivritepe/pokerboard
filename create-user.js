const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser() {
    try {
        // Create a test user
        const hashedPassword = await bcrypt.hash('password123', 10);

        const user = await prisma.user.create({
            data: {
                name: 'Test User',
                email: 'test@example.com',
                password: hashedPassword,
                isAdmin: true,
            },
        });

        console.log('✅ User created successfully:');
        console.log('ID:', user.id);
        console.log('Name:', user.name);
        console.log('Email:', user.email);
        console.log('Is Admin:', user.isAdmin);
        console.log('');
        console.log('🔑 Login credentials:');
        console.log('Email: test@example.com');
        console.log('Password: password123');
    } catch (error) {
        console.error('❌ Error creating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createUser();
