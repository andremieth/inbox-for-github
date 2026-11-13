/** The operating systems the app runs on; whatever differs between them (keys, window chrome, badge) branches on this. */
export type Platform = "mac" | "windows";

/**
 * The platform behind a web view's user agent: "windows" for WebView2
 * ("… (Windows NT 10.0; Win64; x64) …"), "mac" for everything else, so macOS stays the default.
 *
 * @example
 *   platformOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 … Edg/142.0"); // "windows"
 */
export function platformOf(userAgent: string): Platform {
  return userAgent.includes("Windows NT") ? "windows" : "mac";
}

/**
 * The platform this page runs on. A `platform=mac` or `platform=windows` in the address wins over
 * the web view's own answer, so the demo scripts can show either look from any machine.
 *
 * @param search  The address's query string; the page's own by default.
 *
 * @example
 *   detectPlatform("?lang=de&platform=windows"); // "windows"
 */
export function detectPlatform(search: string = window.location.search): Platform {
  const forced = new URLSearchParams(search).get("platform");
  return forced === "mac" || forced === "windows" ? forced : platformOf(navigator.userAgent);
}

let current: Platform | null = null;

/**
 * The platform every function here answers for, decided on first use: `detectPlatform` in a
 * window, "mac" without one (the unit tests, which run in Node on any machine).
 *
 * Read it inside functions and during render, never into a module-level constant: such a constant
 * would be fixed before a test can switch the platform with `setPlatform`.
 *
 * @example
 *   document.documentElement.dataset.platform = platform(); // "windows"
 */
export function platform(): Platform {
  current ??= typeof window === "undefined" ? "mac" : detectPlatform();
  return current;
}

/**
 * Switches the platform for every following call. For tests, which set it back to "mac" when done.
 *
 * @example
 *   setPlatform("windows");
 */
export function setPlatform(next: Platform): void {
  current = next;
}

/** Whether the app runs on Windows. */
export function isWindows(): boolean {
  return platform() === "windows";
}

/**
 * The two modifiers shortcuts are bound with, as held in a key or mouse event: `mod` is ⌘ on
 * macOS and Ctrl on Windows; `ctrl` is ⌃ on macOS and Alt on Windows, where Ctrl is `mod` already.
 * AltGr, which Windows reports as Ctrl and Alt together, types a character: it is neither of
 * the two, and `altGr` says it is held, since a key pressed with it must not act as a plain key
 * either (Ctrl+Alt+D is not D).
 *
 * @example
 *   modifiersOf(event).mod; // true for ⌘K on macOS and for Ctrl+K on Windows
 */
export function modifiersOf(e: Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "altKey">): { mod: boolean; ctrl: boolean; altGr: boolean } {
  if (!isWindows()) return { mod: e.metaKey, ctrl: e.ctrlKey, altGr: false };
  const altGr = e.ctrlKey && e.altKey;
  return { mod: e.ctrlKey && !altGr, ctrl: e.altKey && !altGr, altGr };
}

/** How Windows writes the keys the app's texts show as glyphs: ⌘, ⌃, ⇧ and ↵. They are texts, so the dictionaries hold them. */
export interface KeyNames {
  mod: string;
  ctrl: string;
  shift: string;
  enter: string;
}

/** The modifier glyphs with the name each takes on Windows, in the order Windows writes them: Ctrl, Alt, Shift. */
const MODIFIERS: [glyph: string, name: keyof KeyNames][] = [
  ["⌘", "mod"],
  ["⌃", "ctrl"],
  ["⇧", "shift"],
];
const HAS_GLYPH = /[⌘⌃⇧↵]/;
/** Modifier glyphs before a key, or before the hyphen of "⌘-click". */
const SHORTCUT = /([⌘⌃⇧]+)(?:([A-Za-z0-9,↑↓←→↵])|(?=-))/g;

function modifierNames(glyphs: string | readonly string[], names: KeyNames): string[] {
  return MODIFIERS.filter(([glyph]) => glyphs.includes(glyph)).map(([, name]) => names[name]);
}

/**
 * A text with its shortcuts written the Windows way. Texts and labels name shortcuts by the
 * macOS glyphs everywhere in the code and the dictionaries; this is where Windows gets its own
 * spelling, so no text exists twice. Text without a glyph comes back as it is.
 *
 * @param text   A label ("⇧⌘R") or a sentence that names shortcuts.
 * @param names  The key names in the text's language.
 *
 * @example
 *   keyText("Refresh (⇧⌘R), or ⌘-click", { mod: "Ctrl", ctrl: "Alt", shift: "Shift", enter: "Enter" }); // "Refresh (Ctrl+Shift+R), or Ctrl-click"
 */
export function keyText(text: string, names: KeyNames): string {
  if (!HAS_GLYPH.test(text)) return text;
  return text
    .replace(SHORTCUT, (_match, glyphs: string, key?: string) => [...modifierNames(glyphs, names), ...(key ? [key === "↵" ? names.enter : key] : [])].join("+"))
    .replaceAll("↵", names.enter);
}

/**
 * The keys of one shortcut, each for a key cap of its own, written the Windows way: the
 * modifiers by name in Windows' order, ↵ as Enter. Other parts ("–", "/", "Esc") stay.
 *
 * @example
 *   keyCaps(["⇧", "⌘", "R"], { mod: "Ctrl", ctrl: "Alt", shift: "Shift", enter: "Enter" }); // ["Ctrl", "Shift", "R"]
 */
export function keyCaps(combo: readonly string[], names: KeyNames): string[] {
  const held = combo.filter((key) => MODIFIERS.some(([glyph]) => glyph === key));
  const rest = combo.filter((key) => !held.includes(key));
  return [...modifierNames(held, names), ...rest.map((key) => (key === "↵" ? names.enter : key))];
}

/** Keys WebView2 acts on by themselves: find next, reload, caret browsing. */
const BROWSER_KEYS = new Set(["F3", "F5", "F7"]);
/** With Ctrl, WebView2's find, find next, history, downloads, new window, open, print, reload, save, view source and zoom. */
const BROWSER_CTRL_KEYS = new Set(["f", "g", "h", "j", "n", "o", "p", "r", "s", "u", "+", "-", "=", "0"]);

/**
 * Whether a key press is a browser command of WebView2, the web view on Windows: it would
 * reload the app (F5, Ctrl+R), print it (Ctrl+P), open the find bar or leave the page (Alt+←).
 * The keys the app binds itself are among them, since their bindings rest while a dialog is open.
 * A character typed with AltGr is never one. See docs/reference/windows.md.
 *
 * @example
 *   window.addEventListener("keydown", (e) => isBrowserAccelerator(e) && e.preventDefault(), true);
 */
export function isBrowserAccelerator(e: Pick<KeyboardEvent, "key" | "ctrlKey" | "altKey">): boolean {
  if (BROWSER_KEYS.has(e.key)) return true;
  if (e.altKey) return !e.ctrlKey && (e.key === "ArrowLeft" || e.key === "ArrowRight");
  return e.ctrlKey && BROWSER_CTRL_KEYS.has(e.key.toLowerCase());
}
