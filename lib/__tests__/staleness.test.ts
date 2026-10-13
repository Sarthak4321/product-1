import { isLeadStale, getStaleLabel } from "../staleness";

describe("Lead Staleness Logic", () => {
  const now = Date.now();

  beforeAll(() => {
    // Lock Date.now() if needed, but relative offsets are fine.
  });

  describe("isLeadStale", () => {
    it("returns false for status that is not CONTACTED or INTERESTED", () => {
      const createdAt = new Date(now - 100 * 60 * 60 * 1000).toISOString(); // 100 hours ago
      expect(isLeadStale("NEW", null, createdAt)).toBe(false);
      expect(isLeadStale("FOLLOW_UP", null, createdAt)).toBe(false);
      expect(isLeadStale("CONVERTED", null, createdAt)).toBe(false);
    });

    it("returns false for CONTACTED lead with activity less than 48 hours ago", () => {
      const createdAt = new Date(now - 10 * 60 * 60 * 1000).toISOString(); // 10 hours ago
      const updatedAt = new Date(now - 5 * 60 * 60 * 1000).toISOString(); // 5 hours ago
      expect(isLeadStale("CONTACTED", updatedAt, createdAt)).toBe(false);
    });

    it("returns true for CONTACTED lead with activity exactly/more than 48 hours ago", () => {
      const createdAt = new Date(now - 50 * 60 * 60 * 1000).toISOString(); // 50 hours ago
      const updatedAt = new Date(now - 48 * 60 * 60 * 1000 - 1000).toISOString(); // 48 hours and 1s ago
      expect(isLeadStale("CONTACTED", updatedAt, createdAt)).toBe(true);
    });

    it("returns true for INTERESTED lead with activity exactly/more than 48 hours ago", () => {
      const createdAt = new Date(now - 50 * 60 * 60 * 1000).toISOString(); // 50 hours ago
      const updatedAt = new Date(now - 49 * 60 * 60 * 1000).toISOString(); // 49 hours ago
      expect(isLeadStale("INTERESTED", updatedAt, createdAt)).toBe(true);
    });

    it("falls back to createdAt when updatedAt is null or undefined", () => {
      const oldCreatedAt = new Date(now - 50 * 60 * 60 * 1000).toISOString(); // 50 hours ago
      const recentCreatedAt = new Date(now - 10 * 60 * 60 * 1000).toISOString(); // 10 hours ago

      expect(isLeadStale("CONTACTED", null, oldCreatedAt)).toBe(true);
      expect(isLeadStale("CONTACTED", undefined, oldCreatedAt)).toBe(true);
      expect(isLeadStale("CONTACTED", null, recentCreatedAt)).toBe(false);
    });
  });

  describe("getStaleLabel", () => {
    it("returns 'Stale' if activity was between 48 and 72 hours ago", () => {
      const createdAt = new Date(now - 60 * 60 * 1000).toISOString();
      const updatedAt = new Date(now - 50 * 60 * 60 * 1000).toISOString(); // 50 hours (2 days and 2 hours)
      expect(getStaleLabel(updatedAt, createdAt)).toBe("Stale");
    });

    it("returns days elapsed (e.g., 'Stale: 3d') if activity was 72+ hours ago", () => {
      const createdAt = new Date(now - 100 * 60 * 60 * 1000).toISOString();
      const updatedAt = new Date(now - 75 * 60 * 60 * 1000).toISOString(); // 75 hours (3 days and 3 hours)
      expect(getStaleLabel(updatedAt, createdAt)).toBe("Stale: 3d");
    });

    it("returns days elapsed (e.g., 'Stale: 5d') if activity was 120+ hours ago", () => {
      const createdAt = new Date(now - 150 * 60 * 60 * 1000).toISOString();
      const updatedAt = new Date(now - 125 * 60 * 60 * 1000).toISOString(); // 125 hours (5 days and 5 hours)
      expect(getStaleLabel(updatedAt, createdAt)).toBe("Stale: 5d");
    });
  });
});
