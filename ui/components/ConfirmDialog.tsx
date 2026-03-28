/**
 * components/ConfirmDialog.tsx
 * ---------------------------------------------------------------------------
 * Reusable confirmation modal for destructive actions like delete.
 */

import React from "react";
import { Modal } from "@dynatrace/strato-components-preview/overlays";
import { Button } from "@dynatrace/strato-components-preview/buttons";
import { Flex } from "@dynatrace/strato-components-preview/layouts";
import { Text } from "@dynatrace/strato-components/typography";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "accent" | "default" | "emphasized";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "emphasized",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal title={title} show={open} onDismiss={onCancel}>
      <Flex flexDirection="column" gap={20} padding={8}>
        <Flex flexDirection="row" gap={12} alignItems="flex-start">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(220,53,69,0.12), rgba(220,53,69,0.06))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            ⚠️
          </div>
          <Text style={{ lineHeight: 1.6, paddingTop: 8 }}>{message}</Text>
        </Flex>
        <Flex flexDirection="row" justifyContent="flex-end" gap={8}>
          <Button variant="default" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting…" : confirmLabel}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};
