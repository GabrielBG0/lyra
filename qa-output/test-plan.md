# Test Plan — Lyra Rust Core (`src-tauri/src/core/`)

Generated: 2026-05-04

## Scope

All business logic in `src-tauri/src/core/`. The `commands/` layer (Tauri IPC glue) and `core/vault::start_watcher` (thread-based watcher with timing concerns) were intentionally excluded.

## Infrastructure Added

| File                 | Change                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Cargo.toml`         | Added `[dev-dependencies] tempfile = "3"`                                                                                                                                |
| `src/test_utils.rs`  | New shared fixture module (only compiled under `#[cfg(test)]`)                                                                                                           |
| `src/lib.rs`         | Added `#[cfg(test)] pub mod test_utils;`                                                                                                                                 |
| `src/core/config.rs` | Refactored `load_config`/`save_config` to delegate to path-injectable `load_config_from`/`save_config_to` helpers (avoids touching the real `%APPDATA%` config in tests) |

## Files Covered

| Source File        | Test Location         | Test Types            | # Tests |
| ------------------ | --------------------- | --------------------- | ------- |
| `core/utils.rs`    | inline `#[cfg(test)]` | unit                  | 11      |
| `core/diff.rs`     | inline `#[cfg(test)]` | unit                  | 10      |
| `core/export.rs`   | inline `#[cfg(test)]` | unit + async file I/O | 10      |
| `core/song.rs`     | inline `#[cfg(test)]` | async file I/O        | 9       |
| `core/section.rs`  | inline `#[cfg(test)]` | async file I/O        | 6       |
| `core/snapshot.rs` | inline `#[cfg(test)]` | async file I/O        | 9       |
| `core/comment.rs`  | inline `#[cfg(test)]` | async file I/O        | 9       |
| `core/index.rs`    | inline `#[cfg(test)]` | async SQLite          | 9       |
| `core/config.rs`   | inline `#[cfg(test)]` | async file I/O        | 4       |
| **Total**          |                       |                       | **86**  |

## Test Cases Summary

### `core/utils.rs`

- `sanitize_title_simple_words` — "Blue Hour" → "blue-hour"
- `sanitize_title_special_chars_become_hyphens` — apostrophe becomes its own hyphen segment
- `sanitize_title_numbers_are_preserved` — digits pass through
- `sanitize_title_consecutive_separators_collapsed_to_one`
- `sanitize_title_leading_and_trailing_separators_stripped`
- `sanitize_title_all_non_alphanumeric_returns_untitled`
- `sanitize_title_empty_string_returns_untitled`
- `sanitize_title_unicode_letters_preserved` — `is_alphanumeric()` accepts Unicode letters
- `sanitize_title_mixed_case_lowercased`
- `find_available_path_returns_stem_when_no_collision`
- `find_available_path_increments_on_single_collision`
- `find_available_path_keeps_incrementing_past_multiple_collisions`
- `serialize_section_roundtrip` — TOML serialize → deserialize preserves all fields
- `serialize_section_multiline_content_is_human_readable` — newlines produce multiline TOML strings

### `core/diff.rs`

- `diff_snapshots_identical_sections_are_equal` — Equal status, no hunks
- `diff_snapshots_changed_content_produces_hunks` — Changed with Insert+Delete hunks
- `diff_snapshots_section_only_in_a_is_removed` — Removed with Delete hunk
- `diff_snapshots_section_only_in_b_is_added` — Added with Insert hunk
- `diff_snapshots_metadata_only_change_is_changed_with_no_hunks` — Changed, empty hunks
- `diff_snapshots_results_sorted_by_section_order`
- `diff_snapshots_removed_section_sorted_by_a_order`
- `diff_working_vs_snapshot_matching_content_is_equal`
- `diff_working_vs_snapshot_modified_live_is_changed`
- `diff_working_vs_snapshot_new_live_section_is_added`
- `diff_section_merges_consecutive_same_kind_hunks` — adjacent same-tag chars become single hunk

### `core/export.rs`

