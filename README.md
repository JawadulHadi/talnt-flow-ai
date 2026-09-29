# TalntFlow AI

**TalntFlow AI** is a lightweight applicant tracking system (ATS) with an AI recruiting agent, structured STAR scorecards and hiring analytics.

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

## Built with

- TanStack Start & TanStack Router, React 19, TypeScript
- Tailwind CSS with `data-theme` design tokens
- Zustand for state
- Anthropic SDK (`claude-opus-5-5`) for the agent, server-side only
