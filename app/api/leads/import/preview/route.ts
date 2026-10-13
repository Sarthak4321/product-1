import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/auth";
import { parseAndNormalizePhone } from "@/lib/phone";

function parseCsvRow(rowText: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    if (char === '"' || char === "'") {
      if (inQuotes && rowText[i + 1] === char) {
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map((c) => c.replace(/^["']|["']$/g, "").trim());
}

export async function POST(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);

    const body = await req.json();
    const { csvContent } = body;

    if (!csvContent || typeof csvContent !== "string") {
      return NextResponse.json(
        { error: "Spreadsheet content is empty or invalid" },
        { status: 400 }
      );
    }

    // Split rows
    const lines = csvContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return NextResponse.json(
        { error: "No data rows found in the uploaded file" },
        { status: 400 }
      );
    }

    const firstRowCells = parseCsvRow(lines[0]);

    // Check if the first row is a header row
    const lowerCells = firstRowCells.map((c) => c.toLowerCase());
    let phoneColIndex = lowerCells.findIndex((cell) =>
      cell.includes("phone") || cell.includes("mobile") || cell.includes("number") || cell.includes("contact") || cell.includes("cell")
    );

    const isHeader = phoneColIndex !== -1 || lowerCells.some((c) => ["name", "email", "course", "city", "place", "class"].includes(c));

    let headers: string[] = [];
    if (isHeader) {
      headers = firstRowCells.map((h, i) => h || `Column ${i + 1}`);
    } else {
      const colCount = parseCsvRow(lines[0]).length;
      headers = Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`);
    }

    if (phoneColIndex === -1) phoneColIndex = 0;

    // Auto-detect mappings based on header text
    let autoPhoneIndex = phoneColIndex;
    let autoNameIndex = lowerCells.findIndex((c) => c.includes("name") || c.includes("student"));
    let autoCourseIndex = lowerCells.findIndex((c) => c.includes("course") || c.includes("program") || c.includes("target") || c.includes("stream"));
    let autoPlaceIndex = lowerCells.findIndex((c) => c.includes("place") || c.includes("city") || c.includes("location") || c.includes("address") || c.includes("state"));
    let autoClassIndex = lowerCells.findIndex((c) => c.includes("class") || c.includes("grade") || c.includes("batch") || c.includes("standard"));
    let autoNotesIndex = lowerCells.findIndex((c) => c.includes("note") || c.includes("remark") || c.includes("comment") || c.includes("email"));

    const dataLines = isHeader ? lines.slice(1) : lines;

    const seenInFile = new Set<string>();
    const previewRows: Array<{
      rowNumber: number;
      raw: string;
      normalized: string;
      rowData: Record<string, string>;
      cells: string[];
      status: "VALID" | "DUPLICATE_FILE" | "DUPLICATE_DB" | "INVALID";
      reason?: string;
    }> = [];

    const candidatesToValidate: Array<{
      rowNumber: number;
      raw: string;
      normalized: string;
      rowData: Record<string, string>;
      cells: string[];
    }> = [];

    let invalidCount = 0;
    let duplicateInFileCount = 0;

    dataLines.forEach((line, index) => {
      const rowNumber = isHeader ? index + 2 : index + 1;
      const cells = parseCsvRow(line);
      const rowData: Record<string, string> = {};
      headers.forEach((header, idx) => {
        rowData[header] = cells[idx] || "";
      });

      let rawValue = cells[phoneColIndex] || "";
      let parsed = parseAndNormalizePhone(rawValue);

      // Fallback: search across all cells if target phone cell is not valid
      if (!parsed.isValid && cells.length > 1) {
        for (let i = 0; i < cells.length; i++) {
          const candidateParsed = parseAndNormalizePhone(cells[i]);
          if (candidateParsed.isValid) {
            rawValue = cells[i];
            parsed = candidateParsed;
            phoneColIndex = i;
            break;
          }
        }
      }

      if (!parsed.isValid) {
        invalidCount++;
        previewRows.push({
          rowNumber,
          raw: rawValue || cells[0] || "",
          normalized: "",
          rowData,
          cells,
          status: "INVALID",
          reason: parsed.error || "Malformed phone number",
        });
        return;
      }

      if (seenInFile.has(parsed.normalized)) {
        duplicateInFileCount++;
        previewRows.push({
          rowNumber,
          raw: rawValue,
          normalized: parsed.normalized,
          rowData,
          cells,
          status: "DUPLICATE_FILE",
          reason: "Repeated in uploaded file",
        });
        return;
      }

      seenInFile.add(parsed.normalized);
      candidatesToValidate.push({
        rowNumber,
        raw: rawValue,
        normalized: parsed.normalized,
        rowData,
        cells,
      });
    });

    // Query DB in chunks scoped to authenticated organization
    const normalizedList = candidatesToValidate.map((c) => c.normalized);
    const existingInDb = await prisma.lead.findMany({
      where: {
        organizationId: context.organizationId,
        phone: { in: normalizedList },
      },
      select: { phone: true },
    });

    const dbSet = new Set(existingInDb.map((e: { phone: string }) => e.phone));
    let alreadyInDbCount = 0;
    const validPhones: string[] = [];
    const validLeads: Array<{
      phone: string;
      name?: string;
      course?: string;
      place?: string;
      class?: string;
      notes?: string;
      rowData: Record<string, string>;
    }> = [];

    candidatesToValidate.forEach((item) => {
      if (dbSet.has(item.normalized)) {
        alreadyInDbCount++;
        previewRows.push({
          rowNumber: item.rowNumber,
          raw: item.raw,
          normalized: item.normalized,
          rowData: item.rowData,
          cells: item.cells,
          status: "DUPLICATE_DB",
          reason: "Already exists in your workspace CRM",
        });
      } else {
        validPhones.push(item.normalized);
        validLeads.push({
          phone: item.normalized,
          name: autoNameIndex !== -1 ? item.cells[autoNameIndex] || undefined : undefined,
          course: autoCourseIndex !== -1 ? item.cells[autoCourseIndex] || undefined : undefined,
          place: autoPlaceIndex !== -1 ? item.cells[autoPlaceIndex] || undefined : undefined,
          class: autoClassIndex !== -1 ? item.cells[autoClassIndex] || undefined : undefined,
          notes: autoNotesIndex !== -1 ? item.cells[autoNotesIndex] || undefined : undefined,
          rowData: item.rowData,
        });
        previewRows.push({
          rowNumber: item.rowNumber,
          raw: item.raw,
          normalized: item.normalized,
          rowData: item.rowData,
          cells: item.cells,
          status: "VALID",
        });
      }
    });

    previewRows.sort((a, b) => a.rowNumber - b.rowNumber);

    return NextResponse.json({
      headers,
      autoMapping: {
        phoneIndex: autoPhoneIndex !== -1 ? autoPhoneIndex : 0,
        nameIndex: autoNameIndex !== -1 ? autoNameIndex : null,
        courseIndex: autoCourseIndex !== -1 ? autoCourseIndex : null,
        placeIndex: autoPlaceIndex !== -1 ? autoPlaceIndex : null,
        classIndex: autoClassIndex !== -1 ? autoClassIndex : null,
        notesIndex: autoNotesIndex !== -1 ? autoNotesIndex : null,
      },
      summary: {
        totalRows: dataLines.length,
        validCount: validPhones.length,
        duplicateInFileCount,
        alreadyInDbCount,
        invalidCount,
      },
      previewRows: previewRows.slice(0, 150),
      rows: previewRows.slice(0, 150),
      validPhones,
      validLeads,
    });
  } catch (error: any) {
    console.error("CSV preview error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to process spreadsheet file" },
      { status: statusCode }
    );
  }
}
