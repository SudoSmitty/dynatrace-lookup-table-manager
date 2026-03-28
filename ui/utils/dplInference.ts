/**
 * utils/dplInference.ts
 * ---------------------------------------------------------------------------
 * Analyses the content of a data file (CSV, JSON, JSONL) and infers the
 * best-fitting DPL (Dynatrace Pattern Language) matcher for each field /
 * column.  The result is used to auto-generate a parse pattern for the
 * lookup:upload API.
 *
 * Complete DPL Grammar Reference – all matcher types:
 *
 * ── Composite / Structural ──────────────────────────────────────────────
 *   JSON, JSON_OBJECT   – JSON object matcher
 *   JSON_ARRAY           – JSON array matcher
 *   JSON_VALUE           – JSON value matcher
 *   KVP                  – Key-value pair matcher
 *   ARRAY                – Array matcher
 *   STRUCTURE            – Structure matcher
 *   ENUM                 – Enum value matcher
 *
 * ── Lines & Strings ─────────────────────────────────────────────────────
 *   DATA                 – Multiline data (greedy, crosses line breaks)
 *   LD / LDATA           – Line data (up to end of line, catch-all)
 *   STRING               – Quoted string (single or double) or visible chars
 *   SQS                  – Single-quoted string
 *   DQS                  – Double-quoted string
 *   CSVSQS               – Single-quoted string (CSV escaping)
 *   CSVDQS               – Double-quoted string (CSV escaping)
 *   UPPER                – Uppercase characters [A-Z]
 *   LOWER                – Lowercase characters [a-z]
 *   ALPHA                – Alphabetic characters [a-zA-Z]
 *   DIGIT                – Digits [0-9]
 *   XDIGIT               – Hexadecimal digits [0-9a-fA-F]
 *   ALNUM                – Alphanumeric [a-zA-Z0-9]
 *   PUNCT                – Punctuation & symbols
 *   BLANK                – Space and tab
 *   SPACE                – Whitespace characters
 *   NSPACE               – Non-whitespace characters
 *   GRAPH                – Visible characters (no space)
 *   PRINT                – Printable characters
 *   WORD                 – Word characters [a-zA-Z0-9_]
 *   ASCII                – All ASCII characters
 *   CNTRL                – Control characters
 *
 * ── Line Terminators ────────────────────────────────────────────────────
 *   EOL / LF             – Line Feed
 *   EOLWIN / WINEOL      – CR+LF (Windows)
 *   CR                   – Carriage Return
 *
 * ── Time & Date ─────────────────────────────────────────────────────────
 *   TIMESTAMP / TIME     – Generic timestamp (configurable format)
 *   JSONTIMESTAMP        – yyyy-MM-ddTHH:mm:ss.SSSZ
 *   ISO8601              – yyyy-MM-ddTHH:mm:ssZ
 *   HTTPDATE             – dd/MMM/yyyy:HH:mm:ss Z
 *
 * ── Numeric ─────────────────────────────────────────────────────────────
 *   BOOLEAN / BOOL       – true / false (case-insensitive)
 *   INT / INTEGER        – Integer numbers (32-bit range)
 *   LONG                 – Integer numbers (64-bit range)
 *   HEXINT               – Hexadecimal integers
 *   HEXLONG              – Hexadecimal long integers
 *   FLOAT                – Floating-point (dot separator)
 *   CFLOAT               – Floating-point (comma separator)
 *   DOUBLE               – Floating-point (dot separator, double precision)
 *   CDOUBLE              – Floating-point (comma separator, double precision)
 *
 * ── Network ─────────────────────────────────────────────────────────────
 *   IPADDR               – IPv4 or IPv6 address
 *   IPV4 / IPV4ADDR      – IPv4 address only
 *   IPV6 / IPV6ADDR      – IPv6 address only
 *
 * ── Special ─────────────────────────────────────────────────────────────
 *   CREDITCARD           – Valid credit card number (Luhn check)
 *   SMARTSCAPEID         – Dynatrace SmartScape entity ID
 *
 * ── Modifiers (not matchers, used inline with matchers) ─────────────────
 *   <<  >>  !<<  !>>     – Look behind / ahead / negative variants
 *
 * @see https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-grammar
 */

// ── public types ───────────────────────────────────────────────────────────

