/**
 * types.ts
 * ---------------------------------------------------------------------------
 * Domain types used throughout the Lookup Table Manager application.
 */

/** Metadata for a single lookup table as returned by DQL / Resource Store. */
export interface LookupTableMeta {
  /** Full file path in the Resource Store, e.g. "/lookups/ip_ranges.csv" */
  filePath: string;
  /** Human-friendly display name (may be empty). */
  displayName: string;
  /** Optional description. */
  description: string;
  /** Size in bytes (from dt.system.files metadata). */
  sizeBytes: number;
  /** ISO 8601 timestamp when the file was last modified. */
  lastModified: string;
}

/** A single row of data from a lookup table preview. */
export type LookupRow = Record<string, unknown>;

/** Shape of the JSON part sent with the multipart upload request. */
export interface LookupUploadRequest {
  /** File path under /lookups/, e.g. "/lookups/my_table" */
  filePath: string;
  /** Name of the field used as the lookup key. */
  lookupField: string;
  /** DPL parse pattern. */
  parsePattern: string;
  /** Number of initial records to skip (e.g. 1 to skip CSV header row). */
  skippedRecords?: number;
  /** Optional display name. */
  displayName?: string;
  /** Optional description. */
  description?: string;
}

/** Response from the lookup:upload endpoint (simplified). */
export interface LookupUploadResponse {
  filePath: string;
  recordsCount: number;
}

/** Parameters for listing tables. */
export interface ListTablesParams {
  /** Optional text to filter table names. */
  search?: string;
}

/** Response wrapper for DQL queries. */
export interface DqlQueryResult<T = Record<string, unknown>> {
  records: T[];
  metadata?: Record<string, unknown>;
}
