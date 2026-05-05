//! Core logic for index
#![allow(dead_code)]

use std::path::Path;

use sqlx::{types::Json, FromRow, SqlitePool};

use crate::{
    error::AppResult,
    models::song::{SongIndexEntry, SongStatus},
};

#[derive(FromRow)]
pub struct SongDbRow {
    id: String,
    title: String,
    status: SongStatus,
    bpm: Option<i64>, // SQLite uses i64 for integers
    key_sig: Option<String>,
    genre: Json<Vec<String>>,
    mood: Json<Vec<String>>,
    language: Json<Vec<String>>,
    file_path: String,
    updated_at: String,
    created_at: String,
}

impl From<SongDbRow> for SongIndexEntry {
    fn from(row: SongDbRow) -> Self {
        Self {
            id: row.id,
            title: row.title,
            status: row.status,
            bpm: row.bpm.map(|b| b as u16),
            key_sig: row.key_sig,
            genre: row.genre.0,
            mood: row.mood.0,
            language: row.language.0,
            file_path: row.file_path,
            updated_at: row.updated_at,
            created_at: row.created_at,
        }
    }
}

pub async fn init_index(vault_path: &Path) -> AppResult<SqlitePool> {
    let index_path = vault_path.join(".lyrindex");
    let database_path = index_path.join("index.db");

    tokio::fs::create_dir_all(index_path).await?;

    let connection_string = format!(
        "sqlite://{}?mode=rwc",
        database_path.to_string_lossy().replace('\\', "/")
    );

    let pool = sqlx::sqlite::SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&connection_string)
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}

