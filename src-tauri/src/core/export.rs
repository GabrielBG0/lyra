//! Core logic for export — plain text and printable HTML rendering
#![allow(dead_code)]

use std::path::Path;

use crate::{
    core::{snapshot::load_snapshot, song::read_lyr_file},
    error::AppResult,
    models::song::MusicalInfo,
};

const RULE: &str = "─────────────────────────";
const HISTORY_RULE: &str = "══════════════════════════════════════════════";

// ── Public API ──────────────────────────────────────────────────────────────

/// Export the song as a plain-text string.
///
/// Format:
/// ```text
/// {title}
/// {key} · {bpm} BPM · {tuning}
/// ─────────────────────────
/// [Section Name]
/// content…
///
/// [Section Name]
/// …
/// ```
///
/// When `include_history` is `true`, every snapshot is appended after a
/// separator, oldest first, with its note, date, and full section content.
pub async fn export_plain_text(path: &Path, include_history: bool) -> AppResult<String> {
    let payload = read_lyr_file(path).await?;
    let mut out = String::new();

    // ── Header ───────────────────────────────────────────────────────
    out.push_str(&payload.metadata.title);
    out.push('\n');

    let info_line = format_musical_info(&payload.metadata.musical);
    if !info_line.is_empty() {
        out.push_str(&info_line);
        out.push('\n');
    }

    out.push_str(RULE);
    out.push('\n');

    // ── Sections ─────────────────────────────────────────────────────
    for section in &payload.sections {
        out.push('\n');
        out.push('[');
        out.push_str(&section.name);
        out.push_str("]\n");
        out.push_str(&section.content);
        out.push('\n');
    }

    // ── History ──────────────────────────────────────────────────────
    if include_history && !payload.snapshot_headers.is_empty() {
        out.push('\n');
        out.push_str(HISTORY_RULE);
        out.push_str("\n  HISTORY\n");
        out.push_str(HISTORY_RULE);
        out.push('\n');

        for header in &payload.snapshot_headers {
            let note = header.note.as_deref().unwrap_or("Untitled snapshot");
            let date = format_date(&header.created_at);

            out.push('\n');
            out.push_str(&format!("── {note} · {date} "));
            out.push_str("──────────────────────────────\n");

            match load_snapshot(path, &header.id).await {
                Ok(snap) => {
                    let mut sections = snap.sections.clone();
                    sections.sort_by_key(|s| s.order);
                    for section in &sections {
                        out.push('\n');
                        out.push('[');
                        out.push_str(&section.name);
                        out.push_str("]\n");
                        out.push_str(&section.content);
                        out.push('\n');
                    }
                }
                Err(_) => {
                    out.push_str("  (could not load snapshot)\n");
                }
            }
        }
    }

    Ok(out)
}

/// Export the song as a printable HTML string.
///
/// The frontend opens this in a Tauri webview window and triggers
/// `window.print()`. No Rust PDF dependency is required.
pub async fn export_html(path: &Path, include_history: bool) -> AppResult<String> {
    let payload = read_lyr_file(path).await?;
    let mut body = String::new();

    // ── Header ───────────────────────────────────────────────────────
    body.push_str(&format!(
        "<h1 class=\"title\">{}</h1>\n",
        escape_html(&payload.metadata.title)
    ));

    let info_line = format_musical_info(&payload.metadata.musical);
    if !info_line.is_empty() {
        body.push_str(&format!(
            "<p class=\"meta\">{}</p>\n",
            escape_html(&info_line)
        ));
    }

    body.push_str("<hr class=\"rule\">\n");

    // ── Sections ─────────────────────────────────────────────────────
    for section in &payload.sections {
        body.push_str("<div class=\"section\">\n");
        body.push_str(&format!(
            "  <h2 class=\"section-name\">{}</h2>\n",
            escape_html(&section.name)
        ));
        body.push_str(&format!(
            "  <pre class=\"lyrics\">{}</pre>\n",
            escape_html(&section.content)
        ));
        body.push_str("</div>\n");
    }

    // ── History ──────────────────────────────────────────────────────
    if include_history && !payload.snapshot_headers.is_empty() {
        body.push_str("<div class=\"history\">\n");
        body.push_str("  <h2 class=\"history-title\">History</h2>\n");

        for header in &payload.snapshot_headers {
            let note = header.note.as_deref().unwrap_or("Untitled snapshot");
            let date = format_date(&header.created_at);

            body.push_str("  <div class=\"snapshot\">\n");
            body.push_str(&format!(
                "    <h3 class=\"snapshot-header\">{} <span class=\"snapshot-date\">{}</span></h3>\n",
                escape_html(note),
                escape_html(&date)
            ));

            match load_snapshot(path, &header.id).await {
                Ok(snap) => {
                    let mut sections = snap.sections.clone();
                    sections.sort_by_key(|s| s.order);
                    for section in &sections {
                        body.push_str("    <div class=\"section\">\n");
                        body.push_str(&format!(
                            "      <h4 class=\"section-name\">{}</h4>\n",
                            escape_html(&section.name)
                        ));
                        body.push_str(&format!(
                            "      <pre class=\"lyrics\">{}</pre>\n",
                            escape_html(&section.content)
                        ));
                        body.push_str("    </div>\n");
                    }
                }
                Err(_) => {
                    body.push_str("    <p class=\"error\">Could not load snapshot.</p>\n");
                }
            }

            body.push_str("  </div>\n");
        }

        body.push_str("</div>\n");
    }

    Ok(build_html_document(&payload.metadata.title, &body))
}

