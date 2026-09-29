# TalntFlow AI

**TalntFlow AI** is an autonomous Applicant Tracking System (ATS), AI candidate scoring engine, and multi-job board integration platform designed for modern recruiting teams.

## Features

- **Kanban Pipeline Board**: Visualise candidate stages across Applied, Screened, Interviewing, Offer, and Hired with drag-and-drop workflow and glass-morphism UI.
- **AI Candidate Scoring**: Automated evaluation and matching against job descriptions using local weighted engines or Gemini AI.
- **Scorecards & Evaluations**: Structured STAR interview scorecards with competency weighting and team notes.
- **Deliverables & Analytics**: Exportable hiring reports, candidate communication logs, and sourcing ROI metrics.
- **Multi-Theme Support**: Frosted Slate, Frosted Ember, Paper Light, and Signal Emerald themes.

## Local Development

Prerequisites: Node.js 22+ and npm.

```sh
# Clone repository
git clone <repository-url>
cd Talnt_Hub

# Install dependencies
npm install

# Start development server on port 3000
npm run dev
```

## Deployment

### Vercel

1. Import your repository into Vercel.
2. Vercel will automatically detect Vite (`vercel.json` is pre-configured).
3. Click **Deploy**.

### Netlify

1. Import your repository into Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist` (`netlify.toml` is pre-configured).
4. Click **Deploy**.

## Built With

- TanStack Start & TanStack Router
- React 19 & TypeScript
- Tailwind CSS & Glass-morphism design tokens
- Zustand state management
- Lucide React icons
