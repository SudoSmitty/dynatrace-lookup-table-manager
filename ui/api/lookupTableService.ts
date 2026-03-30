/**
 * api/lookupTableService.ts
 * ---------------------------------------------------------------------------
 * Service functions for CRUD operations on Dynatrace Grail lookup tables.
 *
 * - List   → DQL query against dt.system.files
 * - Create → POST …/lookup:upload (overwrite=false)
 * - Update → POST …/lookup:upload (overwrite=true)
 * - Delete → POST …/files:delete
 * - Preview → DQL `load` command
 * - Test parse → POST …/lookup:test-pattern
 */

import { queryFetch, resourceStoreFetch } from "./platformFetch";
import type {
  LookupRow,
  LookupTableMeta,
  LookupUploadRequest,
  LookupUploadResponse,
} from "../types";

// ---------------------------------------------------------------------------
// DQL response helper
// ---------------------------------------------------------------------------

/**
 * Extract records from a DQL query:execute response.
 * The response shape can vary:
 *   - { records: [...] }
 *   - { result: { records: [...] } }
 * This helper handles both defensively.
 */
function extractRecords<T>(raw: Record<string, unknown>): T[] {
  if (Array.isArray(raw.records)) return raw.records as T[];
  const nested = raw.result as Record<string, unknown> | undefined;
  if (nested && Array.isArray(nested.records)) return nested.records as T[];
  return [];
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/**
 * Fetch all lookup tables from Grail using DQL `fetch dt.system.files`.
 * There is no REST list endpoint — DQL is the only way to enumerate files.
 */
export async function listLookupTables(
  search?: string
): Promise<LookupTableMeta[]> {
  let dql = `fetch dt.system.files`;
  if (search) {
    const s = search.replace(/"/g, "\\\"");
    dql += `\n| filter contains(name, "${s}") or contains(display_name, "${s}")`;
  }

  const raw = await queryFetch<Record<string, unknown>>({
    query: dql,
    requestTimeoutMilliseconds: 30_000,
    maxResultRecords: 1_000,
  });

  const records = extractRecords<Record<string, unknown>>(raw);

  return records
    .map(mapRecordToMeta)
    .filter((f) => f.filePath.startsWith("/lookups/"));
}

/**
 * Map a raw DQL record from `dt.system.files` to our `LookupTableMeta` shape.
 * Field names are resolved defensively – if the schema ever changes we fall
 * back gracefully.
 */
function mapRecordToMeta(r: Record<string, unknown>): LookupTableMeta {
  const filePath = String(r.name ?? r.filePath ?? r.path ?? r.file_path ?? "");
  return {
    filePath,
    displayName: String(
      r.display_name ?? r.displayName ?? extractName(filePath)
    ),
    description: String(r.description ?? ""),
    sizeBytes: Number(r.size ?? r.sizeBytes ?? r.file_size ?? 0),
    lastModified: String(
      r["modified.timestamp"] ?? r.lastModified ?? r.last_modified ?? r.timestamp ?? ""
    ),
  };
}

/** Derive a human-friendly name from a file path. */
function extractName(filePath: string): string {
  const parts = filePath.split("/").filter(Boolean);
  const filename = parts[parts.length - 1] ?? filePath;
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
}

// ---------------------------------------------------------------------------
// Preview (View Detail)
// ---------------------------------------------------------------------------

/** Load all rows of a lookup table via DQL. */
export async function previewLookupTable(
  filePath: string
): Promise<LookupRow[]> {
  const dql = `load "${filePath}"`;

  const raw = await queryFetch<Record<string, unknown>>({
    query: dql,
    requestTimeoutMilliseconds: 60_000,
    maxResultRecords: 50_000,
  });

  return extractRecords<LookupRow>(raw);
}

/** Count total records in a lookup table. */
export async function countLookupRows(filePath: string): Promise<number> {
  const dql = `load "${filePath}" | summarize count()`;
  const raw = await queryFetch<Record<string, unknown>>({
    query: dql,
    requestTimeoutMilliseconds: 30_000,
    maxResultRecords: 1,
  });
  const records = extractRecords<{ "count()": number }>(raw);
  return records[0]?.["count()"] ?? 0;
}

// ---------------------------------------------------------------------------
// Create / Update (Upload)
// ---------------------------------------------------------------------------

/**
 * Upload a lookup table to the Resource Store.
 * @param meta   – JSON metadata (filePath, lookupField, etc.)
 * @param file   – The data file content (CSV, JSONL, XML, …)
 * @param overwrite – true to replace an existing table; false for new.
 */
export async function uploadLookupTable(
  meta: LookupUploadRequest,
  file: File,
  overwrite = false
): Promise<LookupUploadResponse> {
  const formData = new FormData();

  // The "request" part must be sent as application/json within the multipart body.
  // Using a Blob ensures the correct Content-Type for this part.
  // Include `overwrite` in the JSON body so the API recognises it.
  const requestBody = overwrite ? { ...meta, overwrite: true } : meta;
  formData.append(
    "request",
    new Blob([JSON.stringify(requestBody)], { type: "application/json" })
  );

  // The "content" part is the actual data file.
  formData.append("content", file);

  const qs = overwrite ? "?overwrite=true" : "";

  const raw = await resourceStoreFetch<Record<string, unknown>>(
    `/files/tabular/lookup:upload${qs}`,
    {
      method: "POST",
      body: formData,
      // Do NOT set Content-Type – the browser adds the multipart boundary.
    }
  );

  // The API response shape may vary – normalise it defensively.
  return {
    filePath: String(raw.filePath ?? raw.path ?? raw.file_path ?? meta.filePath),
    recordsCount: Number(raw.recordsCount ?? raw.records_count ?? raw.totalRecords ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Test Parse Pattern
// ---------------------------------------------------------------------------

export interface TestPatternResult {
  success: boolean;
  records?: LookupRow[];
  error?: string;
}

/** Validate a parse pattern against a sample file before uploading. */
export async function testParsePattern(
  meta: LookupUploadRequest,
  file: File
): Promise<TestPatternResult> {
  const formData = new FormData();
  formData.append("request", JSON.stringify(meta));
  formData.append("content", file, file.name);

  try {
    const result = await resourceStoreFetch<{ records: LookupRow[] }>(
      "/files/tabular/lookup:test-pattern",
      { method: "POST", body: formData }
    );
    return { success: true, records: result.records ?? [] };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/** Delete a lookup table from the Resource Store. */
export async function deleteLookupTable(filePath: string): Promise<void> {
  const response = await fetch(
    `${'/platform/storage/resource-store/v1'}/files:delete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath }),
    }
  );
  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.error?.message ?? body?.message ?? JSON.stringify(body);
    } catch {
      detail = await response.text().catch(() => "");
    }
    throw new Error(
      `Platform API error ${response.status}: ${detail || response.statusText}`
    );
  }
  // Delete may return empty body — don't try to parse JSON
}
