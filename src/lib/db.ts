import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { randomUUID } from "crypto";
import {
  ACCENT_KEYS,
  BLOCK_TYPES,
  accentOf,
  stageOf,
  type AccentKey,
  type Attachment,
  type Block,
  type Idea,
} from "./types";
import { SEED_IDEAS } from "./seed";

const DB_PATH =
  process.env.IDEA_LOG_DB_PATH ?? join(process.cwd(), "data", "ideas.db");

// In dev, Next.js reloads modules on every change; cache the connection so we
// don't open a new handle (and re-run migrations) on each request.
const globalForDb = globalThis as unknown as { _ideaLogDb?: Database.Database };

function init(): Database.Database {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS ideas (
      id        TEXT PRIMARY KEY,
      title     TEXT NOT NULL,
      subtitle  TEXT,
      icon      TEXT,
      accent    TEXT NOT NULL DEFAULT 'blue',
      stage     TEXT NOT NULL DEFAULT 'seed',
      concept   TEXT,
      tags      TEXT NOT NULL DEFAULT '[]',
      sections  TEXT NOT NULL DEFAULT '[]',
      pinned    INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ideas_updated ON ideas(updatedAt);
  `);

  // Migration: add the attachments column to databases created before it existed.
  // (SQLite has no ADD COLUMN IF NOT EXISTS, so probe the schema first.)
  const cols = db.prepare(`PRAGMA table_info(ideas)`).all() as { name: string }[];
  if (!cols.some((c) => c.name === "attachments")) {
    db.exec(`ALTER TABLE ideas ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]'`);
  }
  // `repo`: when an idea graduates to a real project, the repo/dashboard it handed
  // off to (name or URL). Added after the original schema.
  if (!cols.some((c) => c.name === "repo")) {
    db.exec(`ALTER TABLE ideas ADD COLUMN repo TEXT NOT NULL DEFAULT ''`);
  }
  // Idea Log no longer tracks "building"/"shipped" — once an idea becomes a project
  // the Dashboard owns its status. Fold any legacy rows into "graduated".
  db.exec(`UPDATE ideas SET stage='graduated' WHERE stage IN ('building','shipped')`);

  // Seed the reference ideas into a brand-new database so a fresh deploy looks
  // alive. Every seeded idea is editable/deletable like any other.
  const { n } = db.prepare(`SELECT COUNT(*) AS n FROM ideas`).get() as { n: number };
  if (n === 0) seed(db);

  return db;
}

export function getDb(): Database.Database {
  if (!globalForDb._ideaLogDb) globalForDb._ideaLogDb = init();
  return globalForDb._ideaLogDb;
}

// --- row <-> idea ------------------------------------------------------------

interface Row {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  accent: string;
  stage: string;
  repo: string;
  concept: string | null;
  tags: string;
  sections: string;
  attachments: string;
  pinned: number;
  createdAt: string;
  updatedAt: string;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function trimmed(v: unknown): string {
  return str(v).trim();
}
function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function accentOrUndef(v: unknown): AccentKey | undefined {
  return typeof v === "string" && (ACCENT_KEYS as readonly string[]).includes(v)
    ? (v as AccentKey)
    : undefined;
}

function sanitizeTags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(trimmed).filter(Boolean).slice(0, 24);
}

