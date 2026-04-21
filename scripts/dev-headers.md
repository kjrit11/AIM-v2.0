# Local dev auth — how it works

In production, Databricks Apps sits in front of the Next.js server and attaches
`x-forwarded-*` headers to every request (see `docs/ARCHITECTURE.md` § Auth).
Locally there is no proxy, so those headers never arrive, and
`getDatabricksUser()` would return `null` — breaking every protected route.

## The dev shim

`src/lib/databricksUser.ts` detects `NODE_ENV === 'development'` and, when the
`x-forwarded-*` headers are missing, dynamically `require()`s
`src/lib/devAuth.ts` and returns a hardcoded user:

```ts
{
  userId: 'dev-user-local',
  workspaceId: 'dev-workspace',
  email: 'dev@local.test',
  username: 'dev@local.test',
  accessToken: null,
}
```

## Running locally

```
npm run dev
```

That's it. Hitting `http://localhost:3000/dashboard` will authenticate as
`dev@local.test` with no OAuth round-trip.

## Why the dynamic `require`

`require('./devAuth')` inside a `NODE_ENV === 'development'` branch is
tree-shaken out of production bundles by the Next.js/webpack dead-code
elimination pass — the shim never ships to Databricks. Avoid converting it
to a static `import` or the shim will leak into the prod bundle.

## Future: overriding the dev user

Right now the dev user is hardcoded. When we need to test role derivation
(Phase 3+), we'll add `.env.local` support (e.g. `DEV_USER_EMAIL`,
`DEV_USER_ROLE`) and have `getDevUser()` read from `process.env`. Not yet
implemented — add when Phase 3 introduces roles.
