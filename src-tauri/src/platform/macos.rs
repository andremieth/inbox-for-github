//! macOS: where its tools are, and how the system is asked.

use std::path::PathBuf;

/// Apps started from Finder do not inherit the shell PATH, so `gh` is looked up in the usual install locations.
pub fn gh_candidates() -> Vec<PathBuf> {
    ["/opt/homebrew/bin/gh", "/usr/local/bin/gh", "gh"].into_iter().map(PathBuf::from).collect()
}

const ORCA_BUNDLE_ID: &str = "com.stablyai.orca";

/// Orca's command-line entry in its app bundle, see `docs/reference/orca.md`.
pub fn orca_cli() -> Result<PathBuf, String> {
    Ok(PathBuf::from("/Applications/Orca.app/Contents/Resources/bin/orca"))
}

/// Brings Orca's window to the front.
pub fn orca_activate() -> Result<(), String> {
    super::command("open").args(["-b", ORCA_BUNDLE_ID]).spawn().map(|_| ()).map_err(|e| e.to_string())
}

/// The app's builder; macOS adds nothing to it, as it starts an app only once by itself.
pub fn builder() -> tauri::Builder<tauri::Wry> {
    tauri::Builder::default()
}

/// Nothing to set up: the Dock icon is the way back to a hidden window, and ⌘Q the way out.
pub fn setup(_app: &tauri::AppHandle) -> tauri::Result<()> {
    Ok(())
}

/// macOS has no tray menu to label.
pub fn tray_labels(_app: &tauri::AppHandle, _open: &str, _quit: &str) -> Result<(), String> {
    Ok(())
}

/// The Mac's locale with its region (`defaults read -g AppleLocale`, e.g. "en_US@rg=dezzzz"),
/// as System Settings › Language & Region sets it.
pub fn system_locale() -> Result<String, String> {
    let output = super::command("defaults").args(["read", "-g", "AppleLocale"]).output().map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}
