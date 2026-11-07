import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { checkCode } from "@/lib/otp";

const MESSAGES = {
  invalid: ["That code isn't right.", 400],
  expired: ["That code has expired. Please request a new one.", 400],
  locked: ["Too many wrong attempts. Please request a new code.", 429],
} as const;

export async function POST(request: Request) {
  const limit = rateLimit(`reset:${clientIp(request)}`, 20, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

  // Check the password BEFORE using up an attempt on the code
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

  const result = await checkCode(email, "RESET", code);
  if (!result.ok) {
    const [error, status] = MESSAGES[result.reason];
    return NextResponse.json({ error }, { status });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const updated = await prisma.user.updateMany({
    where: { email },
    data: { password: passwordHash },
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "That code isn't right." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}