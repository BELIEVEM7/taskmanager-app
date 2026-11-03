import type { Priority } from "@/generated/prisma/enums";

const PRIORITIES: Priority[] = ["NONE", "LOW", "MEDIUM", "HIGH"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type Options = {
  startDate?: string | null;
  startTime?: string | null;
  priority?: Priority;
};

function isRealDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export function parseTaskOptions(
  body: Record<string, unknown>
): { data: Options } | { error: string } {
  const data: Options = {};

  if (body.startDate !== undefined) {
    if (!body.startDate) data.startDate = null; // empty or null clears it
      else if ( typeof body.startDate === "string" && DATE_RE.test(body.startDate) && isRealDate(body.startDate)
    )
      data.startDate = body.startDate;
    else return { error: "Start date must look like 2026-11-05" };
  }

  if (body.startTime !== undefined) {
    if (!body.startTime) data.startTime = null;
    else if (typeof body.startTime === "string" && TIME_RE.test(body.startTime))
      data.startTime = body.startTime;
    else return { error: "Start time must look like 09:30" };
  }

  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority as Priority))
      return { error: "Priority must be NONE, LOW, MEDIUM or HIGH" };
    data.priority = body.priority as Priority;
  }

  return { data };
}