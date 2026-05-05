//! Data models for snapshot
#![allow(dead_code)]

use serde::{Deserialize, Serialize};

use crate::models::section::SnapshotSection;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Snapshot {
    pub id: String, // ULID
    pub created_at: String,
    pub created_by: Option<String>,
    pub note: Option<String>,
    pub sections: Vec<SnapshotSection>,
}

// Lightweight — used in timeline, no section content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapshotHeader {
    pub id: String,
    pub created_at: String,
    pub created_by: Option<String>,
    pub note: Option<String>,
    pub section_count: u32,
}
