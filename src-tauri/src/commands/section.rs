//! Commands for section
#![allow(dead_code)]

use std::path::PathBuf;

use chrono::Utc;
use ulid::Ulid;

use crate::{
    core,
    error::AppResult,
    models::section::{Section, SectionType},
};

#[tauri::command]
pub async fn add_section(
    path: String,
    section_type: SectionType,
    name: String,
    order: u32,
) -> AppResult<Section> {
    let path_buff = PathBuf::from(path);
    let now = Utc::now().to_rfc3339();

    let section = Section {
        id: Ulid::new().to_string(),
        name,
        section_type,
        order,
        content: String::new(),
        created_at: now.clone(),
        updated_at: now,
    };

    core::section::write_section(&path_buff, &section).await?;

    Ok(section)
}

#[tauri::command]
pub async fn delete_section(path: String, section_id: String) -> AppResult<()> {
    let path_buff = PathBuf::from(path);
    core::section::delete_section(&path_buff, section_id.as_str()).await
}

#[tauri::command]
pub async fn reorder_sections(path: String, ordered_ids: Vec<String>) -> AppResult<()> {
    let path_buff = PathBuf::from(path);
    core::section::reorder_sections(&path_buff, ordered_ids).await
}
