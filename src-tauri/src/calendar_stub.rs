//! Stand-ins for the calendar commands where there is no EventKit, that is everywhere but macOS.
//! They exist so the web view's calls find a command: the status says "unsupported", reads come
//! back empty and writes fail. The web view asks for none of them on Windows, see
//! `docs/reference/windows.md`.

const UNSUPPORTED: &str = "unsupported";

#[tauri::command]
pub fn calendar_authorized() -> bool {
    false
}

/// `"unsupported"`, next to macOS's `"granted"`, `"ask"` and `"denied"`.
#[tauri::command]
pub fn calendar_status() -> &'static str {
    UNSUPPORTED
}

#[tauri::command]
pub fn calendar_settings() -> Result<(), String> {
    Err(UNSUPPORTED.into())
}

#[tauri::command]
pub fn calendar_access() -> Result<bool, String> {
    Err(UNSUPPORTED.into())
}

#[tauri::command]
pub fn calendar_list() -> Vec<()> {
    Vec::new()
}

#[tauri::command]
pub fn calendar_events() -> Vec<()> {
    Vec::new()
}

#[tauri::command]
pub fn calendar_find() -> Vec<()> {
    Vec::new()
}

#[tauri::command]
pub fn calendar_put() -> Result<(), String> {
    Err(UNSUPPORTED.into())
}

#[tauri::command]
pub fn calendar_move() -> Result<(), String> {
    Err(UNSUPPORTED.into())
}

#[tauri::command]
pub fn calendar_remove() -> Result<(), String> {
    Err(UNSUPPORTED.into())
}

/// Nothing to watch without a calendar store.
pub fn watch(_app: tauri::AppHandle) {}
