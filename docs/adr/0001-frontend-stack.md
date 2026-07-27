# Frontend stack: Next.js 16, Tailwind CSS 4, shadcn/ui

The `frontend` workspace is a Next.js 16 app (App Router, Turbopack, `src/` layout) styled with Tailwind CSS 4 and shadcn/ui, scaffolded with `create-next-app` rather than hand-assembled so that the generated `next-env.d.ts`, TS plugin wiring and the validated `next`/`react` version pair stay correct. It lives at the repo root alongside `backend/`, matching the existing flat pnpm-workspace layout.

## Considered options

**shadcn base primitives: Radix, not Base UI.** The shadcn CLI (4.x) now defaults to Base UI, so `-b radix` is passed explicitly. Radix has the deeper ecosystem today — third-party blocks, registries and nearly all existing tutorials assume it. shadcn's docs state that most `components.json` settings cannot be changed after initialization, so this is effectively one-way. The `radix-nova` style (Lucide icons, Geist fonts) is recorded in `frontend/components.json`.

**Backend access: server-side only, no CORS.** Server Components and Route Handlers read a server-only `API_URL` (see `frontend/.env.example`); the browser only ever talks to the Next origin. This is why `backend/src/main.ts` deliberately does **not** call `app.enableCors()` and why there is no `NEXT_PUBLIC_API_URL` — dead CORS config is worse than none. If client-side fetching is ever needed, add a `rewrites()` proxy in `frontend/next.config.ts` rather than exposing the API origin to the bundle. Switching to `NEXT_PUBLIC_*` means enabling CORS on the backend for `http://localhost:3001`.

**Frontend on port 3001.** The backend owns 3000 (its `.env.example`, its Swagger URL at `/docs`). The port is hard-coded in the frontend's `dev`/`start` scripts rather than read from `PORT`, so a stray `PORT=3000` in the environment cannot cause a collision.

## Deliberate deviations from `backend/`

These differ from the backend workspace on purpose. They are not drift to be "fixed":

- **TypeScript `strict: true`.** `backend/tsconfig.json` is the stock Nest scaffold with `strict` off and `noImplicitAny: false`. The frontend is greenfield with no legacy to grandfather, and loosening strictness later is a one-way ratchet. There is no root `tsconfig.json` to inherit from.
- **Lint is not type-checked.** The backend uses typescript-eslint's `recommendedTypeChecked`; the frontend keeps `eslint-config-next`'s non-type-checked setup. Type safety comes from `pnpm typecheck:frontend` and `next build`. Type-checked linting over React and shadcn-generated code is mostly `no-unsafe-*` noise.
- **Prettier uses double quotes.** `backend/.prettierrc` sets `singleQuote: true`. The frontend sets `singleQuote: false` so that hand-written code matches what `create-next-app` and `shadcn add` generate — otherwise every generated file arrives as a lint error and reformatting shadcn's own files makes future `shadcn diff` noisy forever. Prettier still runs through ESLint (`eslint-plugin-prettier/recommended`) as in the backend.

## Consequences

- `pnpm-workspace.yaml` approves build scripts for `sharp` (a `next` optional dependency) and `unrs-resolver` (reached via `eslint-config-next`); pnpm 10 gates both by default.
- `create-next-app` writes a nested `frontend/pnpm-workspace.yaml`; it was deleted, since it would make `frontend/` its own workspace root and detach it from this monorepo.
- Turbopack infers its root from `pnpm-lock.yaml`, i.e. the repo root — which also holds the ~300 MB of tracked `.db` files in `data-collection/`. `turbopack.root` must **not** be pinned to `frontend/`: pnpm symlinks resolve into `<repo-root>/node_modules/.pnpm`, so a narrower root breaks module resolution. If watcher cost becomes a problem, relocating `data-collection/` is the fix.
- `frontend/AGENTS.md` (plus a `frontend/CLAUDE.md` that just includes it) is kept as generated — it warns coding agents that Next 16 diverges from their training data.
- The root `dev` script uses `pnpm run --parallel "/^(dev|start:dev)$/"` rather than a single script name, because the two workspaces name their watch script differently. No `turbo`/`concurrently` dependency is added; the root package still has zero dependencies.
