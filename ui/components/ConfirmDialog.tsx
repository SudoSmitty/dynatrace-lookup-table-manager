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
      <Flex flexDirection="column" gap={16} padding={8}>
        <Text>{message}</Text>
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
