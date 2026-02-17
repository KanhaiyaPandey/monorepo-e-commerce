import nodemailer from "nodemailer";
import dotenv from "dotenv";
import ejs from "ejs";
import path from "path";


dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  service: process.env.SMTP_SERVICE,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const renderEmailTemplate = async (templateName: string, data: Record<string, any>): Promise<string> => {
  const templatePath = path.join(
    process.cwd(),
    "auth-service",
    "src",
    "utils",
    "email-templates",
    `${templateName}.ejs`
  );
  return await ejs.renderFile(templatePath, data)
}

export const sendEmail = async (to: string, subject: string, templateName: string, data?: Record<string, any>) => {
    try {
        const html = await renderEmailTemplate(templateName, data || {});
        await transporter.sendMail({
            from: `<${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

export const sendOtpEmail = async (email: string, name: string, otp: string) => {
  const subject = "Your OTP Code";
  const html = `
    <p>Hi ${name},</p>
    <p>Your OTP code is: <strong>${otp}</strong></p>
    <p>This code will expire in 5 minutes.</p>
  `;
  await sendEmail(email, subject, html);
};