import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  getPendingSignup,
  clearPendingSignup,
} from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { checkCode } from "@/lib/otp";

const MESSAGES = {
  invalid: ["That code isn't right.", 400],
  expired: ["That code has expired. Please request a new one.", 400],
  locked: ["Too many wrong attempts. Please request a new code.", 429],
} as const;

export async function POST(request: Request) {
  const limit = rateLimit(`verify:${clientIp(request)}`, 20, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const pending = await getPendingSignup();
  if (!pending) {
    return NextResponse.json(
      { error: "Your sign-up session expired. Please start again." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  const result = await checkCode(pending.email, "SIGNUP", code);
  if (!result.ok) {
    const [error, status] = MESSAGES[result.reason];
    return NextResponse.json({ error }, { status });
  }

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email: pending.email,
        password: pending.passwordHash,
        name: pending.name,
      },
      select: { id: true, email: true, name: true },
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      await clearPendingSignup();
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    throw err;
  }

  await clearPendingSignup();
  await createSession(user.id);
  return NextResponse.json({ user }, { status: 201 });
}