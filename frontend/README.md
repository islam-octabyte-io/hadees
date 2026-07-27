# frontend

The hadees web app — Next.js 16 (App Router, Turbopack), Tailwind CSS 4, shadcn/ui.

## Development

Install from the **repo root** only (this is a pnpm workspace):

```bash
pnpm install
```

Then, from the repo root:

```bash
pnpm dev:frontend        # http://localhost:3001
pnpm dev                 # frontend (3001) + backend (3000) together
```

The backend API runs on port 3000 (Swagger at http://localhost:3000/docs). Copy
`.env.example` to `.env.local` and set `API_URL` to point at it. `API_URL` is
server-side only — read it in Server Components or Route Handlers, never in
client code.

## Checks

```bash
pnpm typecheck:frontend
pnpm lint:frontend
pnpm build:frontend
```

## Conventions

Deliberate divergences from the `backend` workspace are recorded in
`docs/adr/0001-frontend-stack.md`.
