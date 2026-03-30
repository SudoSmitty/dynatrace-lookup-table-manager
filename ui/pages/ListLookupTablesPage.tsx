/**
 * pages/ListLookupTablesPage.tsx
 * ---------------------------------------------------------------------------
 * Main page: split layout with a tree sidebar on the left and an inline
 * detail/preview panel on the right. Supports view, update, delete, and
 * export actions via the tree's context menu.
 */

import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@dynatrace/strato-components-preview/buttons";
import { Flex } from "@dynatrace/strato-components-preview/layouts";
import { Text } from "@dynatrace/strato-components/typography";

import { deleteLookupTable, previewLookupTable } from "../api";
import { IconTable, IconHdd, IconClock, IconClipboard } from "../components/Icons";
import { useLookupTables, useLookupPreview, useNotifications } from "../hooks";
import {
  AppHeader,
  ConfirmDialog,
  EmptyState,
  LookupTreeSidebar,
  NotificationBar,
  TableDetailPanel,
} from "../components";
import type { TreeAction } from "../components/LookupTreeSidebar";
import type { LookupTableMeta, LookupRow } from "../types";

export const ListLookupTablesPage: React.FC = () => {
  const navigate = useNavigate();

  const { tables, loading, error, refresh } = useLookupTables();
  const { notifications, addNotification, dismiss } = useNotifications();

  // Selected table in the tree
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const {
    rows,
    totalCount,
    loading: previewLoading,
    error: previewError,
    refresh: refreshPreview,
  } = useLookupPreview(selectedPath);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<LookupTableMeta | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ---------------------------------------------------------------------------
  // Export helpers
  // ---------------------------------------------------------------------------

  const exportData = useCallback(
    async (table: LookupTableMeta, format: "csv" | "json") => {
      try {
        const data = await previewLookupTable(table.filePath);
        if (data.length === 0) {
          addNotification("warning", "No data", "Table has no records to export.");
          return;
        }

        let content: string;
        let mimeType: string;
        let ext: string;

        if (format === "csv") {
          const keys = Object.keys(data[0]);
          const header = keys.map(escapeCsvField).join(",");
          const rows = data.map((row) =>
            keys.map((k) => escapeCsvField(String(row[k] ?? ""))).join(",")
          );
          content = [header, ...rows].join("\n");
          mimeType = "text/csv";
          ext = "csv";
        } else {
          content = JSON.stringify(data, null, 2);
          mimeType = "application/json";
          ext = "json";
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const name = table.filePath.split("/").filter(Boolean).pop() ?? "export";
        a.download = `${name}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addNotification("success", "Exported", `${data.length} records exported as ${ext.toUpperCase()}.`);
      } catch (err: unknown) {
        addNotification(
          "critical",
          "Export failed",
          err instanceof Error ? err.message : String(err)
        );
      }
    },
    [addNotification]
  );

  // ---------------------------------------------------------------------------
  // Tree action handler
  // ---------------------------------------------------------------------------

  const handleTreeAction = useCallback(
    (action: TreeAction, table: LookupTableMeta) => {
      switch (action) {
        case "view":
          setSelectedPath(table.filePath);
          break;
        case "update":
          navigate(`/upload?path=${encodeURIComponent(table.filePath)}`);
          break;
        case "delete":
          setDeleteTarget(table);
          break;
        case "export-csv":
          exportData(table, "csv");
          break;
        case "export-json":
          exportData(table, "json");
          break;
      }
    },
    [navigate, exportData]
  );

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------

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
      if (selectedPath === deleteTarget.filePath) {
        setSelectedPath(null);
      }
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
  }, [deleteTarget, selectedPath, addNotification, refresh]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Flex flexDirection="column" style={{ height: "100vh", overflow: "hidden" }}>
      <NotificationBar notifications={notifications} onDismiss={dismiss} />

      <AppHeader
        title="Lookup Table Manager"
        subtitle="Create, view, update, and delete Dynatrace Grail lookup tables"
        actions={
          <Flex flexDirection="row" gap={8}>
            <Button variant="default" onClick={refresh}>
              Refresh
            </Button>
            <Button variant="accent" onClick={() => navigate("/upload")}>
              + New Lookup Table
            </Button>
          </Flex>
        }
      />

      {/* Stats bar */}
      {!loading && !error && tables.length > 0 && (
        <div className="stats-bar">
          <div className="stat-card">
            <IconTable size={20} color="var(--ltm-accent-1)" />
            <Flex flexDirection="column" gap={0}>
              <Text style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--ltm-subtle-text)" }}>
                Tables
              </Text>
              <Text style={{ fontSize: 20, fontWeight: 700 }}>{tables.length}</Text>
            </Flex>
          </div>
          <div className="stat-card">
            <IconHdd size={20} color="var(--ltm-accent-2)" />
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
            <IconClock size={20} color="#f59e0b" />
            <Flex flexDirection="column" gap={0}>
              <Text style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--ltm-subtle-text)" }}>
                Last Updated
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 600 }}>
                {tables[0]?.lastModified
                  ? new Date(tables[0].lastModified).toLocaleDateString()
                  : "—"}
              </Text>
            </Flex>
          </div>
        </div>
      )}

      {/* Split layout: sidebar + detail */}
      <Flex flexDirection="row" style={{ flex: 1, overflow: "hidden" }}>
        {/* Left sidebar */}
        <LookupTreeSidebar
          tables={tables}
          selectedPath={selectedPath}
          onSelect={setSelectedPath}
          onAction={handleTreeAction}
          loading={loading}
        />

        {/* Right detail panel */}
        <Flex
          flexDirection="column"
          style={{
            flex: 1,
            overflow: "auto",
            padding: 20,
          }}
        >
          {error && (
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

          {!error && !selectedPath && (
            <Flex
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap={12}
              style={{ flex: 1, opacity: 0.5 }}
            >
              <IconClipboard size={32} color="var(--ltm-subtle-text)" />
              <Text style={{ fontSize: 14 }}>
                Select a lookup table from the tree to view its data
              </Text>
            </Flex>
          )}

          {!error && selectedPath && (
            <TableDetailPanel
              filePath={selectedPath}
              table={tables.find((t) => t.filePath === selectedPath)}
              rows={rows}
              totalCount={totalCount}
              loading={previewLoading}
              error={previewError}
            />
          )}
        </Flex>
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

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

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
