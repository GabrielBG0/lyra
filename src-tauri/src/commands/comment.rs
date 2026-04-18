//! Commands for comment
#![allow(dead_code)]

use std::path::PathBuf;

use crate::{core, error::AppResult, models::comment::Comment};

/// Add a new comment to a song file and return the persisted comment.
#[tauri::command]
pub async fn add_comment(
    path: String,
    section_id: String,
    snapshot_id: Option<String>,
    text: String,
) -> AppResult<Comment> {
    let path_buf = PathBuf::from(path);
    core::comment::add_comment(&path_buf, section_id, snapshot_id, text).await
}

/// Mark a comment as resolved.
#[tauri::command]
pub async fn resolve_comment(path: String, comment_id: String) -> AppResult<()> {
    let path_buf = PathBuf::from(path);
    core::comment::resolve_comment(&path_buf, &comment_id).await
}

/// Return all comments for a given section.
#[tauri::command]
pub async fn list_comments(path: String, section_id: String) -> AppResult<Vec<Comment>> {
    let path_buf = PathBuf::from(path);
    core::comment::list_comments(&path_buf, &section_id).await
}
