//! Data models for comment
#![allow(dead_code)]

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    pub id: String,
    pub section_id: String,
    pub snapshot_id: Option<String>,
    pub text: String,
    pub resolved: bool,
    pub created_at: String,
    pub created_by: Option<String>,
}
