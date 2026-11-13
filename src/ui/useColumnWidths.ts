import { useCallback, useState } from "react";
import { isWindows } from "./platform";

export type Column = "sidebar" | "list";

interface Bounds {
  initial: number;
  min: number;
  max: number;
}

export const COLUMNS: Record<Column, Bounds> = {
  sidebar: { initial: 228, min: 180, max: 360 },
  list: { initial: 380, min: 300, max: 680 },
};

const STORAGE_KEY = "column-widths";

/** What the sidebar starts wider by on Windows, where the search field's shortcut is written out ("Ctrl+K") and takes that much more room than "⌘K". */
const WINDOWS_SIDEBAR_EXTRA = 16;

/**
 * The width a column has before the viewer sized it, and after a reset.
 *
 * @example
 *   initialWidth("sidebar"); // 228 on macOS, 244 on Windows
 */
export function initialWidth(column: Column): number {
  return COLUMNS[column].initial + (column === "sidebar" && isWindows() ? WINDOWS_SIDEBAR_EXTRA : 0);
}

/**
 * Widths of the two resizable columns, in CSS pixels, remembered across restarts.
 *
 * Widths are clamped to the bounds in `COLUMNS`. They live in the webview's localStorage, a
 * per-device convenience: when storage is unavailable or holds garbage, the initial widths apply.
 *
 * @returns The current widths, `resize(column, width)` to set one (clamped and persisted) and
 *   `reset(column)` to restore its initial width.
 *
 * @example
 *   const columns = useColumnWidths();
 *   columns.resize("list", 520);
 *   columns.widths.list; // 520
 */
export function useColumnWidths() {
  const [widths, setWidths] = useState<Record<Column, number>>(load);

  const resize = useCallback((column: Column, width: number) => {
    setWidths((current) => {
      const next = { ...current, [column]: clamp(column, width) };
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback((column: Column) => resize(column, initialWidth(column)), [resize]);

  return { widths, resize, reset };
}

function clamp(column: Column, width: number): number {
  const { min, max } = COLUMNS[column];
  return Math.round(Math.min(max, Math.max(min, width)));
}

function load(): Record<Column, number> {
  const initial = { sidebar: initialWidth("sidebar"), list: initialWidth("list") };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<Record<Column, unknown>>;
    for (const column of Object.keys(initial) as Column[]) {
      const value = stored[column];
      if (typeof value === "number" && Number.isFinite(value)) initial[column] = clamp(column, value);
    }
  } catch {
    // Unreadable storage falls back to the initial widths.
  }
  return initial;
}

function save(widths: Record<Column, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  } catch {
    // Not persisting is acceptable; the widths still apply for this session.
  }
}
