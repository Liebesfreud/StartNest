# Contributing to AeroNav

Thanks for helping improve AeroNav.

## Local Setup

```bash
npm install
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with local-only credentials. Do not commit `.dev.vars`.

## Development

Start the frontend:

```bash
npm run dev
```

Start the Cloudflare Worker locally:

```bash
npm run cf:dev
```

Apply local D1 migrations:

```bash
npm run db:migrate:local
```

## Checks

Run these before opening a pull request:

```bash
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

## Migrations

Add a new migration for schema changes. Do not edit migrations that may already have been applied by other users.

Migration filenames must use unique, increasing numeric prefixes.

## Pull Requests

- Keep changes focused.
- Update README or docs when behavior changes.
- Avoid committing local state, generated build output, secrets, or machine-specific configuration.
