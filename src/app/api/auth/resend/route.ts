import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPendingSignup } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { createCode, sendCodeEmail, RESEND_COOLDOWN_MS } from "@/lib/otp";

export async function POST(request: Request) {
  const ipLimit = rateLimit(`resend:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } }
    );
  }

  const pending = await getPendingSignup();
  if (!pending) {
    return NextResponse.json(
      { error: "Your sign-up session expired. Please start again." },
      { status: 400 }
    );
  }

  const emailLimit = rateLimit(`code-email:${pending.email}`, 5, 60 * 60 * 1000);
  if (!emailLimit.ok) {
    return NextResponse.json(
      { error: "Too many codes requested. Please try again later." },
      { status: 429, headers: { "Retry-After": String(emailLimit.retryAfter) } }
    );
  }

  const result = await createCode(pending.email, "SIGNUP");
  if (!result.ok) {
    return NextResponse.json(
      { error: `Please wait ${result.retryAfter} seconds before requesting another code.` },
      { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
    );
  }

  try {
    await sendCodeEmail(pending.email, result.code, "SIGNUP");
  } catch {
    await prisma.emailCode.deleteMany({
      where: { email: pending.email, purpose: "SIGNUP" },
    });
    return NextResponse.json(
      { error: "We couldn't send the email. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, retryAfter: RESEND_COOLDOWN_MS / 1000 });
}