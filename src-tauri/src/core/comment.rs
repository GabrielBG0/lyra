//! Core logic for comment — read/write of `comments.toml` inside `.lyr` archives
#![allow(dead_code)]

use std::{collections::HashSet, io::Read, io::Write, path::Path};

use chrono::Utc;
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use zip::{write::SimpleFileOptions, ZipArchive, ZipWriter};

use crate::{
    core::utils::copy_entries_except,
    error::{AppError, AppResult},
    models::comment::Comment,
};

const COMMENTS_ENTRY: &str = "comments.toml";

/// TOML envelope for `comments.toml` — a single `comments` array.
#[derive(Debug, Serialize, Deserialize)]
struct CommentsFile {
    #[serde(default)]
    comments: Vec<Comment>,
}

// ── Public API ──────────────────────────────────────────────────────────────

/// Read all comments from a `.lyr` archive.
///
/// Returns an empty `Vec` if the file has no `comments.toml` (forward-compatible).
pub async fn read_comments(path: &Path) -> AppResult<Vec<Comment>> {
    let file = tokio::fs::File::open(path).await?.into_std().await;
    let mut archive = ZipArchive::new(file)?;

    let raw = match archive.by_name(COMMENTS_ENTRY) {
        Ok(mut entry) => {
            let mut buf = String::with_capacity(entry.size() as usize);
            entry.read_to_string(&mut buf)?;
            Some(buf)
        }
        Err(_) => None,
    };

    match raw {
        Some(buf) => {
            let cf: CommentsFile =
                toml::from_str(&buf).map_err(|e| AppError::Other(format!("comments.toml: {e}")))?;
            Ok(cf.comments)
        }
        None => Ok(Vec::new()),
    }
}

/// Add a new comment to the `.lyr` archive and return the persisted [`Comment`].
pub async fn add_comment(
    path: &Path,
    section_id: String,
    snapshot_id: Option<String>,
    text: String,
) -> AppResult<Comment> {
    let mut comments = read_comments(path).await?;

    let comment = Comment {
        id: Ulid::new().to_string(),
        section_id,
        snapshot_id,
        text,
        resolved: false,
        created_at: Utc::now().to_rfc3339(),
        created_by: None,
    };

    comments.push(comment.clone());
    write_comments(path, &comments).await?;

    Ok(comment)
}

/// Mark the comment identified by `comment_id` as resolved.
///
/// Returns `AppError::Other` if the id does not exist.
pub async fn resolve_comment(path: &Path, comment_id: &str) -> AppResult<()> {
    let mut comments = read_comments(path).await?;

    let target = comments
        .iter_mut()
        .find(|c| c.id == comment_id)
        .ok_or_else(|| AppError::Other(format!("comment not found: {comment_id}")))?;

    target.resolved = true;
    write_comments(path, &comments).await
}

