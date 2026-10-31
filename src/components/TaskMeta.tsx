import type { Task } from "./TaskList";

const PRIORITY_STYLES = {
  LOW: {
    label: "Low",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  },
  HIGH: {
    label: "High",
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
} as const;

export default function TaskMeta({ task }: { task: Task }) {
  const { startTime, priority } = task;

  if (!startTime && priority === "NONE") return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {priority !== "NONE" && (
        <span
          className={`rounded-full px-2 py-0.5 font-medium ${PRIORITY_STYLES[priority].className}`}
        >
          {PRIORITY_STYLES[priority].label}
        </span>
      )}
      {startTime && <span>{startTime}</span>}
    </div>
  );
}