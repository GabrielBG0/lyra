//! Commands for diff
#![allow(dead_code)]

use crate::error::AppResult;
use crate::models::diff::{DiffHunk, DiffStatus, HunkKind, SectionDiff};
use crate::models::section::{Section, SnapshotSection};
use crate::models::snapshot::Snapshot;
use similar::{ChangeTag, TextDiff};
use std::collections::{HashMap, HashSet};

fn content_to_hunks(text: &str, kind: HunkKind) -> Vec<DiffHunk> {
    vec![DiffHunk {
        kind,
        text: text.to_string(),
    }]
}

fn diff_section(old_text: &str, new_text: &str) -> Vec<DiffHunk> {
    let diff = similar::TextDiff::from_chars(old_text, new_text);
    let mut hunks = Vec::new();

    for change in diff.iter_all_changes() {
        let kind = match change.tag() {
            ChangeTag::Delete => HunkKind::Delete,
            ChangeTag::Equal => HunkKind::Equal,
            ChangeTag::Insert => HunkKind::Insert,
        };

        hunks.push(DiffHunk {
            kind,
            text: change.value().to_string(),
        });
    }

    hunks
}