/// Return all comments belonging to `section_id`.
pub async fn list_comments(path: &Path, section_id: &str) -> AppResult<Vec<Comment>> {
    let all = read_comments(path).await?;
    Ok(all
        .into_iter()
        .filter(|c| c.section_id == section_id)
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::song::create_lyr_file;
    use tempfile::TempDir;

    // ── read_comments ─────────────────────────────────────────────────

    #[tokio::test]
    async fn read_comments_on_fresh_song_returns_empty_vec() {
        let dir = TempDir::new().unwrap();
        let (path, _) = create_lyr_file(dir.path(), "Test").await.unwrap();

        let comments = read_comments(&path).await.unwrap();

        assert!(comments.is_empty());
    }

    // ── add_comment ───────────────────────────────────────────────────

    #[tokio::test]
    async fn add_comment_persists_and_is_readable() {
        let dir = TempDir::new().unwrap();
        let (path, _) = create_lyr_file(dir.path(), "Test").await.unwrap();

        add_comment(&path, "sec-1".to_owned(), None, "Great line!".to_owned())
            .await
            .unwrap();

        let comments = read_comments(&path).await.unwrap();

        assert_eq!(comments.len(), 1);
        assert_eq!(comments[0].section_id, "sec-1");
        assert_eq!(comments[0].text, "Great line!");
        assert!(!comments[0].resolved);
    }

    #[tokio::test]
    async fn add_comment_returns_correct_fields() {
        let dir = TempDir::new().unwrap();
        let (path, _) = create_lyr_file(dir.path(), "Test").await.unwrap();

        let comment = add_comment(
            &path,
            "sec-1".to_owned(),
            Some("snap-abc".to_owned()),
            "Nice!".to_owned(),
        )
        .await
        .unwrap();

        assert_eq!(comment.section_id, "sec-1");
        assert_eq!(comment.snapshot_id.as_deref(), Some("snap-abc"));
        assert_eq!(comment.text, "Nice!");
        assert!(!comment.resolved);
        assert!(!comment.id.is_empty());
    }

    #[tokio::test]
    async fn add_multiple_comments_all_persisted() {
        let dir = TempDir::new().unwrap();
        let (path, _) = create_lyr_file(dir.path(), "Test").await.unwrap();

        add_comment(&path, "s1".to_owned(), None, "First".to_owned())
            .await
            .unwrap();
        add_comment(&path, "s2".to_owned(), None, "Second".to_owned())
            .await
            .unwrap();

        let comments = read_comments(&path).await.unwrap();
        assert_eq!(comments.len(), 2);
    }

    // ── resolve_comment ───────────────────────────────────────────────

    #[tokio::test]
    async fn resolve_comment_marks_it_resolved() {
        let dir = TempDir::new().unwrap();
        let (path, _) = create_lyr_file(dir.path(), "Test").await.unwrap();

        let comment = add_comment(&path, "s1".to_owned(), None, "Fix this".to_owned())
            .await
            .unwrap();

        resolve_comment(&path, &comment.id).await.unwrap();

        let comments = read_comments(&path).await.unwrap();
        assert!(comments[0].resolved);
    }

    #[tokio::test]
    async fn resolve_comment_only_affects_target_comment() {
        let dir = TempDir::new().unwrap();
        let (path, _) = create_lyr_file(dir.path(), "Test").await.unwrap();

        let c1 = add_comment(&path, "s1".to_owned(), None, "One".to_owned())
            .await
            .unwrap();
        add_comment(&path, "s1".to_owned(), None, "Two".to_owned())
            .await
            .unwrap();

        resolve_comment(&path, &c1.id).await.unwrap();

        let comments = read_comments(&path).await.unwrap();
        let resolved_count = comments.iter().filter(|c| c.resolved).count();
        assert_eq!(resolved_count, 1);
        assert_eq!(comments.iter().find(|c| c.resolved).unwrap().id, c1.id);
    }

    #[tokio::test]
    async fn resolve_comment_with_unknown_id_returns_error() {
        let dir = TempDir::new().unwrap();
        let (path, _) = create_lyr_file(dir.path(), "Test").await.unwrap();

        let result = resolve_comment(&path, "no-such-id").await;

        assert!(result.is_err());
    }

    // ── list_comments ─────────────────────────────────────────────────

    #[tokio::test]
    async fn list_comments_filters_by_section_id() {
        let dir = TempDir::new().unwrap();
        let (path, _) = create_lyr_file(dir.path(), "Test").await.unwrap();

        add_comment(&path, "sec-a".to_owned(), None, "For A".to_owned())
            .await
            .unwrap();
        add_comment(&path, "sec-b".to_owned(), None, "For B".to_owned())
            .await
            .unwrap();
        add_comment(&path, "sec-a".to_owned(), None, "Also For A".to_owned())
            .await
            .unwrap();

        let a_comments = list_comments(&path, "sec-a").await.unwrap();
        let b_comments = list_comments(&path, "sec-b").await.unwrap();

        assert_eq!(a_comments.len(), 2);
        assert_eq!(b_comments.len(), 1);
        assert!(a_comments.iter().all(|c| c.section_id == "sec-a"));
    }

    #[tokio::test]
    async fn list_comments_unknown_section_returns_empty() {
        let dir = TempDir::new().unwrap();
        let (path, _) = create_lyr_file(dir.path(), "Test").await.unwrap();

        let comments = list_comments(&path, "no-such-section").await.unwrap();

        assert!(comments.is_empty());
    }
}

// ── Internal ────────────────────────────────────────────────────────────────

/// Atomically replace `comments.toml` inside the archive.
///
/// Write-to-temp-then-rename pattern — matches the convention used throughout
/// `core/section.rs` and `core/snapshot.rs`.
async fn write_comments(path: &Path, comments: &[Comment]) -> AppResult<()> {
    let tmp_path = path.with_extension("lyr.tmp");

    let mut skip: HashSet<String> = HashSet::new();
    skip.insert(COMMENTS_ENTRY.to_owned());

    let result = do_write_comments(&tmp_path, path, comments, &skip).await;

    if result.is_err() {
        let _ = tokio::fs::remove_file(&tmp_path).await;
    } else {
        tokio::fs::rename(&tmp_path, path).await?;
    }

    result
}

async fn do_write_comments(
    tmp_path: &Path,
    src_path: &Path,
    comments: &[Comment],
    skip: &HashSet<String>,
) -> AppResult<()> {
    let src_file = tokio::fs::File::open(src_path).await?.into_std().await;
    let mut src_archive = ZipArchive::new(src_file)?;

    let tmp_file = tokio::fs::File::create(tmp_path).await?.into_std().await;
    let mut writer = ZipWriter::new(tmp_file);
    let opts = SimpleFileOptions::default();

    // Copy every entry except the old comments.toml
    copy_entries_except(&mut src_archive, &mut writer, skip, opts)?;

    // Write the updated comments.toml
    let cf = CommentsFile {
        comments: comments.to_vec(),
    };
    let toml_str = toml::to_string_pretty(&cf)
        .map_err(|e| AppError::Other(format!("comments.toml serialization: {e}")))?;
    writer.start_file(COMMENTS_ENTRY, opts)?;
    writer.write_all(toml_str.as_bytes())?;

    writer.finish()?;
    Ok(())
}