/** Validate untrusted block data (from the API or from stored JSON). */
function sanitizeBlocks(v: unknown): Block[] {
  if (!Array.isArray(v)) return [];
  const out: Block[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") continue;
    const b = raw as Record<string, unknown>;
    if (!(BLOCK_TYPES as readonly unknown[]).includes(b.type)) continue;
    const label = trimmed(b.label);
    const items = Array.isArray(b.items) ? b.items : [];

    if (b.type === "doc") {
      out.push({ type: "doc", label, text: str(b.text) });
    } else if (b.type === "grid") {
      out.push({
        type: "grid",
        label,
        items: items
          .map((it) => {
            const o = (it ?? {}) as Record<string, unknown>;
            return { name: trimmed(o.name), desc: trimmed(o.desc) };
          })
          .filter((it) => it.name || it.desc),
      });
    } else if (b.type === "phases") {
      out.push({
        type: "phases",
        label,
        items: items
          .map((it) => {
            const o = (it ?? {}) as Record<string, unknown>;
            const dot = accentOrUndef(o.dot);
            return { name: trimmed(o.name), text: trimmed(o.text), ...(dot ? { dot } : {}) };
          })
          .filter((it) => it.name || it.text),
      });
    } else if (b.type === "list") {
      const tone = accentOrUndef(b.tone);
      out.push({
        type: "list",
        label,
        ...(tone ? { tone } : {}),
        items: items.map(trimmed).filter(Boolean),
      });
    } else if (b.type === "links") {
      out.push({
        type: "links",
        label,
        items: items
          .map((it) => {
            const o = (it ?? {}) as Record<string, unknown>;
            return { label: trimmed(o.label), url: trimmed(o.url) };
          })
          .filter((it) => it.url || it.label),
      });
    }
  }
  return out;
}

/** Validate untrusted attachment metadata (from the API or from stored JSON). */
function sanitizeAttachments(v: unknown): Attachment[] {
  if (!Array.isArray(v)) return [];
  const out: Attachment[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const id = trimmed(o.id);
    const key = trimmed(o.key);
    if (!id || !key) continue; // both are set server-side on upload; skip malformed
    const size = typeof o.size === "number" && Number.isFinite(o.size) ? Math.max(0, Math.floor(o.size)) : 0;
    out.push({
      id,
      key,
      name: trimmed(o.name) || "file",
      mime: trimmed(o.mime) || "application/octet-stream",
      size,
    });
  }
  return out.slice(0, 50);
}

