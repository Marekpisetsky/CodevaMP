# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js (App Router) TypeScript project.

- `src/app/`: route entry points (`page.tsx`, `layout.tsx`, `error.tsx`) and route-local UI.
- `src/app/components/`: shared React components.
- `src/app/lib/`: app services/integrations (for example Supabase helpers).
- `src/brands/`: multi-brand catalog and tokens.
- `src/shared/`: cross-brand routes and shared modules.
- `public/`: static assets (icons, textures, OG media).

Use `@/*` imports (mapped to `src/*`) instead of long relative paths.

## Build, Test, and Development Commands
- `npm run dev`: starts local dev server (`http://localhost:3000`).
- `npm run lint`: runs ESLint (`next/core-web-vitals` + TypeScript rules).
- `npm run build`: production build (`next build --turbopack`).
- `npm run start`: serves the production build.

Recommended local loop:
```bash
npm install
npm run lint
npm run dev
```

## Coding Style & Naming Conventions
- Use TypeScript and functional React components.
- Indentation: 2 spaces; keep JSX and props readable.
- Follow Next naming conventions exactly: `page.tsx`, `layout.tsx`, `error.tsx`.
- Use kebab-case for component files (for example `site-shell.tsx`).
- Prefer explicit types for props, API payloads, and shared constants.

## Testing Guidelines
No dedicated test framework is configured yet.

- Required checks before PR: `npm run lint` and `npm run build`.
- Manually verify affected routes (especially `/visuales` flows) in dev mode.
- If adding tests, use `*.test.ts` / `*.test.tsx` and colocate with feature code or add a `tests/` directory.

## Commit & Pull Request Guidelines
Recent history includes informal messages (`holap`, `hola bb`). Do not continue that pattern.

- Use clear, imperative commits: `feat(visuales): add hero quick actions`.
- Keep scope in the subject (`fix(nav)`, `refactor(brands)`, `chore(build)`).

PRs must include:
- short description of behavior changes,
- linked issue/task when available,
- screenshots for UI changes,
- validation notes (`npm run lint`, `npm run build`).

## Security & Configuration Tips
- Store secrets only in `.env.local`; never commit credentials.
- Review `next.config.ts` headers/CSP changes carefully.
- Treat Supabase keys and auth flows in `src/app/lib/supabase.ts` as sensitive code paths.
