//! Core logic for section
#![allow(dead_code)]

use std::{collections::HashSet, io::Write, path::Path};

use zip::{write::SimpleFileOptions, ZipArchive, ZipWriter};

use crate::{
    core::{
        self,
        utils::{copy_entries_except, serialize_section},
    },
    error::AppResult,
    models::section::Section,
};

/// Update a single section inside an existing `.lyr` archive atomically.
///
/// This avoids re-serializing every section when only one has changed.
pub async fn write_section(path: &Path, section: &Section) -> AppResult<()> {
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

pub async fn delete_section(path: &Path, section_id: &str) -> AppResult<()> {
    let temp_file = path.with_extension("lyr.tmp");
    let mut delete: HashSet<String> = HashSet::new();
    delete.insert(format!("sections/{}.toml", section_id));

    let result = do_delete_section(&temp_file, path, &delete);

    if result.is_err() {
        let _ = std::fs::remove_file(&temp_file);
    } else {
        std::fs::rename(&temp_file, path)?;
    }

    result
}

fn do_delete_section(
    tmp_path: &Path,
    src_path: &Path,
    excluded_entries: &HashSet<String>,
) -> AppResult<()> {
    let src_file = std::fs::File::open(src_path)?;
    let mut src_archive = ZipArchive::new(src_file)?;

    let tmp_file = std::fs::File::create(tmp_path)?;
    let mut writer = ZipWriter::new(tmp_file);
    let opts = SimpleFileOptions::default();

    copy_entries_except(&mut src_archive, &mut writer, excluded_entries, opts)?;

    writer.finish()?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        core::song::{create_lyr_file, read_lyr_file},
        test_utils::make_section,
    };
    use tempfile::TempDir;

    // ── write_section ─────────────────────────────────────────────────

    #[tokio::test]
    async fn write_section_updates_content_in_place() {
        let dir = TempDir::new().unwrap();
        let (path, payload) = create_lyr_file(dir.path(), "Test").await.unwrap();

        let mut updated = payload.sections[0].clone();
        updated.content = "New lyrics here".to_owned();
        write_section(&path, &updated).await.unwrap();

        let read_back = read_lyr_file(&path).await.unwrap();
        assert_eq!(read_back.sections[0].content, "New lyrics here");
    }

    #[tokio::test]
    async fn write_section_preserves_other_entries() {
        let dir = TempDir::new().unwrap();
        let (path, payload) = create_lyr_file(dir.path(), "Test").await.unwrap();

        // Add a second section via write_lyr_file, then update only the first
        let second = make_section("sec-two", "Bridge", 2, "bridge content");
        let sections = vec![payload.sections[0].clone(), second];
        crate::core::song::write_lyr_file(&path, &payload.metadata, &sections)
            .await
            .unwrap();

        let mut updated_first = sections[0].clone();
        updated_first.content = "changed".to_owned();
        write_section(&path, &updated_first).await.unwrap();

        let read_back = read_lyr_file(&path).await.unwrap();
        assert_eq!(read_back.sections.len(), 2);
        let bridge = read_back.sections.iter().find(|s| s.id == "sec-two").unwrap();
        assert_eq!(bridge.content, "bridge content");
    }

    // ── delete_section ────────────────────────────────────────────────

    #[tokio::test]
    async fn delete_section_removes_the_target_section() {
        let dir = TempDir::new().unwrap();
        let (path, payload) = create_lyr_file(dir.path(), "Test").await.unwrap();
        let second = make_section("to-delete", "Chorus", 2, "chorus");
        let sections = vec![payload.sections[0].clone(), second];
        crate::core::song::write_lyr_file(&path, &payload.metadata, &sections)
            .await
            .unwrap();

        delete_section(&path, "to-delete").await.unwrap();

        let read_back = read_lyr_file(&path).await.unwrap();
        assert_eq!(read_back.sections.len(), 1);
        assert!(read_back.sections.iter().all(|s| s.id != "to-delete"));
    }

    #[tokio::test]
    async fn delete_section_preserves_remaining_sections() {
        let dir = TempDir::new().unwrap();
        let (path, payload) = create_lyr_file(dir.path(), "Test").await.unwrap();
        let keeper = make_section("keeper", "Bridge", 2, "keep this");
        let sections = vec![payload.sections[0].clone(), keeper];
        crate::core::song::write_lyr_file(&path, &payload.metadata, &sections)
            .await
            .unwrap();

        delete_section(&path, &payload.sections[0].id).await.unwrap();

        let read_back = read_lyr_file(&path).await.unwrap();
        assert_eq!(read_back.sections.len(), 1);
        assert_eq!(read_back.sections[0].id, "keeper");
        assert_eq!(read_back.sections[0].content, "keep this");
    }

    // ── reorder_sections ──────────────────────────────────────────────

    #[tokio::test]
    async fn reorder_sections_assigns_order_by_position_in_id_list() {
        let dir = TempDir::new().unwrap();
        let (path, payload) = create_lyr_file(dir.path(), "Test").await.unwrap();

        let s1 = payload.sections[0].clone();
        let s2 = make_section("sec-b", "Chorus", 99, "chorus");
        let s3 = make_section("sec-c", "Bridge", 99, "bridge");
        crate::core::song::write_lyr_file(&path, &payload.metadata, &[s1, s2, s3])
            .await
            .unwrap();

        // Put them in reverse order
        reorder_sections(&path, vec![
            "sec-c".to_owned(),
            "sec-b".to_owned(),
            payload.sections[0].id.clone(),
        ])
        .await
        .unwrap();

        let read_back = read_lyr_file(&path).await.unwrap();
        let by_order: Vec<_> = {
            let mut v = read_back.sections;
            v.sort_by_key(|s| s.order);
            v
        };

        assert_eq!(by_order[0].id, "sec-c");
        assert_eq!(by_order[1].id, "sec-b");
        assert_eq!(by_order[2].id, payload.sections[0].id);
    }
}

pub async fn reorder_sections(path: &Path, ordered_ids: Vec<String>) -> AppResult<()> {
    let mut payload = core::song::read_lyr_file(path).await?;

    for section in payload.sections.iter_mut() {
        let found_index = ordered_ids.iter().position(|id| id == &section.id);

        if let Some(new_index) = found_index {
            section.order = new_index as u32;
        }
    }

    core::song::write_lyr_file(path, &payload.metadata, &payload.sections).await?;

    Ok(())
}
