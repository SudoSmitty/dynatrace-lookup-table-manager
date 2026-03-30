/**
 * components/FileDropZone.tsx
 * ---------------------------------------------------------------------------
 * Drag-and-drop file selector for uploading lookup table data files.
 */

import React, { useCallback, useRef, useState } from "react";
import { Flex } from "@dynatrace/strato-components-preview/layouts";
import { Text } from "@dynatrace/strato-components/typography";

interface FileDropZoneProps {
  accept?: string;
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  selectedFileName?: string;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  accept = ".csv,.jsonl,.json,.xml",
  onFileSelected,
  disabled = false,
  selectedFileName,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelected(file);
    },
    [disabled, onFileSelected]
  );

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      setDragActive(e.type === "dragenter" || e.type === "dragover");
    },
    [disabled]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDrag}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onClick={() => !disabled && inputRef.current?.click()}
      className="glass-card"
      style={{
        border: `2px dashed ${
          dragActive
            ? "var(--ltm-accent-1)"
            : "var(--ltm-card-border)"
        }`,
        borderRadius: 12,
        padding: "40px 24px",
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        background: dragActive
          ? "var(--ltm-drop-bg)"
          : "transparent",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: dragActive ? "scale(1.01)" : "scale(1)",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: "none" }}
        disabled={disabled}
      />
      <Flex flexDirection="column" alignItems="center" gap={12}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--ltm-accent-soft-1), var(--ltm-accent-soft-2))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            transition: "transform 0.3s ease",
            transform: dragActive ? "scale(1.15)" : "scale(1)",
          }}
        >
          {selectedFileName ? "✓" : "↑"}
        </div>
        {selectedFileName ? (
          <Flex flexDirection="column" alignItems="center" gap={4}>
            <Text style={{ fontWeight: 700, fontSize: 15 }}>{selectedFileName}</Text>
            <Text style={{ fontSize: 12, color: "var(--dt-colors-text-neutral-default)" }}>Click or drop to replace</Text>
          </Flex>
        ) : (
          <>
            <Text style={{ fontWeight: 600, fontSize: 15 }}>
              Drag & drop a file here, or click to browse
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "var(--dt-colors-text-neutral-default)",
              }}
            >
              Supported formats: CSV, JSON Lines, JSON, XML
            </Text>
          </>
        )}
      </Flex>
    </div>
  );
};
