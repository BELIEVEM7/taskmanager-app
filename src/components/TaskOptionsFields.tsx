import { Input } from "@/components/ui/input";

export type TaskOptions = {
  startDate: string;
  startTime: string;
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH";
};

export const emptyOptions: TaskOptions = {
  startDate: "",
  startTime: "",
  priority: "NONE",
};

type Props = {
  value: TaskOptions;
  onChange: (value: TaskOptions) => void;
};

export default function TaskOptionsFields({ value, onChange }: Props) {
  function set<K extends keyof TaskOptions>(key: K, v: TaskOptions[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">Start date</span>
        <Input
          type="date"
          value={value.startDate}
          onChange={(e) => set("startDate", e.target.value)}
        />
      </label>

      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">Start time</span>
        <Input
          type="time"
          value={value.startTime}
          onChange={(e) => set("startTime", e.target.value)}
        />
      </label>

      <label className="space-y-1 text-sm">
        <span className="text-muted-foreground">Priority</span>
        <select
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={value.priority}
          onChange={(e) => set("priority", e.target.value as TaskOptions["priority"])}
        >
          <option value="NONE">None</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </label>
    </div>
  );
}