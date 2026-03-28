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
      style={{
        border: `2px dashed ${
          dragActive
            ? "var(--dt-colors-border-accent-default, #1496ff)"
            : "var(--dt-colors-border-neutral-default, #ccc)"
        }`,
        borderRadius: 8,
        padding: "32px 16px",
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        background: dragActive
          ? "var(--dt-colors-surface-accent-subdued, rgba(20,150,255,0.05))"
          : "var(--dt-colors-surface-default, transparent)",
        transition: "border-color 0.2s, background 0.2s",
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
      <Flex flexDirection="column" alignItems="center" gap={8}>
        <Text style={{ fontSize: 28 }}>📂</Text>
        {selectedFileName ? (
          <Text>
            <strong>{selectedFileName}</strong> selected
          </Text>
        ) : (
          <>
            <Text style={{ fontWeight: 600 }}>
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
