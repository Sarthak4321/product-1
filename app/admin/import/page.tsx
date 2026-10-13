"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  SlidersHorizontal,
  Table as TableIcon,
  User,
  Phone,
  BookOpen,
  MapPin,
  GraduationCap,
  FileText,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { SessionUser } from "@/lib/auth";

interface PreviewSummary {
  totalRows: number;
  validCount: number;
  duplicateInFileCount: number;
  alreadyInDbCount: number;
  invalidCount: number;
}

interface PreviewRow {
  rowNumber: number;
  raw: string;
  normalized: string;
  rowData: Record<string, string>;
  cells: string[];
  status: "VALID" | "DUPLICATE_FILE" | "DUPLICATE_DB" | "INVALID";
  reason?: string;
}

interface FieldMappings {
  phoneHeader: string;
  nameHeader: string;
  courseHeader: string;
  placeHeader: string;
  classHeader: string;
  notesHeader: string;
}

export default function AdminImportPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<SessionUser | null>(null);
  const [counsellors, setCounsellors] = useState<Array<{ id: string; name: string }>>([]);
  const [assignedToId, setAssignedToId] = useState("");

  const [csvContent, setCsvContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMappings>({
    phoneHeader: "",
    nameHeader: "",
    courseHeader: "",
    placeHeader: "",
    classHeader: "",
    notesHeader: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [summary, setSummary] = useState<PreviewSummary | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [validPhones, setValidPhones] = useState<string[]>([]);

  // Check auth and load counsellors
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (!["ADMIN", "ORG_ADMIN", "SUPER_ADMIN"].includes(data.user.role)) {
            showToast("Admin access required", "error");
            router.push("/leads");
            return;
          }
          setUser(data.user);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));

    // Fetch counsellors
    fetch("/api/counsellors")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.counsellors) {
          setCounsellors(data.counsellors);
        }
      });
  }, [router, showToast]);

  const parseFileToCsvText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const reader = new FileReader();

      if (ext === "xlsx" || ext === "xls") {
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            resolve(csv);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
      } else {
        // Plain CSV / TXT file
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
      }
    });
  };

  const handleFileProcess = async (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);
    try {
      const parsedCsvText = await parseFileToCsvText(file);
      setCsvContent(parsedCsvText);
      await processPreview(parsedCsvText);
    } catch (err) {
      console.error(err);
      showToast("Error parsing Excel/CSV file", "error");
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const processPreview = async (rawContent: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/leads/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent: rawContent }),
      });

      if (!res.ok) throw new Error("Failed to parse lead preview");

      const data = await res.json();
      const detectedHeaders: string[] = data.headers || [];
      setHeaders(detectedHeaders);

      // Auto-populate field mappings based on returned autoMapping indices
      const autoMap = data.autoMapping || {};
      setFieldMappings({
        phoneHeader: autoMap.phoneIndex !== null && detectedHeaders[autoMap.phoneIndex] ? detectedHeaders[autoMap.phoneIndex] : detectedHeaders[0] || "",
        nameHeader: autoMap.nameIndex !== null && detectedHeaders[autoMap.nameIndex] ? detectedHeaders[autoMap.nameIndex] : "",
        courseHeader: autoMap.courseIndex !== null && detectedHeaders[autoMap.courseIndex] ? detectedHeaders[autoMap.courseIndex] : "",
        placeHeader: autoMap.placeIndex !== null && detectedHeaders[autoMap.placeIndex] ? detectedHeaders[autoMap.placeIndex] : "",
        classHeader: autoMap.classIndex !== null && detectedHeaders[autoMap.classIndex] ? detectedHeaders[autoMap.classIndex] : "",
        notesHeader: autoMap.notesIndex !== null && detectedHeaders[autoMap.notesIndex] ? detectedHeaders[autoMap.notesIndex] : "",
      });

      setSummary(data.summary || null);
      setPreviewRows(data.previewRows || data.rows || []);
      setValidPhones(data.validPhones || []);
    } catch (e) {
      console.error(e);
      showToast("Error validating CSV/Excel file", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Compute structured leads payload to submit based on active field mappings
  const leadsToImport = useMemo(() => {
    const validRows = previewRows.filter((r) => r.status === "VALID");
    return validRows.map((row) => {
      const rowData = row.rowData || {};
      return {
        phone: row.normalized || row.raw,
        name: fieldMappings.nameHeader ? rowData[fieldMappings.nameHeader] || undefined : undefined,
        course: fieldMappings.courseHeader ? rowData[fieldMappings.courseHeader] || undefined : undefined,
        place: fieldMappings.placeHeader ? rowData[fieldMappings.placeHeader] || undefined : undefined,
        class: fieldMappings.classHeader ? rowData[fieldMappings.classHeader] || undefined : undefined,
        notes: fieldMappings.notesHeader ? rowData[fieldMappings.notesHeader] || undefined : undefined,
      };
    });
  }, [previewRows, fieldMappings]);

  const handleConfirmImport = async () => {
    if (!leadsToImport.length) {
      showToast("No valid leads to import", "error");
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch("/api/leads/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads: leadsToImport,
          phones: validPhones,
          assignedToId: assignedToId || undefined,
        }),
      });

      if (!res.ok) throw new Error("Import failed");

      const data = await res.json();
      showToast(
        `Successfully imported ${data.importedCount} leads with full details!`,
        "success"
      );
      router.push("/leads");
    } catch (e) {
      console.error(e);
      showToast("Failed to commit lead import", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const getHeaderBadge = (headerName: string) => {
    if (headerName === fieldMappings.phoneHeader) {
      return (
        <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px] uppercase flex items-center gap-1">
          <Phone className="w-3 h-3" /> Phone
        </span>
      );
    }
    if (headerName === fieldMappings.nameHeader) {
      return (
        <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[10px] uppercase flex items-center gap-1">
          <User className="w-3 h-3" /> Name
        </span>
      );
    }
    if (headerName === fieldMappings.courseHeader) {
      return (
        <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px] uppercase flex items-center gap-1">
          <GraduationCap className="w-3 h-3" /> Course
        </span>
      );
    }
    if (headerName === fieldMappings.placeHeader) {
      return (
        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase flex items-center gap-1">
          <MapPin className="w-3 h-3" /> City/Place
        </span>
      );
    }
    if (headerName === fieldMappings.classHeader) {
      return (
        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] uppercase flex items-center gap-1">
          <BookOpen className="w-3 h-3" /> Class
        </span>
      );
    }
    if (headerName === fieldMappings.notesHeader) {
      return (
        <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px] uppercase flex items-center gap-1">
          <FileText className="w-3 h-3" /> Notes
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-safe font-sans">
      <Header user={user} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-blue-600" />
            <span>Import Leads Spreadsheet</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Upload Excel (.xlsx, .xls) or CSV files with dynamic field mapping and automatic deduplication.
          </p>
        </div>

        {/* Dropzone Upload Card */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="bg-white border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all shadow-2xs group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors">
              <FileSpreadsheet className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                {fileName ? (
                  <span className="text-blue-600 font-bold">{fileName}</span>
                ) : (
                  "Click to browse or drag & drop file here"
                )}
              </p>
              <p className="text-xs text-slate-400">
                Supports Excel (.xlsx, .xls) and CSV (.csv) format
              </p>
            </div>

            {fileName && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-2 text-xs"
              >
                Change File
              </Button>
            )}
          </div>
        </div>

        {/* Processing Spinner */}
        {isProcessing && (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-2xs space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">
              Analyzing file structure & checking duplicates...
            </p>
          </div>
        )}

        {/* Validation Breakdown, Field Mapping & Table Preview */}
        {summary && !isProcessing && (
          <div className="space-y-6">
            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-center">
                <p className="text-xs text-slate-500 font-medium">Total Rows</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {summary.totalRows}
                </p>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl shadow-2xs text-center">
                <p className="text-xs text-emerald-800 font-semibold">Valid New</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {summary.validCount}
                </p>
              </div>

              <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl shadow-2xs text-center">
                <p className="text-xs text-amber-800 font-semibold">Duplicates</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {summary.duplicateInFileCount + summary.alreadyInDbCount}
                </p>
              </div>

              <div className="bg-rose-50/60 border border-rose-200 p-4 rounded-2xl shadow-2xs text-center">
                <p className="text-xs text-rose-800 font-semibold">Invalid</p>
                <p className="text-2xl font-bold text-rose-700 mt-1">
                  {summary.invalidCount}
                </p>
              </div>
            </div>

            {/* Dynamic CSV Field Mapping Controls */}
            {headers.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Dynamic Field Mapping
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {headers.length} CSV Columns Detected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Phone Mapping */}
                  <Select
                    label="📱 Mobile Phone Number *"
                    value={fieldMappings.phoneHeader}
                    onChange={(e) => setFieldMappings({ ...fieldMappings, phoneHeader: e.target.value })}
                    options={headers.map((h) => ({ value: h, label: h }))}
                  />

                  {/* Name Mapping */}
                  <Select
                    label="👤 Student / Lead Name"
                    value={fieldMappings.nameHeader}
                    onChange={(e) => setFieldMappings({ ...fieldMappings, nameHeader: e.target.value })}
                    options={[
                      { value: "", label: "-- Ignore / Do not map --" },
                      ...headers.map((h) => ({ value: h, label: h })),
                    ]}
                  />

                  {/* Course Mapping */}
                  <Select
                    label="🎓 Course / Stream"
                    value={fieldMappings.courseHeader}
                    onChange={(e) => setFieldMappings({ ...fieldMappings, courseHeader: e.target.value })}
                    options={[
                      { value: "", label: "-- Ignore / Do not map --" },
                      ...headers.map((h) => ({ value: h, label: h })),
                    ]}
                  />

                  {/* City/Place Mapping */}
                  <Select
                    label="📍 City / Location"
                    value={fieldMappings.placeHeader}
                    onChange={(e) => setFieldMappings({ ...fieldMappings, placeHeader: e.target.value })}
                    options={[
                      { value: "", label: "-- Ignore / Do not map --" },
                      ...headers.map((h) => ({ value: h, label: h })),
                    ]}
                  />

                  {/* Class Mapping */}
                  <Select
                    label="📚 Class / Batch"
                    value={fieldMappings.classHeader}
                    onChange={(e) => setFieldMappings({ ...fieldMappings, classHeader: e.target.value })}
                    options={[
                      { value: "", label: "-- Ignore / Do not map --" },
                      ...headers.map((h) => ({ value: h, label: h })),
                    ]}
                  />

                  {/* Notes Mapping */}
                  <Select
                    label="📝 Notes / Email / Details"
                    value={fieldMappings.notesHeader}
                    onChange={(e) => setFieldMappings({ ...fieldMappings, notesHeader: e.target.value })}
                    options={[
                      { value: "", label: "-- Ignore / Do not map --" },
                      ...headers.map((h) => ({ value: h, label: h })),
                    ]}
                  />
                </div>
              </div>
            )}

            {/* Auto-Assign Selector & Confirm Button */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <Select
                label="Auto-Assign New Leads to Counsellor (Optional)"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                options={[
                  { value: "", label: "Unassigned (Queue Pool)" },
                  ...counsellors.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />

              <Button
                variant="primary"
                size="lg"
                onClick={handleConfirmImport}
                isLoading={isImporting}
                disabled={summary.validCount === 0}
                className="w-full text-base font-bold py-3.5 shadow-sm"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {summary.validCount > 0
                  ? `IMPORT ${summary.validCount} LEADS WITH DYNAMIC FIELDS`
                  : "NO VALID LEADS TO IMPORT"}
              </Button>
            </div>

            {/* Dynamic Spreadsheet Grid Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Spreadsheet Data Preview (Showing up to 150 rows)
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {previewRows.length} rows loaded
                </span>
              </div>

              {/* Dynamic Table with Original CSV Columns */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-sans">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-3.5 py-3 w-12 text-center text-slate-400">
                        #
                      </th>
                      <th scope="col" className="px-3.5 py-3 min-w-[130px]">
                        Status
                      </th>
                      {headers.map((h, i) => (
                        <th key={i} scope="col" className="px-3.5 py-3 min-w-[140px] whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span>{h}</span>
                            {getHeaderBadge(h)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 font-medium">
                    {previewRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          row.status === "INVALID" ? "bg-rose-50/30" : row.status.startsWith("DUPLICATE") ? "bg-amber-50/20" : ""
                        }`}
                      >
                        <td className="px-3.5 py-3 font-mono text-slate-400 text-center font-bold">
                          {row.rowNumber}
                        </td>

                        <td className="px-3.5 py-3 whitespace-nowrap">
                          {row.status === "VALID" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                              <span>Valid</span>
                            </span>
                          )}

                          {row.status === "DUPLICATE_FILE" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                              <span>Dup in File</span>
                            </span>
                          )}

                          {row.status === "DUPLICATE_DB" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                              <span>In CRM DB</span>
                            </span>
                          )}

                          {row.status === "INVALID" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md">
                              <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                              <span>Invalid</span>
                            </span>
                          )}
                        </td>

                        {headers.map((h, i) => {
                          const val = row.rowData?.[h] || row.cells?.[i] || "";
                          const isPhoneCol = h === fieldMappings.phoneHeader;
                          return (
                            <td
                              key={i}
                              className={`px-3.5 py-3 text-slate-800 truncate max-w-[200px] ${
                                isPhoneCol ? "font-mono font-bold text-blue-700" : ""
                              }`}
                              title={val}
                            >
                              {val || <span className="text-slate-300 italic">-</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav user={user} />
    </div>
  );
}
