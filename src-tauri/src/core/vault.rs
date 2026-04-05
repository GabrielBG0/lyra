//! Core logic for vault
#![allow(dead_code)]

use std::{
    collections::HashSet,
    ffi::OsStr,
    path::{Path, PathBuf},
};

use crate::{
    core::{
        index::{get_song_by_path, list_songs, remove_song, upsert_song},
        song::read_lyr_file,
    },
    error::AppResult,
    models::song::SongIndexEntry,
};

use chrono::Utc;
use notify::{event, EventKind, Watcher};
use sqlx::SqlitePool;
use tauri::Emitter;

fn find_lyr_files_recursive(current_dir: &Path, files: &mut Vec<PathBuf>) -> AppResult<()> {
    let dir_entries = std::fs::read_dir(current_dir)?.filter_map(Result::ok);

    for entry in dir_entries {
        let file_type = entry.file_type()?;

        if file_type.is_dir() && entry.file_name() != ".lyrindex" {
            find_lyr_files_recursive(&entry.path(), files)?;
        } else if file_type.is_file() && entry.path().extension() == Some(OsStr::new("lyr")) {
            files.push(entry.path());
        }
    }

    Ok(())
}

fn find_lyr_files_flat(vault_path: &Path) -> AppResult<Vec<PathBuf>> {
    let files = std::fs::read_dir(vault_path)?
        .filter_map(Result::ok)
        .filter(|e| {
            e.file_type().map(|t| t.is_file()).unwrap_or(false)
                && e.path().extension() == Some(OsStr::new("lyr"))
        })
        .map(|e| e.path())
        .collect();

    Ok(files)
}

pub async fn scan_vault(vault_path: &Path, pool: &SqlitePool) -> AppResult<Vec<SongIndexEntry>> {
    let lyr_paths = find_lyr_files_flat(vault_path)?;

    let disk_paths: HashSet<String> = lyr_paths
        .iter()
        .map(|p| p.to_string_lossy().into_owned())
        .collect();

    for path in lyr_paths {
        let song_row = get_song_by_path(pool, &path.to_string_lossy()).await?;
        match song_row {
            None => {
                let song_payload = read_lyr_file(&path).await?;

                upsert_song(
                    pool,
                    &SongIndexEntry::from_payload(
                        song_payload,
                        path.to_string_lossy().into_owned(),
                    ),
                )
                .await?;
            }
            Some(song) => {
                let modified_at =
                    chrono::DateTime::<Utc>::from(std::fs::metadata(&path)?.modified()?)
                        .to_rfc3339();
                if modified_at != song.updated_at {
                    let updated_song = read_lyr_file(&path).await?;

                    upsert_song(
                        pool,
                        &SongIndexEntry::from_payload(
                            updated_song,
                            path.to_string_lossy().into_owned(),
                        ),
                    )
                    .await?;
                }
            }
        }
    }

    let db_songs = list_songs(pool).await?;

    for song in &db_songs {
        if !disk_paths.contains(&song.file_path) {
            remove_song(pool, &song.file_path).await?;
        }
    }

    let valid_songs = db_songs
        .into_iter()
        .filter(|song| disk_paths.contains(&song.file_path))
        .collect();

    Ok(valid_songs)
}

