# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Windows desktop app (Electron + React + TypeScript) for a small warehouse: records
PZ (przyjęcie/receipt) and WZ (wydanie/issue) documents, generates PDFs for them,
and appends every line item to a growing `magazyn.xlsx`. Single user, single machine,
local SQLite as the source of truth — no backend, no auth, no cloud.

The full task breakdown (13 sequential tasks) and the product/architecture decisions
behind it live in commit history — each commit message is prefixed `Zadanie N: ...`.
`git log --oneline` is the fastest way to see what's implemented vs. still pending.

## Commands

```bash
npm install        # postinstall runs `electron-builder install-app-deps`,
                    # which rebuilds better-sqlite3 against Electron's ABI
npm run dev         # electron-vite dev server + Electron window
npm run typecheck   # tsc --noEmit for both main/preload (tsconfig.node.json) and
                     # renderer (tsconfig.web.json) — run typecheck:node /
                     # typecheck:web separately when iterating on just one side
npm run lint        # eslint --cache . (add --fix to auto-fix)
npm run format      # prettier --write .
npm run build       # typecheck, then electron-vite build (out/main, out/preload, out/renderer)
npm run build:win   # build + electron-builder --win (target platform for this project)
```

There is no test suite yet.

### Environment gotchas (already hit once, don't rediscover)

- **better-sqlite3 is a native module.** On a fresh Linux/WSL2 dev box it needs
  `make`/`gcc`/`g++` (`sudo apt install build-essential`) before `npm install` can
  compile it — there's no way around this from inside a sandboxed session.
- **npm's `approve-scripts` gate.** After `npm install`, if you see packages listed
  as having unreviewed install scripts, run `npm approve-scripts --allow-scripts-pending`
  to see them, then `npm approve-scripts <pkg>`. For `esbuild` specifically use
  `npm approve-scripts esbuild --no-allow-scripts-pin` — pinning breaks because two
  esbuild versions coexist in the tree across installs.
- **Dev vs prod DB files are separate** (`magazyn-dev.db` vs `magazyn.db`, both in
  Electron's `userData` path) specifically so `npm run dev` never touches
  packaged-app data — see `src/main/utils/paths.ts`.

## Architecture

### Process split (electron-vite)

Three independent build targets, each with its own `tsconfig`:

- `src/main/` — Node/Electron main process (`tsconfig.node.json`)
- `src/preload/` — contextBridge preload script (also `tsconfig.node.json`)
- `src/renderer/src/` — React app (`tsconfig.web.json`)
- `src/shared/` — types/schemas/constants imported by *all three* sides via the
  `@shared/*` path alias (configured identically in `electron.vite.config.ts` and
  both tsconfigs — if you add a new alias, it needs to go in three places)

### IPC: one contract, not three separate ones

The whole IPC surface is generated from a single source of truth,
`src/shared/ipc-channels.ts` (`IPC_CHANNELS`, `domain:action` naming). Everything
else mirrors it:

- `src/preload/api.ts` exposes `window.api.<domain>.<action>()` via
  `ipcRenderer.invoke`, typed against `src/shared/types/*`
- `src/main/ipc/<domain>.handlers.ts` registers one `ipcMain.handle` per channel,
  wrapped through `src/main/ipc/handleIpc.ts`
- `src/main/ipc/index.ts::registerAllHandlers()` is the single place that wires up
  every domain's handlers, called once from `src/main/index.ts` after migrations run

**Error contract:** handlers never let raw errors cross the IPC boundary. Throw
`AppError(code, message)` (`src/main/utils/errors.ts`) from services; `handleIpc`
catches it and rethrows as `Error(JSON.stringify({ code, message }))`. On the
renderer side, `parseIpcError()` (`src/shared/utils/ipcError.ts`) extracts that
payload back out of Electron's wrapped rejection message — always go through it
rather than reading `err.message` directly, since Electron prefixes/wraps it.

**Validation:** request payloads are validated with zod schemas from
`src/shared/schemas/*` — the *same* schema is used for `react-hook-form`'s
`zodResolver` in the renderer and for `parseOrThrow()` (`src/main/utils/validate.ts`)
in the IPC handler, so client-side and server-side validation can't drift apart.
Note the `emptyToNull` preprocessing pattern in `src/shared/schemas/kontrahent.ts`:
optional text fields are `nullable()`, but HTML inputs submit `''`, not `null`, so
schemas `z.preprocess()` empty strings to `null` before the `nullable()` check.
Forms consequently need `z.input<Schema>` (raw form shape) vs `z.output<Schema>`
(validated shape) as two different `useForm` generics — see `KontrahentForm.tsx`.

### Data layer

- `src/main/db/connection.ts` — singleton `getDb()`, opens SQLite with
  `journal_mode = WAL` and `foreign_keys = ON`
- `src/main/db/migrations/` — hand-rolled, versioned, forward-only migrations
  (`{ version, name, sql }` objects, not `.sql` files, so they bundle with Vite).
  `db/runner.ts::runMigrations()` tracks applied versions in a `schema_migrations`
  table and runs each new one inside a transaction. No down-migrations by design.
- Services (`src/main/services/*Service.ts`) own their own cached prepared
  statements (module-level, lazily initialized on first call since `getDb()` isn't
  safe to call at import time) and are the only code that touches SQL. IPC handlers
  never construct SQL directly.

Schema: `Kontrahenci` (counterparties, soft-deleted via `aktywny` flag — never
hard-deleted, since `Dokumenty` FKs reference them) → `Dokumenty` (PZ/WZ header,
auto-numbered `TYP/NNN/ROK` via a `Liczniki(typ, rok)` counter that resets itself
each year because the counter is keyed by year) → `PozycjeDokumentu` (line items,
1:N).

### Renderer

React Router `HashRouter` (required — the packaged renderer loads from `file://`,
where path-based routing breaks) with `AppShell` as the persistent layout and pages
under `src/renderer/src/pages/`. Tailwind v4 via the `@tailwindcss/vite` plugin
(`@import 'tailwindcss'` in `assets/main.css`, no separate PostCSS config file).

Data-fetching hooks (`src/renderer/src/hooks/`) follow one pattern: `useState` for
data/loading/error, an internal `async function load()` *inside* the effect (not
top-level `setState` calls in the effect body — the stricter
`react-hooks/set-state-in-effect` lint rule flags that), and a `cancelled` flag
guard against stale responses on unmount/re-run.

### Not implemented yet

`resources/fonts/` and `resources/templates/` exist as empty placeholders for
upcoming work: PDF generation needs a bundled Polish-diacritic-capable font
(pdf-lib's standard fonts don't cover ą/ć/ę/ł/ń/ó/ś/ź/ż — a custom font must be
embedded via `@pdf-lib/fontkit`), and CMR document generation needs a template PDF
that hasn't been supplied yet. `electron-builder.yml` still has the scaffolded
mac/linux config; this project targets Windows only, to be trimmed when the
packaging task is done.
