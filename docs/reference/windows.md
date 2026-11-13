# Windows

What differs on Windows and the facts behind it. The app was built for macOS; this repository
adapts it. Everything that branches on the platform asks `src/ui/platform.ts` in the web view.

**Where the port stands (2026-11-10):** the web view and the shell are adapted. The shell
compiles on Windows, the dev window runs, and `npm run build:local:windows` builds and installs
the app. What was observed there is marked "seen" below; most of it was read out of the running
window by a script (see "Looking into the running window"). What a person has to look at, and
what no run has covered, is listed under "Not verified yet".

## Toolchain

Verified 2026-11-10 on Windows 11:

```powershell
winget install --id Schniz.fnm --exact --source winget       # Node versions; reads .node-version
fnm install 26
winget install --id Rustlang.Rustup --exact --source winget  # rustup 1.29.3, default host x86_64-pc-windows-msvc
rustup toolchain install                                     # in the checkout: the Rust of rust-toolchain.toml
winget install --id zizmor.zizmor --exact --source winget    # for changes in .github/
winget install --id rhysd.actionlint --exact --source winget
npm ci
```

`npm run typecheck`, `npm run lint` and `npm test` pass on Windows with Node 26. winget puts new
tools on the path of new terminals only.

Compiling the shell also needs Microsoft's C++ build tools with the workload "Desktop
development with C++", as [Tauri's prerequisites](https://v2.tauri.app/start/prerequisites/)
name it (read 2026-11-09):

