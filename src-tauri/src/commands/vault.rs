//! Commands for vault
#![allow(dead_code)]

use std::ffi::OsStr;
use std::path::PathBuf;

use tauri::State;

use crate::core::index::{clear_index, upsert_song};
use crate::core::song::read_lyr_file;
use crate::core::vault::copy_into_vault;
use crate::error::AppError;
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
    let new_config = {
        let mut config_guard = state.config.lock().unwrap();
        config_guard.vault_path = Some(path);
        config_guard.clone()
    };

    save_config(&new_config).await?;

    let vault_path = PathBuf::from(new_config.vault_path.unwrap());
    scan_vault(&vault_path, &state.pool).await?;

    Ok(())
}

#[tauri::command]
pub async fn list_songs(state: tauri::State<'_, AppState>) -> AppResult<Vec<SongIndexEntry>> {
    index::list_songs(&state.pool).await
}

#[tauri::command]
pub async fn rebuild_index(state: State<'_, AppState>) -> AppResult<Vec<SongIndexEntry>> {
    let vault_path_str = {
        let config_guard = state.config.lock().unwrap();
        config_guard
            .vault_path
            .clone()
            .ok_or(AppError::VaultNotConfigured)?
    };

    let vault_path = PathBuf::from(vault_path_str);

    clear_index(&state.pool).await?;

    scan_vault(vault_path.as_path(), &state.pool).await
}

#[tauri::command]
pub async fn import_song(
    state: tauri::State<'_, AppState>,
    external_path_str: String,
) -> AppResult<SongIndexEntry> {
    let vault_path_str = {
        let config_guard = state.config.lock().unwrap();
        config_guard
            .vault_path
            .clone()
            .ok_or(AppError::VaultNotConfigured)?
    };

    let vault_path = PathBuf::from(vault_path_str);
    let source_path = PathBuf::from(external_path_str);

    if source_path.extension() != Some(OsStr::new("lyr")) {
        return Err(AppError::Other(
            "File selected is not a valid .lyr file!".to_string(),
        ));
    }

    let new_path = copy_into_vault(&vault_path, &source_path).await?;

    let payload = match read_lyr_file(&new_path).await {
        Ok(p) => p,
        Err(e) => {
            let _ = tokio::fs::remove_file(&new_path).await;
            return Err(e);
        }
    };

    let path_string = new_path.to_string_lossy().into_owned();
    let index_entry = SongIndexEntry::from_metadata(&payload.metadata, path_string);

    upsert_song(&state.pool, &index_entry).await?;

    Ok(index_entry)
}
