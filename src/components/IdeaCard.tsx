import { ACCENT, STAGE_LABEL, tagAccent, type Block, type Idea } from "@/lib/types";

export default function IdeaCard({
  idea,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  idea: Idea;
  onEdit: (idea: Idea) => void;
  onDelete: (idea: Idea) => void;
  onTogglePin: (idea: Idea) => void;
}) {
  return (
    <article className="idea-card" data-pinned={idea.pinned}>
      <div className="card-top">
        <div className="card-icon" style={{ background: ACCENT[idea.accent].tile }}>
          {idea.icon}
        </div>
        <div className="card-head">
          <div className="card-name">{idea.title}</div>
          {idea.subtitle && <div className="card-sub">{idea.subtitle}</div>}
          <span className={`stage-chip stage-${idea.stage}`}>{STAGE_LABEL[idea.stage]}</span>
        </div>
        <div className="card-actions">
          <button
            className={`icon-btn${idea.pinned ? " pinned" : ""}`}
            title={idea.pinned ? "Unpin" : "Pin to top"}
            onClick={() => onTogglePin(idea)}
          >
            {idea.pinned ? "★" : "☆"}
          </button>
          <button className="icon-btn" title="Edit" onClick={() => onEdit(idea)}>
            ✎
          </button>
          <button className="icon-btn danger" title="Delete" onClick={() => onDelete(idea)}>
            ✕
          </button>
        </div>
      </div>

      <div className="card-body">
        {idea.tags.length > 0 && (
          <div className="tags">
            {idea.tags.map((t, i) => {
              const a = ACCENT[tagAccent(t)];
              return (
                <span key={i} className="tag" style={{ background: a.bg, color: a.fg, borderColor: a.border }}>
                  {t}
                </span>
              );
            })}
          </div>
        )}

        {idea.concept && (
          <>
            <div className="section-label">Concept</div>
            <p className="desc">{idea.concept}</p>
          </>
        )}

        {idea.sections.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>
    </article>
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.type === "grid") {
    return (
      <>
        <div className="section-label">{block.label}</div>
        <div className="features-grid">
          {block.items.map((it, i) => (
            <div key={i} className="feature-item">
              <div className="feature-name">{it.name}</div>
              {it.desc && <div className="feature-desc">{it.desc}</div>}
            </div>
          ))}
        </div>
      </>
    );
  }

  if (block.type === "phases") {
    return (
      <>
        <div className="section-label">{block.label}</div>
        <div className="phases">
          {block.items.map((it, i) => (
            <div key={i} className="phase-row">
              <span
                className="phase-dot"
                style={it.dot ? { background: ACCENT[it.dot].dot } : undefined}
              />
              <p className="phase-text">
                {it.name && <span className="phase-name">{it.name} </span>}
                {it.text}
              </p>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (block.type === "list") {
    const a = ACCENT[block.tone ?? "gray"];
    return (
      <>
        <div className="section-label">{block.label}</div>
        <div className="callout" style={{ background: a.bg, borderColor: a.border }}>
          <ul className="callout-list">
            {block.items.map((it, i) => (
              <li key={i} style={{ color: a.fg }}>
                {it}
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }

  // links
  return (
    <>
      <div className="section-label">{block.label}</div>
      <div className="ref-rows">
        {block.items.map((it, i) => (
          <div key={i} className="ref-row">
            {it.label && <span className="ref-label">{it.label}</span>}
            <a className="ref-link" href={it.url} target="_blank" rel="noreferrer">
              {it.url}
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
