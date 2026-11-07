import nodemailer from "nodemailer";
import type { EmailMessage } from "../types";

let transporter: Promise<nodemailer.Transporter> | null = null;

async function createTransporter() {
  // Creates a fresh throwaway inbox automatically, so there are no credentials to paste
  const account = await nodemailer.createTestAccount();
  console.log("[mail] Using a temporary Ethereal test inbox");
  return nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
}

export async function sendWithEthereal(message: EmailMessage) {
  transporter ??= createTransporter().catch((err) => {
    transporter = null; // allow a retry next time
    throw err;
  });
  const t = await transporter;

  const info = await t.sendMail({
    from: "Task Manager <noreply@example.com>",
    ...message,
  });

  const url = nodemailer.getTestMessageUrl(info);
  if (url) console.log(`[mail] Preview: ${url}`); // click it to read the email
}