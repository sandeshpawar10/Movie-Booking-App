const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.mailtrap_smtp_host || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.mailtrap_smtp_port) || 2525,
    auth: {
        user: process.env.mailtrap_smtp_user,
        pass: process.env.mailtrap_smtp_pass
    }
});

const sendEmail = async (to, subject, text) => {
    try {
        const info = await transporter.sendMail({
            from: '"CineMagic 🎬" <noreply@cinemagic.com>',
            to,
            subject,
            text,
            html: text.replace(/\n/g, '<br>')
        });
        console.log(`[MAILER] Email sent to ${to}: ${info.messageId}`);
    } catch (err) {
        console.error(`[MAILER] Failed to send email to ${to}:`, err.message);
    }
};

module.exports = sendEmail;
