# Idea Log — project context

A personal **idea log**: a card-based catalogue of product/project/game ideas with full
add/edit/delete. Modelled on a light pastel card showcase; architecture cloned from
`jarvis-dashboard` (its sibling in the Jarvis constellation).

- **Stack:** Next.js 16 + React 19 + Tailwind 4, SQLite via `better-sqlite3`. App Router.
- **Repo:** `BrewerIndustries/idea-log` (private). Working copy: `~/Desktop/Jarvis/idea-log`
  (standalone repo; the Jarvis repo `.gitignore`s it).

## Environments (both on the jarvis server, `dan@100.102.159.57`, over Tailscale)

| Env  | Branch | Path                | Port | Service        | URL                               |
| ---- | ------ | ------------------- | ---- | -------------- | --------------------------------- |
| DEV  | `dev`  | `/opt/idea-log-dev` | 4670 | `idea-log-dev` | https://idea-log.dev.dabrewer.dev |
| MAIN | `main` | `/opt/idea-log`     | 4660 | `idea-log`     | https://idea-log.dabrewer.dev     |

Each env is a git checkout (read-only deploy key `~/.ssh/idea-log-deploy`, host alias
`github-idea-log`) with its **own `.env` (separate `JARVIS_TOKEN`) and isolated SQLite
DB**. `.env`, `data/`, `node_modules/`, `.next/` are gitignored — server-only.

DEV's `.env` sets **`JARVIS_ENV=dev`** → amber non-prod banner + `[DEV]` title. MAIN
leaves it unset; the prod unit's `PORT=4660` also hard-suppresses the banner. Read at
request time (`page.tsx` is `force-dynamic`), so `.env` edit + restart suffices.

## Workflow  ⚠️ READ THIS

- **Work on `dev`.** Push to `dev` and deploy DEV freely.
- **Never promote to `main` without the user's explicit permission — and only via an
  approved PR** (`gh pr create --base main --head dev`). Do NOT fast-forward or
  `git push origin dev:main` (the user treats FF shortcuts as cheating review; the
  harness blocks `git merge` / main pushes). `main` is production.

```bash
git push origin dev
ssh dan@100.102.159.57 /opt/idea-log-dev/deploy/update-dev.sh    # → DEV (:4670)
# after the user approves + merges a dev→main PR:
ssh dan@100.102.159.57 /opt/idea-log/deploy/update.sh           # → MAIN (:4660)
```

## Data model (one `ideas` table — see `src/lib/types.ts`)

- Header: `title`, `subtitle`, `icon` (emoji), `accent` (palette key), `stage`
  (`seed|exploring|building|shipped|shelved`), `pinned`, `concept`.
- `tags`: JSON `string[]`; chip colour is derived by hashing the label (no colour stored).
- `sections`: JSON ordered `Block[]`. Four block types generalise the reference's
  sections: `grid` (name+desc cards), `phases` (dot+name+text), `list` (callout box with
  a `tone`), `links` (label+url). The editor is "add block → pick type".
- Sort: `pinned DESC, updatedAt DESC`. A fresh/empty DB is **seeded** with the five
  reference ideas (`src/lib/seed.ts`); deletable.

## Architecture map

- `src/lib/db.ts` — SQLite open/cache/WAL + CRUD with JSON columns; `sanitizeBlocks`
  validates untrusted block data; `seed()` runs on an empty DB.
- `src/lib/types.ts` — `ACCENT` palette/map, `STAGES`, `Block` union, `Idea`, `tagAccent`.
- `src/lib/auth.ts` — `isAuthorized` (Bearer or `x-jarvis-token`; open if no token set).
- `src/app/api/ideas/route.ts` — `GET`/`POST`; `…/[id]/route.ts` — `PATCH`/`DELETE`.
- `src/app/page.tsx` — resolves `JARVIS_ENV`; **hard prod guard keys off `PORT === "4660"`**.
- `src/components/IdeaLog.tsx` — client UI: fetch `/api/ideas` (refetch-after-write, no
  polling), token bar (`localStorage` `idea-log-token`), search + stage filter, env banner.
- `src/components/IdeaCard.tsx` — one card + the four block renderers.
- `src/components/IdeaEditor.tsx` — add/edit modal with the typed block editor.
- `src/app/globals.css` — light card theme (ported from the reference design).
- `.jarvis.json` — registry declaration (`id`, `name`, `category: standalone`, per-env
  `status` + `deploy.port`), read by the Launcher + Dashboard registry sync.
- `deploy/` — `idea-log.service` / `idea-log-dev.service`, `update.sh` / `update-dev.sh`,
  `README.md`.

## Constellation wiring

- **Launcher** (`BrewerIndustries/jarvis-launcher`): an `AppDef` in `DEFAULT_APPS`
  (`src/lib/apps.ts`), category `standalone`, `prodPort: 4660`. URL auto-derives to
  `idea-log.dabrewer.dev` / `idea-log.dev.dabrewer.dev`.
- **Dashboard** (`BrewerIndustries/jarvis-dashboard`): `idea-log` added to `REPOS` +
  `DEFAULTS` in `scripts/sync-registry.mjs`; the registry sync reads this repo's
  `.jarvis.json`.
- nginx proxies the two subdomains to `:4660` / `:4670`; prod DNS is a Cloudflare A record,
  dev is the `*.dev.dabrewer.dev` wildcard.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000  (.env.local: JARVIS_TOKEN=test)
npm run build    # run before deploying — catches native-module / TS issues
```
