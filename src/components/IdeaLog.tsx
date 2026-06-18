"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { STAGES, STAGE_LABEL, type Idea, type Stage } from "@/lib/types";
import IdeaCard from "./IdeaCard";
import IdeaEditor from "./IdeaEditor";

const TOKEN_KEY = "idea-log-token";

function payloadFrom(d: Idea) {
  return {
    title: d.title,
    subtitle: d.subtitle,
    icon: d.icon,
    accent: d.accent,
    stage: d.stage,
    concept: d.concept,
    tags: d.tags,
    sections: d.sections,
    pinned: d.pinned,
  };
}

export default function IdeaLog({ env }: { env?: string | null }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "">("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Idea | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY) ?? "");
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/ideas", { cache: "no-store" });
      const data = await res.json();
      setIdeas(data.ideas ?? []);
    } catch {
      /* keep last good state */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveToken = (v: string) => {
    setToken(v);
    localStorage.setItem(TOKEN_KEY, v);
  };

  const headers = useCallback(
    (json: boolean): Record<string, string> => ({
      ...(json ? { "content-type": "application/json" } : {}),
      ...(token ? { "x-jarvis-token": token } : {}),
    }),
    [token],
  );

  // Create (POST) or update (PATCH). Throws on failure so the editor can show it.
  const createOrUpdate = useCallback(
    async (draft: Idea) => {
      const isNew = !draft.id;
      const res = await fetch(isNew ? "/api/ideas" : `/api/ideas/${draft.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: headers(true),
        body: JSON.stringify(payloadFrom(draft)),
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? "Unauthorized — set your token with the 🔑 button (bottom-right)."
            : `Save failed (${res.status}).`,
        );
      }
      await refresh();
    },
    [headers, refresh],
  );

  const remove = useCallback(
    async (idea: Idea) => {
      if (!confirm(`Delete “${idea.title}”? This can't be undone.`)) return;
      setIdeas((prev) => prev.filter((x) => x.id !== idea.id));
      const res = await fetch(`/api/ideas/${idea.id}`, { method: "DELETE", headers: headers(false) });
      if (!res.ok && res.status === 401) {
        alert("Unauthorized — set your token with the 🔑 button (bottom-right).");
      }
      refresh();
    },
    [headers, refresh],
  );

  const togglePin = useCallback(
    async (idea: Idea) => {
      setIdeas((prev) => prev.map((x) => (x.id === idea.id ? { ...x, pinned: !x.pinned } : x)));
      await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: headers(true),
        body: JSON.stringify({ pinned: !idea.pinned }),
      });
      refresh();
    },
    [headers, refresh],
  );

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (idea: Idea) => {
    setEditing(idea);
    setEditorOpen(true);
  };
  const closeEditor = () => setEditorOpen(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ideas.filter((it) => {
      if (stageFilter && it.stage !== stageFilter) return false;
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        it.subtitle.toLowerCase().includes(q) ||
        it.concept.toLowerCase().includes(q) ||
        it.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [ideas, query, stageFilter]);

  return (
    <>
      {env && <div className="env-banner">⚠ {env} environment — not production</div>}

      <div className="wrap">
        <div className="log-header">
          <span style={{ fontSize: 22 }}>💡</span>
          <span className="log-title">Idea log</span>
          <span className="count-badge">
            {ideas.length} idea{ideas.length === 1 ? "" : "s"}
          </span>
          <div className="header-spacer" />
          <button className="btn btn-primary" onClick={openNew}>
            + New idea
          </button>
        </div>

        <div className="toolbar">
          <input
            className="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ideas…"
          />
          <div className="stage-filter">
            <button className="chip-toggle" data-on={stageFilter === ""} onClick={() => setStageFilter("")}>
              All
            </button>
            {STAGES.map((s) => (
              <button
                key={s}
                className="chip-toggle"
                data-on={stageFilter === s}
                onClick={() => setStageFilter(stageFilter === s ? "" : s)}
              >
                {STAGE_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="empty">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="empty">
            {ideas.length === 0 ? "No ideas yet — capture your first one." : "No ideas match your filter."}
          </p>
        ) : (
          filtered.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onEdit={openEdit} onDelete={remove} onTogglePin={togglePin} />
          ))
        )}
      </div>

      <TokenBar token={token} onSave={saveToken} />

      {editorOpen && <IdeaEditor initial={editing} onSave={createOrUpdate} onClose={closeEditor} />}
    </>
  );
}

function TokenBar({ token, onSave }: { token: string; onSave: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(token);
  useEffect(() => setDraft(token), [token]);

  return (
    <div className="token-bar">
      {open ? (
        <div className="token-box">
          <input
            className="input"
            type="password"
            style={{ width: 180 }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="JARVIS_TOKEN"
          />
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              onSave(draft);
              setOpen(false);
            }}
          >
            Save
          </button>
        </div>
      ) : (
        <button
          className="token-pill"
          onClick={() => setOpen(true)}
          title="Set the token used for edits from this browser"
        >
          🔑 {token ? "token set" : "set token"}
        </button>
      )}
    </div>
  );
}
