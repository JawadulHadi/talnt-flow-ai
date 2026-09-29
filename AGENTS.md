## Architecture

- All ATS data flows through zustand stores in src/stores using the adapter in src/lib/ats/storage-service.ts — swap that adapter to sync with a backend. Persisted shape changes go through the store's `version` + `migrate`, never a new storage key.
- AI calls go through src/lib/ats/ai-service.ts, which falls back to the local engines (src/lib/ats/scoring.ts, `runLocalAgent` in src/lib/ats/agent.ts) and flips the offline banner.
- The agent loop runs server-side in src/lib/ats/agent.server.ts (Claude via the Anthropic SDK), reached through server functions in src/lib/ats/agent.functions.ts. It only reads a snapshot and returns proposals; the UI applies them after recruiter approval. Never add contact details or EEO fields to the agent snapshot.
- Themes are `data-theme` token sets in src/styles.css; components use semantic tokens and the `glass` utility only.
- Deployment targets Vercel (`vercel.json`); Nitro emits `.vercel/output` during the Vercel build.
