/**
 * components/TableDetailPanel.tsx
 * ---------------------------------------------------------------------------
 * Inline detail panel shown in the right side of the split layout.
 * Displays table metadata, record count, and a data preview grid.
 * Also used for export functionality.
 */

import React, { useMemo, useState } from "react";
import {
  DataTable,
  type DataTableColumnDef,
} from "@dynatrace/strato-components-preview/tables";
import { Flex } from "@dynatrace/strato-components-preview/layouts";
import { Heading, Text } from "@dynatrace/strato-components/typography";
import { ProgressCircle } from "@dynatrace/strato-components-preview/content";

import type { LookupRow, LookupTableMeta } from "../types";
import {
  IconFile,
  IconHash,
  IconColumns,
  IconHdd,
  IconClock,
  IconCopy,
  IconCheck,
} from "./Icons";

interface TableDetailPanelProps {
  filePath: string;
  table?: LookupTableMeta;
  rows: LookupRow[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

export const TableDetailPanel: React.FC<TableDetailPanelProps> = ({
  filePath,
  table,
  rows,
  totalCount,
  loading,
  error,
}) => {
  const columnCount = rows.length > 0 ? Object.keys(rows[0]).length : 0;
  const columns = useMemo<DataTableColumnDef<Record<string, unknown>>[]>(() => {
    if (rows.length === 0) return [];
    const keys = Object.keys(rows[0]);
    return keys.map((key) => {
      const grailType = inferGrailType(key, rows);
      return {
        id: key,
        header: () => (
          <Flex flexDirection="row" alignItems="center" gap={6}>
            <Text style={{ fontWeight: 600 }}>{key}</Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--dt-colors-text-neutral-default)",
                opacity: 0.7,
              }}
            >
              {grailType}
            </Text>
          </Flex>
        ),
        accessor: key,
        width: "1fr" as const,
        cell: ({ value }: { value: unknown }) => (
          <Text style={{ wordBreak: "break-all" }}>
            {value === null || value === undefined ? "—" : String(value)}
          </Text>
        ),
      };
    });
  }, [rows]);

  if (loading) {
    return (
      <Flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={12}
        style={{ flex: 1, padding: 40 }}
      >
        <ProgressCircle />
        <Text style={{ opacity: 0.6 }}>Loading table preview…</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={8}
        style={{ flex: 1, padding: 40 }}
      >
        <Text style={{ color: "var(--dt-colors-text-critical-default)" }}>
          Error: {error}
        </Text>
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" gap={16} style={{ flex: 1, overflow: "hidden" }}>
      {/* Meta bar */}
      <div className="meta-bar" style={{ flexShrink: 0 }}>
        <div className="meta-card meta-card--purple" style={{ minWidth: 200 }}>
          <FilePathChip filePath={filePath} />
        </div>
        <div className="meta-card meta-card--teal">
          <MetaChip label="Records" value={String(totalCount)} icon={<IconHash size={18} color="var(--ltm-accent-2)" />} />
        </div>
        <div className="meta-card meta-card--amber">
          <MetaChip label="Columns" value={String(columnCount)} icon={<IconColumns size={18} color="#f59e0b" />} />
        </div>
        {table && table.sizeBytes > 0 && (
          <div className="meta-card meta-card--purple">
            <MetaChip label="Size" value={formatBytes(table.sizeBytes)} icon={<IconHdd size={18} color="var(--ltm-accent-1)" />} />
          </div>
        )}
        {table && table.lastModified && (
          <div className="meta-card meta-card--teal">
            <MetaChip
              label="Last Modified"
              value={new Date(table.lastModified).toLocaleString()}
              icon={<IconClock size={18} color="var(--ltm-accent-2)" />}
            />
          </div>
        )}
      </div>

      {/* Data */}
      {rows.length === 0 ? (
        <Flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{ flex: 1, padding: 40 }}
        >
          <Text style={{ opacity: 0.5 }}>This table has no records.</Text>
        </Flex>
      ) : (
        <Flex
          flexDirection="column"
          gap={8}
          style={{ flex: 1, overflow: "hidden" }}
        >
          <Heading level={6}>
            <span className="gradient-text">Data Preview</span>
          </Heading>
          <div className="table-wrapper" style={{ flex: 1, overflow: "auto" }}>
            <DataTable data={rows} columns={columns} sortable resizable fullWidth>
              <DataTable.Pagination defaultPageSize={25} />
            </DataTable>
          </div>
        </Flex>
      )}
    </Flex>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────

const MetaChip: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <Flex flexDirection="row" gap={8} alignItems="center">
    {icon && <span style={{ flexShrink: 0, display: "flex" }}>{icon}</span>}
    <Flex flexDirection="column" gap={2}>
      <Text
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--ltm-subtle-text)",
          fontWeight: 500,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontWeight: 700, fontSize: 14 }}>{value}</Text>
    </Flex>
  </Flex>
);

const FilePathChip: React.FC<{ filePath: string }> = ({ filePath }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(filePath).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Flex flexDirection="row" gap={8} alignItems="center" style={{ width: "100%" }}>
      <span style={{ flexShrink: 0, display: "flex" }}><IconFile size={18} color="var(--ltm-accent-1)" /></span>
      <Flex flexDirection="column" gap={2} style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--ltm-subtle-text)",
            fontWeight: 500,
          }}
        >
          File Path
        </Text>
        <Text
          style={{
            fontWeight: 700,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            wordBreak: "break-all",
            lineHeight: 1.4,
          }}
        >
          {filePath}
        </Text>
      </Flex>
      <button
        onClick={handleCopy}
        title="Copy file path"
        style={{
          all: "unset",
          cursor: "pointer",
          fontSize: 16,
          padding: 4,
          borderRadius: 4,
          flexShrink: 0,
          opacity: copied ? 1 : 0.5,
          transition: "opacity 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = copied ? "1" : "0.5")}
      >
        {copied ? <IconCheck size={16} color="var(--ltm-accent-2)" /> : <IconCopy size={16} />}
      </button>
    </Flex>
  );
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function inferGrailType(key: string, rows: Record<string, unknown>[]): string {
  const samples = rows
    .slice(0, 50)
    .map((r) => r[key])
    .filter((v) => v != null);
  if (samples.length === 0) return "STRING";
  const jsTypes = new Set(samples.map((v) => typeof v));
  if (jsTypes.size === 1) {
    const t = jsTypes.values().next().value;
    if (t === "boolean") return "BOOLEAN";
    if (t === "number") {
      return samples.every((v) => Number.isInteger(v)) ? "LONG" : "DOUBLE";
    }
  }
  if (jsTypes.size === 1 && jsTypes.has("string")) {
    const strs = samples as string[];
    const nonEmpty = strs.filter(Boolean);
    const RE_IPV4 =
      /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
    const RE_TS =
      /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;
    if (nonEmpty.length > 0) {
      if (nonEmpty.every((s) => RE_IPV4.test(s))) return "IP_ADDRESS";
      if (nonEmpty.every((s) => RE_TS.test(s))) return "TIMESTAMP";
    }
    return "STRING";
  }
  if (samples.some((v) => Array.isArray(v))) return "ARRAY";
  return "STRING";
}
