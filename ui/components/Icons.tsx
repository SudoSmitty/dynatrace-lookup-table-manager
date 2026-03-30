/**
 * components/Icons.tsx
 * ---------------------------------------------------------------------------
 * Minimal inline SVG icons — flat, modern, single-color.
 * All icons accept size (default 16) and color (default currentColor).
 */

import React from "react";

interface IconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

const svg = (
  size: number,
  color: string,
  style: React.CSSProperties | undefined,
  children: React.ReactNode
) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
  >
    {children}
  </svg>
);

export const IconTable: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </>);

export const IconDatabase: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
  </>);

export const IconFile: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </>);

export const IconFolder: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </>);

export const IconFolderOpen: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v1" />
    <path d="M2 10h20l-2 9H4z" />
  </>);

export const IconHdd: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <line x1="22" y1="12" x2="2" y2="12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    <line x1="6" y1="16" x2="6.01" y2="16" />
    <line x1="10" y1="16" x2="10.01" y2="16" />
  </>);

export const IconClock: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </>);

export const IconColumns: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </>);

export const IconEye: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </>);

export const IconEdit: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </>);

export const IconDownload: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </>);

export const IconTrash: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </>);

export const IconCopy: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>);

export const IconCheck: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <polyline points="20 6 9 17 4 12" />
  </>);

export const IconUpload: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </>);

export const IconClipboard: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
  </>);

export const IconChevronRight: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <polyline points="9 18 15 12 9 6" />
  </>);

export const IconChevronDown: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <polyline points="6 9 12 15 18 9" />
  </>);

export const IconHash: React.FC<IconProps> = ({ size = 16, color = "currentColor", style }) =>
  svg(size, color, style, <>
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </>);