// ── Internal helpers ────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{core::song::create_lyr_file, test_utils::build_test_lyr};
    use tempfile::TempDir;

    // ── escape_html ───────────────────────────────────────────────────

    #[test]
    fn escape_html_plain_text_unchanged() {
        assert_eq!(escape_html("Hello world"), "Hello world");
    }

    #[test]
    fn escape_html_ampersand() {
        assert_eq!(escape_html("a & b"), "a &amp; b");
    }

    #[test]
    fn escape_html_angle_brackets() {
        assert_eq!(escape_html("<em>hi</em>"), "&lt;em&gt;hi&lt;/em&gt;");
    }

    #[test]
    fn escape_html_double_quote() {
        assert_eq!(escape_html(r#"say "hi""#), "say &quot;hi&quot;");
    }

    #[test]
    fn escape_html_all_special_chars_in_one_string() {
        assert_eq!(
            escape_html(r#"<a href="x&y">z</a>"#),
            "&lt;a href=&quot;x&amp;y&quot;&gt;z&lt;/a&gt;"
        );
    }

    // ── format_date ───────────────────────────────────────────────────

    #[test]
    fn format_date_truncates_to_yyyy_mm_dd() {
        assert_eq!(format_date("2025-03-15T14:22:00Z"), "2025-03-15");
    }

    #[test]
    fn format_date_already_short_returns_unchanged() {
        assert_eq!(format_date("2025-03"), "2025-03");
    }

    #[test]
    fn format_date_empty_string_returns_empty() {
        assert_eq!(format_date(""), "");
    }

    // ── format_musical_info ───────────────────────────────────────────

    #[test]
    fn format_musical_info_all_fields_joined_with_dot() {
        let info = MusicalInfo {
            key: Some("C Major".to_owned()),
            bpm: Some(120),
            capo: None,
            tuning: Some("DADGAD".to_owned()),
        };
        assert_eq!(format_musical_info(&info), "C Major · 120 BPM · DADGAD");
    }

    #[test]
    fn format_musical_info_only_bpm() {
        let info = MusicalInfo {
            key: None,
            bpm: Some(90),
            capo: None,
            tuning: None,
        };
        assert_eq!(format_musical_info(&info), "90 BPM");
    }

    #[test]
    fn format_musical_info_all_none_returns_empty_string() {
        let info = MusicalInfo {
            key: None,
            bpm: None,
            capo: None,
            tuning: None,
        };
        assert_eq!(format_musical_info(&info), "");
    }

    // ── build_html_document ───────────────────────────────────────────

    #[test]
    fn build_html_document_contains_doctype_and_title() {
        let html = build_html_document("My Song", "<p>body</p>");
        assert!(html.contains("<!DOCTYPE html>"));
        assert!(html.contains("My Song"));
        assert!(html.contains("<p>body</p>"));
    }

    #[test]
    fn build_html_document_escapes_title() {
        let html = build_html_document("<script>alert(1)</script>", "");
        assert!(!html.contains("<script>"));
        assert!(html.contains("&lt;script&gt;"));
    }

    // ── export_plain_text ─────────────────────────────────────────────

    #[tokio::test]
    async fn export_plain_text_contains_title_and_section() {
        let dir = TempDir::new().unwrap();
        let (path, _) = create_lyr_file(dir.path(), "Midnight Blues").await.unwrap();

        let text = export_plain_text(&path, false).await.unwrap();

        assert!(text.contains("Midnight Blues"));
        assert!(text.contains("[Verse 1]"));
    }

    #[tokio::test]
    async fn export_plain_text_without_history_has_no_history_section() {
        let dir = TempDir::new().unwrap();
        let (path, _) = create_lyr_file(dir.path(), "Song").await.unwrap();

        let text = export_plain_text(&path, false).await.unwrap();

        assert!(!text.contains("HISTORY"));
    }

    // ── export_html ───────────────────────────────────────────────────

    #[tokio::test]
    async fn export_html_produces_valid_structure() {
        let dir = TempDir::new().unwrap();
        let lyr_path = dir.path().join("test.lyr");
        build_test_lyr(&lyr_path, "Ocean Drive", "sec-001");

        let html = export_html(&lyr_path, false).await.unwrap();

        assert!(html.contains("<!DOCTYPE html>"));
        assert!(html.contains("Ocean Drive"));
        assert!(html.contains("Verse 1"));
        assert!(html.contains("Hello world"));
    }

    #[tokio::test]
    async fn export_html_escapes_special_characters_in_title() {
        let dir = TempDir::new().unwrap();
        let (path, _) = create_lyr_file(dir.path(), "A & B").await.unwrap();

        let html = export_html(&path, false).await.unwrap();

        assert!(!html.contains("<title>A & B</title>"));
        assert!(html.contains("A &amp; B"));
    }
}

/// Build the info line from optional musical fields.
/// Returns an empty string when all fields are `None`.
fn format_musical_info(musical: &MusicalInfo) -> String {
    let mut parts: Vec<String> = Vec::new();
    if let Some(key) = &musical.key {
        parts.push(key.clone());
    }
    if let Some(bpm) = musical.bpm {
        parts.push(format!("{bpm} BPM"));
    }
    if let Some(tuning) = &musical.tuning {
        parts.push(tuning.clone());
    }
    parts.join(" · ")
}

/// Trim the ISO 8601 timestamp to the date portion (`YYYY-MM-DD`).
fn format_date(iso: &str) -> String {
    iso.get(..10).unwrap_or(iso).to_owned()
}

/// Escape the minimal HTML special characters to avoid broken markup.
fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

/// Wrap `body` in a complete HTML document with embedded `@media print` CSS.
fn build_html_document(title: &str, body: &str) -> String {
    format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; }}

    body {{
      font-family: "Georgia", serif;
      max-width: 700px;
      margin: 0 auto;
      padding: 2rem;
      color: #111;
      background: #fff;
    }}

    h1.title {{
      font-size: 2rem;
      margin-bottom: 0.25rem;
    }}

    p.meta {{
      color: #555;
      font-style: italic;
      margin-top: 0;
    }}

    hr.rule {{
      border: none;
      border-top: 1px solid #ccc;
      margin: 1.5rem 0;
    }}

    .section {{
      margin-bottom: 2rem;
    }}

    h2.section-name {{
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #666;
      margin-bottom: 0.4rem;
    }}

    pre.lyrics {{
      font-family: "Georgia", serif;
      font-size: 1rem;
      line-height: 1.8;
      white-space: pre-wrap;
      margin: 0;
    }}

    .history {{
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 2px solid #111;
    }}

    h2.history-title {{
      font-size: 1.1rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }}

    .snapshot {{
      margin: 2rem 0;
      padding: 1rem;
      border-left: 3px solid #ccc;
    }}

    h3.snapshot-header {{
      font-size: 0.95rem;
      margin-bottom: 0.75rem;
    }}

    span.snapshot-date {{
      color: #888;
      font-weight: normal;
      font-size: 0.85rem;
    }}

    h4.section-name {{
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #999;
      margin-bottom: 0.25rem;
    }}

    p.error {{
      color: #c00;
      font-style: italic;
    }}

    @media print {{
      body {{
        padding: 0;
        max-width: 100%;
      }}
      .snapshot {{
        break-inside: avoid;
      }}
    }}
  </style>
</head>
<body>
{body}
</body>
</html>
"#,
        title = escape_html(title),
        body = body,
    )
}
