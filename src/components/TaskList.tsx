import TaskItem from "./TaskItem";

export type Task = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  startDate: string | null;
  startTime: string | null;
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH";
};

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2, NONE: 3 } as const;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatHeading(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const weekday = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday}, ${d} ${MONTHS[m - 1]} ${y}`;
}

function compareTasks(a: Task, b: Task) {
  return (
    PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
    (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99")
  );
}

export default function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="text-muted-foreground">No tasks yet.</p>;
  }

  // Group tasks by date. Tasks without a date use the empty string as their key.
  const groups = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = task.startDate ?? "";
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }

  // Dates in order, earliest first, with "no date" last
  const keys = [...groups.keys()].sort((a, b) => {
    if (a === "") return 1;
    if (b === "") return -1;
    return a.localeCompare(b);
  });

  const onlyUndated = keys.length === 1 && keys[0] === "";

  return (
    <div className="space-y-6">
      {keys.map((key) => (
        <section key={key || "no-date"}>
          {!onlyUndated && (
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              {key ? formatHeading(key) : "No date"}
            </h2>
          )}
          <ul className="space-y-2">
            {[...groups.get(key)!].sort(compareTasks).map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}