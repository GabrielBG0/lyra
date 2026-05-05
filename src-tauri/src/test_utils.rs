//! Shared test fixtures and helpers.
//!
//! Only compiled under `#[cfg(test)]` — declared as such in `lib.rs`.

use std::{io::Write, path::Path};

use zip::{write::SimpleFileOptions, ZipWriter};

use crate::models::{
    section::{Section, SectionType, SnapshotSection},
    snapshot::Snapshot,
    song::{AlbumRef, MusicalInfo, SongMetadata, SongStatus, SongTags},
};

pub fn make_section(id: &str, name: &str, order: u32, content: &str) -> Section {
    Section {
        id: id.to_owned(),
        name: name.to_owned(),
        section_type: SectionType::Verse,
        order,
        content: content.to_owned(),
        created_at: "2025-01-01T00:00:00Z".to_owned(),
        updated_at: "2025-01-01T00:00:00Z".to_owned(),
    }
}

pub fn make_snapshot_section(id: &str, name: &str, order: u32, content: &str) -> SnapshotSection {
    SnapshotSection {
        section_id: id.to_owned(),
        name: name.to_owned(),
        section_type: SectionType::Verse,
        order,
        content: content.to_owned(),
    }
}

pub fn make_song_metadata(id: &str, title: &str) -> SongMetadata {
    SongMetadata {
        id: id.to_owned(),
        title: title.to_owned(),
        status: SongStatus::Idea,
        created_at: "2025-01-01T00:00:00Z".to_owned(),
        updated_at: "2025-01-01T00:00:00Z".to_owned(),
        musical: MusicalInfo {
            key: None,
            bpm: None,
            capo: None,
            tuning: None,
        },
        tags: SongTags {
            genre: Vec::new(),
            mood: Vec::new(),
            language: Vec::new(),
        },
        album: AlbumRef {
            album_id: None,
            track_number: None,
        },
    }
}

pub fn make_snapshot(id: &str, sections: Vec<SnapshotSection>) -> Snapshot {
    Snapshot {
        id: id.to_owned(),
        created_at: "2025-01-01T00:00:00Z".to_owned(),
        created_by: None,
        note: None,
        sections,
    }
}

/// Build a minimal valid `.lyr` archive at `path` with one section.
///
/// Uses direct ZIP writes to avoid coupling to private serialization details.
pub fn build_test_lyr(path: &Path, title: &str, section_id: &str) {
    let metadata = make_song_metadata("test-song-id", title);
    let section = make_section(section_id, "Verse 1", 1, "Hello world");

    let file = std::fs::File::create(path).unwrap();
    let mut writer = ZipWriter::new(file);
    let opts = SimpleFileOptions::default();

    writer.start_file("meta.json", opts).unwrap();
    writer.write_all(br#"{"lyr_format_version":"1.0"}"#).unwrap();

    let song_toml = toml::to_string_pretty(&metadata).unwrap();
    writer.start_file("song.toml", opts).unwrap();
    writer.write_all(song_toml.as_bytes()).unwrap();

    let section_toml = toml::to_string_pretty(&section).unwrap();
    writer
        .start_file(format!("sections/{}.toml", section.id), opts)
        .unwrap();
    writer.write_all(section_toml.as_bytes()).unwrap();

    writer.add_directory("snapshots/", opts).unwrap();

    writer.start_file("comments.toml", opts).unwrap();
    writer.write_all(b"comments = []\n").unwrap();

    writer.finish().unwrap();
}
