//! Data models for diff
#![allow(dead_code)]

use serde;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SectionDiff {
    pub section_id: String,
    pub name: String,
    pub status: DiffStatus,
    pub hunks: Vec<DiffHunk>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DiffStatus {
    Equal,
    Changed,
    Added,
    Removed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffHunk {
    pub kind: HunkKind,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum HunkKind {
    Equal,
    Insert,
    Delete,
}
