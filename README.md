# TalntFlow AI

[![Live demo](https://img.shields.io/badge/demo-talntflow--ai.vercel.app-000?logo=vercel)](https://talntflow-ai.vercel.app)
[![Release](https://img.shields.io/github/v/release/JawadulHadi/talnt-flow-ai)](https://github.com/JawadulHadi/talnt-flow-ai/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**TalntFlow AI** is a lightweight applicant tracking system (ATS) with an AI recruiting agent, structured STAR scorecards and hiring analytics.

**Live demo:** https://talntflow-ai.vercel.app (demo data lives in your browser; use the reset button in the header to restore it)

## Features

- **Jobs**: requisitions with Draft → Active → Closed lifecycle and live applicant counts per job.
- **Pipeline**: per-job Kanban across Sourced, Screened, Interviewing, Offer Sent and Hired. Stage moves are timestamped and send the matching candidate email.
- **Candidates**: add manually with résumé attachment, duplicate detection per job, rejection with reason (and rejection email), reactivation, and permanent deletion for data-erasure requests.
- **TalntFlow Agent**: an agent loop that reads the pipeline through tools and returns proposals (stage moves, reminder/feedback emails, notes) that a recruiter approves one by one. It runs on Claude when `ANTHROPIC_API_KEY` is set and falls back to local triage rules otherwise.
- **Scorecards**: 10 weighted STAR questions with a deterministic score and verdict; Claude writes the narrative summary when connected.
- **Analytics**: time to fill, stage velocity, funnel with bottleneck audit, source ROI, and diversity reporting based only on voluntary self-identification.
- **Team & integrations**: role hierarchy with pending invites; simulated job-board and HRIS connections.
- **Themes**: Frosted Slate, Frosted Ember, Paper Light and Signal Emerald.

Data is stored in the browser (localStorage) through `src/lib/ats/storage-service.ts`; swap that adapter to sync with a backend.

## Local development

Prerequisites: Node.js 22.12+ and npm.

```sh
git clone https://github.com/JawadulHadi/talnt-flow-ai.git
cd talnt-flow-ai
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests
```

To enable Claude locally, create `.env` from `.env.example` and set `ANTHROPIC_API_KEY`.

## Deployment (Vercel)

The build uses Nitro, which detects Vercel and emits the Build Output API (`.vercel/output`): static assets plus one Node function for SSR and server functions. `vercel.json` pins the install and build commands.

```sh
npx vercel deploy --prod
```

Optional environment variable in the Vercel project: `ANTHROPIC_API_KEY` (enables Claude for the agent and scorecards). The deployment has no user authentication, so anyone with the URL can trigger agent runs on that key. Before setting it on a public URL, add auth or Vercel Deployment Protection and set a spend limit on the key.

## Documentation

| Document                                     | What it covers                                                    |
| -------------------------------------------- | ----------------------------------------------------------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data flow, persistence and migrations, the agent loop, deployment |
| [CHANGELOG.md](CHANGELOG.md)                 | Release history                                                   |
| [CONTRIBUTING.md](CONTRIBUTING.md)           | Setup, required checks, project rules, release process            |
| [SECURITY.md](SECURITY.md)                   | Reporting vulnerabilities and deployment responsibilities         |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)     | Community standards                                               |
| [AGENTS.md](AGENTS.md)                       | Architecture rules for AI coding agents                           |

## Built with

- TanStack Start & TanStack Router, React 19, TypeScript
- Tailwind CSS with `data-theme` design tokens
- Zustand for state
- Anthropic SDK (`claude-opus-5-5`) for the agent, server-side only

## License

[MIT](LICENSE) © 2026 Jawad Ul Hadi
