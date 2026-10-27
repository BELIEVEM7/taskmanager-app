import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(){
    const session = await getSession()
    if(!session){
        return NextResponse.json({  error: "Not authenticated" }, {status: 401});
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId}, //"Find the user whose database ID matches the ID stored in the session."
        select: {id: true, email: true, name: true },
    });
    if(!user){
        return NextResponse.json({ error: "Not authenticated" }, {status: 401 })
    }

    return NextResponse.json({ user });
}