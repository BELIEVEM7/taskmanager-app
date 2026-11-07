import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { createCode, sendCodeEmail, RESEND_COOLDOWN_MS } from "@/lib/otp";

function tooMany(message: string, retryAfter: number) {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

export async function POST(request: Request) {
  const ipLimit = rateLimit(`forgot:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (!ipLimit.ok) {
    return tooMany("Too many requests. Please try again later.", ipLimit.retryAfter);
  }

  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  // Applies to every address, existing or not, so it reveals nothing
  const emailLimit = rateLimit(`code-email:${email}`, 5, 60 * 60 * 1000);
  if (!emailLimit.ok) {
    return tooMany("Too many codes requested for this email. Please try again later.", emailLimit.retryAfter);
  }

  // The real work happens after the response is sent, so the response time
  // is the same whether or not an account exists
  after(async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!user) return;

      const result = await createCode(email, "RESET");
      if (!result.ok) return; // cooldown: a code was sent a moment ago

      try {
        await sendCodeEmail(email, result.code, "RESET");
      } catch {
        await prisma.emailCode.deleteMany({ where: { email, purpose: "RESET" } });
      }
    } catch {
      console.error("forgot-password: request failed");
    }
  });

  return NextResponse.json({ ok: true, retryAfter: RESEND_COOLDOWN_MS / 1000 });
}