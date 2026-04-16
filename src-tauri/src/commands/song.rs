//! Commands for song
#![allow(dead_code)]

use std::path::PathBuf;

use sanitize_filename::sanitize;
use tauri::State;

use chrono::Utc;
use ulid::Ulid;

use crate::{
    commands::AppState,
    core::{
        index::upsert_song,
        song::{read_lyr_file, write_lyr_file},
    },
    error::{AppError, AppResult},
    models::{
        section::Section,
        song::{
            AlbumRef, MusicalInfo, SongIndexEntry, SongMetadata, SongPayload, SongStatus, SongTags,
        },
    },
};

#[tauri::command]
pub async fn open_song(state: State<'_, AppState>, path: String) -> AppResult<SongPayload> {
    let path_buff = PathBuf::from(&path);

    Ok(read_lyr_file(&path_buff).await?)
}

#[tauri::command]
pub async fn save_song(
    state: State<'_, AppState>,
    path: String,
    metadata: SongMetadata,
    sections: Vec<Section>,
) -> AppResult<()> {
    let path_buff = PathBuf::from(path);

    write_lyr_file(&path_buff, &metadata, &sections).await?;

    let song_entry = SongIndexEntry::from_metadata(&metadata, path);

    upsert_song(&state.pool, &song_entry).await?;

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
    upsert_song(&state.pool, &index_entry).await?;

    // 5. Send it to React
    Ok(payload)
}
