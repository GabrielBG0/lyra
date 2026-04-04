#![allow(dead_code)]

use serde::{Deserialize, Serialize};    

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    vault_path: Option<String>,
    last_opened_song: Option<String>,
}



