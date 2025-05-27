import nodemailer from 'nodemailer';

// Email templates
export const emailTemplates = {
    passwordReset: (resetLink: string) => ({
        subject: 'Reset Your Password',
        text: `Click the following link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Reset Your Password</h2>
                <p>Click the following link to reset your password:</p>
                <p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
                <p style="color: #666;">This link will expire in 1 hour.</p>
                <p style="color: #666;">If you didn't request this password reset, please ignore this email.</p>
            </div>
        `,
    }),
    welcome: (name: string) => ({
        subject: 'Welcome to Pokerboard!',
        text: `Welcome to Pokerboard, ${name}!\n\nThank you for joining us. We're excited to have you on board.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to Pokerboard!</h2>
                <p>Hi ${name},</p>
                <p>Thank you for joining us. We're excited to have you on board.</p>
                <p>Get started by creating your first game room or joining an existing one.</p>
            </div>
        `,
    }),
};

// Create reusable transporter object using SMTP transport
const createTransporter = async () => {
    const config = {
        host: process.env.DEV_SMTP_HOST || 'smtp.mailtrap.io',
        port: parseInt(process.env.DEV_SMTP_PORT || '2525'),
        auth: {
            user: process.env.DEV_SMTP_USER,
            pass: process.env.DEV_SMTP_PASSWORD,
        },
        debug: true, // Enable debug logging
        logger: true, // Enable logger
    };

    console.log('Email configuration:', {
        host: config.host,
        port: config.port,
        auth: {
            user: config.auth.user,
            pass: '***', // Hide password in logs
        },
    });

    const transporter = nodemailer.createTransport(config);

    // Verify connection configuration
    try {
        await transporter.verify();
        console.log('SMTP connection verified successfully');
    } catch (error) {
        console.error('SMTP connection verification failed:', error);
        throw error;
    }

    return transporter;
};

type EmailOptions = {
    to: string;
    subject: string;
    text: string;
    html: string;
};

export const sendEmail = async (options: EmailOptions) => {
    try {
        console.log('Attempting to send email to:', options.to);
        const transporter = await createTransporter();

        const mailOptions = {
            from:
                process.env.EMAIL_FROM ||
                '"Pokerboard" <noreply@pokerboard.com>',
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        };

        console.log('Mail options:', {
            ...mailOptions,
            text: mailOptions.text.substring(0, 50) + '...',
            html: '(HTML content)',
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Detailed email error:', error);
        throw error;
    }
};