function rowToIdea(row: Row): Idea {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? "",
    icon: row.icon ?? "💡",
    accent: accentOf(row.accent),
    stage: stageOf(row.stage),
    repo: str(row.repo),
    concept: row.concept ?? "",
    tags: sanitizeTags(parseJson(row.tags)),
    sections: sanitizeBlocks(parseJson(row.sections)),
    attachments: sanitizeAttachments(parseJson(row.attachments)),
    pinned: row.pinned === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowFromIdea(idea: Idea) {
  return {
    id: idea.id,
    title: idea.title,
    subtitle: idea.subtitle || null,
    icon: idea.icon || null,
    accent: idea.accent,
    stage: idea.stage,
    repo: idea.repo || "",
    concept: idea.concept || null,
    tags: JSON.stringify(idea.tags),
    sections: JSON.stringify(idea.sections),
    attachments: JSON.stringify(idea.attachments),
    pinned: idea.pinned ? 1 : 0,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  };
}

const INSERT = `INSERT INTO ideas
  (id, title, subtitle, icon, accent, stage, repo, concept, tags, sections, attachments, pinned, createdAt, updatedAt)
  VALUES (@id, @title, @subtitle, @icon, @accent, @stage, @repo, @concept, @tags, @sections, @attachments, @pinned, @createdAt, @updatedAt)`;

// --- public API --------------------------------------------------------------

export interface IdeaInput {
  title?: unknown;
  subtitle?: unknown;
  icon?: unknown;
  accent?: unknown;
  stage?: unknown;
  repo?: unknown;
  concept?: unknown;
  tags?: unknown;
  sections?: unknown;
  attachments?: unknown;
  pinned?: unknown;
}

/** Create an idea from an arbitrary payload. Returns null if it has no title. */
export function createIdea(input: IdeaInput): Idea | null {
  const title = trimmed(input.title);
  if (!title) return null;
  const now = new Date().toISOString();
  const idea: Idea = {
    id: randomUUID(),
    title,
    subtitle: trimmed(input.subtitle),
    icon: trimmed(input.icon) || "💡",
    accent: accentOf(input.accent),
    stage: stageOf(input.stage),
    repo: trimmed(input.repo),
    concept: trimmed(input.concept),
    tags: sanitizeTags(input.tags),
    sections: sanitizeBlocks(input.sections),
    attachments: sanitizeAttachments(input.attachments),
    pinned: Boolean(input.pinned),
    createdAt: now,
    updatedAt: now,
  };
  getDb().prepare(INSERT).run(rowFromIdea(idea));
  return idea;
}

export function listIdeas(): Idea[] {
  return (
    getDb()
      .prepare(`SELECT * FROM ideas ORDER BY pinned DESC, updatedAt DESC`)
      .all() as Row[]
  ).map(rowToIdea);
}

export function getIdea(id: string): Idea | null {
  const row = getDb().prepare(`SELECT * FROM ideas WHERE id = ?`).get(id) as Row | undefined;
  return row ? rowToIdea(row) : null;
}

export function updateIdea(id: string, patch: IdeaInput): Idea | null {
  const existing = getIdea(id);
  if (!existing) return null;
  const next: Idea = {
    ...existing,
    title: patch.title !== undefined ? trimmed(patch.title) || existing.title : existing.title,
    subtitle: patch.subtitle !== undefined ? trimmed(patch.subtitle) : existing.subtitle,
    icon: patch.icon !== undefined ? trimmed(patch.icon) || "💡" : existing.icon,
    accent: patch.accent !== undefined ? accentOf(patch.accent) : existing.accent,
    stage: patch.stage !== undefined ? stageOf(patch.stage) : existing.stage,
    repo: patch.repo !== undefined ? trimmed(patch.repo) : existing.repo,
    concept: patch.concept !== undefined ? trimmed(patch.concept) : existing.concept,
    tags: patch.tags !== undefined ? sanitizeTags(patch.tags) : existing.tags,
    sections: patch.sections !== undefined ? sanitizeBlocks(patch.sections) : existing.sections,
    attachments: patch.attachments !== undefined ? sanitizeAttachments(patch.attachments) : existing.attachments,
    pinned: patch.pinned !== undefined ? Boolean(patch.pinned) : existing.pinned,
    updatedAt: new Date().toISOString(),
  };
  getDb()
    .prepare(
      `UPDATE ideas SET title=@title, subtitle=@subtitle, icon=@icon, accent=@accent,
        stage=@stage, repo=@repo, concept=@concept, tags=@tags, sections=@sections, attachments=@attachments,
        pinned=@pinned, updatedAt=@updatedAt WHERE id=@id`,
    )
    .run(rowFromIdea(next));
  return next;
}

export function deleteIdea(id: string): number {
  return getDb().prepare(`DELETE FROM ideas WHERE id = ?`).run(id).changes;
}

// --- seed --------------------------------------------------------------------

function seed(db: Database.Database) {
  const now = Date.now();
  const stmt = db.prepare(INSERT);
  const ideas: Idea[] = SEED_IDEAS.map((s, i) => ({
    id: randomUUID(),
    title: s.title,
    subtitle: trimmed(s.subtitle),
    icon: trimmed(s.icon) || "💡",
    accent: accentOf(s.accent),
    stage: stageOf(s.stage),
    repo: trimmed((s as { repo?: unknown }).repo),
    concept: trimmed(s.concept),
    tags: sanitizeTags(s.tags),
    sections: sanitizeBlocks(s.sections),
    attachments: [],
    pinned: Boolean(s.pinned),
    createdAt: new Date(now).toISOString(),
    // Stagger updatedAt so the list keeps the reference's order (first = top).
    updatedAt: new Date(now - i * 1000).toISOString(),
  }));
  const insertAll = db.transaction((rows: Idea[]) => rows.forEach((idea) => stmt.run(rowFromIdea(idea))));
  insertAll(ideas);
}
