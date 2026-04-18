//! Commands for snapshot
#![allow(dead_code)]

use std::path::PathBuf;

use crate::{
    commands::AppState,
    core,
    error::AppResult,
    models::{
        section::Section,
        snapshot::{Snapshot, SnapshotHeader},
    },
};

#[tauri::command]
pub async fn create_snapshot(
    path: String,
    sections: Vec<Section>,
    note: Option<String>,
) -> AppResult<SnapshotHeader> {
    let path_buff = PathBuf::from(path);
    core::snapshot::create_snapshot(&path_buff, &sections, note).await
}

#[tauri::command]
pub async fn load_snapshot(path: String, snapshot_id: String) -> AppResult<Snapshot> {
    let path_buff = PathBuf::from(path);
    core::snapshot::load_snapshot(&path_buff, &snapshot_id).await
}

#[tauri::command]
pub async fn restore_snapshot(path: String, snapshot_id: String) -> AppResult<Vec<Section>> {
    let path_buff = PathBuf::from(path);
    core::snapshot::restore_snapshot(&path_buff, &snapshot_id).await
}

#[tauri::command]
pub async fn cherry_pick_section(
    path: String,
    snapshot_id: String,
    section_id: String,
) -> AppResult<Section> {
    let path_buff = PathBuf::from(path);
    core::snapshot::cherry_pick_section(&path_buff, &snapshot_id, &section_id).await
}
