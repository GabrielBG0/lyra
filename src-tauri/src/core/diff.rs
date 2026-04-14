//! Core logic for diff
#![allow(dead_code)]

use crate::models::diff::{DiffHunk, DiffStatus, HunkKind, SectionDiff};
use crate::models::section::{Section, SnapshotSection};
use crate::models::snapshot::Snapshot;
use similar::ChangeTag;
use std::collections::{HashMap, HashSet};

fn content_to_hunks(text: &str, kind: HunkKind) -> Vec<DiffHunk> {
    if text.is_empty() {
        return vec![];
    }

    vec![DiffHunk {
        kind,
        text: text.to_string(),
    }]
}

fn diff_section(old_text: &str, new_text: &str) -> Vec<DiffHunk> {
    let diff = similar::TextDiff::from_chars(old_text, new_text);
    let mut hunks: Vec<DiffHunk> = Vec::new();

    for change in diff.iter_all_changes() {
        let kind = match change.tag() {
            ChangeTag::Delete => HunkKind::Delete,
            ChangeTag::Equal => HunkKind::Equal,
            ChangeTag::Insert => HunkKind::Insert,
        };

        let text = change.value().to_string();

        if let Some(last) = hunks.last_mut() {
            if last.kind == kind {
                last.text.push_str(&text);
                continue;
            }
        }

        hunks.push(DiffHunk { kind, text });
    }

    hunks
}

pub fn diff_snapshots(snapshot_a: &Snapshot, snapshot_b: &Snapshot) -> Vec<SectionDiff> {
    let mut map_a = HashMap::new();
    for section in &snapshot_a.sections {
        map_a.insert(&section.section_id, section);
    }

    let mut map_b = HashMap::new();

    for section in &snapshot_b.sections {
        map_b.insert(&section.section_id, section);
    }

    let mut all_ids = HashSet::new();

    for id in map_a.keys() {
        all_ids.insert(*id);
    }

    for id in map_b.keys() {
        all_ids.insert(*id);
    }

    let mut diffs = Vec::new();

    for id in all_ids {
        match (map_a.get(id), map_b.get(id)) {
            (Some(a), None) => {
                let hunks = content_to_hunks(&a.content, HunkKind::Delete);
                diffs.push(SectionDiff {
                    section_id: a.section_id.to_string(),
                    name: a.name.to_string(),
                    status: DiffStatus::Removed,
                    hunks,
                });
            }
            (None, Some(b)) => {
                let hunks = content_to_hunks(&b.content, HunkKind::Insert);
                diffs.push(SectionDiff {
                    section_id: b.section_id.to_string(),
                    name: b.name.to_string(),
                    status: DiffStatus::Added,
                    hunks,
                });
            }
            (Some(a), Some(b)) => {
                let (status, hunks) = if a.content == b.content {
                    (DiffStatus::Equal, vec![])
                } else {
                    (DiffStatus::Changed, diff_section(&a.content, &b.content))
                };

                diffs.push(SectionDiff {
                    section_id: b.section_id.to_string(),
                    name: b.name.to_string(),
                    status,
                    hunks,
                });
            }
            (None, None) => unreachable!(),
        }
    }

    diffs.sort_by_key(|diff| {
        map_b
            .get(&diff.section_id)
            .map(|section| section.order)
            .unwrap_or_else(|| map_a.get(&diff.section_id).unwrap().order)
    });

    diffs
}

pub fn diff_working_vs_snapshot(
    live_sections: &[Section],
    snapshot: &Snapshot,
) -> Vec<SectionDiff> {
    let temp_snapshot_sections: Vec<SnapshotSection> = live_sections
        .iter()
        .map(|s| SnapshotSection {
            section_id: s.id.to_string(),
            name: s.name.to_string(),
            order: s.order,
            content: s.content.clone(),
            section_type: s.section_type.clone(),
        })
        .collect();

    let live_snapshot = Snapshot {
        id: "live_workspace".to_string(),
        created_at: String::new(),
        sections: temp_snapshot_sections,
        created_by: Some(String::new()),
        note: Some(String::new()),
    };

    diff_snapshots(snapshot, &live_snapshot)
}
