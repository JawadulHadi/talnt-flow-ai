# Contributing to TalntFlow AI

Thanks for helping out. This guide covers setup, the checks a pull request must pass, and the
rules that keep the codebase consistent.

## Setup

Prerequisites: Node.js 22.12 or newer, and npm.

```sh
git clone https://github.com/JawadulHadi/talnt-flow-ai.git
cd talnt-flow-ai
npm install          # .npmrc sets legacy-peer-deps
npm run dev          # http://localhost:3000
```

Claude is optional. Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` to use it; without a
key the agent and scorecard run on the local engines.

## Before you open a pull request

Run all four and make sure they pass:

```sh
npx tsc --noEmit     # type check
npm run lint         # ESLint + Prettier
npm test             # Vitest unit tests
npm run build        # production build
```

Add or update tests in `src/lib/ats/ats.test.ts` when you change store actions, analytics,
scoring, the persistence migration or the agent tools.

## Project rules

The full list lives in [AGENTS.md](AGENTS.md). The ones that matter most:

- **Data** goes through the zustand stores in `src/stores`, persisted by the adapter in
  `src/lib/ats/storage-service.ts`.
- **Persisted shape changes** bump the store `version` and extend `migrateAtsState`. Never rename the
  storage key; that discards users' data.
- **AI calls** go through `src/lib/ats/ai-service.ts` and must keep a local fallback.
- **The agent** only reads a snapshot and returns proposals. Don't give it tools that write
  directly, and never add contact details or self-identification fields to the snapshot.
- **Styling** uses the semantic theme tokens from `src/styles.css` and the `glass` utility. Check
  new UI in all four themes, including Paper Light.
- **Generated files**: don't edit `src/routeTree.gen.ts` by hand; the router plugin regenerates it.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit together.

## Branches and commits

- Branch from `main` using `feat/…`, `fix/…`, `docs/…` or `chore/…`.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`,
  `style:`, `docs:`, `test:`, `chore:`.
- Keep pull requests focused. Describe the user-visible change and add screenshots for UI work.

## Reporting bugs and requesting features

Use the issue templates. Report security problems privately as described in
[SECURITY.md](SECURITY.md), not in a public issue.

## Releases

Maintainers release from `main`:

1. Move the `Unreleased` entries in [CHANGELOG.md](CHANGELOG.md) under a new version and date.
2. Bump `version` in `package.json` following [Semantic Versioning](https://semver.org/).
3. Tag the commit `vX.Y.Z` and publish a GitHub release with the changelog section as notes.

## License

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
