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
}

export const DataPreviewPanel: React.FC<DataPreviewPanelProps> = ({
  columns,
  loading = false,
  onTypeChange,
  parsePattern,
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
    <Flex flexDirection="column" gap={16}>
      <Heading level={6}>Detected Columns &amp; DPL Types</Heading>
      <Text style={{ fontSize: 12, color: "var(--dt-colors-text-neutral-default)" }}>
        Each column's data type has been auto-detected from sample values.
        All columns import as LD (line data) by default for maximum compatibility.
        Switch any column to a stricter type if needed.
      </Text>

      {/* Column table */}
      <div
        style={{
          border: "1px solid var(--dt-colors-border-neutral-default)",
          borderRadius: 6,
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
                background: "var(--dt-colors-background-surface-default)",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              <th style={thStyle}>Column</th>
              <th style={thStyle}>Detected</th>
              <th style={thStyle}>Import As</th>
              <th style={thStyle}>Sample Values</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col, idx) => (
              <tr key={col.name} style={{ borderTop: "1px solid var(--dt-colors-border-neutral-default)" }}>
                <td style={tdStyle}>
                  <Text style={{ fontWeight: 600 }}>{col.name}</Text>
                </td>
                <td style={tdStyle}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--dt-colors-text-primary-default)",
                      background: "var(--dt-colors-background-surface-default)",
                      borderRadius: 4,
                      padding: "2px 8px",
                      display: "inline-block",
                    }}
                  >
                    {col.detectedType}
                  </Text>
                </td>
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
          style={{
            background: "var(--dt-colors-background-surface-default)",
            borderRadius: 4,
            padding: "8px 12px",
            fontFamily: "monospace",
            fontSize: 12,
            wordBreak: "break-all",
            color: "var(--dt-colors-text-neutral-default)",
            border: "1px solid var(--dt-colors-border-neutral-default)",
          }}
        >
          {parsePattern}
        </div>
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
