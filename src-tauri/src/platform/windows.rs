//! Windows: where its tools are, and how the system is asked. See `docs/reference/windows.md`.

use std::path::PathBuf;
use tauri::menu::{MenuBuilder, MenuItem, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, Wry};
use windows_sys::Win32::Globalization::GetUserDefaultLocaleName;

/// `gh` by the PATH first, which a windowed app inherits here, then where its installers put
/// it: winget and the MSI, scoop, chocolatey.
pub fn gh_candidates() -> Vec<PathBuf> {
    let under = |var: &str, rest: &str| std::env::var_os(var).map(|base| PathBuf::from(base).join(rest));
    [
        Some(PathBuf::from("gh")),
        under("ProgramFiles", r"GitHub CLI\gh.exe"),
        under("USERPROFILE", r"scoop\shims\gh.exe"),
        under("ProgramData", r"chocolatey\bin\gh.exe"),
    ]
    .into_iter()
    .flatten()
    .collect()
}

/// Where Orca's installer puts it for the current user (electron-builder's default). An error
/// without LOCALAPPDATA, as the path would be relative then and name a program by chance.
fn orca_dir() -> Result<PathBuf, String> {
    let local = std::env::var_os("LOCALAPPDATA").ok_or("LOCALAPPDATA is not set")?;
    Ok(PathBuf::from(local).join(r"Programs\Orca"))
}

/// Orca's command-line entry next to its app, a launcher of its own on Windows.
pub fn orca_cli() -> Result<PathBuf, String> {
    Ok(orca_dir()?.join(r"resources\bin\orca.exe"))
}

/// Brings Orca's window to the front by starting Orca again: it runs once and hands a second
/// start over to the window that is open.
pub fn orca_activate() -> Result<(), String> {
    super::command(orca_dir()?.join("Orca.exe")).spawn().map(|_| ()).map_err(|e| e.to_string())
}

/// The app's builder with what only Windows needs. In a built app a second start brings the
/// window of the first one forward and ends: a hidden window invites starting the app again.
/// The dev build is left out: the lock goes by the bundle identifier, which both share, and the
/// dev window is to run next to the installed app.
pub fn builder() -> tauri::Builder<Wry> {
    let builder = tauri::Builder::default();
    if cfg!(debug_assertions) {
        return builder;
    }
    builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| crate::show_main_window(app)))
}

const TRAY_OPEN: &str = "open";
const TRAY_QUIT: &str = "quit";

/// The tray menu's entries, kept so `tray_labels` can put the app's language on them.
struct TrayMenu {
    open: MenuItem<Wry>,
    quit: MenuItem<Wry>,
}

/// Puts the app's icon into the tray, with a menu to open the window and to quit; a left click
/// opens the window. Closing the window only hides it (`run`), so the tray is the way back to
/// it and the way out of the app. The English labels show until the web view sends its own.
pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItemBuilder::with_id(TRAY_OPEN, "Open").build(app)?;
    let quit = MenuItemBuilder::with_id(TRAY_QUIT, "Quit").build(app)?;
    let menu = MenuBuilder::new(app).items(&[&open, &quit]).build()?;
    let mut tray = TrayIconBuilder::with_id("main")
        .tooltip(app.config().product_name.clone().unwrap_or_default())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            TRAY_OPEN => crate::show_main_window(app),
            TRAY_QUIT => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                crate::show_main_window(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    app.manage(TrayMenu { open, quit });
    Ok(())
}

/// Puts the app's language on the tray menu; the web view sends the texts once it knows them.
pub fn tray_labels(app: &AppHandle, open: &str, quit: &str) -> Result<(), String> {
    let menu = app.try_state::<TrayMenu>().ok_or("the tray menu is not set up")?;
    menu.open.set_text(open).and_then(|()| menu.quit.set_text(quit)).map_err(|e| e.to_string())
}

/// The longest locale name with its terminating NUL, in UTF-16 units (LOCALE_NAME_MAX_LENGTH in winnt.h).
const LOCALE_NAME_MAX_LENGTH: usize = 85;

/// The regional format as a BCP 47 tag ("de-DE", "en-US"), as Settings › Time & language ›
/// Language & region sets it. It is not the display language, which is all the web view knows.
pub fn system_locale() -> Result<String, String> {
    let mut name = [0u16; LOCALE_NAME_MAX_LENGTH];
    // SAFETY: the buffer is valid for the length passed, and the call writes no more than that.
    let written = unsafe { GetUserDefaultLocaleName(name.as_mut_ptr(), name.len() as i32) };
    // The count includes the terminating NUL; 0 is failure.
    match usize::try_from(written) {
        Ok(length) if length > 1 => Ok(String::from_utf16_lossy(&name[..length - 1])),
        _ => Err("Windows named no user locale".into()),
    }
}
