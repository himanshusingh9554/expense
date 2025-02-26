import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io', // or whatever Mailtrap gives you
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_USER, 
      pass: process.env.MAILTRAP_PASS
    }
});

export const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    };
    return transporter.sendMail(mailOptions);
};
