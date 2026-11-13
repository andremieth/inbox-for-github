import { Fragment, createElement, type ReactNode } from "react";
import { de, deWindows } from "./locales/de";
import { en, enWindows, type Messages } from "./locales/en";
import { isWindows, keyCaps, keyText, type KeyNames } from "./platform";

export type Lang = "en" | "de";
export type MessageKey = keyof Messages;

const DICTIONARIES: Record<Lang, Messages> = { en, de };
/** What Windows words differently, by language; every other text is the dictionary's. */
const WINDOWS: Record<Lang, Partial<Messages>> = { en: enWindows, de: deWindows };

let current: Lang = "en";

/**
 * Switches the language for every following `t` call. The app sets it from the settings at the
 * top of each render, so a change shows on the next render; tests set it directly.
 *
 * @example
 *   setLang("de");
 */
export function setLang(lang: Lang): void {
  current = lang;
}

/** The current language, e.g. for `Intl` formatters of texts; dates and times use `dateLocale`. */
export function lang(): Lang {
  return current;
}

let region: string | null = null;

/**
 * The region in the system's locale, as the shell's `system_locale` reports it; null when it
 * names none. macOS gives "en_US@rg=dezzzz" or "de_AT": the `rg` override that System Settings ›
 * Language & Region writes, else the country. Windows gives the regional format as a BCP 47 tag,
 * "de-DE" or "sr-Latn-RS", with the sort order after it where one is chosen ("es-ES_tradnl").
 *
 * @example
 *   regionOf("en_US@rg=dezzzz"); // "DE"
 *   regionOf("de-DE"); // "DE"
 */
export function regionOf(locale: string): string | null {
  const override = /@(?:.*;)?rg=([a-z]{2})zzzz/i.exec(locale)?.[1];
  const country = /^[a-z]{2,3}(?:[_-][A-Z][a-z]{3})?[_-]([A-Z]{2})(?![A-Za-z0-9])/.exec(locale)?.[1];
  return (override ?? country)?.toUpperCase() ?? null;
}

/** Sets the system's region for `dateLocale`, from its locale (see `regionOf`); set once at start. */
export function setRegion(locale: string): void {
  region = regionOf(locale);
}

/**
 * The locale dates and times are formatted with: the app's language in the system's region, so
 * English in Germany reads "3 Nov" in German order ("en-DE"); without a region the language.
 *
 * @example
 *   new Date().toLocaleDateString(dateLocale(), { day: "numeric", month: "short" });
 */
export function dateLocale(): string {
  return region ? `${current}-${region}` : current;
}

/** The key names of the current language, for writing shortcuts the Windows way. */
function keyNames(): KeyNames {
  const dictionary = DICTIONARIES[current];
  return { mod: dictionary["keys.windows.mod"], ctrl: dictionary["keys.windows.ctrl"], shift: dictionary["keys.windows.shift"], enter: dictionary["keys.windows.enter"] };
}

/** A text of the current language as this platform shows it: on Windows its own wording where there is one, and the shortcuts written out (`keyText`). */
function message(key: MessageKey): string {
  if (!isWindows()) return DICTIONARIES[current][key];
  return keyText(WINDOWS[current][key] ?? DICTIONARIES[current][key], keyNames());
}

/**
 * Looks up a text in the current language and fills `{name}` placeholders from `params`.
 * English is the source dictionary; the German one must have the same keys, so a missing
 * translation fails the typecheck. The dictionaries name shortcuts by the macOS glyphs; on
 * Windows the text comes back with them written out ("⌘R" as "Ctrl+R").
 *
 * @example
 *   t("time.now"); // "now"
 *   t("activity.commits", { count: 3 }); // "3 new commits"
 */
export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  return message(key).replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

/**
 * Like `t`, but placeholders may be elements, e.g. a bold name inside a translated sentence.
 *
 * @example
 *   tRich("activity.assigned", { name: <strong>alice</strong> }); // [<strong>alice</strong>, " assigned you"]
 */
export function tRich(key: MessageKey, params: Record<string, ReactNode>): ReactNode {
  const parts = message(key).split(/\{(\w+)\}/);
  return parts.map((part, i) => createElement(Fragment, { key: i }, i % 2 === 1 ? (params[part] ?? `{${part}}`) : part));
}

/**
 * A shortcut label a component writes itself, for this platform: the glyphs on macOS, the key
 * names of the current language on Windows. Texts from `t` need no such call.
 *
 * @example
 *   <kbd>{tKey("⇧⌘R")}</kbd> // "⇧⌘R" on macOS, "Ctrl+Shift+R" on Windows
 */
export function tKey(keys: string): string {
  return isWindows() ? keyText(keys, keyNames()) : keys;
}

/**
 * The keys of one shortcut for this platform, each for a key cap of its own.
 *
 * @example
 *   tKeys(["⌘", "K"]).map((key) => <kbd key={key}>{key}</kbd>); // ⌘ K on macOS, Ctrl K on Windows
 */
export function tKeys(combo: readonly string[]): string[] {
  return isWindows() ? keyCaps(combo, keyNames()) : [...combo];
}
