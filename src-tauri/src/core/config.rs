#![allow(dead_code)]

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppConfig {
    pub vault_path: Option<String>,
    pub last_opened_song: Option<String>,
    #[serde(default)]
    pub debug_mode: bool,
    #[serde(default)]
    pub nudge_dismissed: bool,
    #[serde(default)]
    pub tutorial_completed: bool,
}

fn config_path() -> AppResult<PathBuf> {
    let home_dir = dirs::home_dir()
        .ok_or_else(|| AppError::Other("Could not find home directory".to_owned()))?;

    #[cfg(target_os = "windows")]
    let config_dir = {
        // On Windows, prefer APPDATA env var over home dir
        std::env::var("APPDATA")
            .map(PathBuf::from)
            .unwrap_or_else(|_| home_dir.join("AppData").join("Roaming"))
            .join("lyra")
    };

    #[cfg(target_os = "macos")]
    let config_dir = home_dir
        .join("Library")
        .join("Application Support")
        .join("lyra");

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    let config_dir = home_dir.join(".config").join("lyra");

    Ok(config_dir.join("config.toml"))
}

pub async fn load_config() -> AppResult<AppConfig> {
    let path = config_path()?;

    if !path.exists() {
        return Ok(AppConfig::default());
    }

    let content = tokio::fs::read_to_string(&path).await?;
    let config: AppConfig = toml::from_str(&content)?;

    Ok(config)
}

pub async fn save_config(config: &AppConfig) -> AppResult<()> {
    let path = config_path()?;

    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    let serial = toml::to_string_pretty(config)?;

    tokio::fs::write(&path, serial).await?;

    Ok(())
}
