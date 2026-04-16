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
pub async fn create_song(state: State<'_, AppState>, title: String) -> AppResult<SongPayload> {
    let config_guard = state.config.lock().unwrap();

    let vault_path = PathBuf::from(
        config_guard
            .vault_path
            .clone()
            .ok_or(AppError::VaultNotConfigured)?,
    );

    drop(config_guard);

    let id = Ulid::new().to_string();
    let now = Utc::now().to_rfc3339();
    let safe_title = sanitize(&title);
    let file_name = safe_title + ".lyr";
    let full_path = vault_path.join(file_name);
    let path_string = full_path.to_string_lossy().into_owned();

    if full_path.exists() {
        return Err(AppError::FileExists(path_string));
    }

    let new_metadata = SongMetadata {
        id,
        title: title,
        status: SongStatus::Idea,
        created_at: now.clone(),
        updated_at: now,
        musical: MusicalInfo {
            key: None,
            bpm: None,
            capo: None,
            tuning: None,
        },
        tags: SongTags {
            genre: vec![],
            mood: vec![],
            language: vec![],
        },
        album: AlbumRef {
            album_id: None,
            track_number: None,
        },
    };

    let payload = SongPayload {
        metadata: new_metadata,
        sections: vec![],
        snapshot_headers: vec![],
        comments: vec![],
        file_path: path_string.clone(),
    };

    write_lyr_file(&full_path, &payload.metadata, &payload.sections).await?;

    let index_entry = SongIndexEntry::from_metadata(&payload.metadata, path_string);

    upsert_song(&state.pool, &index_entry).await?;

    Ok(payload)
}
