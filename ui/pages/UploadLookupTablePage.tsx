/**
 * pages/UploadLookupTablePage.tsx
 * ---------------------------------------------------------------------------
 * Create / Update page for a lookup table.
 *
 * When the URL contains `?path=...` we are in UPDATE mode:
 *   - The form is pre-filled with the existing table's metadata.
 *   - Upload uses overwrite=true.
 *
 * Otherwise we are in CREATE mode:
 *   - All fields are blank.
 *   - Upload uses overwrite=false.
 */

import React, { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@dynatrace/strato-components-preview/buttons";
import {
  FormField,
  Label,
  TextInput,
  Select,
} from "@dynatrace/strato-components-preview/forms";
import { Flex } from "@dynatrace/strato-components-preview/layouts";
import { Heading, Text } from "@dynatrace/strato-components/typography";

import { uploadLookupTable } from "../api";
import { useNotifications } from "../hooks";
import {
  AppHeader,
  DataPreviewPanel,
  FileDropZone,
  LoadingOverlay,
  NotificationBar,
} from "../components";
import type { LookupUploadRequest } from "../types";
import type { InferredColumn, DplType } from "../utils/dplInference";
import { inferColumns, buildCsvParsePattern } from "../utils/dplInference";

type FileFormat = "csv" | "jsonl" | "json";

const FILE_FORMAT_OPTIONS: { value: FileFormat; label: string }[] = [
  { value: "csv", label: "CSV (comma-separated)" },
  { value: "jsonl", label: "JSON Lines (.jsonl)" },
  { value: "json", label: "JSON" },
];

/** Map file format to the DPL parse pattern Dynatrace expects.
 *  For JSON, the pattern must be `JSON:<lookupField>` per the official docs.
 *  For CSV with headers, use `CSV_HEADER`.
 *  @see https://developer.dynatrace.com/develop/guides/data/store-static-data-in-grail/
 */
function getParsePattern(format: FileFormat, lookupField: string): string {
  switch (format) {
    case "csv":
      // CSV pattern is built from inferred columns; this is a fallback
      // using LD (line data) as a catch-all if inference didn't run.
      return `LD:${lookupField || "data"} EOL`;
    case "jsonl":
      return `JSON:${lookupField}`;
    case "json":
      return `JSON:${lookupField}`;
  }
}

/** Try to detect the format from the file extension. */
function detectFormat(filename: string): FileFormat {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "jsonl" || ext === "ndjson") return "jsonl";
  if (ext === "json") return "json";
  return "csv";
}

