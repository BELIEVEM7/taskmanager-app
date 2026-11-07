import { sendWithEthereal } from "./providers/ethereal";
import { sendWithResend } from "./providers/resend";
import type { EmailMessage } from "./types";

type Purpose = "SIGNUP" | "RESET";

export async function sendOTP(email: string, otp: string, purpose: Purpose) {
  const subject =
    purpose === "SIGNUP" ? "Your verification code" : "Your password reset code";
  const action =
    purpose === "SIGNUP" ? "verify your email address" : "reset your password";

  const message: EmailMessage = {
    to: email,
    subject,
    text: `Your code to ${action} is: ${otp}\n\nIt expires in 10 minutes. If you didn't request this, you can ignore this email.`,
  };

  if (process.env.NODE_ENV === "development") {
    return sendWithEthereal(message);
  }
  return sendWithResend(message);
}