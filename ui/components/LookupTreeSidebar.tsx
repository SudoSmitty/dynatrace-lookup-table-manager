/**
 * components/LookupTreeSidebar.tsx
 * ---------------------------------------------------------------------------
 * Tree-view sidebar that organises lookup tables by directory structure.
 * Each table has a three-dot context menu with View, Update, Delete, and
 * Export actions.
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import { TextInput } from "@dynatrace/strato-components-preview/forms";
import { Flex } from "@dynatrace/strato-components-preview/layouts";
import { Text } from "@dynatrace/strato-components/typography";

import type { LookupTableMeta } from "../types";
import {
  IconFile,
  IconFolder,
  IconFolderOpen,
  IconChevronRight,
  IconChevronDown,
  IconEye,
  IconEdit,
  IconDownload,
  IconTrash,
} from "./Icons";

// ── Types ──────────────────────────────────────────────────────────────────

interface TreeNode {
  /** Segment name (directory or file). */
  name: string;
  /** Full path for leaf nodes. */
  fullPath?: string;
  /** Table metadata for leaf nodes. */
  table?: LookupTableMeta;
  /** Child directories / tables. */
  children: TreeNode[];
}

export type TreeAction = "view" | "update" | "delete" | "export-csv" | "export-json";

interface LookupTreeSidebarProps {
  tables: LookupTableMeta[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onAction: (action: TreeAction, table: LookupTableMeta) => void;
  loading?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────

export const LookupTreeSidebar: React.FC<LookupTreeSidebarProps> = ({
  tables,
  selectedPath,
  onSelect,
  onAction,
  loading = false,
}) => {
  const [search, setSearch] = useState("");
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [menuTarget, setMenuTarget] = useState<{
    table: LookupTableMeta;
    x: number;
    y: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter tables by search
  const filtered = useMemo(() => {
    if (!search.trim()) return tables;
    const s = search.toLowerCase();
    return tables.filter(
      (t) =>
        t.filePath.toLowerCase().includes(s) ||
        t.displayName.toLowerCase().includes(s)
    );
  }, [tables, search]);

  // Build tree from flat paths
  const tree = useMemo(() => buildTree(filtered), [filtered]);

  // Auto-expand all dirs when searching
  const effectiveDirs = useMemo(() => {
    if (search.trim()) {
      const allDirs = new Set<string>();
      const collect = (nodes: TreeNode[], prefix: string) => {
        for (const n of nodes) {
          if (n.children.length > 0) {
            const p = prefix ? `${prefix}/${n.name}` : n.name;
            allDirs.add(p);
            collect(n.children, p);
          }
        }
      };
      collect(tree, "");
      return allDirs;
    }
    return expandedDirs;
  }, [search, tree, expandedDirs]);

  const toggleDir = useCallback(
    (dirPath: string) => {
      setExpandedDirs((prev) => {
        const next = new Set(prev);
        if (next.has(dirPath)) next.delete(dirPath);
        else next.add(dirPath);
        return next;
      });
    },
    []
  );

  const handleMenuClick = useCallback(
    (e: React.MouseEvent, table: LookupTableMeta) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMenuTarget({ table, x: rect.right + 4, y: rect.top });
    },
    []
  );

  const handleAction = useCallback(
    (action: TreeAction) => {
      if (menuTarget) {
        onAction(action, menuTarget.table);
        setMenuTarget(null);
      }
    },
    [menuTarget, onAction]
  );

  // Close menu on outside click
  const handleBackdrop = useCallback(() => setMenuTarget(null), []);

  // ── Render tree nodes ────────────────────────────────────────────────────

  const renderNodes = (nodes: TreeNode[], depth: number, pathPrefix: string) =>
    nodes.map((node) => {
      const currentPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;

      if (node.table) {
        // Leaf node — a table
        const isSelected = selectedPath === node.table.filePath;
        return (
          <div
            key={node.table.filePath}
            className={`tree-item ${isSelected ? "tree-item--selected" : ""}`}
            style={{ paddingLeft: depth * 16 + 12 }}
            onClick={() => onSelect(node.table!.filePath)}
          >
            <span className="tree-item__icon"><IconFile size={14} /></span>
            <Flex flexDirection="column" style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {node.name}
              </Text>
              {node.table.displayName && node.table.displayName !== node.name && (
                <Text
                  style={{
                    fontSize: 11,
                    opacity: 0.6,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {node.table.displayName}
                </Text>
              )}
            </Flex>
            <button
              className="tree-item__menu-btn"
              onClick={(e) => handleMenuClick(e, node.table!)}
              title="Actions"
            >
              ⋮
            </button>
          </div>
        );
      }

      // Directory node
      const isExpanded = effectiveDirs.has(currentPath);
      return (
        <div key={currentPath}>
          <div
            className="tree-item tree-item--dir"
            style={{ paddingLeft: depth * 16 + 12 }}
            onClick={() => toggleDir(currentPath)}
          >
            <span className="tree-item__icon">
              {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            </span>
            <span className="tree-item__icon" style={{ marginLeft: -4 }}>
              {isExpanded ? <IconFolderOpen size={14} /> : <IconFolder size={14} />}
            </span>
            <Text style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
              {node.name}
            </Text>
            <Text
              style={{
                fontSize: 10,
                opacity: 0.5,
                marginRight: 8,
              }}
            >
              {countLeaves(node)}
            </Text>
          </div>
          {isExpanded && (
            <div style={{ animation: "fadeIn 0.15s ease both" }}>
              {renderNodes(node.children, depth + 1, currentPath)}
            </div>
          )}
        </div>
      );
    });

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="tree-sidebar">
      {/* Search */}
      <div style={{ padding: "12px 12px 8px" }}>
        <TextInput
          placeholder="Search…"
          value={search}
          onChange={(val) => setSearch(val ?? "")}
        />
      </div>

      {/* Header */}
      <div
        style={{
          padding: "4px 12px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            opacity: 0.5,
            fontWeight: 600,
          }}
        >
          Lookup Tables (/lookups/…)
        </Text>
      </div>

      {/* Tree */}
      <div className="tree-sidebar__list">
        {loading && (
          <Flex
            flexDirection="column"
            alignItems="center"
            padding={24}
            gap={8}
          >
            <Text style={{ opacity: 0.5, fontSize: 13 }}>Loading…</Text>
          </Flex>
        )}
        {!loading && filtered.length === 0 && (
          <Flex flexDirection="column" alignItems="center" padding={24}>
            <Text style={{ opacity: 0.5, fontSize: 13 }}>
              {search ? "No matching tables" : "No lookup tables"}
            </Text>
          </Flex>
        )}
        {!loading && filtered.length > 0 && renderNodes(tree, 0, "")}
      </div>

      {/* Context menu */}
      {menuTarget && (
        <>
          <div className="tree-menu-backdrop" onClick={handleBackdrop} />
          <div
            ref={menuRef}
            className="tree-context-menu"
            style={{ top: menuTarget.y, left: menuTarget.x }}
          >
            <button className="tree-context-menu__item" onClick={() => handleAction("update")}>
              <IconEdit size={14} /> Update
            </button>
            <div className="tree-context-menu__divider" />
            <button className="tree-context-menu__item" onClick={() => handleAction("export-csv")}>
              <IconDownload size={14} /> Export CSV
            </button>
            <button className="tree-context-menu__item" onClick={() => handleAction("export-json")}>
              <IconDownload size={14} /> Export JSON
            </button>
            <div className="tree-context-menu__divider" />
            <button
              className="tree-context-menu__item tree-context-menu__item--danger"
              onClick={() => handleAction("delete")}
            >
              <IconTrash size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a tree from flat file paths. Strips /lookups/ prefix for display. */
function buildTree(tables: LookupTableMeta[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const table of tables) {
    // Strip /lookups/ prefix
    const relative = table.filePath.replace(/^\/lookups\/?/, "");
    const segments = relative.split("/").filter(Boolean);

    let current = root;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const isLast = i === segments.length - 1;

      if (isLast) {
        current.push({
          name: seg,
          fullPath: table.filePath,
          table,
          children: [],
        });
      } else {
        let dir = current.find((n) => n.name === seg && !n.table);
        if (!dir) {
          dir = { name: seg, children: [] };
          current.push(dir);
        }
        current = dir.children;
      }
    }
  }

  // Sort: directories first, then alphabetical
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      const aDir = a.children.length > 0 && !a.table ? 0 : 1;
      const bDir = b.children.length > 0 && !b.table ? 0 : 1;
      if (aDir !== bDir) return aDir - bDir;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) {
      if (n.children.length > 0) sortNodes(n.children);
    }
  };
  sortNodes(root);

  return root;
}

function countLeaves(node: TreeNode): number {
  if (node.table) return 1;
  return node.children.reduce((sum, c) => sum + countLeaves(c), 0);
}
