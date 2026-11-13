/**
 * The Windows counterpart of `build-local.mjs`: builds the current checkout as a prerelease and
 * installs it for the current user, so the app in daily use follows `main` between releases. No
 * file in the checkout changes: the version reaches Tauri as a `--config` override.
 *
 * The version follows the rule of `build-local.mjs`, which is repeated here and kept in step by
 * hand: the next patch after `package.json`, then `alpha.<commits since the last tag>`, e.g.
 * `0.4.1-alpha.2`; on a tagged commit without changes it stays the release's.
 *
 * Runs `npm ci` first when `package-lock.json` is newer than the installed packages, so the
 * build uses exactly the lock. Then it builds the NSIS installer and runs it silently (`/S`):
 * the installer closes a running copy of the installed app, replaces it in
 * `%LOCALAPPDATA%\Inbox for GitHub` and starts it again (`/R`). The dev window is not affected,
 * and the data under the bundle identifier `inbox-for-github` stays. The installer is unsigned.
 * Refuses unless this is Windows on x64 and `cargo` is on the path. See docs/reference/windows.md.
 *
 *   npm run build:local:windows              # build, install, start
 *   npm run build:local:windows -- --dry-run # print the version, then stop
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const dryRun = process.argv.includes("--dry-run");
const productName = "Inbox for GitHub";

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: "utf8", ...opts }).trim();
const show = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: "inherit", ...opts });
const fail = (message) => {
  console.error(`build:local:windows: ${message}`);
  process.exit(1);
};
const onPath = (cmd) => {
  try {
    run(cmd, ["--version"]);
    return true;
  } catch {
    return false;
  }
};

if (process.platform !== "win32" || process.arch !== "x64") fail("needs Windows on x64; on a Mac use build:local.");
if (!onPath("cargo")) fail("cargo is not on the path. Install Rust with rustup (see docs/reference/windows.md).");

const { version: released } = JSON.parse(readFileSync("package.json", "utf8"));
const tag = run("git", ["describe", "--tags", "--abbrev=0", "--match", "v*"]);
const ahead = Number(run("git", ["rev-list", "--count", `${tag}..HEAD`]));
const dirty = run("git", ["status", "--porcelain"]) !== "";
const sha = run("git", ["rev-parse", "--short", "HEAD"]) + (dirty ? ".dirty" : "");
const [major, minor, patch] = released.split(".").map(Number);
const version = ahead === 0 && !dirty ? released : `${major}.${minor}.${patch + 1}-alpha.${ahead}`;

console.log(`Version ${version} (${sha}), unsigned.`);
if (dryRun) process.exit(0);

// npm and the Tauri CLI are started through node: Node does not start a .cmd file without a shell, and a shell would mangle the JSON below
const npm = process.env.npm_execpath;
if (!npm) fail("run it through npm: npm run build:local:windows");
// npm ci empties node_modules, which would break a dev window running from this checkout
const installedLock = "node_modules/.package-lock.json";
if (!existsSync(installedLock) || statSync("package-lock.json").mtimeMs > statSync(installedLock).mtimeMs) {
  show(process.execPath, [npm, "ci"]);
}

show(process.execPath, [resolve("node_modules/@tauri-apps/cli/tauri.js"), "build", "--bundles", "nsis", "--config", JSON.stringify({ version }), "--", "--locked"], {
  env: {
    ...process.env,
    // Encoded, as a home folder may hold a space, which splits plain RUSTFLAGS; the more specific remap comes last and wins
    CARGO_ENCODED_RUSTFLAGS: [`--remap-path-prefix=${homedir()}=/build`, `--remap-path-prefix=${process.cwd()}=/src`].join("\x1f"),
  },
});
const setup = resolve(process.env.CARGO_TARGET_DIR ?? "src-tauri/target", "release/bundle/nsis", `${productName}_${version}_x64-setup.exe`);
if (!existsSync(setup)) fail(`the build left no installer at ${setup}.`);

show(setup, ["/S", "/R"]);
console.log(`Installed ${version} (${sha}) for the current user and started it.`);
