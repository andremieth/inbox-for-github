import { afterEach, describe, expect, it } from "vitest";
import { setPlatform } from "./platform";
import { COLUMNS, initialWidth } from "./useColumnWidths";

afterEach(() => setPlatform("mac"));

describe("initialWidth", () => {
  it("is the column's own width on macOS", () => {
    expect(initialWidth("sidebar")).toBe(COLUMNS.sidebar.initial);
    expect(initialWidth("list")).toBe(COLUMNS.list.initial);
  });

  it("gives the sidebar room for the written-out shortcut on Windows, within its bounds", () => {
    setPlatform("windows");
    expect(initialWidth("sidebar")).toBeGreaterThan(COLUMNS.sidebar.initial);
    expect(initialWidth("sidebar")).toBeLessThanOrEqual(COLUMNS.sidebar.max);
    expect(initialWidth("list")).toBe(COLUMNS.list.initial);
  });
});
