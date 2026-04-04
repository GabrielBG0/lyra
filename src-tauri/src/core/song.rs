//! Core logic for song — .lyr archive reading, writing, and creation
#![allow(dead_code)]

use std::collections::HashSet;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use chrono::Utc;
use serde::{Deserialize, Serialize};
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

use crate::error::{AppError, AppResult};
use crate::models::comment::Comment;
use crate::models::section::{Section, SectionType};
use crate::models::snapshot::SnapshotHeader;
use crate::models::song::{
    AlbumRef, MusicalInfo, SongMetadata, SongPayload, SongStatus, SongTags,
};

// ---------- internal helpers ----------

/// The only format version we currently recognise.
const SUPPORTED_FORMAT_VERSION: u32 = 1;

/// Structure of `meta.json` at the ZIP root.
#[derive(Debug, Serialize, Deserialize)]
struct LyrMeta {
    lyr_format_version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    created_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    created_by: Option<String>,
}

/// Wrapper used to deserialize `comments.toml`, which is expected to be
/// a table with a single `comments` key containing an array of `Comment`.
#[derive(Debug, Serialize, Deserialize)]
struct CommentsFile {
    #[serde(default)]
    comments: Vec<Comment>,
}

/// Wrapper used to deserialize a snapshot JSON just enough to extract the
/// header fields and count sections without loading full content.
///
/// Snapshot filenames follow the pattern `{ISO-8601}_{slug}.json`,
/// e.g. `2025-03-01T14:22Z_first-draft.json`.
#[derive(Debug, Deserialize)]
struct SnapshotFile {
    created_at: String,
    created_by: Option<String>,
    note: Option<String>,
    #[serde(default)]
    sections: Vec<serde_json::Value>, // only need the count
}

// ---------- public API ----------

/// Open a `.lyr` ZIP archive and return a fully populated [`SongPayload`].
///
/// Reading order:
/// 1. `meta.json`  — validate format version
/// 2. `song.toml`  — parse into [`SongMetadata`]
/// 3. `sections/`  — each `{ulid}.toml` → [`Section`], sorted by `order`
/// 4. `snapshots/` — each `{ulid}.json` → [`SnapshotHeader`] (header only)
/// 5. `comments.toml` → `Vec<Comment>`
pub async fn read_lyr_file(path: &Path) -> AppResult<SongPayload> {
    // Open the ZIP synchronously — the file I/O is fast for small archives
    // and the zip crate doesn't offer async readers.
    let file = std::fs::File::open(path)?;
    let mut archive = ZipArchive::new(file)?;

    // ── 1. meta.json — format version gate ──────────────────────────
    let meta = read_entry_string(&mut archive, "meta.json")?;
    let meta: LyrMeta = serde_json::from_str(&meta)?;

    // Accept "1" or "1.0" — normalise to the major version for comparison.
    let major: u32 = meta
        .lyr_format_version
        .split('.')
        .next()
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);

    if major != SUPPORTED_FORMAT_VERSION {
        return Err(AppError::Other(format!(
            "unsupported format version: {} (expected {})",
            meta.lyr_format_version, SUPPORTED_FORMAT_VERSION
        )));
    }

    // ── 2. song.toml — metadata ─────────────────────────────────────
    let song_toml = read_entry_string(&mut archive, "song.toml")?;
    let metadata: SongMetadata = toml::from_str(&song_toml).map_err(|e| {
        AppError::Other(format!("song.toml: {e}"))
    })?;

    // ── 3. sections/ — collect entry names first, then parse ────────
    let section_names: Vec<String> = (0..archive.len())
        .filter_map(|i| {
            let entry = archive.by_index(i).ok()?;
            let name = entry.name().to_owned();
            if name.starts_with("sections/") && name.ends_with(".toml") {
                Some(name)
            } else {
                None
            }
        })
        .collect();

    let mut sections: Vec<Section> = Vec::with_capacity(section_names.len());
    for name in &section_names {
        let raw = read_entry_string(&mut archive, name)?;
        let section: Section = toml::from_str(&raw).map_err(|e| {
            AppError::Other(format!("{name}: {e}"))
        })?;
        sections.push(section);
    }
    sections.sort_by_key(|s| s.order);

    // ── 4. snapshots/ — header-only parse (JSON files) ───────────────
    let snapshot_names: Vec<String> = (0..archive.len())
        .filter_map(|i| {
            let entry = archive.by_index(i).ok()?;
            let name = entry.name().to_owned();
            if name.starts_with("snapshots/") && name.ends_with(".json") {
                Some(name)
            } else {
                None
            }
        })
        .collect();

    let mut snapshot_headers: Vec<SnapshotHeader> = Vec::with_capacity(snapshot_names.len());
    for name in &snapshot_names {
        let raw = read_entry_string(&mut archive, name)?;
        let snap: SnapshotFile = serde_json::from_str(&raw).map_err(|e| {
            AppError::Other(format!("{name}: {e}"))
        })?;

        // Derive the id from the filename stem:
        //   "snapshots/01HXKM5P8Q9R2S3T4U5V6W7X8Y.json" → "01HXKM5P8Q9R2S3T4U5V6W7X8Y"
        let id = name
            .strip_prefix("snapshots/")
            .and_then(|s| s.strip_suffix(".json"))
            .unwrap_or("")
            .to_owned();

        snapshot_headers.push(SnapshotHeader {
            id,
            created_at: snap.created_at,
            created_by: snap.created_by,
            note: snap.note,
            section_count: snap.sections.len() as u32,
        });
    }

    // Sort by id — ULID lexicographic order is chronological.
    snapshot_headers.sort_by(|a, b| a.id.cmp(&b.id));

    // ── 5. comments.toml (optional) ─────────────────────────────────
    let comments = match read_entry_string(&mut archive, "comments.toml") {
        Ok(raw) => {
            let file: CommentsFile = toml::from_str(&raw).map_err(|e| {
                AppError::Other(format!("comments.toml: {e}"))
            })?;
            file.comments
        }
        Err(_) => Vec::new(), // missing file → no comments
    };

    // ── Assemble payload ────────────────────────────────────────────
    Ok(SongPayload {
        metadata,
        sections,
        snapshot_headers,
        comments,
        file_path: path.to_string_lossy().into_owned(),
    })
}

