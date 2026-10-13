/**
 * @jest-environment node
 */
import { parseAndNormalizePhone } from "../phone";

describe("CSV Import Parsing & Duplicate Detection Logic", () => {
  function processCsvContent(csvContent: string) {
    const lines = csvContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return { totalRows: 0, validPhones: [], duplicateCount: 0, invalidCount: 0 };
    }

    const firstLine = lines[0].toLowerCase();
    const isHeader =
      firstLine.includes("phone") ||
      firstLine.includes("mobile") ||
      firstLine.includes("number") ||
      firstLine.includes("contact");

    const dataLines = isHeader ? lines.slice(1) : lines;
    const seenInFile = new Set<string>();
    const validPhones: string[] = [];
    let duplicateCount = 0;
    let invalidCount = 0;

    dataLines.forEach((line) => {
      const cells = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const rawValue = cells[0] || "";
      const parsed = parseAndNormalizePhone(rawValue);

      if (!parsed.isValid) {
        invalidCount++;
        return;
      }

      if (seenInFile.has(parsed.normalized)) {
        duplicateCount++;
        return;
      }

      seenInFile.add(parsed.normalized);
      validPhones.push(parsed.normalized);
    });

    return {
      totalRows: dataLines.length,
      validPhones,
      duplicateCount,
      invalidCount,
    };
  }

  it("handles CSV with standard headers (phone)", () => {
    const csv = `phone\n9876543210\n9876543211\n9876543212`;
    const result = processCsvContent(csv);
    expect(result.totalRows).toBe(3);
    expect(result.validPhones.length).toBe(3);
    expect(result.duplicateCount).toBe(0);
    expect(result.invalidCount).toBe(0);
  });

  it("handles CRLF windows line endings and quoted cells", () => {
    const csv = `"phone"\r\n"9876543210"\r\n"9876543211"\r\n`;
    const result = processCsvContent(csv);
    expect(result.totalRows).toBe(2);
    expect(result.validPhones.length).toBe(2);
  });

  it("detects and filters duplicate phone numbers within the CSV file", () => {
    const csv = `phone\n9876543210\n9876543210\n9876543210\n9876543211`;
    const result = processCsvContent(csv);
    expect(result.totalRows).toBe(4);
    expect(result.validPhones.length).toBe(2);
    expect(result.duplicateCount).toBe(2);
  });

  it("identifies malformed phone numbers and separates invalid rows", () => {
    const csv = `phone\n9876543210\ninvalid-123\n12345\n9876543211`;
    const result = processCsvContent(csv);
    expect(result.totalRows).toBe(4);
    expect(result.validPhones.length).toBe(2);
    expect(result.invalidCount).toBe(2);
  });

  it("handles multi-column CSV taking the phone column", () => {
    const csv = `phone,name,class\n9876543210,Rahul,12\n9876543211,Ananya,11`;
    const result = processCsvContent(csv);
    expect(result.totalRows).toBe(2);
    expect(result.validPhones).toEqual(["919876543210", "919876543211"]);
  });
});