```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools --exact --source winget --override "--quiet --wait --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

An installed Visual Studio 2022 serves as well once it has that workload
(`Microsoft.VisualStudio.Workload.NativeDesktop`); with the editor alone it has no linker. What
counts is the compiler component, and this prints a path when it is there (seen 2026-11-10):

```powershell
& "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
```

`cargo check --locked` in `src-tauri` then passes without a warning; the first run took about
six minutes, a release build seven (2026-11-10).

The Tauri CLI (2.12.4) rewrites the `tauri` entry of the Windows table in `Cargo.toml` on every
run, so that it names `macos-private-api` like the base entry, which follows `macOSPrivateApi`
in the config. The manifest is committed in that form, so a run leaves the checkout unchanged
(seen 2026-11-10).

## The platform in the web view

`platform()` is "windows" when the web view's user agent contains "Windows NT", else "mac".
Seen 2026-11-10 in the Tauri window, where WebView2 157 reports
`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36 Edg/157.0.0.0`.
A `platform=mac` or
`platform=windows` in the address wins, which is how the demo scripts show either look on any
machine. Without a window, as in the unit tests, it is "mac": Node has a `navigator` of its own
since version 21, so reading it there would make the tests depend on the machine. A test that
needs Windows calls `setPlatform("windows")` and sets it back afterwards.

`main.tsx` writes the platform to `<html data-platform>` for the styles.

## Keys

| | macOS | Windows |
|---|---|---|
| `mod+` in a binding | ⌘ | Ctrl |
| `ctrl+` in a binding | ⌃ | Alt |
| Picking several repositories in the sidebar | ⌘-click | Ctrl-click |
| Sending a comment | ⌘↵ | Ctrl+Enter |

`modifiersOf` (`src/ui/platform.ts`) reads both modifiers from a key or mouse event; every check
goes through it, so `App.tsx` binds each shortcut once. AltGr arrives as Ctrl and Alt together
and counts as neither; a key pressed with it is bound to nothing, so typing "@" or "€" on a
German keyboard triggers no shortcut, and Ctrl+Alt+D is not D.

Seen 2026-11-10 in the dev window: Ctrl+K opens the palette, Ctrl+, the settings and Ctrl+F the
app's search; Alt+A assigns and Ctrl+A does not; Ctrl+Z takes it back; D marks done and
Ctrl+Alt+D does nothing. Menus and tooltips read "Alt+U" and "Assign me (Alt+A)".

**Browser commands.** WebView2 acts on browser keys by default
(`AreBrowserAcceleratorKeysEnabled`): F5 and Ctrl+R reload the page, Ctrl+P prints, Ctrl+F and
F3 search, F7 offers caret browsing, Alt+← goes back. In a built app `main.tsx` calls
`preventDefault` on them (`isBrowserAccelerator`) in the capture phase, without stopping the
event, so the app's own Ctrl+R and Ctrl+F still run. The app's keys are on the list on purpose:
their bindings rest while a dialog is open, and Ctrl+R would then reload the app. The dev window
keeps the browser's keys, like it keeps the context menu. Seen 2026-11-10 in the installed app,
with the welcome dialog open: F5 and Ctrl+R, pressed through the system, leave the page loaded.

## Texts

The dictionaries and the code name shortcuts by the macOS glyphs everywhere. On Windows `t()`
writes them out with the key names of the text's language (`keys.windows.*`): "⌘R" reads
"Ctrl+R", in German "Strg+R"; "⇧⌘R" reads "Ctrl+Shift+R"; "⌘-click" reads "Ctrl-click". Labels
a component builds itself go through `tKey` and `tKeys`. No text exists twice for its shortcuts.

Seventeen texts read differently on Windows: fifteen name the Mac, macOS, the Dock, the Terminal
or a folder, and two texts of the help name the calendar: the event a plan keeps, and the key
that plans at a time. Their Windows wording is
in `enWindows` and `deWindows` next to the dictionaries (`src/ui/locales/`); `t()` prefers it on
Windows. The type `WindowsMessages` makes the German object carry exactly the English keys.
Three tests in `i18n.test.tsx` run texts through `t()` on Windows: every text fails on a glyph
or on "Mac", "macOS" or "Dock", the calendar's texts excepted, and every text of the help
(`help.*` and `keys.*`) on a mention of the calendar.

## Look

Windows has no vibrancy behind the sidebar, and the window is to keep its native title bar. So
under `[data-platform="windows"]` the sidebar and the body take `--bg`, opaque, and the padding
for the traffic lights goes. `--text-faint` on `--bg` is 5.0:1 in light and 5.2:1 in dark, and
4.6:1 and 4.7:1 under a hovered entry; `--surface` was tried first and fell to 4.48 and 4.09
there (computed 2026-11-10).

The sidebar starts 16 px wider on Windows, at 244 px (`initialWidth` in `useColumnWidths.ts`):
"Ctrl+K" in the search field measures 43.5 px where "⌘K" measures 29.2 px, and at the macOS
width the field's label broke into two lines (seen 2026-11-10 in the dev window).

## Badge

`setBadgeCount` is unsupported on Windows; the API's own note says to use `setOverlayIcon`
(`@tauri-apps/api` 2.12.4, `window.d.ts`). `showBadge` (`src/ui/badge.ts`) draws a red disc with
the count on a canvas, 16 CSS pixels times the device pixel ratio, and hands it over through
`Image.new`, which takes raw RGBA and needs no Cargo feature (`image.d.ts`: "does not decode an
image format, so it requires no extra Cargo feature"); PNG bytes would need `image-png`. The
shell has to grant `core:window:allow-set-overlay-icon`, which `core:window:default` does not
include; `capabilities/windows.json` does, and `showBadge` then succeeds in the Tauri window
(seen 2026-11-10). How the overlay looks on the taskbar is under "Not verified yet".

## Calendar

Off. Plans in the calendar rest on EventKit, and Windows has no store that reaches the user's
accounts without a login of the app's own (see [`decisions.md`](../decisions.md)).
`chosenCalendar` in `src/calendar.ts` answers "none" on Windows whatever the setting holds, and
every calendar feature asks it. The settings keys stay.

What was looked at, read 2026-11-10:

- Windows' appointments API: `AppointmentManager.RequestStoreAsync` lists the app capability
  `appointmentsSystem` under its Windows requirements
  ([Microsoft Learn](https://learn.microsoft.com/en-us/uwp/api/windows.applicationmodel.appointments.appointmentmanager.requeststoreasync));
  capabilities are declared in the manifest of an app package, which this app does not have.
- Outlook: Microsoft's
  [feature comparison](https://support.microsoft.com/en-us/outlook/getstarted/feature-comparison-between-new-outlook-and-classic-outlook)
  lists the Outlook Object Model as "Available" in classic Outlook and "Not supported" in the new
  one, so automation would reach only part of the users.
- Microsoft Graph reaches every Microsoft 365 calendar, but needs an app registration and a
  sign-in of the app's own.

## The shell

What differs per system is in `src-tauri/src/platform/`: `mod.rs` names the items, `macos.rs`
and `windows.rs` each define all of them, and only the host's file is compiled. The commands
stay in `lib.rs` and call into it.

Both files are compiled for every pull request: the workflow `Shell` runs `cargo check --locked`
on a macOS and a Windows runner. Its first run was the first time this tree was compiled on
macOS, and it passed (seen 2026-11-13). Running the macOS app built from here is under "Not
verified yet".

- **Dependencies per system.** The EventKit crates are macOS-only; Windows adds the `tray-icon`
  feature of `tauri`, `tauri-plugin-single-instance` and `windows-sys`. Checked 2026-11-10 with
  `cargo tree --locked --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`: the
  Windows tree holds no `objc2` crate, the macOS tree neither the tray icon nor the plugin.
- **Window.** `tauri.windows.conf.json` is laid over `tauri.conf.json` as a JSON Merge Patch, in
  which an array replaces the base's whole
  ([Tauri, configuration files](https://v2.tauri.app/develop/configuration-files/), read
  2026-11-09). Its window entry is therefore complete and leaves out what only macOS knows:
  the overlay title bar, the transparency and the vibrancy.
- **Refreshing in the background.** Upstream's window entry also sets
  `"backgroundThrottling": "disabled"`, without which WKWebView stops the refresh timer of a
  hidden window (see [`architecture.md`](architecture.md)). The Windows entry leaves it out:
  Tauri names the option unsupported on Windows (`tauri-utils` 2.10.2, `config.rs`), and wry
  0.57.0 reads it in `wkwebview/mod.rs` only, behind a `cfg` for macOS and iOS (both read
  2026-11-10). WebView2 needs no such switch for a timer of minutes. Seen 2026-11-10 in the
  installed app's log: with the window hidden in the tray, the refresh set to five minutes
  started three times in a row within a second of its time.
- **Data.** The database is `%APPDATA%\inbox-for-github\tracker.db`, the log folder
  `%LOCALAPPDATA%\inbox-for-github\logs\`
  ([Tauri, path](https://v2.tauri.app/reference/javascript/api/namespacepath/), read 2026-11-09;
  both seen 2026-11-10). Next to the logs is `EBWebView`, WebView2's user data folder.
- **Console programs.** A windowed app that starts `gh` or Orca's CLI gets a console window
  flashing up unless the process is created with CREATE_NO_WINDOW; `platform::command` sets it.
- **`gh`** is looked up on the PATH first, which a windowed app inherits on Windows, then in
  `%ProgramFiles%\GitHub CLI`, scoop's shims and chocolatey's `bin`. Seen 2026-11-10: the dev
  window got its token from the `gh` on the PATH.
- **Home folder.** `~` at the start of the repository folder becomes the user's home folder,
  before `/` and before `\`, and the path comes back with one kind of separator (seen
  2026-11-10).
- **Calendar.** Outside macOS the ten calendar commands are stand-ins (`calendar_stub.rs`): the
  status is "unsupported", reads come back empty, writes fail. A stand-in declares no parameters
  and still takes a call that passes the real command's (seen 2026-11-10).
- **Closing** hides the window on both systems. On Windows the app sits in the tray: a left
  click opens the window, the menu offers Open and Quit, labelled by the web view through
  `tray_labels`. A second start of the built app shows the first instance's window and ends.
  The dev build is left out of that: `tauri-plugin-single-instance` 2.5.5 names its lock after
  the bundle identifier (`<identifier>-sim`, read in its source 2026-11-10), which the dev build
  shares, and the dev window is to run next to the installed app. Seen 2026-11-10 in the
  installed app: closing hides the window and the process stays; a second start ends with exit
  code 0 and leaves the first window in front; the page of a hidden window reports no focus.
  The dev window and the installed app ran side by side.
- **Dates.** `GetUserDefaultLocaleName` gives the regional format as a BCP 47 tag ("de-DE"),
  which is not the display language (seen 2026-11-10: the command returns such a tag).
- **Orca** installs per user: its CLI is `%LOCALAPPDATA%\Programs\Orca\resources\bin\orca.exe`,
  and starting `Orca.exe` again brings its window forward (read in Orca's source, 2026-11-09:
  `getBundledLauncherPath` and the installer settings). Without Orca the call fails with
  "os error 3", the path that is missing, where macOS reports "os error 2"; `useOrca` takes any
  failure as "not installed" (seen 2026-11-10).

## Installer and releases

Windows bundles as an NSIS installer only: it needs no tools beyond the Tauri CLI and takes
prerelease versions. Read in the bundler's source (`tauri-bundler`, `nsis/` on branch `dev`,
2026-11-10):

- The file is `<product name>_<version>_x64-setup.exe` in
  `src-tauri/target/release/bundle/nsis/`.
- It installs for the current user into `%LOCALAPPDATA%\Inbox for GitHub`, without administrator
  rights.
- `/S` runs it silently; it then closes a running copy of the app through the Restart Manager
  without asking. `/R` starts the app after a silent install.
- The Start menu shortcut carries the bundle identifier as its AppUserModelID, which is what
  notifications are sent under.

Seen 2026-11-10 with `npm run build:local:windows`, as a prerelease version:

- The file name, the folder and the shortcut's AppUserModelID are as stated above. The folder
  holds `inbox-for-github.exe` and `uninstall.exe`; the program carries the prerelease version
  as its product and file version and no signature. The uninstall entry is in the current
  user's part of the registry. A silent install also puts a shortcut on the desktop.
- Over a running app whose window was hidden, the silent install took 12 seconds and ended with
  exit code 0; it closed the app and started the new one. The dev window kept running, although
  its program has the same file name, and the database was not touched.
- The path remap of the build script holds: a panic message of the built app named
  `/build\.cargo\registry\…`, not the home folder.
- In PowerShell, `Start-Process -Wait` on the installer does not return after `/R`: it waits for
  the app the installer started as well. The build script's `execFileSync` returns with the
  installer.

The installer is unsigned, so Windows SmartScreen warns on the first start of a download ("More
info", then "Run anyway"). `npm run build:local:windows` builds and installs a prerelease of
the checkout; releases are in [`releasing.md`](../releasing.md).

## Looking into the running window

WebView2 opens its DevTools protocol when the app is started with this variable set; the dev
window and the installed app both honor it:

```powershell
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = '--remote-debugging-port=9333'
```

`http://127.0.0.1:9333/json` then lists the page and its WebSocket address, over which
`Runtime.evaluate` reads anything the page knows. Three things to know (seen 2026-11-10):

