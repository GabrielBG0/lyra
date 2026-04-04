#![allow(dead_code)]

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    vault_path: Option<String>,
    last_opened_song: Option<String>,
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
            .join("benzaiten")
    };

    #[cfg(target_os = "macos")]
    let config_dir = home
        .join("Library")
        .join("Application Support")
        .join("benzaiten");

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    let config_dir = home.join(".config").join("benzaiten");

    Ok(config_dir.join("config.toml"))
}

async fn load_config() -> AppResult<AppConfig> {
    let path = config_path()?;

    if !path.exists() {
        return Ok(AppConfig {
            vault_path: None,
            last_opened_song: None,
        });
    }

    let content = tokio::fs::read_to_string(&path).await?;
    let config: AppConfig = toml::from_str(&content)?;

    Ok(config)
}
