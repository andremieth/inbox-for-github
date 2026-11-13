import { isValidElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { RULES } from "../rules";
import { dateLocale, regionOf, setLang, setRegion, t, tKey, tKeys, tRich, type MessageKey } from "./i18n";
import { en } from "./locales/en";
import { setPlatform } from "./platform";

describe("t", () => {
  it("fills placeholders in the current language", () => {
    setLang("en");
    expect(t("activity.commits", { count: 3 })).toBe("3 new commits");
    setLang("de");
    expect(t("activity.commits", { count: 3 })).toBe("3 neue Commits");
  });

  it("keeps unknown placeholders visible instead of dropping them", () => {
    setLang("en");
    expect(t("activity.commits")).toBe("{count} new commits");
  });
});

describe("tRich", () => {
  it("puts elements in place of placeholders", () => {
    setLang("en");
    const parts = tRich("activity.assigned", { name: <strong>alice</strong> }) as React.ReactElement<{ children: unknown }>[];
    expect(parts.map((p) => (isValidElement(p.props.children) ? "<el>" : p.props.children))).toEqual(["", "<el>", " assigned you"]);
  });
});

describe("shortcuts in texts", () => {
  afterEach(() => setPlatform("mac"));

  it("keeps the glyphs on macOS and writes the keys out on Windows, in the text's language", () => {
    setLang("en");
    expect(t("sidebar.refresh")).toBe("Refresh (⌘R)");
    setPlatform("windows");
    expect(t("sidebar.refresh")).toBe("Refresh (Ctrl+R)");
    setLang("de");
    expect(t("sidebar.refresh")).toBe("Aktualisieren (Strg+R)");
  });

  it("writes the labels components build themselves the same way", () => {
    setLang("en");
    expect(tKey("⇧⌘R")).toBe("⇧⌘R");
    expect(tKeys(["⌘", "K"])).toEqual(["⌘", "K"]);
    setPlatform("windows");
    expect(tKey("⇧⌘R")).toBe("Ctrl+Shift+R");
    expect(tKey("⌃A")).toBe("Alt+A");
    expect(tKeys(["⌘", "K"])).toEqual(["Ctrl", "K"]);
  });

  it("leaves no glyph in any text on Windows, so a new way to name a shortcut cannot slip through", () => {
    setPlatform("windows");
    for (const lang of ["en", "de"] as const) {
      setLang(lang);
      for (const key of Object.keys(en) as MessageKey[]) expect(t(key), `${lang}: ${key}`).not.toMatch(/[⌘⌃⇧↵]/);
    }
  });
});

describe("Windows wording", () => {
  afterEach(() => setPlatform("mac"));

  it("replaces what names the Mac, in both languages, and only on Windows", () => {
    setLang("en");
    expect(t("orgs.localOnly")).toBe("Your selection is stored on this Mac only.");
    setPlatform("windows");
    expect(t("orgs.localOnly")).toBe("Your selection is stored on this PC only.");
    setLang("de");
    expect(t("orgs.localOnly")).toBe("Deine Auswahl wird nur auf diesem PC gespeichert.");
  });

  it("names neither the Mac nor the Dock in any text Windows shows", () => {
    setPlatform("windows");
    for (const lang of ["en", "de"] as const) {
      setLang(lang);
      for (const key of (Object.keys(en) as MessageKey[]).filter((k) => !/^(calendarAccess\.|settings\.(intro\.)?calendar)/.test(k))) expect(t(key), `${lang}: ${key}`).not.toMatch(/\bMacs?\b|macOS|Dock/);
    }
  });

  it("names no calendar in the help, which Windows shows without one", () => {
    setLang("en");
    expect(t("help.assigned.leaves")).toContain("calendar event");
    setPlatform("windows");
    for (const lang of ["en", "de"] as const) {
      setLang(lang);
      for (const key of (Object.keys(en) as MessageKey[]).filter((k) => k.startsWith("help.") || k.startsWith("keys."))) expect(t(key), `${lang}: ${key}`).not.toMatch(/calendar|Kalender/i);
    }
  });
});

describe("rule texts", () => {
  it("has a title and a description for every rule", () => {
    for (const rule of RULES) {
      expect(Object.keys(en)).toContain(`rule.${rule.id}.title`);
      expect(Object.keys(en)).toContain(`rule.${rule.id}.description`);
    }
  });
});

describe("regionOf and dateLocale", () => {
  it("reads the region override, else the country, from a macOS locale", () => {
    expect(regionOf("en_US@rg=dezzzz")).toBe("DE");
    expect(regionOf("de_AT")).toBe("AT");
    expect(regionOf("en")).toBeNull();
  });

  it("reads the region from a Windows locale, with or without a script", () => {
    expect(regionOf("de-DE")).toBe("DE");
    expect(regionOf("en-US")).toBe("US");
    expect(regionOf("sr-Latn-RS")).toBe("RS");
    expect(regionOf("es-ES_tradnl")).toBe("ES");
    expect(regionOf("de")).toBeNull();
  });

  it("formats dates in the app's language and the Mac's region", () => {
    setLang("en");
    setRegion("en_US@rg=dezzzz");
    expect(dateLocale()).toBe("en-DE");
    setRegion("");
    expect(dateLocale()).toBe("en");
  });
});
