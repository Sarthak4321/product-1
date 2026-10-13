/**
 * @jest-environment node
 */
import { generateOrgCode, findOrganizationByRoomId, ensureOrgCode } from "../org-code";
import { prisma } from "../prisma";

jest.mock("../prisma", () => ({
  prisma: {
    organization: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("Organization Virtual Room Code Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. Org Code Generator Format & Cleaning", () => {
    it("should generate a 3-letter uppercase prefix and 4-digit random number for standard names", () => {
      const code = generateOrgCode("Apex Coaching Institute");
      expect(code).toMatch(/^[A-Z]{3}-\d{4}$/);
      expect(code.startsWith("APE-")).toBe(true);
    });

    it("should handle short business names gracefully with fallback ORG prefix", () => {
      const code = generateOrgCode("AI");
      expect(code).toMatch(/^[A-Z]{3}-\d{4}$/);
    });

    it("should strip special characters, spaces, and punctuation from business names", () => {
      const code = generateOrgCode("St. Jude's Academy & Co. #1!");
      expect(code).toMatch(/^[A-Z]{3}-\d{4}$/);
      expect(code.startsWith("STJ-")).toBe(true);
    });

    it("should handle single letter or empty names with fallback ORG", () => {
      const codeEmpty = generateOrgCode("");
      expect(codeEmpty).toMatch(/^ORG-\d{4}$/);

      const codeSingle = generateOrgCode("X");
      expect(codeSingle).toMatch(/^ORG-\d{4}$/);
    });
  });

  describe("2. Room Code Search & Fallback Resolution", () => {
    it("should return null when searching for an empty or whitespace Room ID", async () => {
      const resultEmpty = await findOrganizationByRoomId("");
      const resultSpaces = await findOrganizationByRoomId("   ");
      expect(resultEmpty).toBeNull();
      expect(resultSpaces).toBeNull();
      expect(prisma.organization.findFirst).not.toHaveBeenCalled();
    });

    it("should return null for non-existent organization room codes", async () => {
      (prisma.organization.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const result = await findOrganizationByRoomId("NON-EXISTENT-ROOM-CODE-999");
      expect(result).toBeNull();
      expect(prisma.organization.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { code: "NON-EXISTENT-ROOM-CODE-999" },
            { code: "NON-EXISTENT-ROOM-CODE-999" },
            { slug: "non-existent-room-code-999" },
            { id: "NON-EXISTENT-ROOM-CODE-999" },
          ],
        },
      });
    });

    it("should resolve organization room when provided exact room code or lowercase slug", async () => {
      const mockOrg = {
        id: "org-uuid-1",
        name: "Default Workspace",
        slug: "default-workspace",
        code: "DEF-1234",
      };
      (prisma.organization.findFirst as jest.Mock).mockResolvedValue(mockOrg);

      const orgBySlug = await findOrganizationByRoomId("default-workspace");
      expect(orgBySlug).not.toBeNull();
      expect(orgBySlug?.slug).toBe("default-workspace");
      expect(orgBySlug?.code).toBe("DEF-1234");
    });
  });

  describe("3. ensureOrgCode Flow", () => {
    it("should return existing code if already assigned", async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValueOnce({
        id: "org-1",
        code: "EXISTING-1234",
        name: "Test Academy",
      });

      const code = await ensureOrgCode("org-1", "Test Academy");
      expect(code).toBe("EXISTING-1234");
      expect(prisma.organization.update).not.toHaveBeenCalled();
    });

    it("should throw error if organization not found", async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(ensureOrgCode("missing-id", "Test")).rejects.toThrow("Organization not found");
    });

    it("should generate, check uniqueness, and persist code when organization lacks a code", async () => {
      (prisma.organization.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: "org-2",
          code: null,
          name: "Bright Institute",
        })
        .mockResolvedValueOnce(null); // No collision on first check

      (prisma.organization.update as jest.Mock).mockResolvedValueOnce({
        id: "org-2",
        code: "BRI-5678",
      });

      const code = await ensureOrgCode("org-2", "Bright Institute");
      expect(code).toMatch(/^BRI-\d{4}$/);
      expect(prisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "org-2" },
          data: { code: expect.stringMatching(/^BRI-\d{4}$/) },
        })
      );
    });
  });
});
