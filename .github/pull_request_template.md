## What changed

<!-- The user-visible change, and why. Link related issues, e.g. "Closes #12". -->

## How it was tested

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Checked the affected pages in the browser, including the Paper Light theme for UI changes

## Checklist

- [ ] Persisted-state shape changes bump the store `version` and extend `migrateAtsState`
- [ ] AI changes go through `ai-service.ts` and keep a local fallback
- [ ] Agent changes keep approve-before-apply and don't add contact or self-identification data to the snapshot
- [ ] `CHANGELOG.md` has an entry under `Unreleased`

## Screenshots

<!-- For UI changes. -->
