//! Core logic for snapshots — create, load, restore, cherry-pick
#![allow(dead_code)]

use std::io::{Read, Write};
use std::path::Path;

use chrono::Utc;
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

use crate::error::{AppError, AppResult};
use crate::models::section::{Section, SnapshotSection};
use crate::models::snapshot::{Snapshot, SnapshotHeader};

use crate::core::song::{write_lyr_file, write_section};

// ══════════════════════════════════════════════════════════════════════
//  Public API
// ══════════════════════════════════════════════════════════════════════

/// Create a new snapshot inside an existing `.lyr` archive.
///
/// The snapshot captures the current state of every section. It is
/// serialized as JSON and appended to the archive at
/// `snapshots/{ulid}.json`.
///
/// Returns a lightweight [`SnapshotHeader`] (no section content).
pub async fn create_snapshot(
    path: &Path,
    sections: &[Section],
    note: Option<String>,
) -> AppResult<SnapshotHeader> {
    let now = Utc::now().to_rfc3339();
    let snapshot_id = ulid::Ulid::new().to_string();

    // Build full snapshot
    let snapshot = Snapshot {
        id: snapshot_id.clone(),
        created_at: now.clone(),
        created_by: None,
        note: note.clone(),
        sections: sections.iter().map(snapshot_section_from).collect(),
    };

    let snapshot_json = serde_json::to_string_pretty(&snapshot)?;
    let entry_name = format!("snapshots/{snapshot_id}.json");

    // Append to archive using copy-and-add strategy
    let tmp_path = path.with_extension("lyr.tmp");
    let result = do_append_snapshot(&tmp_path, path, &entry_name, snapshot_json.as_bytes());

    if result.is_err() {
        let _ = std::fs::remove_file(&tmp_path);
    } else {
        std::fs::rename(&tmp_path, path)?;
    }
    result?;

    Ok(SnapshotHeader {
        id: snapshot_id,
        created_at: now,
        created_by: None,
        note,
        section_count: sections.len() as u32,
    })
}

/// Load a full [`Snapshot`] (including all section content) from a `.lyr`
/// archive.
pub async fn load_snapshot(
    path: &Path,
    snapshot_id: &str,
) -> AppResult<Snapshot> {
    let file = std::fs::File::open(path)?;
    let mut archive = ZipArchive::new(file)?;

    let entry_name = format!("snapshots/{snapshot_id}.json");
    let mut entry = archive.by_name(&entry_name).map_err(|_| {
        AppError::SnapshotNotFound(snapshot_id.to_owned())
    })?;

    let mut buf = String::with_capacity(entry.size() as usize);
    entry.read_to_string(&mut buf)?;

    let snapshot: Snapshot = serde_json::from_str(&buf).map_err(|e| {
        AppError::Other(format!("{entry_name}: {e}"))
    })?;

    Ok(snapshot)
}

/// Restore an entire snapshot, replacing all live sections in the archive.
///
/// Each [`SnapshotSection`] is converted back to a [`Section`] with
/// `updated_at` set to now. The restored sections are written via
/// [`write_lyr_file`], which also preserves metadata, snapshots, and
/// comments.
///
/// # Note
///
/// This function reads the file twice: once to load the snapshot, and once
/// to read the current metadata before writing. For a single-user local
/// tool this is safe, but a future improvement is to accept `metadata` as
/// a parameter from the caller (which already holds it in the editor store),
/// eliminating the second read.
pub async fn restore_snapshot(
    path: &Path,
    snapshot_id: &str,
) -> AppResult<Vec<Section>> {
    let snapshot = load_snapshot(path, snapshot_id).await?;
    let now = Utc::now().to_rfc3339();

    let sections: Vec<Section> = snapshot
        .sections
        .iter()
        .map(|ss| section_from_snapshot(ss, &now))
        .collect();

    // Read current metadata so write_lyr_file doesn't clobber it.
    let payload = crate::core::song::read_lyr_file(path).await?;
    write_lyr_file(path, &payload.metadata, &sections).await?;

    Ok(sections)
}

/// Cherry-pick a single section from a snapshot, replacing only that
/// section in the live archive.
///
/// Returns the updated [`Section`].
pub async fn cherry_pick_section(
    path: &Path,
    snapshot_id: &str,
    section_id: &str,
) -> AppResult<Section> {
    let snapshot = load_snapshot(path, snapshot_id).await?;
    let now = Utc::now().to_rfc3339();

    let snap_section = snapshot
        .sections
        .iter()
        .find(|ss| ss.section_id == section_id)
        .ok_or_else(|| AppError::SectionNotFound(section_id.to_owned()))?;

    let section = section_from_snapshot(snap_section, &now);
    write_section(path, &section).await?;

    Ok(section)
}

// ══════════════════════════════════════════════════════════════════════
//  Internal helpers
// ══════════════════════════════════════════════════════════════════════

/// Convert a live [`Section`] into a [`SnapshotSection`] (drops timestamps).
fn snapshot_section_from(section: &Section) -> SnapshotSection {
    SnapshotSection {
        section_id: section.id.clone(),
        name: section.name.clone(),
        section_type: section.section_type.clone(),
        order: section.order,
        content: section.content.clone(),
    }
}

/// Convert a [`SnapshotSection`] back into a live [`Section`].
///
/// Since [`SnapshotSection`] carries no timestamps, both `created_at` and
/// `updated_at` are set to `now` (the time of the restore operation).
fn section_from_snapshot(ss: &SnapshotSection, now: &str) -> Section {
    Section {
        id: ss.section_id.clone(),
        name: ss.name.clone(),
        section_type: ss.section_type.clone(),
        order: ss.order,
        content: ss.content.clone(),
        created_at: now.to_owned(),
        updated_at: now.to_owned(),
    }
}

/// Copy all existing archive entries and append one new entry.
///
/// This is the "append" strategy for the zip crate, which doesn't support
/// true in-place append.
fn do_append_snapshot(
    tmp_path: &Path,
    src_path: &Path,
    entry_name: &str,
    data: &[u8],
) -> AppResult<()> {
    let src_file = std::fs::File::open(src_path)?;
    let mut src_archive = ZipArchive::new(src_file)?;

    let tmp_file = std::fs::File::create(tmp_path)?;
    let mut writer = ZipWriter::new(tmp_file);
    let opts = SimpleFileOptions::default();

    // Copy every existing entry
    for i in 0..src_archive.len() {
        let mut entry = src_archive.by_index(i)?;
        let name = entry.name().to_owned();

        let mut buf = Vec::with_capacity(entry.size() as usize);
        entry.read_to_end(&mut buf)?;

        if entry.is_dir() {
            writer.add_directory(&name, opts)?;
        } else {
            writer.start_file(&name, opts)?;
            writer.write_all(&buf)?;
        }
    }

    // Write the new snapshot entry
    writer.start_file(entry_name, opts)?;
    writer.write_all(data)?;

    writer.finish()?;
    Ok(())
}