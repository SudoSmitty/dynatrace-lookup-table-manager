/**
 * hooks/useLookupPreview.ts
 * ---------------------------------------------------------------------------
 * React hook for previewing the content of a single lookup table.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { countLookupRows, previewLookupTable } from "../api";
import type { LookupRow } from "../types";

export interface UseLookupPreviewResult {
  rows: LookupRow[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLookupPreview(
  filePath: string | null
): UseLookupPreviewResult {
  const [rows, setRows] = useState<LookupRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchPreview = useCallback(async () => {
    if (!filePath) return;
    setLoading(true);
    setError(null);
    try {
      const [data, count] = await Promise.all([
        previewLookupTable(filePath),
        countLookupRows(filePath),
      ]);
      if (mountedRef.current) {
        setRows(data);
        setTotalCount(count);
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [filePath]);

  useEffect(() => {
    mountedRef.current = true;
    fetchPreview();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchPreview]);

  return { rows, totalCount, loading, error, refresh: fetchPreview };
}
