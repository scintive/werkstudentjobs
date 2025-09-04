# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages, layouts, and API routes (`src/app/api/**/route.ts`).
- `src/components`: Reusable UI and feature components (`*.tsx`).
- `src/lib`: Core logic (services, contexts, utils) and Supabase client/schema.
- `src/templates`: Resume templates and render logic (`*.ts`).
- `public`: Static assets served at `/`.
- `tests`: Playwright E2E specs (`*.spec.ts`).
- `supabase_migrations`: SQL migrations; keep in sync with `src/lib/supabase`.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server with Turbopack at `http://localhost:3000`.
- `npm run build`: Production build.
- `npm start`: Run the production server.
- `npm run lint`: Lint with Next.js ESLint config.
- `npx playwright test`: Run E2E tests. Uses `http://localhost:3001` and auto-starts dev via config.
- `npx playwright test --ui`: Visual test runner.

## Coding Style & Naming Conventions
- **Language**: TypeScript (`strict: true`). Prefer `*.tsx` for React components, `*.ts` for libs.
- **Indentation**: 2 spaces; semicolons required; single quotes preferred.
- **React**: Components in `PascalCase`; hooks as `useX`; contexts in `src/lib/contexts`.
- **Files**: Services in `src/lib/services` as `SomethingService.ts`; API routes under `src/app/api/.../route.ts`.
- **Imports**: Use `@/*` path alias.
- **Styling**: Tailwind CSS (globals in `src/app/globals.css`). Keep class names small and composable.
- **Linting**: ESLint with `next/core-web-vitals` + TypeScript rules.

## Testing Guidelines
- **Framework**: Playwright (`@playwright/test`). Specs live in `tests/*.spec.ts`.
- **Server**: Config runs dev at port `3001` and points `baseURL` there.
- **Conventions**: Use descriptive test names and selectors; avoid brittle text selectors.
- **Run**: `npx playwright test` (add `--project=chromium` to isolate).

## Commit & Pull Request Guidelines
- **Commits**: Imperative mood, concise scope. Prefer Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:` (e.g., `feat(editor): add skills manager`).
- **PRs**: Clear description, linked issues, steps to verify, and screenshots/GIFs for UI changes. Ensure `npm run lint` and tests pass locally.

## Security & Configuration
- **Env**: Copy `.env.example` to `.env.local`. Do not commit secrets.
- **Supabase**: Keys/config in `src/lib/supabase`. Version schema changes in `supabase_migrations/` and keep SQL files in sync.
