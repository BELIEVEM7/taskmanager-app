import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

// Sending lives in src/lib/email/. Re-exported here so the routes keep
// importing sendCodeEmail from "@/lib/otp".
export { sendOTP as sendCodeEmail } from "@/lib/email/send-otp";

export type CodePurpose = "SIGNUP" | "RESET";

export const CODE_TTL_MS = 10 * 60 * 1000; // codes last 10 minutes
export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60 * 1000; // one new code per minute

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("JWT_SECRET must be set in .env");
}

export function generateCode() {
  // randomInt is cryptographically secure, unlike Math.random()
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

// A keyed hash: with only 1,000,000 possible codes, a plain hash could be
// reversed instantly if the table leaked. Without the secret it can't be.
function hashCode(email: string, purpose: CodePurpose, code: string) {
  return createHmac("sha256", secret!)
    .update(`otp:${purpose}:${email}:${code}`)
    .digest("hex");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

type Pending = { name?: string | null; passwordHash?: string };

export async function createCode(
  email: string,
  purpose: CodePurpose,
  pending: Pending = {}
) {
  const now = Date.now();

  // Tidy up expired rows as we go
  await prisma.emailCode.deleteMany({
    where: { expiresAt: { lt: new Date(now) } },
  });

  const existing = await prisma.emailCode.findUnique({
    where: { email_purpose: { email, purpose } },
  });
  if (existing) {
    const wait = existing.lastSentAt.getTime() + RESEND_COOLDOWN_MS - now;
    if (wait > 0) {
      return { ok: false as const, retryAfter: Math.ceil(wait / 1000) };
    }
  }

  const code = generateCode();
  const data = {
    codeHash: hashCode(email, purpose, code),
    attempts: 0,
    expiresAt: new Date(now + CODE_TTL_MS),
    lastSentAt: new Date(now),
    pendingName: pending.name ?? null,
    pendingPassword: pending.passwordHash ?? null,
  };

  await prisma.emailCode.upsert({
    where: { email_purpose: { email, purpose } },
    create: { email, purpose, ...data },
    update: data,
  });

  return { ok: true as const, code };
}

export async function checkCode(
  email: string,
  purpose: CodePurpose,
  code: string
) {
  // Count the attempt FIRST, in one atomic step. If we counted afterwards,
  // many parallel requests could slip in extra guesses.
  let record;
  try {
    record = await prisma.emailCode.update({
      where: { email_purpose: { email, purpose } },
      data: { attempts: { increment: 1 } },
    });
  } catch {
    // No code pending. Looks the same as a wrong code, on purpose.
    return { ok: false as const, reason: "invalid" as const };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.emailCode.deleteMany({ where: { id: record.id } });
    return { ok: false as const, reason: "expired" as const };
  }

  if (record.attempts > MAX_ATTEMPTS) {
    return { ok: false as const, reason: "locked" as const };
  }

  const matches =
    /^\d{6}$/.test(code) &&
    safeEqual(record.codeHash, hashCode(email, purpose, code));
  if (!matches) {
    return { ok: false as const, reason: "invalid" as const };
  }

  // Single use: only one request can delete the row, so only one can succeed
  const deleted = await prisma.emailCode.deleteMany({
    where: { id: record.id },
  });
  if (deleted.count === 0) {
    return { ok: false as const, reason: "invalid" as const };
  }

  return { ok: true as const, record };
}
