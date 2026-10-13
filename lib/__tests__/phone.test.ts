import { parseAndNormalizePhone } from "../phone";

describe("parseAndNormalizePhone Granular Edge Cases", () => {
  describe("Indian 10-Digit Mobile Formats", () => {
    it("normalizes pure 10-digit number starting with 9", () => {
      const res = parseAndNormalizePhone("9876543210");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("919876543210");
      expect(res.display).toBe("+91 98765 43210");
      expect(res.tel).toBe("tel:+919876543210");
    });

    it("normalizes pure 10-digit number starting with 8, 7, or 6", () => {
      expect(parseAndNormalizePhone("8123456789").normalized).toBe("918123456789");
      expect(parseAndNormalizePhone("7012345678").normalized).toBe("917012345678");
      expect(parseAndNormalizePhone("6398765432").normalized).toBe("916398765432");
    });

    it("handles leading +91 with spaces, dashes, brackets, dots", () => {
      expect(parseAndNormalizePhone("+91 98765 43210").normalized).toBe("919876543210");
      expect(parseAndNormalizePhone("+91-98765-43210").normalized).toBe("919876543210");
      expect(parseAndNormalizePhone("+91 (98765) 43210").normalized).toBe("919876543210");
      expect(parseAndNormalizePhone("+91.98765.43210").normalized).toBe("919876543210");
    });

    it("handles 12-digit format starting with 91", () => {
      const res = parseAndNormalizePhone("919876543210");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("919876543210");
      expect(res.display).toBe("+91 98765 43210");
    });

    it("handles 11-digit format starting with leading 0 (trunk code)", () => {
      const res = parseAndNormalizePhone("09876543210");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("919876543210");
      expect(res.display).toBe("+91 98765 43210");
    });
  });

  describe("Multi-Number & Multi-Contact Cell Entries", () => {
    it("parses cell with multiple phone numbers separated by slash (/)", () => {
      const res = parseAndNormalizePhone("+91 86375 83173 / +91 90020 01234");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("918637583173");
      expect(res.display).toBe("+91 86375 83173");
      expect(res.altPhones).toEqual(["+91 90020 01234"]);
    });

    it("parses cell with multiple phone numbers separated by comma or pipe", () => {
      const res1 = parseAndNormalizePhone("9876543210, 9123456789");
      expect(res1.isValid).toBe(true);
      expect(res1.normalized).toBe("919876543210");
      expect(res1.altPhones).toEqual(["+91 91234 56789"]);

      const res2 = parseAndNormalizePhone("+91 74495 40316 | +91 81010 01234");
      expect(res2.isValid).toBe(true);
      expect(res2.normalized).toBe("917449540316");
      expect(res2.altPhones).toEqual(["+91 81010 01234"]);
    });

    it("parses cell with numbers separated by 'or'", () => {
      const res = parseAndNormalizePhone("9876543210 or 9876543211");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("919876543210");
      expect(res.altPhones).toEqual(["+91 98765 43211"]);
    });
  });

  describe("International Mobile Formats", () => {
    it("handles US international format +1 202 555 0123", () => {
      const res = parseAndNormalizePhone("+1 202 555 0123");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("12025550123");
      expect(res.display).toBe("+12025550123");
      expect(res.tel).toBe("tel:+12025550123");
    });

    it("handles UK international format +44 7911 123456", () => {
      const res = parseAndNormalizePhone("+44 7911 123456");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("447911123456");
    });
  });

  describe("Invalid & Edge Case Inputs", () => {
    it("rejects non-phone string entries like 'Contact via official website'", () => {
      expect(parseAndNormalizePhone("Contact via official website").isValid).toBe(false);
    });

    it("rejects short numbers (< 8 digits)", () => {
      expect(parseAndNormalizePhone("1234567").isValid).toBe(false);
      expect(parseAndNormalizePhone("9876").isValid).toBe(false);
    });

    it("rejects numbers starting with 0-5 in 10-digit format", () => {
      expect(parseAndNormalizePhone("5876543210").isValid).toBe(false);
      expect(parseAndNormalizePhone("1876543210").isValid).toBe(false);
    });

    it("rejects alphanumeric inputs", () => {
      expect(parseAndNormalizePhone("98765ABCDE").isValid).toBe(false);
      expect(parseAndNormalizePhone("PHONE_NUMBER").isValid).toBe(false);
    });

    it("handles null, undefined, empty string, and whitespace-only strings", () => {
      expect(parseAndNormalizePhone("").isValid).toBe(false);
      expect(parseAndNormalizePhone("   ").isValid).toBe(false);
      expect(parseAndNormalizePhone(null).isValid).toBe(false);
      expect(parseAndNormalizePhone(undefined).isValid).toBe(false);
    });
  });
});