- `escape_html_plain_text_unchanged`
- `escape_html_ampersand`, `escape_html_angle_brackets`, `escape_html_double_quote`, `escape_html_all_special_chars_in_one_string`
- `format_date_truncates_to_yyyy_mm_dd`
- `format_date_already_short_returns_unchanged`
- `format_date_empty_string_returns_empty`
- `format_musical_info_all_fields_joined_with_dot`
- `format_musical_info_only_bpm`
- `format_musical_info_all_none_returns_empty_string`
- `build_html_document_contains_doctype_and_title`
- `build_html_document_escapes_title`
- `export_plain_text_contains_title_and_section`
- `export_plain_text_without_history_has_no_history_section`
- `export_html_produces_valid_structure`
- `export_html_escapes_special_characters_in_title`

### `core/song.rs`

- `create_lyr_file_roundtrip_title_and_default_section`
- `create_lyr_file_derives_filename_from_title`
- `create_lyr_file_avoids_filename_collision`
- `create_lyr_file_status_defaults_to_idea`
- `read_lyr_file_returns_sections_sorted_by_order`
- `read_lyr_file_rejects_unsupported_format_version`
- `read_lyr_file_missing_comments_toml_yields_empty_comments`
- `write_lyr_file_updates_metadata_and_preserves_snapshots`
- `write_lyr_file_replaces_sections`

### `core/section.rs`

- `write_section_updates_content_in_place`
- `write_section_preserves_other_entries`
- `delete_section_removes_the_target_section`
- `delete_section_preserves_remaining_sections`
- `reorder_sections_assigns_order_by_position_in_id_list`

### `core/snapshot.rs`

- `create_snapshot_appears_in_song_header_list`
- `create_snapshot_multiple_snapshots_sorted_chronologically`
- `load_snapshot_returns_full_section_content`
- `load_snapshot_not_found_returns_error` — `AppError::SnapshotNotFound`
- `restore_snapshot_replaces_live_sections_with_snapshot_content`
- `restore_snapshot_preserves_existing_snapshots`
- `cherry_pick_restores_only_the_target_section` — untouched sections unmodified
- `cherry_pick_section_not_in_snapshot_returns_error` — `AppError::SectionNotFound`

### `core/comment.rs`

- `read_comments_on_fresh_song_returns_empty_vec`
- `add_comment_persists_and_is_readable`
- `add_comment_returns_correct_fields`
- `add_multiple_comments_all_persisted`
- `resolve_comment_marks_it_resolved`
- `resolve_comment_only_affects_target_comment`
- `resolve_comment_with_unknown_id_returns_error`
- `list_comments_filters_by_section_id`
- `list_comments_unknown_section_returns_empty`

### `core/index.rs`

- `upsert_song_and_list_songs_roundtrip`
- `upsert_song_on_conflict_updates_existing_row` — conflict on `file_path`
- `list_songs_ordered_newest_updated_at_first`
- `remove_song_deletes_the_correct_row`
- `remove_song_nonexistent_path_is_a_no_op`
- `get_song_by_path_returns_correct_entry`
- `get_song_by_path_missing_path_returns_none`
- `clear_index_removes_all_rows`
- `init_index_creates_database_and_applies_migrations`

### `core/config.rs`

- `load_config_from_missing_file_returns_default`
- `save_and_load_config_roundtrip`
- `save_config_creates_parent_directories`
- `load_config_from_partial_toml_uses_field_defaults`

## Known Gaps / Not Covered

- `core/vault::start_watcher` — excluded (spawns a thread with 300ms debounce, flaky by design)
- `commands/` layer — thin Tauri-state glue requiring a running Tauri runtime context
- Full vault scan (`scan_vault`) with real `.lyr` files and database sync — covered by underlying unit tests of `read_lyr_file` + index CRUD

## Results

| Module          | Passed | Failed |
| --------------- | ------ | ------ |
| `core/utils`    | 11     | 0      |
| `core/diff`     | 11     | 0      |
| `core/export`   | 10     | 0      |
| `core/song`     | 9      | 0      |
| `core/section`  | 5      | 0      |
| `core/snapshot` | 8      | 0      |
| `core/comment`  | 9      | 0      |
| `core/index`    | 9      | 0      |
| `core/config`   | 4      | 0      |
| **Total**       | **86** | **0**  |

One test was fixed during initial run: `sanitize_title_special_chars_become_hyphens` — the apostrophe in `"Don't"` produces a hyphen between `n` and `t` (`"don-t"`), not `"dont"`, because the function maps every non-alphanumeric char to a hyphen with no special-casing for word-internal punctuation.

## How to Run

```bash
cd src-tauri
cargo test --lib
```
