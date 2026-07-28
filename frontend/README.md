# frontend

The hadees web app — Next.js 16 (App Router, Turbopack), Tailwind CSS 4, shadcn/ui.

## Development

Install from the **repo root** only (this is a pnpm workspace):

```bash
pnpm install
```

The reader needs a running, seeded backend. From the repo root:

```bash
pnpm --filter backend db:push
pnpm --filter backend db:seed   # ~42,000 narrations from data-collection/
pnpm dev                        # frontend (3004) + backend (3003) together
pnpm dev:frontend               # http://localhost:3004
```

Copy `.env.example` to `.env.local` and point `API_URL` at the backend (its port
comes from `backend/.env`, currently 3003; Swagger at `/docs`). `API_URL` is
server-side only — read it in Server Components or Server Actions, never in
client code.

## Regenerating the API types

`src/lib/api/schema.d.ts` is generated from the backend's OpenAPI document and
committed. With the backend running:

```bash
pnpm --filter frontend gen:api
```

## Checks

```bash
pnpm typecheck:frontend
pnpm lint:frontend
pnpm build:frontend
```

## Conventions

Deliberate divergences from the `backend` workspace are recorded in
`docs/adr/0001-frontend-stack.md`. The reader's own architecture and design
language — the API client, the component layer, and the Next 16 constraints that
shaped both — are in `docs/adr/0003-reader-frontend.md`.
