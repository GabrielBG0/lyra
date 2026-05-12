#![allow(dead_code)]

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub vault_path: Option<String>,
    pub last_opened_song: Option<String>,
    #[serde(default)]
    pub debug_mode: bool,
    #[serde(default)]
    pub nudge_dismissed: bool,
    #[serde(default)]
    pub tutorial_completed: bool,
    #[serde(default = "default_true")]
    pub select_name_on_focus: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            vault_path: None,
            last_opened_song: None,
            debug_mode: false,
            nudge_dismissed: false,
            tutorial_completed: false,
            select_name_on_focus: true,
        }
    }
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
    load_config_from(&config_path()?).await
}

pub async fn save_config(config: &AppConfig) -> AppResult<()> {
    save_config_to(&config_path()?, config).await
}

async fn load_config_from(path: &std::path::Path) -> AppResult<AppConfig> {
    if !path.exists() {
        return Ok(AppConfig::default());
    }

    let content = tokio::fs::read_to_string(path).await?;
    let config: AppConfig = toml::from_str(&content)?;

    Ok(config)
}

async fn save_config_to(path: &std::path::Path, config: &AppConfig) -> AppResult<()> {
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    let serial = toml::to_string_pretty(config)?;
    tokio::fs::write(path, serial).await?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn load_config_from_missing_file_returns_default() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("config.toml");

        let config = load_config_from(&path).await.unwrap();

        assert_eq!(config.vault_path, None);
        assert_eq!(config.last_opened_song, None);
        assert!(!config.debug_mode);
        assert!(!config.nudge_dismissed);
        assert!(!config.tutorial_completed);
    }

    #[tokio::test]
    async fn save_and_load_config_roundtrip() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("config.toml");

        let original = AppConfig {
            vault_path: Some("/my/vault".to_owned()),
            last_opened_song: Some("/my/vault/song.lyr".to_owned()),
            debug_mode: true,
            nudge_dismissed: true,
            tutorial_completed: false,
        };

        save_config_to(&path, &original).await.unwrap();
        let loaded = load_config_from(&path).await.unwrap();

        assert_eq!(loaded.vault_path, original.vault_path);
        assert_eq!(loaded.last_opened_song, original.last_opened_song);
        assert_eq!(loaded.debug_mode, original.debug_mode);
        assert_eq!(loaded.nudge_dismissed, original.nudge_dismissed);
        assert_eq!(loaded.tutorial_completed, original.tutorial_completed);
    }

    #[tokio::test]
    async fn save_config_creates_parent_directories() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("nested").join("deep").join("config.toml");

        save_config_to(&path, &AppConfig::default()).await.unwrap();

        assert!(path.exists());
    }

    #[tokio::test]
    async fn load_config_from_partial_toml_uses_field_defaults() {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("config.toml");

        tokio::fs::write(&path, r#"vault_path = "/some/vault""#)
            .await
            .unwrap();

        let config = load_config_from(&path).await.unwrap();

        assert_eq!(config.vault_path, Some("/some/vault".to_owned()));
        assert!(!config.debug_mode);
        assert!(!config.nudge_dismissed);
    }
}
