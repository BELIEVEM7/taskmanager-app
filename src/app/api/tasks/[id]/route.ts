import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

import { parseTaskOptions } from "@/lib/taskOptions";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const data: { title?: string; description?: string | null; completed?: boolean } = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }
    data.title = body.title.trim();
  }
  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== "string") {
      return NextResponse.json({ error: "Invalid description" }, { status: 400 });
    }
    data.description = body.description?.trim() || null;
  }
  if (body.completed !== undefined) {
    if (typeof body.completed !== "boolean") {
      return NextResponse.json({ error: "Completed must be true or false" }, { status: 400 });
    }
    data.completed = body.completed;
  }

  const options = parseTaskOptions(body);
  if ("error" in options) {
    return NextResponse.json({ error: options.error }, { status: 400 });
  }

  if (Object.keys(data).length === 0 && Object.keys(options.data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }



  // Only find the task if it belongs to this user
  const existing = await prisma.task.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const task = await prisma.task.update({ where: { id }, data: { ...data, ...options.data } });
  return NextResponse.json({ task });
}

//"_" means I don't need to use this parameter inside this function.
export async function DELETE(_request: Request, { params }: Context) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  const result = await prisma.task.deleteMany({
    where: { id, userId: session.userId },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

