import { useMemo, type ReactNode } from 'react';
import { classNames } from '../../utils/helpers';

/**
 * CopilotMessageContent — renders a Copilot chat message's text with basic
 * markdown-style formatting (paragraphs, bullet/numbered lists, bold,
 * italics, inline code, simple headings) without pulling in a full
 * markdown library or using dangerouslySetInnerHTML.
 *
 * Gemini responses commonly use this subset of markdown for financial
 * advice (e.g. "**Reduce dining out:** ..." or a numbered action list), so
 * rendering it properly is what "Markdown renders correctly" and "Bullet
 * lists / numbered lists render correctly" (frontend audit items) mean in
 * practice for this app — full CommonMark support isn't needed.
 */

type Block =
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'heading'; text: string }
  | { type: 'p'; lines: string[] };

const BULLET_RE = /^\s*[-*•]\s+(.*)$/;
const NUMBERED_RE = /^\s*\d+[.)]\s+(.*)$/;
const HEADING_RE = /^\s*#{1,6}\s+(.*)$/;

function parseBlocks(text: string): Block[] {
  const rawLines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];

    if (line.trim() === '') {
      i++;
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      blocks.push({ type: 'heading', text: heading[1] });
      i++;
      continue;
    }

    if (BULLET_RE.test(line)) {
      const items: string[] = [];
      while (i < rawLines.length) {
        const m = BULLET_RE.exec(rawLines[i]);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (NUMBERED_RE.test(line)) {
      const items: string[] = [];
      while (i < rawLines.length) {
        const m = NUMBERED_RE.exec(rawLines[i]);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    const lines: string[] = [];
    while (
      i < rawLines.length &&
      rawLines[i].trim() !== '' &&
      !BULLET_RE.test(rawLines[i]) &&
      !NUMBERED_RE.test(rawLines[i]) &&
      !HEADING_RE.test(rawLines[i])
    ) {
      lines.push(rawLines[i]);
      i++;
    }
    blocks.push({ type: 'p', lines });
  }

  return blocks;
}

// Matches **bold**, `code`, *italic*, or _italic_ — split() with a
// capturing group keeps the matched delimiters in the resulting array
// alongside the plain-text pieces around them.
const INLINE_RE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text
    .split(INLINE_RE)
    .filter((part) => part.length > 0)
    .map((part, i) => {
      const key = `${keyPrefix}-${i}`;
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={key}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={key}
            className="rounded bg-ink-200/60 px-1 py-0.5 font-mono text-[0.85em] dark:bg-ink-700/60"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (
        (part.startsWith('*') && part.endsWith('*')) ||
        (part.startsWith('_') && part.endsWith('_'))
      ) {
        return <em key={key}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
}

export function CopilotMessageContent({ text, className }: { text: string; className?: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);

  return (
    <div className={classNames('space-y-2', className)}>
      {blocks.map((block, bi) => {
        if (block.type === 'ul') {
          return (
            <ul key={bi} className="list-disc space-y-1 ps-5">
              {block.items.map((item, ii) => (
                <li key={ii}>{renderInline(item, `${bi}-${ii}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={bi} className="list-decimal space-y-1 ps-5">
              {block.items.map((item, ii) => (
                <li key={ii}>{renderInline(item, `${bi}-${ii}`)}</li>
              ))}
            </ol>
          );
        }
        if (block.type === 'heading') {
          return (
            <p key={bi} className="font-semibold">
              {renderInline(block.text, `${bi}`)}
            </p>
          );
        }
        return (
          <p key={bi} className="leading-relaxed">
            {block.lines.map((line, li) => (
              <span key={li}>
                {renderInline(line, `${bi}-${li}`)}
                {li < block.lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
