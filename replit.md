# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── trading-dashboard/  # MetaTrader Analytics Dashboard (React + Vite, frontend-only)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Artifacts

### `artifacts/trading-dashboard` — MetaTrader Analytics Dashboard

A fully browser-based MetaTrader trading report analyzer. No backend required — all analysis runs locally in the browser.

**Features:**
- Excel file parsing via SheetJS (xlsx)
- Core performance metrics: win rate, profit factor, drawdown, expectancy, streaks, etc.
- Equity curve chart (Recharts AreaChart)
- Monthly, weekly, session, and hourly performance breakdown
- Symbol performance table + chart
- Buy vs sell direction analysis (PieChart)
- Psychological pattern detection (overtrading, revenge trading, fear exits, etc.)
- AI-generated trading insights (computed locally, no API)
- Time filtering: 1W / 1M / 3M / 6M / 1Y / All / Custom date range
- Multi-language: English, Arabic (RTL), French
- Dark / Light mode with smooth animated transitions

**Key files:**
- `src/lib/tradeAnalysis.ts` — All analytics logic (metrics, session/hourly/daily/symbol analysis, psych patterns)
- `src/lib/excelParser.ts` — SheetJS-based MetaTrader Excel parser
- `src/lib/i18n.ts` — Translations (EN, AR, FR)
- `src/pages/Dashboard.tsx` — Main dashboard with all sections
- `src/components/charts/` — Recharts chart components
- `src/components/FileUpload.tsx` — Drag & drop file upload
- `src/components/Navbar.tsx` — Top nav with theme + language switcher

**Dependencies:** `xlsx`, `recharts`, `lucide-react`, `date-fns`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`).

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/`.
