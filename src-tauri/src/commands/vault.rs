//! Commands for vault
#![allow(dead_code)]

use std::path::PathBuf;

use crate::{commands::AppState, core::vault::scan_vault};

use crate::{
    core::{config::save_config, index},
    error::AppResult,
    models::song::SongIndexEntry,
};

#[tauri::command]
pub async fn get_vault_path(state: tauri::State<'_, AppState>) -> AppResult<Option<String>> {
    let config_guard = state.config.lock().unwrap();

    Ok(config_guard.vault_path.clone())
}

#[tauri::command]
pub async fn set_vault_path(state: tauri::State<'_, AppState>, path: String) -> AppResult<()> {
    let mut config_guard = state.config.lock().unwrap();

    config_guard.vault_path = Some(path);

    let new_config = config_guard.clone();

    drop(config_guard);

    save_config(&new_config).await?;

    let vault_path = PathBuf::from(new_config.vault_path.unwrap());
    scan_vault(&vault_path, &state.pool).await?;

    Ok(())
}

#[tauri::command]
pub async fn list_songs(state: tauri::State<'_, AppState>) -> AppResult<Vec<SongIndexEntry>> {
    index::list_songs(&state.pool).await
}
