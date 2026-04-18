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
    genre: Json<Vec<String>>, // sqlx will automatically parse the JSON string!
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
    let bpm_i64 = entry.bpm.map(|b| b as i64);

    sqlx::query!(
        r#"
        INSERT INTO songs (id, title, status, bpm, key_sig, genre, file_path, updated_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(file_path) DO UPDATE SET
            id = excluded.id,
            title = excluded.title,
            status = excluded.status,
            bpm = excluded.bpm,
            key_sig = excluded.key_sig,
            genre = excluded.genre,
            updated_at = excluded.updated_at
        "#,
        entry.id,
        entry.title,
        entry.status, // Assumes SongStatus has #[derive(sqlx::Type)]
        bpm_i64,
        entry.key_sig,
        genre_json,
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
        SongDbRow, // Tell the macro to build this struct
        r#"
        SELECT 
            id as "id!", 
            title, 
            status as "status: SongStatus",
            bpm, 
            key_sig, 
            genre as "genre: Json<Vec<String>>", -- Tell the macro about our wrapper
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
    .map(Into::into) // This automatically calls the From trait we wrote above!
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

    // If we got a row, convert it using `.map(Into::into)`
    Ok(result.map(Into::into))
}

pub async fn clear_index(pool: &SqlitePool) -> AppResult<()> {
    sqlx::query!("DELETE FROM songs").execute(pool).await?;
    Ok(())
}
