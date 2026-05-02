//! Tauri commands
#![allow(dead_code)]

use sqlx::SqlitePool;

use crate::core::config::AppConfig;

pub mod comment;
pub mod config;
pub mod debug;
pub mod diff;
pub mod export;
pub mod section;
pub mod snapshot;
pub mod song;
pub mod vault;

pub struct AppState {
    pub pool: std::sync::Mutex<SqlitePool>,
    pub config: std::sync::Mutex<AppConfig>,
}