/// Write (or overwrite) a `.lyr` ZIP archive atomically.
///
/// Strategy:
/// 1. Write to a temp file at `{path}.tmp`
/// 2. Copy **all** existing archive entries except `song.toml` and `sections/*.toml`
///    (preserves snapshots, comments, meta.json)
/// 3. Write the new `song.toml` from `metadata`
/// 4. Write each section as `sections/{id}.toml`
/// 5. Rename temp → final path (atomic on all target OSes)
/// 6. On any error, delete the temp file before returning
pub async fn write_lyr_file(
    path: &Path,
    metadata: &SongMetadata,
    sections: &[Section],
) -> AppResult<()> {
    let tmp_path = path.with_extension("lyr.tmp");

    // Build the set of entry names we will overwrite so we can skip them
    // when copying from the existing archive.
    let mut overwritten: HashSet<String> = HashSet::new();
    overwritten.insert("song.toml".to_owned());
    for s in sections {
        overwritten.insert(format!("sections/{}.toml", s.id));
    }

    let result = do_write_lyr(&tmp_path, path, metadata, sections, &overwritten);

    if result.is_err() {
        // Best-effort cleanup — ignore errors from remove_file.
        let _ = std::fs::remove_file(&tmp_path);
    } else {
        // Atomic rename: tmp → final.
        std::fs::rename(&tmp_path, path)?;
    }

    result
}

/// Update a single section inside an existing `.lyr` archive atomically.
///
/// This avoids re-serializing every section when only one has changed.
pub async fn write_section(
    path: &Path,
    section: &Section,
) -> AppResult<()> {
    let tmp_path = path.with_extension("lyr.tmp");

    let mut overwritten: HashSet<String> = HashSet::new();
    let entry_name = format!("sections/{}.toml", section.id);
    overwritten.insert(entry_name.clone());

    let result = do_write_section(&tmp_path, path, section, &entry_name, &overwritten);

    if result.is_err() {
        let _ = std::fs::remove_file(&tmp_path);
    } else {
        std::fs::rename(&tmp_path, path)?;
    }

    result
}

