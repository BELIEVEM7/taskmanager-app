export const PRIORITY_ORDER = ["HIGH", "MEDIUM", "LOW", "NONE"] as const;

export const PRIORITY_STYLES = {
  HIGH: {
    label: "High",
    row: "bg-red-100 border-red-300 dark:bg-red-950/40 dark:border-red-900",
  },
  MEDIUM: {
    label: "Medium",
    row: "bg-yellow-100 border-yellow-300 dark:bg-yellow-950/40 dark:border-yellow-900",
  },
  LOW: {
    label: "Low",
    row: "bg-blue-100 border-blue-300 dark:bg-blue-950/40 dark:border-blue-900",
  },
  NONE: {
    label: "None",
    row: "bg-background",
  },
} as const;
