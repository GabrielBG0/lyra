//! Commands for config
#![allow(dead_code)]

use crate::{core::config::{load_config, save_config, AppConfig}, error::AppResult};

/// Return the current app config from disk.
#[tauri::command]
pub async fn get_config() -> AppResult<AppConfig> {
    load_config().await
}

/// Persist an updated app config to disk.
#[tauri::command]
pub async fn set_config(config: AppConfig) -> AppResult<()> {
    save_config(&config).await
}
