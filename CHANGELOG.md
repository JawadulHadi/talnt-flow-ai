# Changelog

All notable changes to TalntFlow AI are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-30

First production release, deployed at https://talntflow-ai.vercel.app.

### Added

- **TalntFlow Agent** (`/agent`): a tool-use loop on Claude (`claude-opus-5-5`) that reads a
  read-only pipeline snapshot and returns proposals (stage moves, reminder or feedback emails,
  notes). Each proposal applies only after a recruiter approves it. Without `ANTHROPIC_API_KEY`,
  local triage rules produce the same kind of proposals.
- Claude-written scorecard summaries. The weighted score and verdict stay deterministic.
- Job lifecycle: Draft → Active → Closed, with live applicant counts and a per-job pipeline filter.
- Candidate management: add with résumé attachment, optional contact details and voluntary
  self-identification; duplicate detection per job; reject with reason (logs a rejection email);
  reactivate; permanent deletion for data-erasure requests.
- Team invites start as pending and can be revoked.
- Unit tests for scoring, analytics, store actions, persistence migration and the agent (15 tests).

### Changed

- Deployment targets Vercel only. Nitro emits the Build Output API; `vercel.json` pins
  `npm ci` and `npm run build`.
- Diversity analytics count only candidates who disclosed the attribute and show the disclosure rate.
- Integration sync times are stored as ISO timestamps and shown relative to now.
- Pages render after browser data loads, which removes a hydration mismatch and a flash of demo data.
- Remaining "Qeloma Agent for Recruiter" text renamed to TalntFlow AI.

### Fixed

- Saved browser data was discarded by a storage-key rename. The original key is back, with a
  versioned migration.
- New candidates were given a hard-coded gender, diversity flag, phone number and location.
- Sourcing cost for new candidates disagreed with the shared cost table.
- Candidates added directly at a late stage had a one-entry history, which skewed time-to-fill.
- Résumé "parsing" invented an invalid email from the file name.
- Applicant counts were static and never matched the pipeline.
- Invited team members showed as Active before accepting.
- The generated route tree was missing the Jobs, Team and Integrations routes.
- Posted dates used UTC and an inconsistent format.
- Form inputs were validated trimmed but saved untrimmed.
- The job counter labelled drafts as active positions.
- Dialog forms kept stale values after Cancel or Esc.
- Hard-coded palette colours ignored the active theme.
- `npm install` failed without a lockfile; `package-lock.json` and `.npmrc` are now committed.

### Removed

- `netlify.toml`. Its SPA redirect could not serve this server-rendered app.

### Upgrade notes

- Browser data saved under `qeloma-ats-v1` migrates automatically on first load.
- Data created with the unreleased build from commit `28bac4c` (key `qeloma-ats-v2`) is not migrated.

[Unreleased]: https://github.com/JawadulHadi/talnt-flow-ai/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/JawadulHadi/talnt-flow-ai/releases/tag/v1.0.0
