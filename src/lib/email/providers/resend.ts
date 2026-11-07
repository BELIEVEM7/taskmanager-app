import { Resend } from "resend";
import type { EmailMessage } from "../types";

let client: Resend | null = null;

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  client ??= new Resend(apiKey);
  return client;
}

export async function sendWithResend(message: EmailMessage) {
  const from = process.env.MAIL_FROM;
  if (!from) throw new Error("MAIL_FROM is not set");

  const { error } = await getClient().emails.send({
    from,
    to: [message.to],
    subject: message.subject,
    text: message.text,
  });
  if (error) throw new Error(`Resend failed: ${error.message}`);
}