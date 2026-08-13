# Idea Log

A personal **idea log** — a running, card-based catalogue of product, project, and
game ideas. Capture an idea with a title, an icon, tags, a concept, and as many
structured sections (feature grids, progression phases, callout lists, reference
links, **markdown notes**) as you like; **attach images and files** to any idea;
edit and delete them inline. Styled after a light, pastel card showcase.

Part of the Jarvis constellation: it lives on the jarvis server with the usual
dev/prod split and shows up as a tile in the Launcher + Dashboard.

- **Stack:** Next.js 16 + React 19 + Tailwind 4, SQLite via `better-sqlite3`.
  File attachments use Cloudflare R2 (optional — see below).
- **Repo:** `BrewerIndustries/idea-log` (private). Local working copy: `~/Desktop/Jarvis/idea-log`
  (a standalone repo inside the Jarvis folder; the Jarvis repo `.gitignore`s it).

## Environments (both on the jarvis server, `dan@100.102.159.57`, over Tailscale)

| Env  | Branch | Path                | Port | Service        | URL                               |
| ---- | ------ | ------------------- | ---- | -------------- | --------------------------------- |
| DEV  | `dev`  | `/opt/idea-log-dev` | 4670 | `idea-log-dev` | https://idea-log.dev.dabrewer.dev |
| MAIN | `main` | `/opt/idea-log`     | 4660 | `idea-log`     | https://idea-log.dabrewer.dev     |

Each env is a git checkout with its **own `.env` (separate `JARVIS_TOKEN`) and isolated
SQLite DB**. DEV's `.env` sets `JARVIS_ENV=dev` → amber non-prod banner; MAIN leaves it
unset (and is hard-guarded by its `:4660` port). See [deploy/README.md](deploy/README.md).

## Workflow  ⚠️

- **Work on `dev`.** Push to `dev` and deploy DEV freely.
- **Never promote to `main` without the user's explicit approval — via a PR, never a
  fast-forward / `git push origin dev:main`.** `main` is production and holds real data.

```bash
git push origin dev
ssh dan@100.102.159.57 /opt/idea-log-dev/deploy/update-dev.sh    # → DEV (:4670)
# after an approved dev→main PR merges:
ssh dan@100.102.159.57 /opt/idea-log/deploy/update.sh            # → MAIN (:4660)
```

## Local development

```bash
npm install
npm run dev            # http://localhost:3000  (.env.local with JARVIS_TOKEN=test)
npm run build          # production build (run before deploying)
```

A fresh/empty database is **seeded** with five example ideas so the app looks alive on
first run; they're editable and deletable like anything else.

## Data model (one `ideas` table)

- `title`, `subtitle`, `icon` (emoji), `accent` (palette key), `stage`
  (`seed | exploring | building | shipped | shelved`), `concept`, `pinned`
- `tags` — JSON `string[]` (chip colour derived by hashing the label)
- `sections` — JSON ordered list of typed blocks: `grid` (feature/name+desc),
  `phases` (dot + name + text), `list` (callout box), `links` (label + url),
  `doc` (markdown note, rendered by a small dependency-free renderer)
- `attachments` — JSON list of `{ id, name, mime, size, key }`; the bytes live in
  R2, the DB only holds this metadata (column added by an in-code migration)

## Attachments (Cloudflare R2)

Ideas can carry images and files. Bytes are stored in an R2 bucket over its
S3-compatible API (via `aws4fetch`); the app **proxies** them back through
`GET /api/attachments/<key>`, so no public bucket or custom domain is needed —
just four env vars. Object keys are auto-prefixed `dev/` vs `prod/` so both
environments can safely share one bucket. Uploads cap at 25 MB.

Set on the server (see `.env.example`); if unset, the app runs fine and uploads
return "storage not configured":

```
R2_ACCOUNT_ID=…   R2_ACCESS_KEY_ID=…   R2_SECRET_ACCESS_KEY=…   R2_BUCKET=…
```

> Removing an attachment in the editor drops its reference; the R2 object is left
> in place (no auto-delete in v1) to avoid data loss on an accidental remove+cancel.

## API

- `GET /api/ideas` — list (open)
- `POST /api/ideas` — create (token-gated); one idea or `{ ideas: [...] }`
- `PATCH /api/ideas/:id` — partial update (token-gated)
- `DELETE /api/ideas/:id` — delete (token-gated)
- `POST /api/attachments` — upload one file, `multipart/form-data` field `file`
  (token-gated); returns `{ attachment }`
- `GET /api/attachments/<key…>` — stream a stored file back (open)

Writes require `JARVIS_TOKEN` (header `x-jarvis-token` or `Authorization: Bearer`).
If `JARVIS_TOKEN` is unset, writes are open. The browser stores its token in
`localStorage` under `idea-log-token` (set it via the 🔑 button).

## Architecture map

- `src/lib/types.ts` — accent palette + `ACCENT` map, stages, `Block` union, `Idea`, `Attachment`
- `src/lib/db.ts` — SQLite + CRUD (JSON columns), block/attachment sanitising, seed-on-empty
- `src/lib/storage.ts` — R2 object storage (put/get/delete) over `aws4fetch`
- `src/lib/seed.ts` — the five reference ideas in block form
- `src/lib/auth.ts` — token check for writes
- `src/components/Markdown.tsx` — the dependency-free markdown renderer for `doc` blocks
- `src/app/api/ideas/route.ts` — `GET` / `POST`; `…/[id]/route.ts` — `PATCH` / `DELETE`
- `src/app/api/attachments/route.ts` — `POST` upload; `…/[...key]/route.ts` — `GET` stream
- `src/app/page.tsx` — server entry; resolves `JARVIS_ENV` (hard-guarded off `:4660`)
- `src/components/IdeaLog.tsx` — client UI (fetch, token bar, search/filter, env banner)
- `src/components/IdeaCard.tsx` — one card + block renderers
- `src/components/IdeaEditor.tsx` — the add/edit modal with the block editor
- `src/app/globals.css` — the light card theme
- `.jarvis.json` — registry declaration read by the Launcher + Dashboard
- `deploy/` — systemd units, deploy scripts, deploy guide
