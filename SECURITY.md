# Security policy

## Supported versions

Security fixes go into the latest release.

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
| < 1.0   | No        |

## Reporting a vulnerability

Please don't open a public issue. Report it privately through GitHub instead:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Describe the issue, how to reproduce it, and the impact you expect.

The maintainer will acknowledge the report, confirm whether it's a vulnerability, and share a fix or
mitigation plan. Please give reasonable time for a fix before disclosing publicly.

## Deployment responsibilities

These are properties of the current design, not vulnerabilities. Anyone deploying TalntFlow AI should
know them:

- **There's no user authentication.** Anyone who can open the URL can use the app. Put the
  deployment behind authentication or Vercel Deployment Protection if it holds real candidate data.
- **Data lives in the browser.** Candidate records are stored in `localStorage` on each device and
  are not encrypted at rest.
- **The Claude key is server-side only.** `ANTHROPIC_API_KEY` is read inside server functions and
  never shipped to the browser. On a public deployment without authentication, though, anyone can
  trigger agent runs that spend the key's budget. Add authentication first and set a spend limit on
  the key.
- **What the model sees.** The agent snapshot excludes contact details and voluntary
  self-identification data. The agent can't write to the pipeline; a recruiter approves every
  proposal.
- **Cross-site requests.** Server functions are protected by TanStack Start's CSRF middleware
  (`src/start.ts`).
