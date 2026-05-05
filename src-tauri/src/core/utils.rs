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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::make_section;

    // ── sanitize_title ────────────────────────────────────────────────

    #[test]
    fn sanitize_title_simple_words() {
        assert_eq!(sanitize_title("Blue Hour"), "blue-hour");
    }

    #[test]
    fn sanitize_title_special_chars_become_hyphens() {
        // Apostrophe between letters becomes its own hyphen: "don't" → "don-t"
        assert_eq!(sanitize_title("Don't Stop (Demo)"), "don-t-stop-demo");
    }

    #[test]
    fn sanitize_title_numbers_are_preserved() {
        assert_eq!(sanitize_title("Song 2024"), "song-2024");
    }

    #[test]
    fn sanitize_title_consecutive_separators_collapsed_to_one() {
        assert_eq!(sanitize_title("Hello  World"), "hello-world");
    }

    #[test]
    fn sanitize_title_leading_and_trailing_separators_stripped() {
        assert_eq!(sanitize_title("---hello---"), "hello");
    }

    #[test]
    fn sanitize_title_all_non_alphanumeric_returns_untitled() {
        assert_eq!(sanitize_title("---"), "untitled");
    }

    #[test]
    fn sanitize_title_empty_string_returns_untitled() {
        assert_eq!(sanitize_title(""), "untitled");
    }

    #[test]
    fn sanitize_title_unicode_letters_preserved() {
        // Rust's char::is_alphanumeric() accepts Unicode letters like 'é'
        assert_eq!(sanitize_title("Café"), "café");
    }

    #[test]
    fn sanitize_title_mixed_case_lowercased() {
        assert_eq!(sanitize_title("MY SONG"), "my-song");
    }

    // ── find_available_path ───────────────────────────────────────────

    #[test]
    fn find_available_path_returns_stem_when_no_collision() {
        let dir = tempfile::TempDir::new().unwrap();
        let path = find_available_path(dir.path(), "blue-hour").unwrap();
        assert_eq!(path, dir.path().join("blue-hour.lyr"));
    }

    #[test]
    fn find_available_path_increments_on_single_collision() {
        let dir = tempfile::TempDir::new().unwrap();
        std::fs::write(dir.path().join("blue-hour.lyr"), b"").unwrap();

        let path = find_available_path(dir.path(), "blue-hour").unwrap();
        assert_eq!(path, dir.path().join("blue-hour-2.lyr"));
    }

    #[test]
    fn find_available_path_keeps_incrementing_past_multiple_collisions() {
        let dir = tempfile::TempDir::new().unwrap();
        std::fs::write(dir.path().join("song.lyr"), b"").unwrap();
        std::fs::write(dir.path().join("song-2.lyr"), b"").unwrap();
        std::fs::write(dir.path().join("song-3.lyr"), b"").unwrap();

        let path = find_available_path(dir.path(), "song").unwrap();
        assert_eq!(path, dir.path().join("song-4.lyr"));
    }

    // ── serialize_section ─────────────────────────────────────────────

    #[test]
    fn serialize_section_roundtrip() {
        let section = make_section("abc123", "Chorus", 2, "First line\nSecond line");
        let toml_str = serialize_section(&section).unwrap();
        let parsed: crate::models::section::Section = toml::from_str(&toml_str).unwrap();

        assert_eq!(parsed.id, section.id);
        assert_eq!(parsed.name, section.name);
        assert_eq!(parsed.content, section.content);
        assert_eq!(parsed.order, section.order);
    }

    #[test]
    fn serialize_section_multiline_content_is_human_readable() {
        let section = make_section("id1", "Verse", 0, "Line one\nLine two\nLine three");
        let toml_str = serialize_section(&section).unwrap();

        // The toml crate uses a literal multiline string for values with newlines.
        assert!(toml_str.contains("'''") || toml_str.contains("\"\"\""),
            "expected multiline TOML string, got:\n{toml_str}");
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
