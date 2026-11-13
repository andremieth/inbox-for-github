//! What differs between the operating systems, behind one set of names: `macos.rs` and
//! `windows.rs` each define every item re-exported here. Only the host's file is compiled, so a
//! change to the other one is checked by a build on its own system alone.

use std::ffi::OsStr;
use std::process::Command;

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::*;
#[cfg(windows)]
mod windows;
#[cfg(windows)]
pub use windows::*;

/// CREATE_NO_WINDOW: the started process gets no console window.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// A command to run a console program quietly. Started from a windowed app, such a program
/// opens a console window on Windows unless CREATE_NO_WINDOW is set; its output is captured all
/// the same. Elsewhere this is `Command::new`.
pub fn command(program: impl AsRef<OsStr>) -> Command {
    let mut command = Command::new(program);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    command
}
