// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod commands;
pub mod core;
pub mod error;
pub mod models;

use std::path::Path;
use std::sync::Mutex;

use tauri::Manager;

use commands::AppState;
use core::config::{load_config, AppConfig};
use core::index::init_index;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();

            tauri::async_runtime::block_on(async move {
                let config = load_config().await.unwrap_or(AppConfig {
                    vault_path: None,
                    last_opened_song: None,
                });

                // Initialise the SQLite index if a vault path is already set;
                // fall back to an in-memory pool so the app starts cleanly on
                // first launch when no vault has been configured yet.
                let pool = if let Some(ref vault_path) = config.vault_path {
                    match init_index(Path::new(vault_path)).await {
                        Ok(p) => p,
                        Err(_) => sqlx::SqlitePool::connect("sqlite::memory:")
                            .await
                            .expect("failed to open fallback in-memory SQLite pool"),
                    }
                } else {
                    sqlx::SqlitePool::connect("sqlite::memory:")
                        .await
                        .expect("failed to open in-memory SQLite pool")
                };

                handle.manage(AppState {
                    pool,
                    config: Mutex::new(config),
                });
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            // comment
            commands::comment::add_comment,
            commands::comment::resolve_comment,
            commands::comment::list_comments,
            // config
            commands::config::get_config,
            commands::config::set_config,
            // diff
            commands::diff::diff_snapshots,
            commands::diff::diff_working_vs_snapshot,
            // export
            commands::export::export_plain_text,
            commands::export::export_pdf,
            // section
            commands::section::add_section,
            commands::section::delete_section,
            commands::section::reorder_sections,
            // snapshot
            commands::snapshot::create_snapshot,
            commands::snapshot::load_snapshot,
            commands::snapshot::restore_snapshot,
            commands::snapshot::cherry_pick_section,
            // song
            commands::song::open_song,
            commands::song::save_song,
            commands::song::create_song,
            commands::song::delete_song,
            // vault
            commands::vault::get_vault_path,
            commands::vault::set_vault_path,
            commands::vault::list_songs,
            commands::vault::rebuild_index,
            commands::vault::import_song,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