pub async fn upsert_song(pool: &SqlitePool, entry: &SongIndexEntry) -> AppResult<()> {
    let genre_json = serde_json::to_string(&entry.genre)?;
    let mood_json = serde_json::to_string(&entry.mood)?;
    let language_json = serde_json::to_string(&entry.language)?;
    let bpm_i64 = entry.bpm.map(|b| b as i64);

    sqlx::query!(
        r#"
        INSERT INTO songs (id, title, status, bpm, key_sig, genre, mood, language, file_path, updated_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(file_path) DO UPDATE SET
            id = excluded.id,
            title = excluded.title,
            status = excluded.status,
            bpm = excluded.bpm,
            key_sig = excluded.key_sig,
            genre = excluded.genre,
            mood = excluded.mood,
            language = excluded.language,
            updated_at = excluded.updated_at
        "#,
        entry.id,
        entry.title,
        entry.status,
        bpm_i64,
        entry.key_sig,
        genre_json,
        mood_json,
        language_json,
        entry.file_path,
        entry.updated_at,
        entry.created_at
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn remove_song(pool: &SqlitePool, file_path: &str) -> AppResult<()> {
    sqlx::query!(
        r#"
        DELETE FROM songs WHERE file_path = ?
        "#,
        file_path
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn list_songs(pool: &SqlitePool) -> AppResult<Vec<SongIndexEntry>> {
    let entries = sqlx::query_as!(
        SongDbRow,
        r#"
        SELECT
            id as "id!",
            title,
            status as "status: SongStatus",
            bpm,
            key_sig,
            genre as "genre: Json<Vec<String>>",
            mood as "mood: Json<Vec<String>>",
            language as "language: Json<Vec<String>>",
            file_path,
            updated_at,
            created_at
        FROM songs
        ORDER BY updated_at DESC
        "#
    )
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(Into::into)
    .collect();

    Ok(entries)
}

pub async fn get_song_by_path(
    pool: &SqlitePool,
    file_path: &str,
) -> AppResult<Option<SongIndexEntry>> {
    let result = sqlx::query_as!(
        SongDbRow,
        r#"
        SELECT
            id as "id!",
            title,
            status as "status: SongStatus",
            bpm,
            key_sig,
            genre as "genre: Json<Vec<String>>",
            mood as "mood: Json<Vec<String>>",
            language as "language: Json<Vec<String>>",
            file_path,
            updated_at,
            created_at
        FROM songs
        WHERE file_path = ?
        "#,
        file_path,
    )
    .fetch_optional(pool)
    .await?;

    Ok(result.map(Into::into))
}

pub async fn clear_index(pool: &SqlitePool) -> AppResult<()> {
    sqlx::query!("DELETE FROM songs").execute(pool).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::song::SongStatus;

    async fn test_pool() -> SqlitePool {
        let pool = sqlx::SqlitePool::connect("sqlite::memory:").await.unwrap();
        sqlx::migrate!("./migrations").run(&pool).await.unwrap();
        pool
    }

    fn make_entry(id: &str, title: &str, path: &str, updated_at: &str) -> SongIndexEntry {
        SongIndexEntry {
            id: id.to_owned(),
            title: title.to_owned(),
            status: SongStatus::Idea,
            bpm: None,
            key_sig: None,
            genre: vec![],
            mood: vec![],
            language: vec![],
            file_path: path.to_owned(),
            created_at: "2025-01-01T00:00:00Z".to_owned(),
            updated_at: updated_at.to_owned(),
        }
    }

    // ── upsert_song / list_songs ──────────────────────────────────────

    #[tokio::test]
    async fn upsert_song_and_list_songs_roundtrip() {
        let pool = test_pool().await;
        let entry = make_entry("id-1", "Blue Hour", "/vault/blue-hour.lyr", "2025-01-01T00:00:00Z");

        upsert_song(&pool, &entry).await.unwrap();

        let songs = list_songs(&pool).await.unwrap();
        assert_eq!(songs.len(), 1);
        assert_eq!(songs[0].title, "Blue Hour");
        assert_eq!(songs[0].file_path, "/vault/blue-hour.lyr");
    }

    #[tokio::test]
    async fn upsert_song_on_conflict_updates_existing_row() {
        let pool = test_pool().await;
        let entry = make_entry("id-1", "Original", "/vault/song.lyr", "2025-01-01T00:00:00Z");
        upsert_song(&pool, &entry).await.unwrap();

        let updated = make_entry("id-1", "Updated", "/vault/song.lyr", "2025-01-02T00:00:00Z");
        upsert_song(&pool, &updated).await.unwrap();

        let songs = list_songs(&pool).await.unwrap();
        assert_eq!(songs.len(), 1);
        assert_eq!(songs[0].title, "Updated");
    }

    #[tokio::test]
    async fn list_songs_ordered_newest_updated_at_first() {
        let pool = test_pool().await;

        upsert_song(&pool, &make_entry("a", "A", "/v/a.lyr", "2025-01-01T00:00:00Z"))
            .await
            .unwrap();
        upsert_song(&pool, &make_entry("b", "B", "/v/b.lyr", "2025-01-03T00:00:00Z"))
            .await
            .unwrap();
        upsert_song(&pool, &make_entry("c", "C", "/v/c.lyr", "2025-01-02T00:00:00Z"))
            .await
            .unwrap();

        let songs = list_songs(&pool).await.unwrap();

        assert_eq!(songs[0].id, "b"); // newest
        assert_eq!(songs[1].id, "c");
        assert_eq!(songs[2].id, "a"); // oldest
    }

    // ── remove_song ───────────────────────────────────────────────────

    #[tokio::test]
    async fn remove_song_deletes_the_correct_row() {
        let pool = test_pool().await;

        upsert_song(&pool, &make_entry("id-1", "Keep", "/v/keep.lyr", "2025-01-01T00:00:00Z"))
            .await
            .unwrap();
        upsert_song(&pool, &make_entry("id-2", "Delete", "/v/del.lyr", "2025-01-01T00:00:00Z"))
            .await
            .unwrap();

        remove_song(&pool, "/v/del.lyr").await.unwrap();

        let songs = list_songs(&pool).await.unwrap();
        assert_eq!(songs.len(), 1);
        assert_eq!(songs[0].id, "id-1");
    }

    #[tokio::test]
    async fn remove_song_nonexistent_path_is_a_no_op() {
        let pool = test_pool().await;

        let result = remove_song(&pool, "/does/not/exist.lyr").await;

        assert!(result.is_ok());
    }

    // ── get_song_by_path ──────────────────────────────────────────────

    #[tokio::test]
    async fn get_song_by_path_returns_correct_entry() {
        let pool = test_pool().await;
        let entry = make_entry("id-1", "Found", "/v/found.lyr", "2025-01-01T00:00:00Z");
        upsert_song(&pool, &entry).await.unwrap();

        let result = get_song_by_path(&pool, "/v/found.lyr").await.unwrap();

        assert!(result.is_some());
        assert_eq!(result.unwrap().title, "Found");
    }

    #[tokio::test]
    async fn get_song_by_path_missing_path_returns_none() {
        let pool = test_pool().await;

        let result = get_song_by_path(&pool, "/no/such/file.lyr").await.unwrap();

        assert!(result.is_none());
    }

    // ── clear_index ───────────────────────────────────────────────────

    #[tokio::test]
    async fn clear_index_removes_all_rows() {
        let pool = test_pool().await;

        upsert_song(&pool, &make_entry("a", "A", "/v/a.lyr", "2025-01-01T00:00:00Z"))
            .await
            .unwrap();
        upsert_song(&pool, &make_entry("b", "B", "/v/b.lyr", "2025-01-01T00:00:00Z"))
            .await
            .unwrap();

        clear_index(&pool).await.unwrap();

        let songs = list_songs(&pool).await.unwrap();
        assert!(songs.is_empty());
    }

    // ── init_index ────────────────────────────────────────────────────

    #[tokio::test]
    async fn init_index_creates_database_and_applies_migrations() {
        let dir = tempfile::TempDir::new().unwrap();

        let pool = init_index(dir.path()).await.unwrap();
        let songs = list_songs(&pool).await.unwrap();

        assert!(songs.is_empty()); // empty but table exists
        assert!(dir.path().join(".lyrindex").join("index.db").exists());
    }
}