export const UploadLookupTablePage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const existingPath = params.get("path"); // non-null → UPDATE mode

  const isUpdate = !!existingPath;

  // Form state
  const [tableName, setTableName] = useState(
    existingPath ? extractFilename(existingPath) : ""
  );
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [lookupField, setLookupField] = useState("");
  const [fileFormat, setFileFormat] = useState<FileFormat>("csv");
  const [file, setFile] = useState<File | null>(null);

  // Inference state
  const [inferredColumns, setInferredColumns] = useState<InferredColumn[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const { notifications, addNotification, dismiss } = useNotifications();

  // Auto-detect format and run column inference when a file is selected
  const handleFileSelected = useCallback(async (f: File | null) => {
    setFile(f);
    setInferredColumns([]);
    if (f) {
      const fmt = detectFormat(f.name);
      setFileFormat(fmt);
      // Only run column inference for CSV — JSON/JSONL are parsed automatically
      if (fmt === "csv") {
        setAnalyzing(true);
        try {
          const cols = await inferColumns(f, fmt);
          setInferredColumns(cols);
        } catch {
          // inference is best-effort; fall back silently
        } finally {
          setAnalyzing(false);
        }
      }
    }
  }, []);

  // Let the user override a column's inferred type
  const handleTypeChange = useCallback((colIndex: number, newType: DplType) => {
    setInferredColumns((prev) =>
      prev.map((col, i) => (i === colIndex ? { ...col, dplType: newType } : col))
    );
  }, []);

  // For CSV, the API needs the actual per-column DPL pattern (not CSV_HEADER)
  // plus skippedRecords=1 to skip the header row.
  // For JSON/JSONL/XML, use the simple format-based pattern.
  const computedParsePattern = useMemo(() => {
    if (fileFormat === "csv" && inferredColumns.length > 0) {
      return buildCsvParsePattern(inferredColumns);
    }
    return getParsePattern(fileFormat, lookupField.trim());
  }, [fileFormat, inferredColumns, lookupField]);

  // Derive the file path – no file extension; Dynatrace stores lookup tables
  // at paths like /lookups/<name> regardless of the source file format.
  const filePath = useMemo(() => {
    if (isUpdate) return existingPath!;
    const sanitized = tableName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_./\-]/g, "_")
      .replace(/\/+/g, "/")
      .replace(/^\/+/, "");
    return `/lookups/${sanitized}`;
  }, [isUpdate, existingPath, tableName]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (!isUpdate && !tableName.trim()) errs.push("Table name is required.");
    if (!lookupField.trim()) errs.push("Lookup key field is required.");
    if (!file) errs.push("A data file must be selected.");
    return errs;
  }, [isUpdate, tableName, lookupField, file]);

  const isValid = validationErrors.length === 0;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const buildMeta = useCallback((): LookupUploadRequest => {
    const meta: LookupUploadRequest = {
      filePath,
      lookupField: lookupField.trim(),
      parsePattern: computedParsePattern,
    };
    // Skip the header row for CSV files
    if (fileFormat === "csv") {
      meta.skippedRecords = 1;
    }
    if (displayName.trim()) meta.displayName = displayName.trim();
    if (description.trim()) meta.description = description.trim();
    return meta;
  }, [filePath, lookupField, displayName, description, computedParsePattern, fileFormat]);

  const handleSubmit = useCallback(async () => {
    if (!isValid || !file) return;
    setSubmitting(true);
    try {
      const meta = buildMeta();
      const result = await uploadLookupTable(meta, file, isUpdate);
      const resultPath = result.filePath || meta.filePath;
      addNotification(
        "success",
        isUpdate ? "Table updated" : "Table created",
        `"${resultPath}" now has ${result.recordsCount} records.`
      );
      // Navigate to the detail view of the new/updated table
      setTimeout(
        () =>
          navigate(
            `/detail?path=${encodeURIComponent(resultPath)}`
          ),
        800
      );
    } catch (err: unknown) {
      addNotification(
        "critical",
        isUpdate ? "Update failed" : "Create failed",
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setSubmitting(false);
    }
  }, [isValid, file, buildMeta, isUpdate, addNotification, navigate]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Flex flexDirection="column" style={{ height: "100%", minHeight: "100vh" }}>
      <NotificationBar notifications={notifications} onDismiss={dismiss} />

      <AppHeader
        title={isUpdate ? "Update Lookup Table" : "Create Lookup Table"}
        subtitle={isUpdate ? `Replacing: ${existingPath}` : undefined}
        actions={
          <Button variant="default" onClick={() => navigate(-1)}>
            ← Back
          </Button>
        }
      />

      <Flex
        flexDirection="column"
        padding={24}
        gap={24}
        style={{ flex: 1, maxWidth: 720, margin: "0 auto", width: "100%" }}
      >
        {/* Table name (only for create mode) */}
        {!isUpdate && (
          <FormField>
            <Label>Table Name *</Label>
            <TextInput
              placeholder="e.g. network/ip_data"
              value={tableName}
              onChange={(val) => setTableName(val ?? "")}
            />
            <Text
              style={{
                fontSize: 12,
                color: "var(--dt-colors-text-neutral-default)",
              }}
            >
              Will be stored at:{" "}
              <code
                style={{
                  background: "var(--dt-colors-background-surface-default)",
                  border: "1px solid var(--dt-colors-border-neutral-default)",
                  borderRadius: 4,
                  padding: "1px 6px",
                  fontSize: 12,
                  color: "var(--dt-colors-text-neutral-default)",
                }}
              >
                {filePath}
              </code>
              {" — "}
              Slashes (/) are allowed to organize tables into sub-folders.
            </Text>
          </FormField>
        )}

        <FormField>
          <Label>Display Name</Label>
          <TextInput
            placeholder="Human-friendly name (optional)"
            value={displayName}
            onChange={(val) => setDisplayName(val ?? "")}
          />
        </FormField>

        <FormField>
          <Label>Description</Label>
          <TextInput
            placeholder="What data does this table contain? (optional)"
            value={description}
            onChange={(val) => setDescription(val ?? "")}
          />
        </FormField>

        <FormField>
          <Label>Lookup Key Field *</Label>
          <TextInput
            placeholder="e.g. ip_address"
            value={lookupField}
            onChange={(val) => setLookupField(val ?? "")}
          />
          <Text
            style={{
              fontSize: 12,
              color: "var(--dt-colors-text-neutral-default)",
            }}
          >
            The column/field that uniquely identifies each record.
          </Text>
        </FormField>

        {!isUpdate && (
          <FormField>
            <Label>File Format</Label>
            <Select
              value={fileFormat}
              onChange={(val: FileFormat | null) => setFileFormat(val ?? "csv")}
            >
              <Select.Content>
                {FILE_FORMAT_OPTIONS.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select.Content>
            </Select>
            <Text
              style={{
                fontSize: 12,
                color: "var(--dt-colors-text-neutral-default)",
              }}
            >
              Auto-detected from file extension. Column types are inferred from file data.
            </Text>
          </FormField>
        )}

        {/* File upload */}
        <Flex flexDirection="column" gap={8}>
          <Heading level={6}>Data File *</Heading>
          <FileDropZone
            onFileSelected={handleFileSelected}
            selectedFileName={file?.name}
            disabled={submitting}
          />
        </Flex>

        {/* Column inference preview (CSV only) */}
        {fileFormat === "csv" && (analyzing || inferredColumns.length > 0) && (
          <DataPreviewPanel
            columns={inferredColumns}
            loading={analyzing}
            onTypeChange={handleTypeChange}
            parsePattern={computedParsePattern}
          />
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <Flex
            flexDirection="column"
            gap={4}
            style={{
              background: "var(--dt-colors-background-critical-subdued)",
              borderRadius: 6,
              padding: "12px 16px",
            }}
          >
            {validationErrors.map((e, i) => (
              <Text key={i} style={{ color: "var(--dt-colors-text-critical-default)" }}>
                • {e}
              </Text>
            ))}
          </Flex>
        )}

        {/* Action buttons */}
        <Flex flexDirection="row" justifyContent="flex-end" gap={8}>
          <Button
            variant="accent"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
          >
            {submitting
              ? "Uploading…"
              : isUpdate
              ? "Update Table"
              : "Create Table"}
          </Button>
        </Flex>

        {submitting && (
          <LoadingOverlay
            message={isUpdate ? "Updating table…" : "Creating table…"}
          />
        )}
      </Flex>
    </Flex>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractFilename(filePath: string): string {
  const parts = filePath.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? filePath;
}
