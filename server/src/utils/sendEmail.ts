import "dotenv/config";
import nodeMailer, { Transporter } from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

// ES Module replacement for __dirname
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

interface EmailOptions {
  email: string;
  subject: string;
  message: string
  // template: string;
  // data: { [key: string]: any };
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter: Transporter = nodeMailer.createTransport({
    host: process.env.SMPT_HOST,
    port: parseInt(process.env.SMPT_PORT || "587"),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // 👇 FIX: Resolves to 'dist/mails/<template>' in production and 'src/mails/<template>' in dev
  // const templatePath = path.join(__dirname, "../mails", options.template);

  // const html: string = await ejs.renderFile(templatePath, options.data);

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;