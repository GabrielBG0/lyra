//! Debug commands — only functional when debug_mode is enabled at runtime.
#![allow(dead_code)]

use std::ffi::OsStr;
use std::path::PathBuf;

use crate::commands::AppState;
use crate::core::config::save_config;
use crate::core::index::init_index;
use crate::error::{AppError, AppResult};

#[tauri::command]
pub async fn nuke_vault(state: tauri::State<'_, AppState>) -> AppResult<()> {
    let vault_path_str = {
        let config = state.config.lock().unwrap();
        if !config.debug_mode {
            return Err(AppError::Other("debug mode is not enabled".to_string()));
        }
        config.vault_path.clone().ok_or(AppError::VaultNotConfigured)?
    };

    let vault_path = PathBuf::from(&vault_path_str);

    // Delete all .lyr files in the vault
    let mut dir = tokio::fs::read_dir(&vault_path).await?;
    while let Some(entry) = dir.next_entry().await? {
        let path = entry.path();
        if path.extension() == Some(OsStr::new("lyr")) {
            tokio::fs::remove_file(&path).await?;
        }
    }

    // Close the current pool, remove the db file, then reinitialise
    let old_pool = state.pool.lock().unwrap().clone();
    old_pool.close().await;

    let db_path = vault_path.join(".lyrindex").join("index.db");
    if db_path.exists() {
        tokio::fs::remove_file(&db_path).await?;
    }

    let new_pool = init_index(&vault_path).await?;
    *state.pool.lock().unwrap() = new_pool;

    // Clear last_opened_song from persisted config
    let updated = {
        let mut config = state.config.lock().unwrap();
        config.last_opened_song = None;
        config.clone()
    };
    save_config(&updated).await?;

    Ok(())
}

#[tauri::command]
pub async fn reset_app(state: tauri::State<'_, AppState>) -> AppResult<()> {
    let updated = {
        let mut config = state.config.lock().unwrap();
        if !config.debug_mode {
            return Err(AppError::Other("debug mode is not enabled".to_string()));
        }
        config.vault_path = None;
        config.last_opened_song = None;
        config.debug_mode = false;
        config.tutorial_completed = false;
        config.clone()
    };
    save_config(&updated).await?;
    Ok(())
}
