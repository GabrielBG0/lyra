//! Data models for song
#![allow(dead_code)]

use crate::models::comment::Comment;
use crate::models::section::Section;
use crate::models::snapshot::SnapshotHeader;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SongMetadata {
    pub id: String, // ULID
    pub title: String,
    pub status: SongStatus,
    pub created_at: String, // ISO 8601
    pub updated_at: String,
    pub musical: MusicalInfo,
    pub tags: SongTags,
    pub album: AlbumRef,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicalInfo {
    pub key: Option<String>,
    pub bpm: Option<u16>,
    pub capo: Option<u8>,
    pub tuning: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SongTags {
    pub genre: Vec<String>,
    pub mood: Vec<String>,
    pub language: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlbumRef {
    pub album_id: Option<String>,
    pub track_number: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SongStatus {
    Idea,
    Draft,
    Demo,
    Finished,
}

// What open_song returns to the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SongPayload {
    pub metadata: SongMetadata,
    pub sections: Vec<Section>,
    pub snapshot_headers: Vec<SnapshotHeader>,
    pub comments: Vec<Comment>,
    pub file_path: String,
}

// What list_songs returns (index row, no content)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SongIndexEntry {
    pub id: String,
    pub title: String,
    pub status: SongStatus,
    pub bpm: Option<u16>,
    pub key_sig: Option<String>,
    pub genre: Vec<String>,
    pub file_path: String,
    pub created_at: String,
    pub updated_at: String,
}
