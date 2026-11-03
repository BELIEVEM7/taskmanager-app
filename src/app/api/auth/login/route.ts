import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// Compared against when the email doesn't exist, so timing is the same either way
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function POST(request: Request) {

  const limit = rateLimit(`login:${clientIp(request)}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }
  
  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}