/// Create a brand-new, empty `.lyr` archive on disk.
///
/// 1. Generate a ULID for the song.
/// 2. Sanitize `title` into a safe filename (`blue-hour.lyr`).
///    If a collision exists, append `-2`, `-3`, etc.
/// 3. Write the full ZIP structure:
///    - `meta.json`  (format version, timestamp)
///    - `song.toml`  (title, status=idea, empty fields)
///    - `sections/{ulid}.toml` (one default "Verse 1")
///    - `snapshots/`  (empty directory)
///    - `comments.toml` (empty array)
/// 4. Return `(file_path, SongPayload)`.
///
/// On any write error the partially-written file is deleted before
/// returning, so no corrupt `.lyr` file is left on disk.
pub async fn create_lyr_file(
    vault_path: &Path,
    title: &str,
) -> AppResult<(PathBuf, SongPayload)> {
    let now = Utc::now().to_rfc3339();
    let song_id = ulid::Ulid::new().to_string();
    let section_id = ulid::Ulid::new().to_string();

    // ── Derive a safe filename ──────────────────────────────────────
    let base_stem = sanitize_title(title);
    let file_path = find_available_path(vault_path, &base_stem)?;

    // ── Build in-memory structures ──────────────────────────────────
    let metadata = SongMetadata {
        id: song_id,
        title: title.to_owned(),
        status: SongStatus::Idea,
        created_at: now.clone(),
        updated_at: now.clone(),
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
    };

    let default_section = Section {
        id: section_id,
        name: "Verse 1".to_owned(),
        section_type: SectionType::Verse,
        order: 1,
        content: String::new(),
        created_at: now.clone(),
        updated_at: now.clone(),
    };

    let sections = vec![default_section];

    // ── Write ZIP archive — clean up partial file on error ──────────
    let write_result = do_create_lyr(&file_path, &metadata, &sections, &now);

    if write_result.is_err() {
        // Best-effort cleanup: remove the partially-written file so it
        // doesn't appear as a corrupt entry on the next vault scan.
        let _ = std::fs::remove_file(&file_path);
        return Err(write_result.unwrap_err());
    }

    // ── Build return payload ────────────────────────────────────────
    let payload = SongPayload {
        metadata,
        sections,
        snapshot_headers: Vec::new(),
        comments: Vec::new(),
        file_path: file_path.to_string_lossy().into_owned(),
    };

    Ok((file_path, payload))
}

// ══════════════════════════════════════════════════════════════════════
//  Internal utilities
// ══════════════════════════════════════════════════════════════════════

/// Read a ZIP entry's full contents into a `String`.
fn read_entry_string(archive: &mut ZipArchive<std::fs::File>, name: &str) -> AppResult<String> {
    let mut entry = archive.by_name(name)?;
    let mut buf = String::with_capacity(entry.size() as usize);
    entry.read_to_string(&mut buf)?;
    Ok(buf)
}

/// Read a ZIP entry's full contents into a `Vec<u8>`.
fn read_entry_bytes(archive: &mut ZipArchive<std::fs::File>, name: &str) -> AppResult<Vec<u8>> {
    let mut entry = archive.by_name(name)?;
    let mut buf = Vec::with_capacity(entry.size() as usize);
    entry.read_to_end(&mut buf)?;
    Ok(buf)
}

// ---------- write internals ----------

/// Core implementation for [`write_lyr_file`]. Separated so the caller can
/// handle temp-file cleanup uniformly.
fn do_write_lyr(
    tmp_path: &Path,
    src_path: &Path,
    metadata: &SongMetadata,
    sections: &[Section],
    overwritten: &HashSet<String>,
) -> AppResult<()> {
    let tmp_file = std::fs::File::create(tmp_path)?;
    let mut writer = ZipWriter::new(tmp_file);
    let opts = SimpleFileOptions::default();

    // ── Copy existing entries that we are NOT overwriting ────────────
    if src_path.exists() {
        let src_file = std::fs::File::open(src_path)?;
        let mut src_archive = ZipArchive::new(src_file)?;

        copy_entries_except(&mut src_archive, &mut writer, overwritten, opts)?;
    }

    // ── Write song.toml ─────────────────────────────────────────────
    let song_toml = toml::to_string_pretty(metadata).map_err(|e| {
        AppError::Other(format!("song.toml serialization: {e}"))
    })?;
    writer.start_file("song.toml", opts)?;
    writer.write_all(song_toml.as_bytes())?;

    // ── Write sections/{id}.toml ────────────────────────────────────
    for section in sections {
        let entry_name = format!("sections/{}.toml", section.id);
        let section_toml = serialize_section(section)?;
        writer.start_file(entry_name, opts)?;
        writer.write_all(section_toml.as_bytes())?;
    }

    writer.finish()?;
    Ok(())
}

/// Core implementation for [`write_section`].
fn do_write_section(
    tmp_path: &Path,
    src_path: &Path,
    section: &Section,
    entry_name: &str,
    overwritten: &HashSet<String>,
) -> AppResult<()> {
    let src_file = std::fs::File::open(src_path)?;
    let mut src_archive = ZipArchive::new(src_file)?;

    let tmp_file = std::fs::File::create(tmp_path)?;
    let mut writer = ZipWriter::new(tmp_file);
    let opts = SimpleFileOptions::default();

    // ── Copy everything except the section we are replacing ─────────
    copy_entries_except(&mut src_archive, &mut writer, overwritten, opts)?;

    // ── Write the updated section ───────────────────────────────────
    let section_toml = serialize_section(section)?;
    writer.start_file(entry_name, opts)?;
    writer.write_all(section_toml.as_bytes())?;

    writer.finish()?;
    Ok(())
}

