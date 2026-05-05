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
                let content_changed = a.content != b.content;
                let metadata_changed =
                    a.name != b.name || a.section_type != b.section_type || a.order != b.order;

                let (status, hunks) = if !content_changed && !metadata_changed {
                    (DiffStatus::Equal, vec![])
                } else if content_changed {
                    (DiffStatus::Changed, diff_section(&a.content, &b.content))
                } else {
                    (DiffStatus::Changed, vec![])
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        models::diff::{DiffStatus, HunkKind},
        test_utils::{make_section, make_snapshot, make_snapshot_section},
    };

    // ── diff_snapshots ────────────────────────────────────────────────

    #[test]
    fn diff_snapshots_identical_sections_are_equal() {
        let sec = make_snapshot_section("s1", "Verse", 0, "same content");
        let snap_a = make_snapshot("a", vec![sec.clone()]);
        let snap_b = make_snapshot("b", vec![sec]);

        let diffs = diff_snapshots(&snap_a, &snap_b);

        assert_eq!(diffs.len(), 1);
        assert_eq!(diffs[0].status, DiffStatus::Equal);
        assert!(diffs[0].hunks.is_empty());
    }

    #[test]
    fn diff_snapshots_changed_content_produces_hunks() {
        let a = make_snapshot_section("s1", "Verse", 0, "old text");
        let b = make_snapshot_section("s1", "Verse", 0, "new text");

        let diffs = diff_snapshots(&make_snapshot("a", vec![a]), &make_snapshot("b", vec![b]));

        assert_eq!(diffs[0].status, DiffStatus::Changed);
        assert!(!diffs[0].hunks.is_empty());

        let has_insert = diffs[0].hunks.iter().any(|h| h.kind == HunkKind::Insert);
        let has_delete = diffs[0].hunks.iter().any(|h| h.kind == HunkKind::Delete);
        assert!(has_insert && has_delete);
    }

    #[test]
    fn diff_snapshots_section_only_in_a_is_removed() {
        let sec = make_snapshot_section("s1", "Verse", 0, "content");
        let snap_a = make_snapshot("a", vec![sec]);
        let snap_b = make_snapshot("b", vec![]);

        let diffs = diff_snapshots(&snap_a, &snap_b);

        assert_eq!(diffs.len(), 1);
        assert_eq!(diffs[0].status, DiffStatus::Removed);
        assert_eq!(diffs[0].hunks[0].kind, HunkKind::Delete);
    }

    #[test]
    fn diff_snapshots_section_only_in_b_is_added() {
        let sec = make_snapshot_section("s1", "Chorus", 0, "new section");
        let snap_a = make_snapshot("a", vec![]);
        let snap_b = make_snapshot("b", vec![sec]);

        let diffs = diff_snapshots(&snap_a, &snap_b);

        assert_eq!(diffs.len(), 1);
        assert_eq!(diffs[0].status, DiffStatus::Added);
        assert_eq!(diffs[0].hunks[0].kind, HunkKind::Insert);
    }

    #[test]
    fn diff_snapshots_metadata_only_change_is_changed_with_no_hunks() {
        let a = make_snapshot_section("s1", "Old Name", 0, "same");
        let mut b = make_snapshot_section("s1", "New Name", 0, "same");
        b.name = "New Name".to_owned();

        let diffs = diff_snapshots(&make_snapshot("a", vec![a]), &make_snapshot("b", vec![b]));

        assert_eq!(diffs[0].status, DiffStatus::Changed);
        assert!(diffs[0].hunks.is_empty());
    }

    #[test]
    fn diff_snapshots_results_sorted_by_section_order() {
        let s1 = make_snapshot_section("s1", "Verse", 0, "v");
        let s2 = make_snapshot_section("s2", "Chorus", 1, "c");
        let s3 = make_snapshot_section("s3", "Bridge", 2, "b");

        // Feed them in reverse order to verify sorting
        let snap_a = make_snapshot("a", vec![s3.clone(), s1.clone(), s2.clone()]);
        let snap_b = make_snapshot("b", vec![s3, s1, s2]);

        let diffs = diff_snapshots(&snap_a, &snap_b);

        assert_eq!(diffs.len(), 3);
        // After sort by order, should be s1(0), s2(1), s3(2)
        assert_eq!(diffs[0].section_id, "s1");
        assert_eq!(diffs[1].section_id, "s2");
        assert_eq!(diffs[2].section_id, "s3");
    }

    #[test]
    fn diff_snapshots_removed_section_sorted_by_a_order() {
        let kept = make_snapshot_section("keep", "Verse", 0, "v");
        let removed = make_snapshot_section("gone", "Chorus", 1, "c");

        let snap_a = make_snapshot("a", vec![kept.clone(), removed]);
        let snap_b = make_snapshot("b", vec![kept]);

        let diffs = diff_snapshots(&snap_a, &snap_b);

        assert_eq!(diffs.len(), 2);
        // "keep" at order 0, "gone" at order 1 (from A)
        assert_eq!(diffs[0].section_id, "keep");
        assert_eq!(diffs[1].section_id, "gone");
        assert_eq!(diffs[1].status, DiffStatus::Removed);
    }

    // ── diff_working_vs_snapshot ──────────────────────────────────────

    #[test]
    fn diff_working_vs_snapshot_matching_content_is_equal() {
        let live = vec![make_section("s1", "Verse", 0, "same content")];
        let snap_sec = make_snapshot_section("s1", "Verse", 0, "same content");
        let snapshot = make_snapshot("snap", vec![snap_sec]);

        let diffs = diff_working_vs_snapshot(&live, &snapshot);

        assert_eq!(diffs[0].status, DiffStatus::Equal);
    }

    #[test]
    fn diff_working_vs_snapshot_modified_live_is_changed() {
        let live = vec![make_section("s1", "Verse", 0, "edited content")];
        let snap_sec = make_snapshot_section("s1", "Verse", 0, "original content");
        let snapshot = make_snapshot("snap", vec![snap_sec]);

        let diffs = diff_working_vs_snapshot(&live, &snapshot);

        assert_eq!(diffs[0].status, DiffStatus::Changed);
    }

    #[test]
    fn diff_working_vs_snapshot_new_live_section_is_added() {
        let live = vec![
            make_section("s1", "Verse", 0, "verse"),
            make_section("s2", "Chorus", 1, "chorus"),
        ];
        let snap_sec = make_snapshot_section("s1", "Verse", 0, "verse");
        let snapshot = make_snapshot("snap", vec![snap_sec]);

        let diffs = diff_working_vs_snapshot(&live, &snapshot);

        let added = diffs.iter().find(|d| d.section_id == "s2").unwrap();
        assert_eq!(added.status, DiffStatus::Added);
    }

    // ── hunk merging ──────────────────────────────────────────────────

    #[test]
    fn diff_section_merges_consecutive_same_kind_hunks() {
        // When chars of the same tag are adjacent they must be merged into
        // a single hunk, not emitted one char at a time.
        let a = make_snapshot_section("s1", "V", 0, "abc");
        let b = make_snapshot_section("s1", "V", 0, "xyz");

        let diffs = diff_snapshots(&make_snapshot("a", vec![a]), &make_snapshot("b", vec![b]));

        // "abc" vs "xyz" — all chars are different, so we expect one Delete
        // hunk and one Insert hunk (merged), not 6 separate single-char hunks.
        let delete_hunks: Vec<_> = diffs[0]
            .hunks
            .iter()
            .filter(|h| h.kind == HunkKind::Delete)
            .collect();
        let insert_hunks: Vec<_> = diffs[0]
            .hunks
            .iter()
            .filter(|h| h.kind == HunkKind::Insert)
            .collect();
        assert_eq!(delete_hunks.len(), 1);
        assert_eq!(insert_hunks.len(), 1);
        assert_eq!(delete_hunks[0].text, "abc");
        assert_eq!(insert_hunks[0].text, "xyz");
    }
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
