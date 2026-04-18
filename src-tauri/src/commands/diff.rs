//! Commands for diff
#![allow(dead_code)]

use std::path::PathBuf;

use crate::{
    core::{self, snapshot::load_snapshot},
    error::AppResult,
    models::{diff::SectionDiff, section::Section},
};

#[tauri::command]
pub async fn diff_snapshots(
    path: String,
    snapshot_id_a: String,
    snapshot_id_b: String,
) -> AppResult<Vec<SectionDiff>> {
    let path_buff = PathBuf::from(path);

    let snapshot_a = load_snapshot(&path_buff, &snapshot_id_a).await?;
    let snapshot_b = load_snapshot(&path_buff, &snapshot_id_b).await?;

    Ok(core::diff::diff_snapshots(&snapshot_a, &snapshot_b))
}

#[tauri::command]
pub async fn diff_working_vs_snapshot(
    path: String,
    snapshot_id: String,
    sections: Vec<Section>,
) -> AppResult<Vec<SectionDiff>> {
    let path_buff = PathBuf::from(path);

    let snapshot = load_snapshot(&path_buff, &snapshot_id).await?;

    Ok(core::diff::diff_working_vs_snapshot(&sections, &snapshot))
}
