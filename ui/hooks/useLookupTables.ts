/**
 * hooks/useLookupTables.ts
 * ---------------------------------------------------------------------------
 * React hook for fetching and managing the list of lookup tables.
 * Provides loading, error, and refresh capabilities.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { listLookupTables } from "../api";
import type { LookupTableMeta } from "../types";

export interface UseLookupTablesResult {
  tables: LookupTableMeta[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLookupTables(search?: string): UseLookupTablesResult {
  const [tables, setTables] = useState<LookupTableMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLookupTables(search);
      if (mountedRef.current) {
        setTables(data);
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
  }, [search]);

  useEffect(() => {
    mountedRef.current = true;
    fetchTables();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchTables]);

  return { tables, loading, error, refresh: fetchTables };
}
