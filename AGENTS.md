## Architecture

- All ATS data flows through zustand stores in src/stores using the adapter in src/lib/ats/storage-service.ts — swap that adapter to sync with a backend.
- AI calls go through src/lib/ats/ai-service.ts, which falls back to the local scoring engine (src/lib/ats/scoring.ts) and flips the offline banner.
- Themes are `data-theme` token sets in src/styles.css; components use semantic tokens and the `glass` utility only.
- Deployment configured for Vercel (`vercel.json`) and Netlify (`netlify.toml`).
