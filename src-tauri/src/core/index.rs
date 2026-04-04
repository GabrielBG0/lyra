//! Core logic for index
#![allow(dead_code)]

use std::path::Path;

use sqlx::SqlitePool;

use crate::{error::AppResult, models::song::SongIndexEntry};

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
    let status = format!("{:?}", entry.status).to_lowercase();

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
        status,
        entry.bpm,
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
