import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";

import TaskList from "@/components/TaskList";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  });
  if (!user) redirect("/login");

  const tasks = await prisma.task.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, description: true, completed: true },
  });

  return (
    <main className="mx-auto mt-12 max-w-xl px-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <LogoutButton />
      </header>
            <p className="mt-2 mb-6 text-muted-foreground">
        Hello, {user.name ?? user.email}
      </p>
      <TaskList tasks={tasks} />
    </main>
  );
}