/** A single detected column with inferred DPL type. */
export interface InferredColumn {
  /** Column / field name. */
  name: string;
  /** Auto-detected best-fit DPL matcher (for display only). */
  detectedType: DplType;
  /** The DPL matcher used in the actual parse pattern (defaults to LD). */
  dplType: DplType;
  /** A few sample values (max 5) for the user to sanity-check. */
  samples: string[];
}

/**
 * Every DPL matcher keyword that can be used in a parse pattern.
 *
 * Composite matchers (JSON, JSON_OBJECT, JSON_ARRAY, JSON_VALUE, KVP, ARRAY,
 * STRUCTURE, ENUM) require configuration blocks `{ ... }` and are not
 * automatically inferred – but they are available for manual override.
 *
 * Line terminators (EOL, EOLWIN, CR) and look-around modifiers are used for
 * structural pattern building, not column-level typing.
 */
export type DplType =
  // Numeric
  | "INT"
  | "LONG"
  | "HEXINT"
  | "HEXLONG"
  | "FLOAT"
  | "CFLOAT"
  | "DOUBLE"
  | "CDOUBLE"
  | "BOOLEAN"
  // Network
  | "IPV4"
  | "IPV6"
  | "IPADDR"
  // Time & Date
  | "TIMESTAMP"
  | "JSONTIMESTAMP"
  | "ISO8601"
  | "HTTPDATE"
  // Lines & Strings
  | "LD"
  | "DATA"
  | "STRING"
  | "SQS"
  | "DQS"
  | "CSVSQS"
  | "CSVDQS"
  | "UPPER"
  | "LOWER"
  | "ALPHA"
  | "DIGIT"
  | "XDIGIT"
  | "ALNUM"
  | "PUNCT"
  | "BLANK"
  | "SPACE"
  | "NSPACE"
  | "GRAPH"
  | "PRINT"
  | "WORD"
  | "ASCII"
  | "CNTRL"
  // Special
  | "CREDITCARD"
  | "SMARTSCAPEID"
  // Composite (require config blocks – available for manual override)
  | "JSON"
  | "JSON_OBJECT"
  | "JSON_ARRAY"
  | "JSON_VALUE"
  | "KVP"
  | "ARRAY"
  | "STRUCTURE"
  | "ENUM";

/**
 * All selectable DPL types grouped by category – exposed for the override
 * dropdown in the UI.
 */
export const DPL_TYPE_GROUPS: { label: string; types: DplType[] }[] = [
  {
    label: "Numeric",
    types: ["INT", "LONG", "HEXINT", "HEXLONG", "FLOAT", "CFLOAT", "DOUBLE", "CDOUBLE", "BOOLEAN"],
  },
  {
    label: "Network",
    types: ["IPV4", "IPV6", "IPADDR"],
  },
  {
    label: "Time & Date",
    types: ["TIMESTAMP", "JSONTIMESTAMP", "ISO8601", "HTTPDATE"],
  },
  {
    label: "Strings & Characters",
    types: [
      "LD", "DATA", "STRING", "SQS", "DQS", "CSVSQS", "CSVDQS",
      "UPPER", "LOWER", "ALPHA", "DIGIT", "XDIGIT", "ALNUM",
      "PUNCT", "BLANK", "SPACE", "NSPACE", "GRAPH", "PRINT",
      "WORD", "ASCII", "CNTRL",
    ],
  },
  {
    label: "Special",
    types: ["CREDITCARD", "SMARTSCAPEID"],
  },
  {
    label: "Composite",
    types: ["JSON", "JSON_OBJECT", "JSON_ARRAY", "JSON_VALUE", "KVP", "ARRAY", "STRUCTURE", "ENUM"],
  },
];

/** Flat list of every DPL type for convenience. */
export const ALL_DPL_TYPES: DplType[] = DPL_TYPE_GROUPS.flatMap((g) => g.types);

// ── regex patterns ─────────────────────────────────────────────────────────

// Network
const RE_IPV4 =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

