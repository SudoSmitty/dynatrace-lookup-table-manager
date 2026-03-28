/**
 * components/NotificationBar.tsx
 * ---------------------------------------------------------------------------
 * Renders toast-style notifications at the top-right of the app.
 */

import React from "react";
import { Flex } from "@dynatrace/strato-components-preview/layouts";
import type { Notification } from "../hooks";

interface NotificationBarProps {
  notifications: Notification[];
  onDismiss: (id: number) => void;
}

const colorMap: Record<string, string> = {
  success: "var(--dt-colors-charts-status-success-default, #2ab06f)",
  critical: "var(--dt-colors-charts-status-critical-default, #dc3545)",
  warning: "var(--dt-colors-charts-status-warning-default, #f5a623)",
  info: "var(--dt-colors-charts-status-info-default, #1496ff)",
};

export const NotificationBar: React.FC<NotificationBarProps> = ({
  notifications,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 420,
      }}
    >
      {notifications.map((n) => (
        <div
          key={n.id}
          role="alert"
          className="glass-card"
          style={{
            borderLeft: `4px solid ${colorMap[n.type] ?? colorMap.info}`,
            padding: "14px 18px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            animation: "slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: colorMap[n.type] ?? colorMap.info,
            marginTop: 5,
            flexShrink: 0,
          }} />
          <Flex flexDirection="column" gap={2} style={{ flex: 1 }}>
            <strong style={{ fontSize: 14, color: "var(--dt-colors-text-neutral-default)" }}>{n.title}</strong>
            {n.message && (
              <span
                style={{
                  fontSize: 13,
                  color: "var(--dt-colors-text-neutral-subdued)",
                  lineHeight: 1.4,
                }}
              >
                {n.message}
              </span>
            )}
          </Flex>
          <button
            onClick={() => onDismiss(n.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              color: "var(--dt-colors-text-neutral-default)",
              padding: "2px 4px",
              borderRadius: 4,
              transition: "background 0.15s ease",
            }}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
