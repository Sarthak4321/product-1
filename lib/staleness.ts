/**
 * Calculates if a lead is considered "stale".
 * A lead is stale if its status is "CONTACTED" or "INTERESTED"
 * and there has been no activity (calculated by updatedAt or createdAt fallback)
 * for at least 48 hours.
 */
export function isLeadStale(
  status: string,
  updatedAt: string | Date | null | undefined,
  createdAt: string | Date
): boolean {
  if (status !== "CONTACTED" && status !== "INTERESTED") {
    return false;
  }

  const lastActivityDate = updatedAt ? new Date(updatedAt) : new Date(createdAt);
  const hoursSinceActivity = (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60);
  return hoursSinceActivity >= 48;
}

/**
 * Returns the formatted label for the staleness indicator (e.g. "Stale", "Stale: 3d").
 */
export function getStaleLabel(
  updatedAt: string | Date | null | undefined,
  createdAt: string | Date
): string {
  const lastActivityDate = updatedAt ? new Date(updatedAt) : new Date(createdAt);
  const hoursSinceActivity = (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60);
  const daysStale = Math.floor(hoursSinceActivity / 24);
  return daysStale > 2 ? `Stale: ${daysStale}d` : "Stale";
}