const RE_IPV6 =
  /^([0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}$|^::([0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,6}::$|^::$/;

// Numeric
const RE_INT = /^-?\d+$/;
const RE_HEXINT = /^0[xX][0-9a-fA-F]+$/;
const RE_DOUBLE = /^-?\d+\.\d+$/;
const RE_CDOUBLE = /^-?\d+,\d+$/; // comma decimal separator (European)
const RE_BOOLEAN = /^(true|false)$/i;

// Time & Date
const RE_ISO8601 =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:?\d{2})$/;
const RE_JSONTIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,9}(Z|[+-]\d{2}:?\d{2})$/;
const RE_HTTPDATE =
  /^\d{2}\/[A-Z][a-z]{2}\/\d{4}:\d{2}:\d{2}:\d{2} [+-]\d{4}$/;
const RE_TIMESTAMP_GENERIC =
  /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

// Special
const RE_CREDITCARD = /^\d{13,19}$/; // length check; Luhn validated below
const RE_SMARTSCAPEID = /^[A-Z_]+-[0-9A-F]{16}$/; // e.g. HOST-1234567890ABCDEF

// Character classes (used for single-class columns)
const RE_UPPER_ONLY = /^[A-Z]+$/;
const RE_LOWER_ONLY = /^[a-z]+$/;
const RE_ALPHA_ONLY = /^[a-zA-Z]+$/;
const RE_DIGIT_ONLY = /^\d+$/;
const RE_XDIGIT_ONLY = /^[0-9a-fA-F]+$/;
const RE_ALNUM_ONLY = /^[a-zA-Z0-9]+$/;
const RE_WORD_ONLY = /^[a-zA-Z0-9_]+$/;

// ── inference logic ────────────────────────────────────────────────────────

/** Number of rows to sample for type inference. */
const MAX_SAMPLE_ROWS = 50;

/**
 * Read a File object and infer column types.
 * Supports CSV (with header row), JSON arrays, and JSON-Lines.
 */
export async function inferColumns(
  file: File,
  format: "csv" | "json" | "jsonl" | "xml"
): Promise<InferredColumn[]> {
  const text = await readFileHead(file, 256 * 1024); // first 256 KB

  switch (format) {
    case "csv":
      return inferFromCsv(text);
    case "json":
      return inferFromJson(text);
    case "jsonl":
      return inferFromJsonl(text);
    case "xml":
      // XML inference is complex; fall back to generic LD for all fields.
      return [];
  }
}

// ── CSV ────────────────────────────────────────────────────────────────────

function inferFromCsv(text: string): InferredColumn[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCSVRow(lines[0]);
  const dataRows = lines.slice(1, 1 + MAX_SAMPLE_ROWS).map(parseCSVRow);

  return headers.map((name, colIdx) => {
    const values = dataRows.map((row) => (row[colIdx] ?? "").trim());
    const nonEmpty = values.filter(Boolean);
    const detected = inferType(nonEmpty);
    return {
      name,
      detectedType: detected,
      dplType: "LD" as DplType,
      samples: nonEmpty.slice(0, 5),
    };
  });
}

/** Minimal RFC-4180 CSV row parser (handles quoted fields). */
function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuote = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuote = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// ── JSON ───────────────────────────────────────────────────────────────────

function inferFromJson(text: string): InferredColumn[] {
  try {
    const parsed = JSON.parse(text);
    const arr: Record<string, unknown>[] = Array.isArray(parsed)
      ? parsed
      : [parsed];
    return inferFromRecords(arr.slice(0, MAX_SAMPLE_ROWS));
  } catch {
    return [];
  }
}

// ── JSONL ──────────────────────────────────────────────────────────────────

