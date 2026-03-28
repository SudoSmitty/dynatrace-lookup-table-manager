/**
 * pages/ListLookupTablesPage.tsx
 * ---------------------------------------------------------------------------
 * Main page: displays all lookup tables in a searchable, sortable DataTable.
 * Provides actions to Create, View, Update, and Delete tables.
 */

import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
  type DataTableColumnDef,
} from "@dynatrace/strato-components-preview/tables";
import { Button } from "@dynatrace/strato-components-preview/buttons";
import { TextInput } from "@dynatrace/strato-components-preview/forms";
import { Flex } from "@dynatrace/strato-components-preview/layouts";
import { Text } from "@dynatrace/strato-components/typography";

import { deleteLookupTable } from "../api";
import { useLookupTables, useNotifications } from "../hooks";
import {
  AppHeader,
  ConfirmDialog,
  EmptyState,
  LoadingOverlay,
  NotificationBar,
} from "../components";
import type { LookupTableMeta } from "../types";

export const ListLookupTablesPage: React.FC = () => {
  const navigate = useNavigate();

  // Search / filter state
  const [searchTerm, setSearchTerm] = useState("");
  const { tables, loading, error, refresh } = useLookupTables(
    searchTerm || undefined
  );

  // Notification system
  const { notifications, addNotification, dismiss } = useNotifications();

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<LookupTableMeta | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleView = useCallback(
    (table: LookupTableMeta) => {
      navigate(`/detail?path=${encodeURIComponent(table.filePath)}`);
    },
    [navigate]
  );

  const handleUpdate = useCallback(
    (table: LookupTableMeta) => {
      navigate(`/upload?path=${encodeURIComponent(table.filePath)}`);
    },
    [navigate]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLookupTable(deleteTarget.filePath);
      addNotification(
        "success",
        "Table deleted",
        `"${deleteTarget.displayName || deleteTarget.filePath}" was removed.`
      );
      refresh();
    } catch (err: unknown) {
      addNotification(
        "critical",
        "Delete failed",
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, addNotification, refresh]);

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const columns = useMemo<DataTableColumnDef<LookupTableMeta>[]>(
    () => [
      {
        id: "displayName",
        header: "Name",
        accessor: "displayName",
        width: "2fr",
        cell: ({ value, rowData }: { value: string; rowData: LookupTableMeta }) => (
          <Text
            style={{
              cursor: "pointer",
              fontWeight: 600,
              color: "var(--ltm-accent-1)",
              transition: "opacity 0.15s ease",
            }}
            onClick={() => handleView(rowData)}
          >
            {value || rowData.filePath}
          </Text>
        ),
      },
      {
        id: "filePath",
        header: "File Path",
        accessor: "filePath",
        width: "2fr",
        cell: ({ value }: { value: string }) => (
          <Text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, opacity: 0.8 }}>
            {value}
          </Text>
        ),
      },
      {
        id: "sizeBytes",
        header: "Size",
        accessor: "sizeBytes",
        width: "1fr",
        cell: ({ value }: { value: number }) => (
          <Text>{formatBytes(value)}</Text>
        ),
      },
      {
        id: "lastModified",
        header: "Last Modified",
        accessor: "lastModified",
        width: "1.5fr",
        cell: ({ value }: { value: string }) => (
          <Text>{value ? new Date(value).toLocaleString() : "—"}</Text>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        accessor: "filePath",
        width: "1.5fr",
        cell: ({ rowData }: { rowData: LookupTableMeta }) => (
          <Flex flexDirection="row" gap={4}>
            <Button
              variant="default"
              onClick={() => handleView(rowData)}
            >
              View
            </Button>
            <Button
              variant="default"
              onClick={() => handleUpdate(rowData)}
            >
              Update
            </Button>
            <Button
              variant="default"
              color="critical"
              onClick={() => setDeleteTarget(rowData)}
            >
              Delete
            </Button>
          </Flex>
        ),
      },
    ],
    [handleView, handleUpdate]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Flex flexDirection="column" style={{ height: "100%", minHeight: "100vh" }}>
      <NotificationBar notifications={notifications} onDismiss={dismiss} />

      <AppHeader
        title="Lookup Table Manager"
        subtitle="Create, view, update, and delete Dynatrace Grail lookup tables"
        actions={
          <Button variant="accent" onClick={() => navigate("/upload")}>
            + New Lookup Table
          </Button>
        }
      />

      {/* Stats bar */}
      {!loading && !error && tables.length > 0 && (
        <div className="stats-bar">
          <div className="stat-card">
            <span style={{ fontSize: 20 }}>📊</span>
            <Flex flexDirection="column" gap={0}>
              <Text style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--ltm-subtle-text)" }}>
                Tables
              </Text>
              <Text style={{ fontSize: 20, fontWeight: 700 }}>{tables.length}</Text>
            </Flex>
          </div>
          <div className="stat-card">
            <span style={{ fontSize: 20 }}>💾</span>
            <Flex flexDirection="column" gap={0}>
              <Text style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--ltm-subtle-text)" }}>
                Total Size
              </Text>
              <Text style={{ fontSize: 20, fontWeight: 700 }}>
                {formatBytes(tables.reduce((sum, t) => sum + (t.sizeBytes || 0), 0))}
              </Text>
            </Flex>
          </div>
          <div className="stat-card">
            <span style={{ fontSize: 20 }}>🕐</span>
            <Flex flexDirection="column" gap={0}>
              <Text style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--ltm-subtle-text)" }}>
                Last Updated
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 600 }}>
                {tables.length > 0 && tables[0].lastModified
                  ? new Date(tables[0].lastModified).toLocaleDateString()
                  : "—"}
              </Text>
            </Flex>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        padding={16}
        gap={12}
        style={{ animation: "fadeInUp 0.3s ease 0.15s both" }}
      >
        <div style={{ flex: 1, maxWidth: 400 }}>
          <TextInput
            placeholder="Search tables by name or path…"
            value={searchTerm}
            onChange={(val) => setSearchTerm(val ?? "")}
          />
        </div>
        <Button variant="default" onClick={refresh}>
          Refresh
        </Button>
      </Flex>

      {/* Content area */}
      <Flex
        flexDirection="column"
        padding={16}
        style={{ flex: 1, animation: "fadeInUp 0.4s ease 0.2s both" }}
      >
        {loading && <LoadingOverlay message="Loading lookup tables…" />}

        {error && !loading && (
          <EmptyState
            title="Error loading tables"
            message={error}
            action={
              <Button variant="default" onClick={refresh}>
                Retry
              </Button>
            }
          />
        )}

        {!loading && !error && tables.length === 0 && (
          <EmptyState
            title="No lookup tables found"
            message={
              searchTerm
                ? `No tables match "${searchTerm}". Try a different search.`
                : "Get started by creating your first lookup table."
            }
            action={
              !searchTerm ? (
                <Button variant="accent" onClick={() => navigate("/upload")}>
                  + Create Lookup Table
                </Button>
              ) : undefined
            }
          />
        )}

        {!loading && !error && tables.length > 0 && (
          <div className="table-wrapper">
            <DataTable data={tables} columns={columns} sortable resizable fullWidth>
              <DataTable.Pagination defaultPageSize={20} />
            </DataTable>
          </div>
        )}
      </Flex>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Lookup Table"
        message={`Are you sure you want to permanently delete "${
          deleteTarget?.displayName || deleteTarget?.filePath || ""
        }"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="emphasized"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </Flex>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
