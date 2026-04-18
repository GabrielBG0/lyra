//! Commands for song
#![allow(dead_code)]

use std::path::PathBuf;

use tauri::State;

use crate::{
    commands::AppState,
    core::{
        index::{remove_song, upsert_song},
        song::{create_lyr_file, read_lyr_file, write_lyr_file},
    },
    error::{AppError, AppResult},
    models::{
        section::Section,
        song::{SongIndexEntry, SongMetadata, SongPayload},
    },
};

#[tauri::command]
pub async fn open_song(_state: State<'_, AppState>, path: String) -> AppResult<SongPayload> {
    let path_buff = PathBuf::from(&path);

    read_lyr_file(&path_buff).await
}

#[tauri::command]
pub async fn save_song(
    state: State<'_, AppState>,
    path: String,
    metadata: SongMetadata,
    sections: Vec<Section>,
) -> AppResult<()> {
    let path_buff = PathBuf::from(&path);

    write_lyr_file(&path_buff, &metadata, &sections).await?;

    let song_entry = SongIndexEntry::from_metadata(&metadata, path);
    let pool = state.pool.lock().unwrap().clone();
    upsert_song(&pool, &song_entry).await?;

    Ok(())
}

#[tauri::command]
pub async fn create_song(
    state: tauri::State<'_, AppState>,
    title: String,
) -> AppResult<SongPayload> {
    // 1. Safely extract the vault path
    let vault_path_str = {
        let config_guard = state.config.lock().unwrap();
        config_guard
            .vault_path
            .clone()
            .ok_or(AppError::VaultNotConfigured)?
    }; // Lock drops here automatically when the block ends

    let vault_path = PathBuf::from(vault_path_str);

    // 2. Delegate the heavy lifting to your core logic
    let (file_path, payload) = create_lyr_file(&vault_path, &title).await?;

    // 3. Map the data for the database index
    let path_string = file_path.to_string_lossy().into_owned();
    let index_entry = SongIndexEntry::from_metadata(&payload.metadata, path_string);

    // 4. Keep the Vault synchronized
    let pool = state.pool.lock().unwrap().clone();
    upsert_song(&pool, &index_entry).await?;

    // 5. Send it to React
    Ok(payload)
}

#[tauri::command]
pub async fn delete_song(state: State<'_, AppState>, path: String) -> AppResult<()> {
    let path_buff = PathBuf::from(&path);

    match std::fs::remove_file(&path_buff) {
        Ok(_) => {}
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
        Err(e) => return Err(AppError::Io(e)),
    }

    let pool = state.pool.lock().unwrap().clone();
    remove_song(&pool, &path).await?;

    Ok(())
}