- The dev window and the installed app share WebView2's user data folder. While one of them
  runs with browser arguments the other does not have, the one started second ends at once
  (exit code `0xc0000409`) with the panic "failed to create webview" and `HRESULT(0x8007139F)`.
  Stop the app that has the port before starting the other; without the variable both run.
- Key events sent over the protocol (`Input.dispatchKeyEvent`) do not pass through WebView2's
  own handling of browser keys, and they make `document.hasFocus()` answer true in a hidden
  window. For both questions, press the keys through the system and only read over the protocol.
- Once its window is hidden, the process names a 14×14 helper window as its main window (class
  `Tao Thread Event Target`). The app's window is the one of class `Tauri Window`; the tray's is
  `tray_icon_app`.

## Demo scripts

Both scripts find Chrome and Edge in their Windows folders and take a platform:

```powershell
$env:VITE_DEMO = "1"; npx vite    # in a terminal of its own
node scripts/demo-screenshots.mjs --out demo-screenshots --platform windows
```

Windows shots are named `windows-<lang>-<theme>-<view>.png` and carry no painted traffic lights.

## Not verified yet

What a person has to look at, and what no run has covered.
[`TESTING.md`](../../TESTING.md) has the list to go through.

- The window itself: the native title bar, the opaque sidebar, and that no console window
  flashes up when the app starts `gh`.
