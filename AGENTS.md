<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- All ATS data flows through zustand stores in src/stores using the adapter in src/lib/ats/storage-service.ts — swap that adapter to sync with a backend.
- AI calls go through src/lib/ats/ai-service.ts, which falls back to the local scoring engine (src/lib/ats/scoring.ts) and flips the offline banner.
- Themes are `data-theme` token sets in src/styles.css; components use semantic tokens and the `glass` utility only.
