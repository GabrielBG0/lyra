# Security Policy

Thank you for helping keep Lyra safe for songwriters and their data.

Lyra is a local-first desktop app built with Tauri, React, Rust, and SQLite. It stores user work in local `.lyr` files and keeps a rebuildable SQLite index beside the user's vault. Security reports that affect local file access, vault integrity, packaged app behavior, dependency trust, or update and release safety are especially important.

## Supported Versions

Security fixes are provided for the latest public release and the current default branch.

| Version        | Supported   |
| -------------- | ----------- |
| Latest release | Yes         |
| Default branch | Yes         |
| Older releases | Best effort |

Lyra is still early software, so supported versions may change as release channels mature. If you are unsure whether an issue affects a supported version, please report it anyway.

## Reporting a Vulnerability

Please do not open a public GitHub issue for a suspected vulnerability.

Email security reports to:

**gabriel.bgs00@gmail.com**

Use a clear subject such as:

```text
Security report for Lyra: <short summary>
```

If you prefer, you may include a proposed patch, but please send the report first so the issue can be coordinated privately.

## What to Include

Helpful reports usually include:

- A short description of the issue and its impact.
- The affected Lyra version, commit, or release.
- Your operating system and version.
- Steps to reproduce the issue.
- Any proof of concept files, commands, screenshots, logs, or crash output.
- Whether the issue requires a malicious `.lyr` file, a malicious vault path, local user interaction, network access, or a compromised dependency.
- Any mitigations or fixes you have already identified.

Please avoid including sensitive personal data, private lyrics, private vault contents, or secrets in the report. If sample `.lyr` files are needed, use minimal test data.

## Scope

Examples of issues that are in scope:

- Unauthorized file reads or writes outside a selected vault.
- Corruption, deletion, or unintended modification of `.lyr` files.
- Unsafe handling of malicious `.lyr` files, vault paths, ZIP contents, TOML, JSON, SQLite data, or exported text.
- Command injection, path traversal, symlink or junction traversal, unsafe archive handling, or unsafe temporary file behavior.
- Tauri IPC authorization problems or commands exposed more broadly than intended.
- Cross-site scripting or script execution through song content, metadata, comments, filenames, or imported data.
- Dependency, build, release, signing, or installer issues that could compromise users.
- Crashes or denial of service caused by untrusted local files when there is a plausible security impact.

Examples that are usually out of scope:

- Vulnerabilities in unsupported operating systems or end-of-life dependencies.
- Issues that require full control of the user's machine before Lyra is launched.
- Social engineering against maintainers or users.
- Spam, phishing, or automated scanner output without a Lyra-specific impact.
- Missing security headers for a local desktop app unless they lead to an exploitable issue.
- Reports about development-only services that are not reachable in packaged releases, unless they affect contributors in a meaningful way.

## Response Process

I will try to acknowledge security reports within 7 days.

After triage, I will aim to:

- Confirm whether the issue is reproducible.
- Estimate severity and affected versions.
- Share the expected fix timeline when possible.
- Coordinate disclosure timing with the reporter.
- Credit the reporter in the advisory, release notes, or commit history if they want credit.

Fix timelines depend on severity and release complexity, but high-impact issues that put user files or release integrity at risk will be prioritized.

## Disclosure Guidelines

Please give the project reasonable time to investigate and publish a fix before sharing details publicly. Once a fix is available, public disclosure is welcome and appreciated when it helps users understand the risk and update safely.

If you believe active exploitation is happening or users are at immediate risk, say that clearly in the initial report.

## Security Design Notes

Lyra's security model assumes:

- The user's vault is local and user-selected.
- `.lyr` files may be opened from untrusted sources and should be treated as untrusted input.
- The SQLite index is a cache and must not be treated as canonical user data.
- Snapshot history should remain append-only and should not be silently rewritten.
- File writes should preserve the existing write-to-temp-then-atomic-rename strategy.

These assumptions are useful context for reports, fixes, and reviews.
