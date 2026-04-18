//! Utility class
#![allow(dead_code)]

use std::{
    collections::HashSet,
    io::{Read, Write},
    path::{Path, PathBuf},
};

use zip::{write::SimpleFileOptions, ZipArchive, ZipWriter};

use crate::{
    error::{AppError, AppResult},
    models::section::Section,
};

/// Find the first available `{stem}.lyr` path inside `vault_path`.
///
/// Tries `stem.lyr`, then `stem-2.lyr`, `stem-3.lyr`, etc.
pub fn find_available_path(vault_path: &Path, stem: &str) -> AppResult<PathBuf> {
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

/// Serialize a [`Section`] to TOML.
///
/// The `toml` crate's pretty printer automatically uses multiline strings
/// for values containing newlines, keeping section files human-readable
/// when opened in a text editor.
pub fn serialize_section(section: &Section) -> AppResult<String> {
    let toml_str = toml::to_string_pretty(section)
        .map_err(|e| AppError::Other(format!("sections/{}.toml serialization: {e}", section.id)))?;
    Ok(toml_str)
}

/// Sanitize a song title into a safe, lowercase, hyphenated filename stem.
///
/// `"Blue Hour"` → `"blue-hour"`
/// `"Don't Stop (Demo)"` → `"dont-stop-demo"`
pub fn sanitize_title(title: &str) -> String {
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

/// Copy every entry from `src` into `dst` **except** those whose names
/// appear in `skip`.
pub fn copy_entries_except(
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
