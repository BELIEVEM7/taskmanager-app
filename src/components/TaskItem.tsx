"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import TaskMeta from "./TaskMeta";
import TaskOptionsFields, { type TaskOptions } from "./TaskOptionsFields";
import type { Task } from "./TaskList";
import { PRIORITY_STYLES } from "@/lib/priority";

function optionsOf(task: Task): TaskOptions {
  return {
    startDate: task.startDate ?? "",
    startTime: task.startTime ?? "",
    priority: task.priority,
    description: task.description ?? "",
  };
}

export default function TaskItem({ task }: { task: Task }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [options, setOptions] = useState<TaskOptions>(optionsOf(task));

  // Returns true if the request succeeded
  async function run(method: "PATCH" | "DELETE", body?: unknown) {
    setError("");
    setBusy(true);
    try {
      await api(`/api/tasks/${task.id}`, method, body);
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function startEditing() {
    // Reset the form to the task's current values every time editing starts
    setTitle(task.title);
    setOptions(optionsOf(task));
    setError("");
    setEditing(true);
  }

  function cancel() {
    setError("");
    setEditing(false);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await run("PATCH", { title, ...options })) setEditing(false);
  }

  return (
    <li
      className={`rounded-md border px-3 py-2 ${PRIORITY_STYLES[task.priority].row} ${
        task.completed ? "opacity-60" : ""
      }`}
    >
      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && cancel()}
            autoFocus
          />
          <TaskOptionsFields value={options} onChange={setOptions} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3">
          <Checkbox
            className="border-gray-400"
            checked={task.completed}
            disabled={busy}
            onCheckedChange={(checked) =>
              run("PATCH", { completed: checked === true })
            }
          />
          <div className="flex-1">
            <span
              className={
                task.completed ? "text-muted-foreground line-through" : ""
              }
            >
              {task.title}
            </span>
            <TaskMeta task={task} />
          </div>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={startEditing}
          >
            Edit
          </Button>
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
      )}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </li>
  );
}