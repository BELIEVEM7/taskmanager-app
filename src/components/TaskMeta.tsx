import type { Task } from "./TaskList";

export default function TaskMeta({ task }: { task: Task }) {
  const { startTime, description } = task;

  if (!startTime && !description) return null;

  return (
    <div className="mt-1 space-y-1 text-muted-foreground">
      {startTime && <p className="text-xs">Starts at {startTime}</p>}
      {description && (
        <p className="whitespace-pre-wrap text-sm">{description}</p>
      )}
    </div>
  );
}