function inferFromJsonl(text: string): InferredColumn[] {
  const lines = text
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .slice(0, MAX_SAMPLE_ROWS);
  const records: Record<string, unknown>[] = [];
  for (const line of lines) {
    try {
      records.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }
  return inferFromRecords(records);
}

// ── shared record-based inference (JSON / JSONL) ───────────────────────────

function inferFromRecords(
  records: Record<string, unknown>[]
): InferredColumn[] {
  if (records.length === 0) return [];

  // Collect all unique keys across records
  const keySet = new Set<string>();
  for (const rec of records) {
    for (const key of Object.keys(rec)) {
      keySet.add(key);
    }
  }
  const keys = Array.from(keySet);

  return keys.map((name) => {
    const values = records
      .map((r) => {
        const v = r[name];
        return v == null ? "" : String(v);
      })
      .filter(Boolean);
    return {
      name,
      detectedType: inferType(values),
      dplType: "LD" as DplType,
      samples: values.slice(0, 5),
    };
  });
}

// ── per-value type inference ───────────────────────────────────────────────

/**
 * Classify a single value against all detectable DPL types.
 * Returns the best-matching type tag or `null` if only LD would fit.
 */
type DetectedType =
  | "BOOLEAN"
  | "SMARTSCAPEID"
  | "CREDITCARD"
  | "IPV4"
  | "IPV6"
  | "JSONTIMESTAMP"
  | "ISO8601"
  | "HTTPDATE"
  | "TIMESTAMP"
  | "HEXINT"
  | "INT"
  | "DOUBLE"
  | "CDOUBLE"
  | "DIGIT"
  | "XDIGIT"
  | "UPPER"
  | "LOWER"
  | "ALPHA"
  | "ALNUM"
  | "WORD"
  | null;

function classifyValue(v: string): DetectedType {
  // Boolean first – very specific
  if (RE_BOOLEAN.test(v)) return "BOOLEAN";

  // Dynatrace SmartScape ID (e.g. HOST-1234567890ABCDEF)
  if (RE_SMARTSCAPEID.test(v)) return "SMARTSCAPEID";

  // Credit card (13-19 digits + Luhn check)
  if (RE_CREDITCARD.test(v) && luhnCheck(v)) return "CREDITCARD";

  // Network addresses
  if (RE_IPV4.test(v)) return "IPV4";
  if (RE_IPV6.test(v)) return "IPV6";

  // Timestamps – most specific first
  if (RE_JSONTIMESTAMP.test(v)) return "JSONTIMESTAMP";
  if (RE_ISO8601.test(v)) return "ISO8601";
  if (RE_HTTPDATE.test(v)) return "HTTPDATE";
  if (RE_TIMESTAMP_GENERIC.test(v)) return "TIMESTAMP";

  // Hex integers (0xABCD)
  if (RE_HEXINT.test(v)) return "HEXINT";

  // Plain integers
  if (RE_INT.test(v)) return "INT";

  // Floating point (dot)
  if (RE_DOUBLE.test(v)) return "DOUBLE";

  // Floating point (comma – European)
  if (RE_CDOUBLE.test(v)) return "CDOUBLE";

  // Pure character classes (from narrowest to widest)
  if (RE_DIGIT_ONLY.test(v)) return "DIGIT";
  if (RE_XDIGIT_ONLY.test(v)) return "XDIGIT";
  if (RE_UPPER_ONLY.test(v)) return "UPPER";
  if (RE_LOWER_ONLY.test(v)) return "LOWER";
  if (RE_ALPHA_ONLY.test(v)) return "ALPHA";
  if (RE_ALNUM_ONLY.test(v)) return "ALNUM";
  if (RE_WORD_ONLY.test(v)) return "WORD";

  // Everything else → null (will become LD)
  return null;
}

/** Luhn algorithm for credit card validation. */
function luhnCheck(num: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/**
 * Given an array of sample values for a single column, determine the
 * best-fitting DPL matcher type.
 *
 * Strategy:
 *  1. Classify every value individually.
 *  2. Count how many values fall into each detected type.
 *  3. Pick the type with ≥ 80% consensus.
 *  4. For INT, decide between INT vs LONG based on value range.
 *  5. For mixed IPV4+IPV6, promote to IPADDR.
 *  6. Fall back to LD when nothing else fits.
 */
function inferType(values: string[]): DplType {
  if (values.length === 0) return "LD";

  const counts = new Map<DetectedType | null, number>();
  for (const v of values) {
    const t = classifyValue(v);
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  const n = values.length;
  const threshold = 0.8;

  // Helper: ratio for a given type
  const ratio = (t: DetectedType | null) => (counts.get(t) ?? 0) / n;

  // Helper: combined ratio for multiple types
  const combinedRatio = (...types: (DetectedType | null)[]) =>
    types.reduce((sum, t) => sum + (counts.get(t) ?? 0), 0) / n;

  // ── Check in priority order (most specific → least) ──

  if (ratio("BOOLEAN") >= threshold) return "BOOLEAN";

  if (ratio("SMARTSCAPEID") >= threshold) return "SMARTSCAPEID";

  if (ratio("CREDITCARD") >= threshold) return "CREDITCARD";

  // Network: pure IPV4, pure IPV6, or mixed → IPADDR
  if (ratio("IPV4") >= threshold) return "IPV4";
  if (ratio("IPV6") >= threshold) return "IPV6";
  if (combinedRatio("IPV4", "IPV6") >= threshold) return "IPADDR";

  // Timestamps: pick most specific variant first
  if (ratio("JSONTIMESTAMP") >= threshold) return "JSONTIMESTAMP";
  if (ratio("ISO8601") >= threshold) return "ISO8601";
  if (ratio("HTTPDATE") >= threshold) return "HTTPDATE";
  if (combinedRatio("TIMESTAMP", "JSONTIMESTAMP", "ISO8601", "HTTPDATE") >= threshold)
    return "TIMESTAMP";

  // Hex integers
  if (ratio("HEXINT") >= threshold) return "HEXINT";

  // Plain integers → decide INT vs LONG based on magnitude
  if (ratio("INT") >= threshold) {
    const allFit32 = values.every((v) => {
      if (!RE_INT.test(v)) return true;
      const num = Number(v);
      return num >= -2_147_483_648 && num <= 2_147_483_647;
    });
    return allFit32 ? "INT" : "LONG";
  }

  // Mixed integer + DIGIT (pure digit strings are also valid ints)
  if (combinedRatio("INT", "DIGIT") >= threshold) {
    const allFit32 = values.every((v) => {
      if (!RE_INT.test(v) && !RE_DIGIT_ONLY.test(v)) return true;
      const num = Number(v);
      return num >= -2_147_483_648 && num <= 2_147_483_647;
    });
    return allFit32 ? "INT" : "LONG";
  }

  // Floating point (dot) – includes INT+DOUBLE mixes
  if (combinedRatio("INT", "DOUBLE", "DIGIT") >= threshold && (counts.get("DOUBLE") ?? 0) > 0)
    return "DOUBLE";

  // Floating point (comma separator)
  if (ratio("CDOUBLE") >= threshold) return "CDOUBLE";
  if (combinedRatio("INT", "CDOUBLE", "DIGIT") >= threshold && (counts.get("CDOUBLE") ?? 0) > 0)
    return "CDOUBLE";

  // Pure digit strings (not matching INT because no sign)
  if (ratio("DIGIT") >= threshold) return "DIGIT";

  // Hex digits
  if (combinedRatio("DIGIT", "XDIGIT") >= threshold && (counts.get("XDIGIT") ?? 0) > 0)
    return "XDIGIT";

  // Character class matchers (narrowest first)
  if (ratio("UPPER") >= threshold) return "UPPER";
  if (ratio("LOWER") >= threshold) return "LOWER";
  if (combinedRatio("UPPER", "LOWER", "ALPHA") >= threshold) return "ALPHA";
  if (combinedRatio("UPPER", "LOWER", "ALPHA", "DIGIT", "ALNUM") >= threshold) return "ALNUM";
  if (combinedRatio("UPPER", "LOWER", "ALPHA", "DIGIT", "ALNUM", "WORD") >= threshold)
    return "WORD";

  // Default catch-all
  return "LD";
}

// ── pattern generation ─────────────────────────────────────────────────────

/**
 * Build the full DPL parse pattern string from inferred (or overridden) columns.
 *
 * For CSV:  `LD:<name> ',' LD:<name> ... EOL`
 *           We use LD (line data) for ALL columns to ensure every row parses
 *           successfully. Strict type matchers (IPV4, DOUBLE, etc.) reject
 *           rows where even one value doesn't match exactly, so they are
 *           shown in the preview only and not used in the actual pattern.
 * For JSON: we use the built-in `JSON:<lookupField>` shorthand and don't
 *           need per-field matchers (JSON parsing is automatic).
 */
export function buildCsvParsePattern(columns: InferredColumn[]): string {
  if (columns.length === 0) return "LD:data EOL";
  return columns.map((c) => `${c.dplType}:${sanitizeName(c.name)}`).join(" ',' ") + " EOL";
}

function sanitizeName(name: string): string {
  // DPL export names: alphanumeric + underscore, no spaces
  return name.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^(\d)/, "_$1");
}

// ── file reading ───────────────────────────────────────────────────────────

function readFileHead(file: File, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const slice = file.slice(0, maxBytes);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(slice);
  });
}
