import { afterEach, describe, expect, it, vi } from "vitest";
import { calendarSupported, chosenCalendar } from "./calendar";
import { setPlatform } from "./ui/platform";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

afterEach(() => setPlatform("mac"));

describe("chosenCalendar", () => {
  it("is the setting on macOS, where the calendars come from", () => {
    expect(calendarSupported()).toBe(true);
    expect(chosenCalendar({ calendarId: "C1" })).toBe("C1");
    expect(chosenCalendar({ calendarId: "" })).toBe("");
  });

  it("is none on Windows, also when the settings still name a calendar", () => {
    setPlatform("windows");
    expect(calendarSupported()).toBe(false);
    expect(chosenCalendar({ calendarId: "C1" })).toBe("");
  });
});
