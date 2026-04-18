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
