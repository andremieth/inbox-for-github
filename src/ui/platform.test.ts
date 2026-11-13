import { afterEach, describe, expect, it } from "vitest";
import { detectPlatform, isBrowserAccelerator, isWindows, keyCaps, keyText, modifiersOf, platform, platformOf, setPlatform } from "./platform";

afterEach(() => setPlatform("mac"));

const held = (keys: Partial<Record<"metaKey" | "ctrlKey" | "altKey", boolean>>) => ({ metaKey: false, ctrlKey: false, altKey: false, ...keys });

describe("platformOf", () => {
  it("reads Windows from WebView2's user agent and takes everything else as macOS", () => {
    expect(platformOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0")).toBe("windows");
    expect(platformOf("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)")).toBe("mac");
    expect(platformOf("")).toBe("mac");
  });
});

describe("detectPlatform", () => {
  it("lets the address force a platform, and ignores values it does not know", () => {
    expect(detectPlatform("?lang=de&platform=windows")).toBe("windows");
    expect(detectPlatform("?platform=mac")).toBe("mac");
    expect(detectPlatform("?platform=linux")).toBe("mac");
  });
});

describe("platform", () => {
  it("is macOS without a window, so the tests run alike on every machine", () => {
    expect(platform()).toBe("mac");
    expect(isWindows()).toBe(false);
  });

  it("follows setPlatform", () => {
    setPlatform("windows");
    expect(platform()).toBe("windows");
    expect(isWindows()).toBe(true);
  });
});

describe("modifiersOf", () => {
  it("takes ⌘ as mod and ⌃ as ctrl on macOS", () => {
    expect(modifiersOf(held({ metaKey: true }))).toEqual({ mod: true, ctrl: false, altGr: false });
    expect(modifiersOf(held({ ctrlKey: true }))).toEqual({ mod: false, ctrl: true, altGr: false });
    expect(modifiersOf(held({ altKey: true }))).toEqual({ mod: false, ctrl: false, altGr: false });
    expect(modifiersOf(held({ ctrlKey: true, altKey: true }))).toEqual({ mod: false, ctrl: true, altGr: false });
  });

  it("takes Ctrl as mod and Alt as ctrl on Windows", () => {
    setPlatform("windows");
    expect(modifiersOf(held({ ctrlKey: true }))).toEqual({ mod: true, ctrl: false, altGr: false });
    expect(modifiersOf(held({ altKey: true }))).toEqual({ mod: false, ctrl: true, altGr: false });
    expect(modifiersOf(held({ metaKey: true }))).toEqual({ mod: false, ctrl: false, altGr: false });
  });

  it("counts AltGr, which Windows reports as Ctrl and Alt together, as neither, and says it is held", () => {
    setPlatform("windows");
    expect(modifiersOf(held({ ctrlKey: true, altKey: true }))).toEqual({ mod: false, ctrl: false, altGr: true });
  });
});

describe("keyText", () => {
  const en = { mod: "Ctrl", ctrl: "Alt", shift: "Shift", enter: "Enter" };
  const de = { mod: "Strg", ctrl: "Alt", shift: "Umschalt", enter: "Eingabe" };

  it("writes a shortcut with its modifiers by name, in Windows' order", () => {
    expect(keyText("⌘K", en)).toBe("Ctrl+K");
    expect(keyText("⌃A", en)).toBe("Alt+A");
    expect(keyText("⇧⌘R", en)).toBe("Ctrl+Shift+R");
    expect(keyText("⌘,", en)).toBe("Ctrl+,");
    expect(keyText("⌘↵", en)).toBe("Ctrl+Enter");
  });

  it("finds the shortcuts inside a sentence and leaves the rest of it alone", () => {
    expect(keyText("Refresh (⌘R)", en)).toBe("Refresh (Ctrl+R)");
    expect(keyText("⌘R loads new activity, ⌃R the selected item, ⇧⌘R everything in full.", en)).toBe("Ctrl+R loads new activity, Alt+R the selected item, Ctrl+Shift+R everything in full.");
    expect(keyText("(also ⇧↑/⇧↓; ⌘-click one, ⇧-click a range)", en)).toBe("(also Shift+↑/Shift+↓; Ctrl-click one, Shift-click a range)");
  });

  it("takes the key names of the text's language", () => {
    expect(keyText("Aktualisieren (⌘R)", de)).toBe("Aktualisieren (Strg+R)");
    expect(keyText("⌘-Klick einzeln, ⇧-Klick einen Bereich", de)).toBe("Strg-Klick einzeln, Umschalt-Klick einen Bereich");
    expect(keyText("⌘↵", de)).toBe("Strg+Eingabe");
  });

  it("returns text without a glyph, and plain key labels, as they are", () => {
    expect(keyText("Nothing needs you right now.", en)).toBe("Nothing needs you right now.");
    expect(keyText("D", en)).toBe("D");
    expect(keyText("#123", en)).toBe("#123");
    expect(keyText("?", en)).toBe("?");
  });
});

describe("keyCaps", () => {
  const en = { mod: "Ctrl", ctrl: "Alt", shift: "Shift", enter: "Enter" };

  it("names the modifiers, first and in Windows' order", () => {
    expect(keyCaps(["⌘", "K"], en)).toEqual(["Ctrl", "K"]);
    expect(keyCaps(["⌃", "A"], en)).toEqual(["Alt", "A"]);
    expect(keyCaps(["⇧", "⌘", "R"], en)).toEqual(["Ctrl", "Shift", "R"]);
  });

  it("keeps ranges, alternatives and named keys, and writes ↵ as Enter", () => {
    expect(keyCaps(["⇧", "↑", "/", "↓"], en)).toEqual(["Shift", "↑", "/", "↓"]);
    expect(keyCaps(["1", "–", "6"], en)).toEqual(["1", "–", "6"]);
    expect(keyCaps(["Space", "/", "↵"], en)).toEqual(["Space", "/", "Enter"]);
    expect(keyCaps(["Esc"], en)).toEqual(["Esc"]);
  });
});

describe("isBrowserAccelerator", () => {
  const press = (key: string, keys: Partial<Record<"ctrlKey" | "altKey", boolean>> = {}) => ({ key, ctrlKey: false, altKey: false, ...keys });

  it("knows the keys that reload, print, search or leave the page", () => {
    expect(isBrowserAccelerator(press("F5"))).toBe(true);
    expect(isBrowserAccelerator(press("r", { ctrlKey: true }))).toBe(true);
    expect(isBrowserAccelerator(press("R", { ctrlKey: true }))).toBe(true);
    expect(isBrowserAccelerator(press("p", { ctrlKey: true }))).toBe(true);
    expect(isBrowserAccelerator(press("f", { ctrlKey: true }))).toBe(true);
    expect(isBrowserAccelerator(press("ArrowLeft", { altKey: true }))).toBe(true);
  });

  it("leaves typing, the editing keys and the app's own shortcuts alone", () => {
    expect(isBrowserAccelerator(press("p"))).toBe(false);
    expect(isBrowserAccelerator(press("c", { ctrlKey: true }))).toBe(false);
    expect(isBrowserAccelerator(press("k", { ctrlKey: true }))).toBe(false);
    expect(isBrowserAccelerator(press("a", { altKey: true }))).toBe(false);
    expect(isBrowserAccelerator(press("ArrowLeft"))).toBe(false);
  });

  it("never takes a character typed with AltGr", () => {
    expect(isBrowserAccelerator(press("}", { ctrlKey: true, altKey: true }))).toBe(false);
    expect(isBrowserAccelerator(press("0", { ctrlKey: true, altKey: true }))).toBe(false);
  });
});
