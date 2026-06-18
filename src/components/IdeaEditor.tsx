"use client";

import { useState } from "react";
import {
  ACCENT,
  ACCENT_KEYS,
  BLOCK_LABEL,
  STAGES,
  STAGE_LABEL,
  type AccentKey,
  type Block,
  type BlockType,
  type Idea,
} from "@/lib/types";

const BLANK: Idea = {
  id: "",
  title: "",
  subtitle: "",
  icon: "💡",
  accent: "blue",
  stage: "seed",
  concept: "",
  tags: [],
  sections: [],
  pinned: false,
  createdAt: "",
  updatedAt: "",
};

function emptyBlock(type: BlockType): Block {
  switch (type) {
    case "grid":
      return { type, label: "", items: [{ name: "", desc: "" }] };
    case "phases":
      return { type, label: "", items: [{ name: "", text: "" }] };
    case "list":
      return { type, label: "", tone: "rose", items: [""] };
    case "links":
      return { type, label: "", items: [{ label: "", url: "" }] };
  }
}

export default function IdeaEditor({
  initial,
  onSave,
  onClose,
}: {
  initial: Idea | null;
  onSave: (draft: Idea) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Idea>(initial ?? BLANK);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = <K extends keyof Idea>(key: K, value: Idea[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setSections = (fn: (s: Block[]) => Block[]) =>
    setDraft((d) => ({ ...d, sections: fn(d.sections) }));

  const replaceBlock = (bi: number, next: Block) =>
    setSections((s) => s.map((b, i) => (i === bi ? next : b)));
  const removeBlock = (bi: number) => setSections((s) => s.filter((_, i) => i !== bi));
  const moveBlock = (bi: number, dir: -1 | 1) =>
    setSections((s) => {
      const j = bi + dir;
      if (j < 0 || j >= s.length) return s;
      const next = s.slice();
      [next[bi], next[j]] = [next[j], next[bi]];
      return next;
    });
  const addBlock = (type: BlockType) => setSections((s) => [...s, emptyBlock(type)]);

  const addTag = (raw: string) => {
    const t = raw.replace(/,/g, "").trim();
    if (t && !draft.tags.includes(t)) set("tags", [...draft.tags, t]);
    setTagInput("");
  };

  const save = async () => {
    if (!draft.title.trim()) {
      setErr("Give it a title.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      await onSave(draft);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed.");
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">{initial ? "Edit idea" : "New idea"}</span>
          <div className="header-spacer" style={{ flex: 1 }} />
          <button className="icon-btn" title="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label className="field-label">Title</label>
            <input
              className="input"
              autoFocus
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Name of the idea"
            />
          </div>

          <div className="field">
            <label className="field-label">Subtitle</label>
            <input
              className="input"
              value={draft.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              placeholder="One-line summary"
            />
          </div>

          <div className="row">
            <div className="field">
              <label className="field-label">Icon</label>
              <input
                className="input"
                value={draft.icon}
                onChange={(e) => set("icon", e.target.value)}
                placeholder="💡"
              />
            </div>
            <div className="field" style={{ flex: 3 }}>
              <label className="field-label">Accent</label>
              <div className="swatches">
                {ACCENT_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="swatch"
                    title={k}
                    data-on={draft.accent === k}
                    style={{ background: ACCENT[k].tile }}
                    onClick={() => set("accent", k)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label className="field-label">Stage</label>
              <div className="seg">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="seg-btn"
                    data-on={draft.stage === s}
                    onClick={() => set("stage", s)}
                  >
                    {STAGE_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
            <div className="field" style={{ flex: "0 0 auto" }}>
              <label className="field-label">Pinned</label>
              <button
                type="button"
                className="chip-toggle"
                data-on={draft.pinned}
                onClick={() => set("pinned", !draft.pinned)}
              >
                {draft.pinned ? "★ Pinned" : "☆ Pin to top"}
              </button>
            </div>
          </div>

          <div className="field">
            <label className="field-label">Concept</label>
            <textarea
              className="textarea"
              value={draft.concept}
              onChange={(e) => set("concept", e.target.value)}
              placeholder="What is it? The core loop, the pitch, the gist…"
            />
          </div>

          <div className="field">
            <label className="field-label">Tags</label>
            <div className="tags" style={{ marginBottom: 6 }}>
              {draft.tags.map((t, i) => (
                <span key={i} className="tag" style={tagStyle(t)}>
                  {t}
                  <button
                    type="button"
                    onClick={() => set("tags", draft.tags.filter((_, j) => j !== i))}
                    style={{ marginLeft: 5, cursor: "pointer", background: "none", border: "none", color: "inherit" }}
                    title="Remove tag"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <input
              className="input"
              value={tagInput}
              onChange={(e) => {
                if (e.target.value.includes(",")) addTag(e.target.value);
                else setTagInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                } else if (e.key === "Backspace" && !tagInput && draft.tags.length) {
                  set("tags", draft.tags.slice(0, -1));
                }
              }}
              placeholder="Type a tag, press Enter"
            />
          </div>

          <div className="field">
            <label className="field-label">Sections</label>
            <div className="block-editor">
              {draft.sections.map((block, bi) => (
                <div className="block-box" key={bi}>
                  <div className="block-head">
                    <span className="block-kind">{BLOCK_LABEL[block.type]}</span>
                    <input
                      className="input"
                      value={block.label}
                      onChange={(e) => replaceBlock(bi, { ...block, label: e.target.value })}
                      placeholder="Section heading"
                    />
                    <button className="icon-btn" title="Move up" onClick={() => moveBlock(bi, -1)}>
                      ↑
                    </button>
                    <button className="icon-btn" title="Move down" onClick={() => moveBlock(bi, 1)}>
                      ↓
                    </button>
                    <button className="icon-btn danger" title="Remove section" onClick={() => removeBlock(bi)}>
                      ✕
                    </button>
                  </div>
                  <BlockEditor block={block} onChange={(next) => replaceBlock(bi, next)} />
                </div>
              ))}

              <div className="add-block">
                <span className="hint">Add section:</span>
                {(["grid", "phases", "list", "links"] as BlockType[]).map((t) => (
                  <button key={t} type="button" className="btn btn-sm" onClick={() => addBlock(t)}>
                    + {BLOCK_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {err && <div className="warn">{err}</div>}
        </div>

        <div className="modal-foot">
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : initial ? "Save changes" : "Create idea"}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <div style={{ flex: 1 }} />
          <span className="hint">Reads are open · edits need your token</span>
        </div>
      </div>
    </div>
  );
}

function tagStyle(label: string) {
  // mirror the card's deterministic tag colour
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
  const palette: AccentKey[] = ["blue", "teal", "purple", "amber", "coral", "sky", "rose", "green"];
  const a = ACCENT[palette[h % palette.length]];
  return { background: a.bg, color: a.fg, borderColor: a.border } as const;
}

// --- per-type block editors --------------------------------------------------

function BlockEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  if (block.type === "grid") {
    const set = (i: number, patch: Partial<{ name: string; desc: string }>) =>
      onChange({ ...block, items: block.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
    return (
      <div className="block-rows">
        {block.items.map((it, i) => (
          <div className="row-tight" key={i}>
            <input className="input" placeholder="Name" value={it.name} onChange={(e) => set(i, { name: e.target.value })} />
            <input className="input" placeholder="Description" value={it.desc} onChange={(e) => set(i, { desc: e.target.value })} />
            <RemoveRow onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })} />
          </div>
        ))}
        <AddRow label="+ item" onClick={() => onChange({ ...block, items: [...block.items, { name: "", desc: "" }] })} />
      </div>
    );
  }

  if (block.type === "phases") {
    const set = (i: number, patch: Partial<{ name: string; text: string; dot: AccentKey }>) =>
      onChange({ ...block, items: block.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
    return (
      <div className="block-rows">
        {block.items.map((it, i) => (
          <div className="row-tight" key={i}>
            <input className="input" style={{ flex: "0 0 28%" }} placeholder="Name" value={it.name} onChange={(e) => set(i, { name: e.target.value })} />
            <input className="input" placeholder="Text" value={it.text} onChange={(e) => set(i, { text: e.target.value })} />
            <select
              className="select"
              style={{ flex: "0 0 88px" }}
              value={it.dot ?? "gray"}
              onChange={(e) => set(i, { dot: e.target.value as AccentKey })}
              title="Dot colour"
            >
              {ACCENT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <RemoveRow onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })} />
          </div>
        ))}
        <AddRow label="+ phase" onClick={() => onChange({ ...block, items: [...block.items, { name: "", text: "" }] })} />
      </div>
    );
  }

  if (block.type === "list") {
    return (
      <div className="block-rows">
        <div className="row-tight">
          <span className="hint" style={{ flex: "0 0 auto" }}>Tone</span>
          <select
            className="select"
            style={{ flex: "0 0 110px" }}
            value={block.tone ?? "gray"}
            onChange={(e) => onChange({ ...block, tone: e.target.value as AccentKey })}
          >
            {ACCENT_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        {block.items.map((it, i) => (
          <div className="row-tight" key={i}>
            <input className="input" placeholder="Line" value={it} onChange={(e) => onChange({ ...block, items: block.items.map((v, j) => (j === i ? e.target.value : v)) })} />
            <RemoveRow onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })} />
          </div>
        ))}
        <AddRow label="+ line" onClick={() => onChange({ ...block, items: [...block.items, ""] })} />
      </div>
    );
  }

  // links
  const set = (i: number, patch: Partial<{ label: string; url: string }>) =>
    onChange({ ...block, items: block.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  return (
    <div className="block-rows">
      {block.items.map((it, i) => (
        <div className="row-tight" key={i}>
          <input className="input" style={{ flex: "0 0 28%" }} placeholder="Label" value={it.label} onChange={(e) => set(i, { label: e.target.value })} />
          <input className="input" placeholder="https://…" value={it.url} onChange={(e) => set(i, { url: e.target.value })} />
          <RemoveRow onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })} />
        </div>
      ))}
      <AddRow label="+ link" onClick={() => onChange({ ...block, items: [...block.items, { label: "", url: "" }] })} />
    </div>
  );
}

function RemoveRow({ onClick }: { onClick: () => void }) {
  return (
    <button className="icon-btn danger" style={{ flex: "0 0 auto" }} title="Remove" onClick={onClick}>
      ✕
    </button>
  );
}

function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={onClick}>
      {label}
    </button>
  );
}
