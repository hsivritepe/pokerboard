const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetPassword() {
    const email = 'hakan@sivritepe.com'; // Change this to the user's email
    const newPassword = 'newpassword123'; // Change this to the new password

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
    });

    console.log(`Password updated for user: ${user.email}`);
    console.log(`New password: ${newPassword}`);
}

resetPassword()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
