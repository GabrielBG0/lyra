//! Data models for section
#![allow(dead_code)]

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Section {
    pub id: String, // ULID, stable identity
    pub name: String,
    pub section_type: SectionType,
    pub order: u32,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapshotSection {
    pub section_id: String,
    pub name: String,
    pub section_type: SectionType,
    pub order: u32,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum SectionType {
    Intro,
    Verse,
    PreChorus,
    Chorus,
    Bridge,
    Outro,
    Custom,
}
