//! Commands for export
#![allow(dead_code)]

use std::path::PathBuf;

use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

use crate::{core, error::{AppError, AppResult}};

/// Show a native save dialog and write the song as plain text to the chosen path.
#[tauri::command]
pub async fn export_plain_text(
    app: tauri::AppHandle,
    path: String,
    include_history: bool,
) -> AppResult<()> {
    let text = core::export::export_plain_text(&PathBuf::from(&path), include_history).await?;

    let dest = app
        .dialog()
        .file()
        .add_filter("Text file", &["txt"])
        .blocking_save_file();

    if let Some(dest_path) = dest {
        let dest_path = dest_path
            .into_path()
            .map_err(|e| AppError::Other(e.to_string()))?;
        std::fs::write(&dest_path, text)?;
    }

    Ok(())
}

/// Write the song as printable HTML to a temp file and open it in the
/// system's default browser so the user can use the browser's print dialog.
#[tauri::command]
pub async fn export_pdf(
    app: tauri::AppHandle,
    path: String,
    include_history: bool,
) -> AppResult<()> {
    let html = core::export::export_html(&PathBuf::from(&path), include_history).await?;

    let temp_path = std::env::temp_dir().join("lyra_export_print.html");
    std::fs::write(&temp_path, html)?;

    app.opener()
        .open_path(temp_path.to_string_lossy().as_ref(), None::<&str>)
        .map_err(|e| AppError::Other(e.to_string()))?;

    Ok(())
}
