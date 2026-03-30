/**
 * pages/LookupTableDetailPage.tsx
 * ---------------------------------------------------------------------------
 * Detail / preview page for a single lookup table.
 * Shows metadata, record count, and a preview grid of up to 100 rows.
 */

import React, { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  DataTable,
  type DataTableColumnDef,
} from "@dynatrace/strato-components-preview/tables";
import { Button } from "@dynatrace/strato-components-preview/buttons";
import { Flex } from "@dynatrace/strato-components-preview/layouts";
import { Heading, Text } from "@dynatrace/strato-components/typography";

import { deleteLookupTable } from "../api";
import { IconFile, IconHash, IconEye } from "../components/Icons";
import { useLookupPreview, useNotifications } from "../hooks";
import {
  AppHeader,
  ConfirmDialog,
  EmptyState,
  LoadingOverlay,
  NotificationBar,
} from "../components";

export const LookupTableDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const filePath = params.get("path") ?? "";

  const { rows, totalCount, loading, error, refresh } =
    useLookupPreview(filePath);
  const { notifications, addNotification, dismiss } = useNotifications();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ---------------------------------------------------------------------------
  // Derive columns from the first data row
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteLookupTable(filePath);
      addNotification("success", "Table deleted", `"${filePath}" was removed.`);
      navigate("/");
    } catch (err: unknown) {
      addNotification(
        "critical",
        "Delete failed",
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [filePath, addNotification, navigate]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!filePath) {
    return (
      <EmptyState
        title="No table selected"
        message="Please go back and select a lookup table to view."
        action={
          <Button variant="default" onClick={() => navigate("/")}>
            Back to list
          </Button>
        }
      />
    );
  }

  return (
    <Flex flexDirection="column" style={{ height: "100%", minHeight: "100vh" }}>
      <NotificationBar notifications={notifications} onDismiss={dismiss} />

      <AppHeader
        title={extractName(filePath)}
        subtitle={filePath}
        actions={
          <Flex flexDirection="row" gap={8}>
            <Button variant="default" onClick={() => navigate("/")}>
              ← Back
            </Button>
            <Button
              variant="default"
              onClick={() =>
                navigate(`/upload?path=${encodeURIComponent(filePath)}`)
              }
            >
              Update
            </Button>
            <Button
              variant="default"
              color="critical"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </Button>
          </Flex>
        }
      />

      <Flex flexDirection="column" padding={24} gap={20} style={{ flex: 1 }}>
        {/* Metadata bar */}
        <div className="meta-bar">
          <div className="meta-card meta-card--purple">
            <MetaChip label="File Path" value={filePath} icon={<IconFile size={18} color="var(--ltm-accent-1)" />} />
          </div>
          <div className="meta-card meta-card--teal">
            <MetaChip label="Total Records" value={String(totalCount)} icon={<IconHash size={18} color="var(--ltm-accent-2)" />} />
          </div>
          <div className="meta-card meta-card--amber">
            <MetaChip
              label="Preview Rows"
              value={`${rows.length}${rows.length >= 100 ? " (limited)" : ""}`}
              icon={<IconEye size={18} color="#f59e0b" />}
            />
          </div>
        </div>

        {/* Data preview */}
        {loading && <LoadingOverlay message="Loading table preview…" />}

        {error && !loading && (
          <EmptyState
            title="Error loading preview"
            message={error}
            action={
              <Button variant="default" onClick={refresh}>
                Retry
              </Button>
            }
          />
        )}

        {!loading && !error && rows.length === 0 && (
          <EmptyState
            title="Table is empty"
            message="This lookup table has no records."
          />
        )}

        {!loading && !error && rows.length > 0 && (
          <Flex
            flexDirection="column"
            gap={8}
            style={{ animation: "fadeInUp 0.4s ease 0.2s both" }}
          >
            <Heading level={6}>
              <span className="gradient-text">Data Preview</span>
            </Heading>
            <div className="table-wrapper">
              <DataTable data={rows} columns={columns} sortable resizable fullWidth>
                <DataTable.Pagination defaultPageSize={25} />
              </DataTable>
            </div>
          </Flex>
        )}
      </Flex>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Lookup Table"
        message={`Are you sure you want to permanently delete "${filePath}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="emphasized"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </Flex>
  );
};

// ---------------------------------------------------------------------------
// Sub-components & helpers
// ---------------------------------------------------------------------------

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

function extractName(filePath: string): string {
  const parts = filePath.split("/").filter(Boolean);
  const filename = parts[parts.length - 1] ?? filePath;
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
}

/** Infer a Grail-style type label from the actual values in row data. */
function inferGrailType(
  key: string,
  rows: Record<string, unknown>[]
): string {
  const samples = rows
    .slice(0, 50)
    .map((r) => r[key])
    .filter((v) => v != null);
  if (samples.length === 0) return "STRING";

  // Check JS types from the DQL response
  const jsTypes = new Set(samples.map((v) => typeof v));

  if (jsTypes.size === 1) {
    const t = jsTypes.values().next().value;
    if (t === "boolean") return "BOOLEAN";
    if (t === "number") {
      const allInt = samples.every((v) => Number.isInteger(v));
      return allInt ? "LONG" : "DOUBLE";
    }
  }

  // If all strings, try to detect common patterns
  if (jsTypes.size === 1 && jsTypes.has("string")) {
    const strs = samples as string[];
    const RE_IPV4 =
      /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
    const RE_TS =
      /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

    const nonEmpty = strs.filter(Boolean);
    if (nonEmpty.length > 0) {
      if (nonEmpty.every((s) => RE_IPV4.test(s))) return "IP_ADDRESS";
      if (nonEmpty.every((s) => RE_TS.test(s))) return "TIMESTAMP";
    }
    return "STRING";
  }

  // Arrays
  if (samples.some((v) => Array.isArray(v))) return "ARRAY";

  return "STRING";
}
