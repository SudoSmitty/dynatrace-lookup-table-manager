/**
 * components/DataPreviewPanel.tsx
 * ---------------------------------------------------------------------------
 * Shows a preview of the uploaded file data with auto-inferred DPL types
 * per column. Users can override each column's type via a dropdown.
 */

import React from "react";
import { Flex } from "@dynatrace/strato-components-preview/layouts";
import { Select } from "@dynatrace/strato-components-preview/forms";
import { Heading, Text } from "@dynatrace/strato-components/typography";
import { ProgressCircle } from "@dynatrace/strato-components-preview/content";

import type { InferredColumn, DplType } from "../utils/dplInference";
import { DPL_TYPE_GROUPS } from "../utils/dplInference";

interface DataPreviewPanelProps {
  columns: InferredColumn[];
  loading?: boolean;
  /** Called when the user overrides a column's DPL type. */
  onTypeChange: (colIndex: number, newType: DplType) => void;
  /** The generated parse pattern string (shown read-only). */
  parsePattern: string;
  /** When true, hides type-override dropdowns (used for JSON/XML previews). */
  readOnly?: boolean;
  /** Optional hint text shown below the parse pattern. */
  formatHint?: string;
}

export const DataPreviewPanel: React.FC<DataPreviewPanelProps> = ({
  columns,
  loading = false,
  onTypeChange,
  parsePattern,
  readOnly = false,
  formatHint,
}) => {
  if (loading) {
    return (
      <Flex flexDirection="column" alignItems="center" padding={24} gap={12}>
        <ProgressCircle />
        <Text>Analysing file data…</Text>
      </Flex>
    );
  }

  if (columns.length === 0) return null;

  return (
    <Flex flexDirection="column" gap={16} style={{ animation: "fadeInUp 0.4s ease both" }}>
      <Heading level={6}>
        <span className="gradient-text">{readOnly ? "Data Preview" : "Detected Columns & DPL Types"}</span>
      </Heading>
      <Text style={{ fontSize: 12, color: "var(--dt-colors-text-neutral-default)" }}>
        {readOnly
          ? "Preview of fields and sample values detected from the uploaded file."
          : "Each column\u2019s data type has been auto-detected from sample values. All columns import as LD (line data) by default for maximum compatibility. Switch any column to a stricter type if needed."}
      </Text>

      {/* Column table */}
      <div
        className="glass-card"
        style={{
          overflow: "auto",
          maxHeight: 420,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr
              style={{
                background: "var(--ltm-table-header-bg)",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              <th style={thStyle}>Column</th>
              {!readOnly && <th style={thStyle}>Detected</th>}
              {!readOnly && <th style={thStyle}>Import As</th>}
              <th style={thStyle}>Sample Values</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col, idx) => (
              <tr key={col.name} style={{ borderTop: "1px solid var(--dt-colors-border-neutral-default)" }}>
                <td style={tdStyle}>
                  <Text style={{ fontWeight: 600 }}>{col.name}</Text>
                </td>
                {!readOnly && (
                <td style={tdStyle}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--ltm-accent-1)",
                      background: "var(--ltm-accent-soft-1)",
                      borderRadius: 4,
                      padding: "2px 8px",
                      display: "inline-block",
                    }}
                  >
                    {col.detectedType}
                  </Text>
                </td>
                )}
                {!readOnly && (
                <td style={{ ...tdStyle, minWidth: 160 }}>
                  <Select
                    value={col.dplType}
                    onChange={(val: DplType | null) => {
                      if (val) onTypeChange(idx, val);
                    }}
                  >
                    <Select.Content>
                      {DPL_TYPE_GROUPS.flatMap((group) =>
                        group.types.map((t) => (
                          <Select.Option key={t} value={t}>
                            {t}
                          </Select.Option>
                        ))
                      )}
                    </Select.Content>
                  </Select>
                </td>
                )}
                <td style={tdStyle}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "var(--dt-colors-text-neutral-default)",
                      wordBreak: "break-all",
                    }}
                  >
                    {col.samples.length > 0
                      ? col.samples.join(" · ")
                      : "—"}
                  </Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Generated parse pattern */}
      <Flex flexDirection="column" gap={4}>
        <Text style={{ fontSize: 12, fontWeight: 600 }}>
          Generated Parse Pattern
        </Text>
        <div
          className="glass-card"
          style={{
            padding: "10px 14px",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: 12,
            wordBreak: "break-all",
            color: "var(--dt-colors-text-neutral-default)",
          }}
        >
          {parsePattern}
        </div>
        {formatHint && (
          <Text style={{ fontSize: 11, color: "var(--dt-colors-text-neutral-default)", fontStyle: "italic" }}>
            {formatHint}
          </Text>
        )}
      </Flex>
    </Flex>
  );
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  fontWeight: 600,
  fontSize: 12,
};

const tdStyle: React.CSSProperties = {
  padding: "6px 12px",
  verticalAlign: "middle",
};
