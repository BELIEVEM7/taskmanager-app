import TaskItem from "./TaskItem";

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
    <ul className="list-none space-y-2 p-0">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  );
}