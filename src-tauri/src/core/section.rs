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
