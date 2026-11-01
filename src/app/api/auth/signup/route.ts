import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name =
    typeof body?.name === "string" && body.name.trim()
      ? body.name.trim()
      : null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 }
    );
  }
  if (password.length < 8 || password.length > 72) {
    return NextResponse.json(
      { error: "Password must be between 8 and 72 characters" },
      { status: 400 }
    );
  }
  if (name && name.length > 100) {
    return NextResponse.json(
      { error: "Name must be 100 characters or fewer" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
      select: { id: true, email: true, name: true },
    });
  } catch (err) {
    // P2002 = Prisma's code for a unique constraint violation
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }
    throw err;
  }

  await createSession(user.id);
  return NextResponse.json({ user }, { status: 201 });
}