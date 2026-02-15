# Architecture Guide

## Goal
Scale CodevaMP as a multi-brand platform (main brand + mini companies) in one codebase, with predictable extension points.

## Folders
- `src/brands/`: brand registry and design tokens.
- `src/features/`: feature-domain modules by mini company (e.g. `visuales`, future `audio`).
- `src/shared/`: shared infrastructure (routes, auth helpers, UI primitives, utilities).
- `src/app/`: Next.js routes and composition layer.

## Brand Registry
- Define each mini company in `src/brands/catalog.ts`.
- Required fields: `id`, `name`, `basePath`, `tagline`, `description`, `palette`, `quickLinks`, `homeTileRoutes`.
- Access brand config via `getBrandConfig()` / `getBrandByPath()` from `src/brands/index.ts`.

## Central Routes
- Register canonical paths in `src/shared/routes/brand-routes.ts`.
- Do not hardcode top-level routes in feature components when a route already exists in `APP_ROUTES`.

## Feature Isolation Rules
- Brand-specific logic must stay in its feature/domain files.
- Shared logic (auth session behavior, route helpers, generic UI patterns) must live in `src/shared`.
- New mini company rollout: add catalog entry + route constants first, then route pages.

## Iteration Workflow
1. Add/modify brand in `src/brands/catalog.ts`.
2. Register route in `src/shared/routes/brand-routes.ts`.
3. Wire UI entry point (home links, tile routes, nav).
4. Implement feature routes under `src/app/{brand}`.
5. Run `npm run lint` and `npm run build`.

## Visual Identity Policy
- Global signature color is **orange**.
- Secondary palette: white, black, and grayscale.
- Brand accents must be intentional and high-contrast. Avoid unrelated signature colors.
