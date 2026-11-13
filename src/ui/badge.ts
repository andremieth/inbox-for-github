import { Image } from "@tauri-apps/api/image";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isWindows } from "./platform";

/** Beyond this the overlay shows a plain disc: three digits cannot be read at its size. */
const MAX_SHOWN = 99;
/** The edge of a taskbar overlay icon, in CSS pixels. */
const OVERLAY_SIZE = 16;
/** Fixed, as the overlay lies on the taskbar, where the app's theme does not apply: white on it is 5.4:1, it is 3:1 or more on a light and a dark taskbar. */
const FILL = "#cf222e";
/** How often `showBadge` was called, so a call can tell whether a newer one started meanwhile. */
let calls = 0;

/**
 * What the taskbar overlay shows for an unread count: the number up to 99, null for a plain disc
 * beyond that.
 *
 * @example
 *   badgeText(7); // "7"
 *   badgeText(120); // null
 */
export function badgeText(count: number): string | null {
  return count > MAX_SHOWN ? null : String(count);
}

/**
 * Draws the overlay: a red disc filling the canvas, with `text` in white when there is one.
 *
 * @param ctx   The canvas to draw on; whatever it held is cleared.
 * @param size  The canvas's edge in device pixels.
 * @param text  The count as `badgeText` gives it; null leaves the disc plain.
 *
 * @example
 *   drawBadge(canvas.getContext("2d")!, canvas.width, badgeText(7));
 */
export function drawBadge(ctx: CanvasRenderingContext2D, size: number, text: string | null): void {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = FILL;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
  ctx.fill();
  if (text === null) return;
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.round(size * (text.length > 1 ? 0.58 : 0.72))}px "Inter Variable", "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, size / 2, size * 0.54);
}

/**
 * Shows the unread count on the app's icon: the Dock badge on macOS; on Windows, whose taskbar
 * has no badge, a disc with the number laid over the taskbar button (see docs/reference/windows.md).
 * The image goes to the shell as raw pixels, which needs no image decoder there. Of calls that
 * overlap, the newest wins: an older one that is still handing its image over sets nothing.
 *
 * @param count  The number to show; undefined takes the badge away.
 *
 * @example
 *   await showBadge(unread.size > 0 ? unread.size : undefined);
 */
export async function showBadge(count: number | undefined): Promise<void> {
  const call = ++calls;
  const appWindow = getCurrentWindow();
  if (!isWindows()) return appWindow.setBadgeCount(count);
  if (count === undefined) return appWindow.setOverlayIcon();
  const size = Math.round(OVERLAY_SIZE * window.devicePixelRatio);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  drawBadge(ctx, size, badgeText(count));
  const image = await Image.new(new Uint8Array(ctx.getImageData(0, 0, size, size).data.buffer), size, size);
  try {
    if (call === calls) await appWindow.setOverlayIcon(image);
  } finally {
    await image.close();
  }
}
