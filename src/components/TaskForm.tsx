"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TaskOptionsFields, {
  emptyOptions,
  type TaskOptions,
} from "./TaskOptionsFields";

export default function AddTaskForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<TaskOptions>(emptyOptions);
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState("");

  const hasOptions =
    options.startDate !== "" ||
    options.startTime !== "" ||
    options.priority !== "NONE" ||
    options.description !== "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/tasks", "POST", { title, ...options });
      setTitle("");
      setOptions(emptyOptions);
      setShowOptions(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          aria-expanded={showOptions}
          onClick={() => setShowOptions(!showOptions)}
        >
          Options{hasOptions ? " •" : ""}
        </Button>
        <Button type="submit">Add</Button>
      </div>

      {showOptions && <TaskOptionsFields value={options} onChange={setOptions} />}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}