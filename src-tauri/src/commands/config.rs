//! Commands for config
#![allow(dead_code)]

use crate::{
    commands::AppState,
    core::config::{load_config, save_config, AppConfig},
    error::AppResult,
};

#[tauri::command]
pub async fn get_config() -> AppResult<AppConfig> {
    load_config().await
}

#[tauri::command]
pub async fn set_config(state: tauri::State<'_, AppState>, config: AppConfig) -> AppResult<()> {
    {
        let mut guard = state.config.lock().unwrap();
        *guard = config.clone();
    }
    save_config(&config).await
}