/// Core implementation for [`create_lyr_file`]. Separated so the caller
/// can handle partial-file cleanup uniformly.
fn do_create_lyr(
    file_path: &Path,
    metadata: &SongMetadata,
    sections: &[Section],
    now: &str,
) -> AppResult<()> {
    let file = std::fs::File::create(file_path)?;
    let mut writer = ZipWriter::new(file);
    let opts = SimpleFileOptions::default();

    // meta.json
    let meta = LyrMeta {
        lyr_format_version: "1.0".to_owned(),
        created_at: Some(now.to_owned()),
        created_by: None,
    };
    let meta_json = serde_json::to_string_pretty(&meta)?;
    writer.start_file("meta.json", opts)?;
    writer.write_all(meta_json.as_bytes())?;

    // song.toml
    let song_toml = toml::to_string_pretty(metadata).map_err(|e| {
        AppError::Other(format!("song.toml serialization: {e}"))
    })?;
    writer.start_file("song.toml", opts)?;
    writer.write_all(song_toml.as_bytes())?;

    // sections/{id}.toml
    for section in sections {
        let entry_name = format!("sections/{}.toml", section.id);
        let section_toml = serialize_section(section)?;
        writer.start_file(entry_name, opts)?;
        writer.write_all(section_toml.as_bytes())?;
    }

    // snapshots/ (empty directory)
    writer.add_directory("snapshots/", opts)?;

    // comments.toml (empty array)
    let comments_file = CommentsFile { comments: Vec::new() };
    let comments_toml = toml::to_string_pretty(&comments_file).map_err(|e| {
        AppError::Other(format!("comments.toml serialization: {e}"))
    })?;
    writer.start_file("comments.toml", opts)?;
    writer.write_all(comments_toml.as_bytes())?;

    writer.finish()?;
    Ok(())
}

/// Copy every entry from `src` into `dst` **except** those whose names
/// appear in `skip`.
fn copy_entries_except(
    src: &mut ZipArchive<std::fs::File>,
    dst: &mut ZipWriter<std::fs::File>,
    skip: &HashSet<String>,
    opts: SimpleFileOptions,
) -> AppResult<()> {
    for i in 0..src.len() {
        let mut entry = src.by_index(i)?;
        let name = entry.name().to_owned();

        if skip.contains(&name) {
            continue;
        }

        let mut buf = Vec::with_capacity(entry.size() as usize);
        entry.read_to_end(&mut buf)?;

        if entry.is_dir() {
            dst.add_directory(&name, opts)?;
        } else {
            dst.start_file(&name, opts)?;
            dst.write_all(&buf)?;
        }
    }
    Ok(())
}

/// Serialize a [`Section`] to TOML.
///
/// The `toml` crate's pretty printer automatically uses multiline strings
/// for values containing newlines, keeping section files human-readable
/// when opened in a text editor.
fn serialize_section(section: &Section) -> AppResult<String> {
    let toml_str = toml::to_string_pretty(section).map_err(|e| {
        AppError::Other(format!("sections/{}.toml serialization: {e}", section.id))
    })?;
    Ok(toml_str)
}

/// Sanitize a song title into a safe, lowercase, hyphenated filename stem.
///
/// `"Blue Hour"` → `"blue-hour"`
/// `"Don't Stop (Demo)"` → `"dont-stop-demo"`
fn sanitize_title(title: &str) -> String {
    let slug: String = title
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect();

    // Collapse consecutive hyphens and trim leading/trailing ones.
    let mut result = String::with_capacity(slug.len());
    let mut prev_hyphen = true; // start true to trim leading hyphens
    for c in slug.chars() {
        if c == '-' {
            if !prev_hyphen {
                result.push('-');
            }
            prev_hyphen = true;
        } else {
            result.push(c);
            prev_hyphen = false;
        }
    }
    // Trim trailing hyphen
    if result.ends_with('-') {
        result.pop();
    }

    if result.is_empty() {
        "untitled".to_owned()
    } else {
        result
    }
}

/// Find the first available `{stem}.lyr` path inside `vault_path`.
///
/// Tries `stem.lyr`, then `stem-2.lyr`, `stem-3.lyr`, etc.
fn find_available_path(vault_path: &Path, stem: &str) -> AppResult<PathBuf> {
    let first = vault_path.join(format!("{stem}.lyr"));
    if !first.exists() {
        return Ok(first);
    }

    for n in 2..=1000 {
        let candidate = vault_path.join(format!("{stem}-{n}.lyr"));
        if !candidate.exists() {
            return Ok(candidate);
        }
    }

    Err(AppError::FileExists(format!(
        "could not find an available filename for '{stem}.lyr'"
    )))
}