pub fn start_watcher(
    vault_path: PathBuf,
    pool: SqlitePool,
    app_handle: tauri::AppHandle,
) -> AppResult<()> {
    let (tx, rx) = std::sync::mpsc::channel();

    let mut watcher = notify::recommended_watcher(tx)?;

    watcher.watch(&vault_path, notify::RecursiveMode::NonRecursive)?;

    std::thread::spawn({
        move || {
            let _watcher = watcher;
            let mut last_seen = std::collections::HashMap::new();

            for raw_event in rx {
                match raw_event {
                    Ok(event) => match event.kind {
                        EventKind::Create(_) | EventKind::Modify(_) => {
                            for path in event.paths {
                                if path.extension().and_then(|s| s.to_str()) == Some("lyr")
                                    && !path.to_string_lossy().contains(".lyrindex")
                                {
                                    let now = std::time::Instant::now();
                                    if let Some(last) = last_seen.get(&path) {
                                        if now.duration_since(*last).as_millis() < 300 {
                                            continue;
                                        }
                                    }
                                    last_seen.insert(path.clone(), now);

                                    let pool_copy = pool.clone();
                                    let app_clone = app_handle.clone();

                                    tokio::spawn(async move {
                                        if let Err(e) =
                                            handle_file_upsert(path, pool_copy, app_clone).await
                                        {
                                            eprintln!("Failed to upsert file: {:?}", e);
                                        }
                                    });
                                }
                            }
                        }
                        EventKind::Remove(_) => {
                            for path in event.paths {
                                if path.extension().and_then(|s| s.to_str()) == Some("lyr")
                                    && !path.to_string_lossy().contains(".lyrindex")
                                {
                                    let pool_copy = pool.clone();
                                    let app_clone = app_handle.clone();

                                    tokio::spawn(async move {
                                        if let Err(e) =
                                            handle_file_remove(path, pool_copy, app_clone).await
                                        {
                                            eprintln!("Failed to remove file: {:?}", e);
                                        }
                                    });
                                }
                            }
                        }

                        EventKind::Modify(event::ModifyKind::Name(event::RenameMode::Both)) => {
                            if event.paths.len() == 2 {
                                let old_path = &event.paths[0];
                                let new_path = &event.paths[1];

                                let old_is_lyr =
                                    old_path.extension().and_then(|s| s.to_str()) == Some(".lyr");
                                let new_is_lyr =
                                    new_path.extension().and_then(|s| s.to_str()) == Some("lyr");

                                let old_in_vault =
                                    !old_path.to_string_lossy().contains(".lyrindex");
                                let new_in_vault =
                                    !new_path.to_string_lossy().contains(".lyrindex");

                                let pool_copy = pool.clone();
                                let app_clone = app_handle.clone();
                                let new_path = new_path.clone();
                                let old_path = old_path.clone();

                                tokio::spawn(async move {
                                    match (old_is_lyr && old_in_vault, new_is_lyr && new_in_vault) {
                                        (true, true) => {
                                            let _ = handle_file_remove(
                                                old_path,
                                                pool_copy.clone(),
                                                app_clone.clone(),
                                            )
                                            .await;
                                            let _ =
                                                handle_file_upsert(new_path, pool_copy, app_clone)
                                                    .await;
                                        }
                                        (true, false) => {
                                            let _ =
                                                handle_file_remove(old_path, pool_copy, app_clone)
                                                    .await;
                                        }

                                        (false, true) => {
                                            let _ =
                                                handle_file_upsert(new_path, pool_copy, app_clone)
                                                    .await;
                                        }
                                        _ => {}
                                    }
                                });
                            }
                        }

                        _ => {}
                    },
                    Err(e) => {
                        eprintln!("err {:?}", e)
                    }
                }
            }
        }
    });

    Ok(())
}

async fn handle_file_upsert(
    path: PathBuf,
    pool: SqlitePool,
    app_handle: tauri::AppHandle,
) -> AppResult<()> {
    let file = read_lyr_file(&path).await?;

    let song_index = SongIndexEntry::from_payload(file, path.to_string_lossy().into_owned());

    upsert_song(&pool, &song_index).await?;

    app_handle.emit("vault:song-updated", song_index)?;

    Ok(())
}

async fn handle_file_remove(
    path: PathBuf,
    pool: SqlitePool,
    app_handle: tauri::AppHandle,
) -> AppResult<()> {
    let song_path = path.to_string_lossy().to_owned();

    remove_song(&pool, &song_path).await?;

    app_handle.emit("vault:song-removed", &song_path)?;

    Ok(())
}
