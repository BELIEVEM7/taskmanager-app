export type Task = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
};

export default function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="text-muted-foreground">No tasks yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li key={task.id} className="rounded-md border px-3 py-2">
          <span className={task.completed ? "text-muted-foreground line-through" : ""}>
            {task.title}
          </span>
        </li>
      ))}
    </ul>
  );
}