import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setPendingSignup } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { createCode, sendCodeEmail, RESEND_COOLDOWN_MS } from "@/lib/otp";

function tooMany(message: string, retryAfter: number) {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

export async function POST(request: Request) {
  const ipLimit = rateLimit(`signup:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (!ipLimit.ok) {
    return tooMany("Too many sign-up attempts. Please try again later.", ipLimit.retryAfter);
  }

  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body?.confirmPassword === "string" ? body.confirmPassword : "";
  const name =
    typeof body?.name === "string" && body.name.trim() ? body.name.trim() : null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return NextResponse.json(
      { error: "Password must be between 8 and 72 characters" },
      { status: 400 }
    );
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }
  if (name && name.length > 100) {
    return NextResponse.json(
      { error: "Name must be 100 characters or fewer" },
      { status: 400 }
    );
  }

  // Limit codes per address, so this form can't be used to flood someone's inbox
  const emailLimit = rateLimit(`code-email:${email}`, 5, 60 * 60 * 1000);
  if (!emailLimit.ok) {
    return tooMany("Too many codes requested for this email. Please try again later.", emailLimit.retryAfter);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await createCode(email, "SIGNUP");
  if (result.ok) {
    try {
      await sendCodeEmail(email, result.code, "SIGNUP");
    } catch {
      // Remove the code so the cooldown doesn't block a retry
      await prisma.emailCode.deleteMany({ where: { email, purpose: "SIGNUP" } });
      return NextResponse.json(
        { error: "We couldn't send the email. Please try again." },
        { status: 500 }
      );
    }
  }

  await setPendingSignup({ email, name, passwordHash });

  return NextResponse.json({
    pendingVerification: true,
    email,
    sent: result.ok,
    retryAfter: result.ok ? RESEND_COOLDOWN_MS / 1000 : result.retryAfter,
  });
}