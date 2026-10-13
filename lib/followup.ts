/**
 * Formats a follow-up date-time into a readable string relative to a reference date.
 * e.g., "Today at 2:15 pm", "Tomorrow at 4:30 pm", "25 Aug at 10:00 am"
 */
export const formatFollowUp = (
  dateStr: string | Date | null | undefined,
  relativeTo: Date = new Date()
): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  const timeStr = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

  const today = new Date(relativeTo);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = d.toDateString() === today.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  if (isToday) return `Today at ${timeStr.toLowerCase()}`;
  if (isTomorrow) return `Tomorrow at ${timeStr.toLowerCase()}`;

  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at ${timeStr.toLowerCase()}`;
};
