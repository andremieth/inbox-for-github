import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { t } from "./i18n";
import { isWindows } from "./platform";

/**
 * Puts the app's language on the tray menu of Windows, at start and whenever the language
 * changes: the shell builds that menu before any text is known and cannot translate it itself.
 * Does nothing on macOS, which has no tray menu. Call it after `setLang`.
 *
 * @example
 *   setLang(inbox.settings.language);
 *   useTrayLabels();
 */
export function useTrayLabels(): void {
  const open = t("tray.open");
  const quit = t("tray.quit");
  useEffect(() => {
    if (isWindows()) void invoke("tray_labels", { open, quit }).catch(() => undefined);
  }, [open, quit]);
}
