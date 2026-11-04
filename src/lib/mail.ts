import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP settings are missing in .env");
  }

  const port = Number(SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // 465 uses TLS from the start; 587 upgrades after connecting
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
}) {
  const from = process.env.MAIL_FROM ?? process.env.SMTP_USER;
  await getTransporter().sendMail({ from, ...options });
}