// Spec: UI-002a
import { useEffect, useState } from "react";
import type { Result } from "../../core/domain/Result";

/** Loads a list whenever `deps` change; the latest request wins. */
export function useAsyncList<T>(load: () => Promise<Result<T[]>>, deps: unknown[]): T[] {
  const [rows, setRows] = useState<T[]>([]);
  useEffect(() => {
    let active = true;
    void load().then((result) => {
      if (active && result.ok) setRows(result.value);
    });
    return () => {
      active = false;
    };
  }, deps);
  return rows;
}