- The tray icon: how it looks at 16 px, the left click, and the menu in the app's language. Its
  window exists and `tray_labels` succeeds (2026-11-10); nobody has looked at it.
- The overlay icon on a real taskbar: its size at 100 % and 150 % scaling, that
  `setOverlayIcon()` without an image removes it, and that it is back after the window was
  hidden. The overlay belongs to the taskbar button, which a hidden window loses, and `tao`
  0.37.1 sets it once without watching for a new button (read in its source 2026-11-10), so
  `useAttention` sets it again when the window gets the focus.
- Notifications. `tauri-plugin-notification` 2.8.0 sends WinRT toasts through `notify-rust`
  under the bundle identifier (read in the `desktop.rs` of 2.7.0, which 2.8.0 carries unchanged,
  compared 2026-11-13) and notes "Only works for installed apps. Shows powershell name &
  icon in development" ([plugin page](https://v2.tauri.app/plugin/notification/), read
  2026-11-09). In the installed app the permission reads as granted and sending one raised no
  error (2026-11-10); how the toast looks and what a click on it does was not seen.
- Keys nothing was pressed for: Ctrl+P, Ctrl+wheel zoom, and whether an Alt+letter without a
  binding beeps.
- Orca's calls with Orca installed.
- Quitting from the tray, and that the window comes back at its last size and place.
- Uninstalling, and that the data stays.
- The macOS app built from this tree: it compiles (see "The shell"), but nobody has started it.
- A release: there is no workflow for a Windows release yet, only the local build
  ([`releasing.md`](../releasing.md)).
