import { formatFollowUp } from "../followup";

describe("formatFollowUp relative date formatter", () => {
  const mockToday = new Date("2026-08-20T10:00:00.000Z");

  it("handles null, undefined, and empty string safely", () => {
    expect(formatFollowUp(null, mockToday)).toBe("");
    expect(formatFollowUp(undefined, mockToday)).toBe("");
    expect(formatFollowUp("", mockToday)).toBe("");
  });

  it("handles invalid date strings safely", () => {
    expect(formatFollowUp("invalid-date-string", mockToday)).toBe("");
  });

  it("formats call time scheduled for today relatives to today's date", () => {
    // Scheduled for today at 14:30 UTC
    const scheduled = new Date("2026-08-20T14:30:00.000Z");
    const result = formatFollowUp(scheduled, mockToday);
    
    const expectedTime = scheduled.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
    expect(result).toBe(`Today at ${expectedTime}`);
  });

  it("formats call time scheduled for tomorrow relative to today's date", () => {
    // Scheduled for tomorrow (Aug 21) at 10:15 AM UTC
    const scheduled = new Date("2026-08-21T10:15:00.000Z");
    const result = formatFollowUp(scheduled, mockToday);
    
    const expectedTime = scheduled.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
    expect(result).toBe(`Tomorrow at ${expectedTime}`);
  });

  it("formats call time scheduled for any other date absolutely", () => {
    // Scheduled for August 25 at 4:45 PM UTC
    const scheduled = new Date("2026-08-25T16:45:00.000Z");
    const result = formatFollowUp(scheduled, mockToday);
    
    const expectedDate = scheduled.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const expectedTime = scheduled.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
    expect(result).toBe(`${expectedDate} at ${expectedTime}`);
  });
});
