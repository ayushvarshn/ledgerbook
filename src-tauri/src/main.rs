//! Tauri main – spawns Python FastAPI backend and loads static UI

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use tauri::Manager; // for App.manage

fn find_repo_root() -> Option<PathBuf> {
    // Walk up from current exe to find a directory containing "backend/main.py"
    if let Ok(mut dir) = std::env::current_exe().map(|p| p.parent().unwrap_or(Path::new(".")).to_path_buf()) {
        for _ in 0..6 {
            let candidate = dir.join("backend").join("main.py");
            if candidate.exists() {
                return Some(dir);
            }
            if !dir.pop() { break; }
        }
    }
    None
}

fn spawn_backend_dev() -> Option<Child> {
    let repo_root = find_repo_root()?;
    let mut cmd = Command::new(if cfg!(target_os = "windows") { "python" } else { "python3" });
    cmd.args([
        "-m",
        "uvicorn",
        "backend.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8765",
    ])
    .current_dir(&repo_root)
    .stdin(Stdio::null())
    .stdout(Stdio::null())
    .stderr(Stdio::null());
    cmd.spawn().ok()
}

fn spawn_backend_prod(app: &tauri::App) -> Option<Child> {
    // In production, backend is bundled into resources via tauri.conf.json (../backend/**)
    let resolver = app.path_resolver();
    let resource_dir = resolver.resource_dir();
    let cwd = resource_dir.unwrap_or_else(|| std::env::current_dir().unwrap_or_default());
    let mut cmd = Command::new(if cfg!(target_os = "windows") { "python" } else { "python3" });
    cmd.args([
        "-m",
        "uvicorn",
        "backend.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8765",
    ])
    .current_dir(&cwd)
    .stdin(Stdio::null())
    .stdout(Stdio::null())
    .stderr(Stdio::null());
    cmd.spawn().ok()
}

pub struct BackendGuard(Option<Child>);
impl Drop for BackendGuard {
    fn drop(&mut self) {
        if let Some(child) = &mut self.0 {
            let _ = child.kill();
        }
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // spawn backend on startup
            let child = if cfg!(debug_assertions) {
                spawn_backend_dev()
            } else {
                spawn_backend_prod(app)
            };
            // store guard so it is killed on exit
            app.manage(BackendGuard(child));
            Ok(())
        })
        .on_window_event(|_event| {
            // handle window events if needed
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


