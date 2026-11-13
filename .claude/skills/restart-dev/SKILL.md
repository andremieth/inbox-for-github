---
name: restart-dev
description: Restart the Inbox for GitHub dev window, or build the app. Use after adding React hooks, settings keys, store or schema changes, or src-tauri changes, or when the app shows the crash page after a hot reload.
---

# Restart the dev window or build the app

When it is needed: see `docs/reference/local-development.md` ("When the dev window needs a restart").

## Windows

Node from `.node-version` and `cargo` must be on the path (`docs/reference/windows.md`). In
PowerShell, from the checkout:

```powershell
# stop: the dev app of this checkout, then the Tauri CLI, cargo and Vite behind it
Get-Process inbox-for-github -ErrorAction SilentlyContinue | Where-Object Path -like '*\target\debug\*' | Stop-Process -Force
Get-CimInstance Win32_Process -Filter "Name = 'node.exe' OR Name = 'cargo.exe' OR Name = 'cmd.exe'" |
  Where-Object { $_.CommandLine -match 'tauri(\.js)?["'' ]+dev|vite\.js|cargo(\.exe)?["'' ]+run' -and $_.CommandLine -notmatch 'vitest' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
# start: detached, each run with a log file of its own
$log = Join-Path $env:TEMP "claude-inbox\tauri-dev-$(Get-Date -Format HHmmss).log"
New-Item -ItemType Directory -Force (Split-Path $log) | Out-Null
Start-Process cmd.exe -ArgumentList '/c', "npm run tauri dev > `"$log`" 2>&1" -WindowStyle Hidden
```

Then wait until `Get-Process inbox-for-github` shows the app with a path under `target\debug`
(the log then ends in ``Running `target\debug\inbox-for-github.exe` ``), and check the log for
`order of Hooks`, `TypeError`, `Unhandled error` or `no such column`. The log file is new per
run because a child of the stopped run can keep the old one open, and `cmd` then starts nothing.
`process didn't exit successfully … (exit code: 0xffffffff)` in the previous run's log is its
kill, not an error. The installed app may keep running next to the dev window.

Build the app (only when asked): `npm ci`, then `npm run tauri build -- --bundles nsis -- --locked`,
see `docs/releasing.md`.

## macOS

Restart (run the second command in the background):

```sh
pkill -f "target/debug/inbox-for-github"; pkill -f "tauri dev"; pkill -f vite
export PATH=/opt/homebrew/opt/rustup/bin:$PATH && npm run tauri dev > /tmp/claude-inbox/tauri-dev.log 2>&1
```

Then wait until the log shows `target/debug/inbox-for-github` and check it for
`order of Hooks`, `TypeError`, `Unhandled error` or `no such column`. An "exit code 144" from the
previous dev process is its kill, not an error.

Build the app (only when asked): `npm ci`, then `npm run tauri build -- --bundles app -- --locked`, see `docs/releasing.md`.
