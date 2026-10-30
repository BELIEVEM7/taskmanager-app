"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "./TaskList";

export default function TaskItem({ task }: { task: Task }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(method: "PATCH" | "DELETE", body?: unknown) {
    setError("");
    setBusy(true);
    try {
      await api(`/api/tasks/${task.id}`, method, body);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-md border px-3 py-2">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={task.completed}
          disabled={busy}
          aria-label={`Mark "${task.title}" as ${
            task.completed ? "incomplete" : "complete"
          }`}
          onCheckedChange={(checked) =>
            run("PATCH", { completed: checked === true })
          }
        />
        <span
          className={`flex-1 ${
            task.completed ? "text-muted-foreground line-through" : ""
          }`}
        >
          {task.title}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={busy}
          onClick={() => run("DELETE")}
        >
          Delete
        </Button>
      </div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </li>
  );
}