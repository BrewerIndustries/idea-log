import { Fragment, type ReactNode } from "react";

// A small, dependency-free markdown renderer for `doc` blocks. It emits React
// nodes (never raw HTML), so there is no XSS surface even though the content is
// user-authored. Supported: headings, bold/italic, inline code, fenced code,
// links (http/https/mailto/relative only), bullet + numbered lists, blockquotes,
// horizontal rules, and paragraphs. Anything else renders as plain text.

const SAFE_HREF = /^(https?:\/\/|mailto:|\/)/i;

function tokenize(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = text;

  const link = (href: string, children: ReactNode[]): ReactNode =>
    SAFE_HREF.test(href) ? (
      <a className="md-link" href={href} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    ) : (
      <>{children}</>
    );

  const patterns: { re: RegExp; make: (m: RegExpExecArray) => ReactNode }[] = [
    { re: /`([^`]+)`/, make: (m) => <code className="md-code">{m[1]}</code> },
    { re: /\*\*([^*]+?)\*\*/, make: (m) => <strong>{keyed(tokenize(m[1]))}</strong> },
    { re: /__([^_]+?)__/, make: (m) => <strong>{keyed(tokenize(m[1]))}</strong> },
    { re: /\*([^*\s][^*]*?)\*/, make: (m) => <em>{keyed(tokenize(m[1]))}</em> },
    { re: /_([^_\s][^_]*?)_/, make: (m) => <em>{keyed(tokenize(m[1]))}</em> },
    { re: /\[([^\]]+)\]\(([^)\s]+)\)/, make: (m) => link(m[2], tokenize(m[1])) },
    { re: /(https?:\/\/[^\s)]+)/, make: (m) => link(m[1], [m[1]]) },
  ];

  while (rest) {
    let best: RegExpExecArray | null = null;
    let bestAt = Infinity;
    let make: ((m: RegExpExecArray) => ReactNode) | null = null;
    for (const p of patterns) {
      const m = p.re.exec(rest);
      if (m && m.index < bestAt) {
        best = m;
        bestAt = m.index;
        make = p.make;
      }
    }
    if (!best || !make) {
      out.push(rest);
      break;
    }
    if (bestAt > 0) out.push(rest.slice(0, bestAt));
    out.push(make(best));
    rest = rest.slice(bestAt + best[0].length);
  }
  return out;
}

/** Wrap a node list so each child carries a stable key. */
function keyed(nodes: ReactNode[]): ReactNode {
  return nodes.map((n, i) => <Fragment key={i}>{n}</Fragment>);
}

function Inline({ text }: { text: string }) {
  return <>{keyed(tokenize(text))}</>;
}

export default function Markdown({ text }: { text: string }) {
  const lines = (text ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // blank
    if (!line.trim()) {
      i++;
      continue;
    }

    // fenced code
    if (/^```/.test(line.trim())) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) buf.push(lines[i++]);
      i++; // consume closing fence
      blocks.push(
        <pre className="md-pre" key={key++}>
          <code>{buf.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // heading
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = Math.min(3, h[1].length);
      blocks.push(
        <div className={`md-h md-h${level}`} key={key++}>
          <Inline text={h[2].trim()} />
        </div>,
      );
      i++;
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push(<hr className="md-hr" key={key++} />);
      i++;
      continue;
    }

    // blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push(
        <blockquote className="md-quote" key={key++}>
          <Inline text={buf.join(" ")} />
        </blockquote>,
      );
      continue;
    }

    // unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*+]\s+/, ""));
      blocks.push(
        <ul className="md-ul" key={key++}>
          {items.map((it, j) => (
            <li key={j}>
              <Inline text={it} />
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s+/, ""));
      blocks.push(
        <ol className="md-ol" key={key++}>
          {items.map((it, j) => (
            <li key={j}>
              <Inline text={it} />
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // paragraph — gather until blank / next block starter
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i].trim()) &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      buf.push(lines[i++]);
    }
    blocks.push(
      <p className="md-p" key={key++}>
        <Inline text={buf.join(" ")} />
      </p>,
    );
  }

  return <div className="md">{blocks}</div>;
}
