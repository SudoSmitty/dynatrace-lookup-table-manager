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
    return keys.map((key) => ({
      id: key,
      header: key,
      accessor: key,
      width: "1fr" as const,
      cell: ({ value }: { value: unknown }) => (
        <Text style={{ wordBreak: "break-all" }}>
          {value === null || value === undefined ? "—" : String(value)}
        </Text>
      ),
    }));
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
        <Flex
          flexDirection="row"
          gap={32}
          style={{
            background: "var(--dt-colors-surface-default)",
            borderRadius: 8,
            padding: "16px 24px",
            border: "1px solid var(--dt-colors-border-neutral-default)",
          }}
        >
          <MetaChip label="File Path" value={filePath} />
          <MetaChip label="Total Records" value={String(totalCount)} />
          <MetaChip
            label="Preview Rows"
            value={`${rows.length}${rows.length >= 100 ? " (limited)" : ""}`}
          />
        </Flex>

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
          <Flex flexDirection="column" gap={8}>
            <Heading level={6}>Data Preview</Heading>
            <DataTable data={rows} columns={columns} sortable resizable>
              <DataTable.Pagination defaultPageSize={25} />
            </DataTable>
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

const MetaChip: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <Flex flexDirection="column" gap={2}>
    <Text
      style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        color: "var(--dt-colors-text-neutral-default)",
      }}
    >
      {label}
    </Text>
    <Text style={{ fontWeight: 600 }}>{value}</Text>
  </Flex>
);

function extractName(filePath: string): string {
  const parts = filePath.split("/").filter(Boolean);
  const filename = parts[parts.length - 1] ?? filePath;
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
}
