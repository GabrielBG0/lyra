//! Commands for export
#![allow(dead_code)]

use std::path::PathBuf;

use crate::{core, error::AppResult};

/// Export the song as a plain-text string.
///
/// When `include_history` is `true`, every snapshot is appended after the
/// main content, oldest first.
#[tauri::command]
pub async fn export_plain_text(path: String, include_history: bool) -> AppResult<String> {
    let path_buf = PathBuf::from(path);
    core::export::export_plain_text(&path_buf, include_history).await
}

/// Export the song as a printable HTML string.
///
/// The frontend is expected to open this in a Tauri webview window and call
/// `window.print()` — no Rust PDF dependency is required for MVP.
#[tauri::command]
pub async fn export_pdf(path: String, include_history: bool) -> AppResult<String> {
    let path_buf = PathBuf::from(path);
    core::export::export_html(&path_buf, include_history).await
}
