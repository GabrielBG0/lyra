//! Ut
#![allow(dead_code)]

use std::path::{Path, PathBuf};

use crate::error::{AppError, AppResult};

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
