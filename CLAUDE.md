# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

No test framework is configured.

## What This App Does

DroneOK is a Spanish-language drone health certificate generator. Users upload DJI/drone flight logs, the app analyzes them and produces a scored health report, then generates a downloadable PDF certificate ("Certificado de Estado del Dron").

## Architecture

**Flow:** Upload → `/api/analyze` → scored JSON report → `/api/report/pdf` → PDF download

### API Routes

- **`/api/analyze`** — Accepts multipart/form-data, JSON, or text/plain. Parses DJI flight logs (JSON, NDJSON, raw text formats), extracts battery metrics, reliability events (signal loss, failsafe, forced landings), and alerts. Computes three sub-scores (battery, reliability, alerts) combined into an overall 0–100 health score with a confidence level. Returns `{ ok, reports[], debugFiles }`.

- **`/api/report/pdf`** — Accepts a report JSON object, generates an A4 PDF certificate using `pdf-lib` with color-coded health status (Verde/Amarillo/Rojo), score, confidence, key findings, and technical details.

### Components

Note: the components directory is named `componets/` (typo — missing an 'n'). Use `@/componets/` for imports.

- `componets/layouts/Navbar.tsx` — Sticky header
- `componets/layouts/Footer.tsx` — Multi-column footer
- `componets/landing/HeroUpload.tsx` — Main drag-and-drop upload UI that orchestrates the full analyze → PDF download workflow

### Key Dependencies

- `dji-log-parser-js` — DJI flight log parsing (custom type declaration in `types/dji-log-parser-js.d.ts`)
- `@dronedeploy/flight-log-parser` — Additional log format support
- `pdf-lib` — PDF generation
- Tailwind CSS 4 with PostCSS

### Path Aliases

`@/*` maps to the project root (configured in `tsconfig.json`).
