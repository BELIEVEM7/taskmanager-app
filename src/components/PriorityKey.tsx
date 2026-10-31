import { PRIORITY_ORDER, PRIORITY_STYLES } from "@/lib/priority";

export default function PriorityKey() {
  return (
    <div className="mt-10 border-t pt-4">
      <p className="mb-2 text-sm font-medium">Priority key</p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {PRIORITY_ORDER.map((p) => (
          <li key={p} className="flex items-center gap-2">
            <span
              className={`h-4 w-4 rounded border ${PRIORITY_STYLES[p].row}`}
            />
            {PRIORITY_STYLES[p].label}
          </li>
        ))}
      </ul>
    </div>
  );
}