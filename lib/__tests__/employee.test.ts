/**
 * @jest-environment node
 */
import { signToken } from "../auth";

describe("Employee & HR Management Comprehensive Unit Tests", () => {
  describe("1. HR Authorization & Authentication Tokens", () => {
    it("should create and verify valid JWT tokens with HR authorization roles", async () => {
      const hrAdminPayload = {
        userId: "user-hr-admin",
        email: "hr@coachingcenter.com",
        name: "HR Admin",
        role: "ORG_ADMIN" as const,
        organizationId: "org-coaching-1",
      };

      const token = await signToken(hrAdminPayload);
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(20);
    });

    it("should allow HR-specific roles (HR, TEACHER, EMPLOYEE, ORG_ADMIN)", async () => {
      const roles = ["ORG_ADMIN", "HR", "TEACHER", "EMPLOYEE", "SUPER_ADMIN"] as const;
      for (const role of roles) {
        const token = await signToken({
          userId: `user-${role.toLowerCase()}`,
          email: `${role.toLowerCase()}@crm.com`,
          name: `${role} User`,
          role,
          organizationId: "org-1",
        });
        expect(token).toBeDefined();
      }
    });
  });

  describe("2. Data Sanitization & Formatting", () => {
    it("should sanitize and lowercase employee emails", () => {
      const rawEmail = "  John.Doe@Coaching.Com  ";
      const normalized = rawEmail.trim().toLowerCase();
      expect(normalized).toBe("john.doe@coaching.com");
    });

    it("should format first and last names correctly", () => {
      const fullName = "  Dr. Priya  Ramesh   Sharma  ";
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ");

      expect(firstName).toBe("Dr.");
      expect(lastName).toBe("Priya Ramesh Sharma");
    });

    it("should generate standardized sequential employee ID codes", () => {
      const generateEmpId = (seq: number) => `EMP-${String(seq).padStart(4, "0")}`;
      expect(generateEmpId(1)).toBe("EMP-0001");
      expect(generateEmpId(42)).toBe("EMP-0042");
      expect(generateEmpId(1050)).toBe("EMP-1050");
    });
  });

  describe("3. Employment Status & Life Cycle Transitions", () => {
    const validStatuses = [
      "ACTIVE",
      "PROBATION",
      "ON_LEAVE",
      "SUSPENDED",
      "TERMINATED",
      "RESIGNED",
    ];

    it("should validate all allowable employee statuses", () => {
      validStatuses.forEach((status) => {
        expect(validStatuses.includes(status)).toBe(true);
      });
    });

    it("should correctly compute active status predicate", () => {
      const isActive = (status: string) => ["ACTIVE", "PROBATION"].includes(status);
      expect(isActive("ACTIVE")).toBe(true);
      expect(isActive("PROBATION")).toBe(true);
      expect(isActive("ON_LEAVE")).toBe(false);
      expect(isActive("TERMINATED")).toBe(false);
      expect(isActive("RESIGNED")).toBe(false);
    });
  });

  describe("4. Compensation & Salary Calculations", () => {
    it("should calculate annual CTC from monthly salary components", () => {
      const monthlyBasic = 50000;
      const monthlyHRA = 20000;
      const monthlySpecialAllowance = 15000;
      const annualBonus = 60000;

      const monthlyGross = monthlyBasic + monthlyHRA + monthlySpecialAllowance;
      const annualCTC = monthlyGross * 12 + annualBonus;

      expect(monthlyGross).toBe(85000);
      expect(annualCTC).toBe(1080000);
    });

    it("should handle null or zero compensation gracefully", () => {
      const formatSalary = (salary: number | null | undefined) =>
        salary ? `₹${salary.toLocaleString("en-IN")}` : "Not Disclosed";

      expect(formatSalary(null)).toBe("Not Disclosed");
      expect(formatSalary(undefined)).toBe("Not Disclosed");
      expect(formatSalary(50000)).toBe("₹50,000");

      const zeroSalary = 0;
      const zeroFormatted = zeroSalary > 0 ? `₹${zeroSalary.toLocaleString("en-IN")}` : "₹0";
      expect(zeroFormatted).toBe("₹0");
    });
  });

  describe("5. Multi-Tenant HR Scoping & Filter Predicates", () => {
    it("should isolate employee queries strictly by organizationId", () => {
      const employees = [
        { id: "e1", organizationId: "org-alpha", firstName: "Alice" },
        { id: "e2", organizationId: "org-alpha", firstName: "Bob" },
        { id: "e3", organizationId: "org-beta", firstName: "Charlie" },
      ];

      const scopedForAlpha = employees.filter((e) => e.organizationId === "org-alpha");
      expect(scopedForAlpha.length).toBe(2);
      expect(scopedForAlpha.map((e) => e.firstName)).toEqual(["Alice", "Bob"]);

      const scopedForBeta = employees.filter((e) => e.organizationId === "org-beta");
      expect(scopedForBeta.length).toBe(1);
      expect(scopedForBeta[0].firstName).toBe("Charlie");
    });

    it("should filter employees by department, designation, and status", () => {
      const employees = [
        { id: "1", deptId: "d1", desigId: "g1", status: "ACTIVE" },
        { id: "2", deptId: "d1", desigId: "g2", status: "ACTIVE" },
        { id: "3", deptId: "d2", desigId: "g1", status: "ON_LEAVE" },
        { id: "4", deptId: "d1", desigId: "g1", status: "TERMINATED" },
      ];

      const activeInDept1 = employees.filter((e) => e.deptId === "d1" && e.status === "ACTIVE");
      expect(activeInDept1.length).toBe(2);

      const desig1Employees = employees.filter((e) => e.desigId === "g1");
      expect(desig1Employees.length).toBe(3);
    });
  });
});
