import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

import { parseTaskOptions } from "@/lib/taskOptions";

export async function GET(){
    const session = await getSession();
    if(!session){
        return NextResponse.json({ error: "Not authenticated"}, {status: 401});
    }

    const tasks = await prisma.task.findMany({
        where: { userId: session.userId },  
        orderBy: {createdAt: "desc"},
    });

    return NextResponse.json({ tasks });
}

export async function POST(request: Request){
    const session = await getSession();
    if(!session){
        return NextResponse.json({ error: "Not authenticated"}, {status: 401});
    }

    const body = await request.json().catch(() => null);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description =
        typeof body?.description === "string" ? body.description.trim() || null : null;

    if(!title){
        return NextResponse.json({ error: "Title is required"}, {status: 400 });
    }
    if(title.length > 200){
        return NextResponse.json({ error: "Title must be 200 characters or fewer"}, {status: 400 });
    }

    const options = parseTaskOptions(body ?? {});
    if ("error" in options) {
        return NextResponse.json({ error: options.error }, { status: 400 });
    }

    const task = await prisma.task.create({
        data: {title, description, userId: session.userId, ...options.data}, 
    })

    return NextResponse.json({ task }, { status: 201 });
}