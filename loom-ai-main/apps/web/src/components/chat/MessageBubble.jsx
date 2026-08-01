/**
 * @file MessageBubble.jsx
 * @description Claude-style chat message with:
 *  - Proper markdown rendering (**bold**, *italic*, `code`, headings, lists)
 *  - Client-side typewriter animation for the latest assistant message
 *  - Selectable, copyable text
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { RefreshCw, XCircle } from 'lucide-react';
import CodeBlock from './CodeBlock';

/* ─── Lightweight Markdown → JSX renderer ─────────────────────────── */
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines (add spacing between blocks)
    if (line.trim() === '') {
      elements.push(<div key={`gap-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // # Heading 1
    if (line.startsWith('# ')) {
      elements.push(<h2 key={i} className="text-base font-semibold text-[var(--text-primary)] mt-3 mb-1">{inlineMarkdown(line.slice(2))}</h2>);
      i++; continue;
    }
    // ## Heading 2
    if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="text-sm font-semibold text-[var(--text-primary)] mt-2 mb-1">{inlineMarkdown(line.slice(3))}</h3>);
      i++; continue;
    }
    // ### Heading 3
    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="text-sm font-medium text-[var(--text-primary)] mt-2 mb-0.5">{inlineMarkdown(line.slice(4))}</h4>);
      i++; continue;
    }

    // Bullet list items
    if (line.match(/^[\-\*] /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[\-\*] /)) {
        items.push(<li key={i} className="ml-4 text-sm leading-relaxed list-disc">{inlineMarkdown(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="space-y-0.5 my-1">{items}</ul>);
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        const text = lines[i].replace(/^\d+\. /, '');
        items.push(<li key={i} className="ml-4 text-sm leading-relaxed list-decimal">{inlineMarkdown(text)}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="space-y-0.5 my-1">{items}</ol>);
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
      elements.push(<hr key={i} className="border-[var(--border-subtle)] my-3" />);
      i++; continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm leading-7 text-[var(--text-primary)]">
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return elements;
}

/* Inline formatting: bold, italic, code, links */
function inlineMarkdown(text) {
  if (!text) return '';

  const parts = [];
  // Pattern: **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));

    if (match[0].startsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-[var(--text-primary)]">{match[2]}</strong>);
    } else if (match[0].startsWith('*')) {
      parts.push(<em key={match.index} className="italic">{match[3]}</em>);
    } else if (match[0].startsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1 py-0.5 rounded bg-black/[0.06] theme-dark:bg-white/10 text-[0.8em] font-mono text-indigo-600 theme-dark:text-indigo-300">
          {match[4]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}

/* ─── Typewriter hook ──────────────────────────────────────────────── */
function useTypewriter(fullText, enabled) {
  const [displayed, setDisplayed] = useState(enabled ? '' : fullText);
  const [done, setDone] = useState(!enabled);
  const rafRef = useRef(null);
  const iRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(fullText);
      setDone(true);
      return;
    }

    setDisplayed('');
    iRef.current = 0;
    setDone(false);

    const CHARS_PER_FRAME = 3; // speed: ~3 chars per 16ms frame

    function tick() {
      iRef.current = Math.min(iRef.current + CHARS_PER_FRAME, fullText.length);
      setDisplayed(fullText.slice(0, iRef.current));
      if (iRef.current < fullText.length) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [fullText, enabled]);

  return { displayed, done };
}

/* ─── Component ────────────────────────────────────────────────────── */
export function MessageBubble({ message, onRegenerate, isLatestAssistant = false }) {
  const isUser = message.role === 'user';

  // Typewriter only on the latest assistant message
  const { displayed, done } = useTypewriter(
    message.content || '',
    !isUser && isLatestAssistant
  );

  const textToRender = (!isUser && isLatestAssistant) ? displayed : message.content;

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-1 select-text">
        <div className="max-w-[75%]">
          <div className="inline-block px-4 py-2.5 rounded-2xl rounded-br-sm bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm leading-relaxed shadow-sm">
            {message.content}
          </div>
          {message.timestamp && (
            <div className="text-[11px] text-[var(--text-muted)] mt-1 text-right pr-1">
              {message.timestamp}
            </div>
          )}
        </div>
      </div>
    );
  }

  // AI assistant message
  return (
    <div className="flex flex-col gap-2 px-4 py-2 max-w-[90%] select-text">
      {/* Label row */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">loom</span>
        {message.stack && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {message.stack === 'vanilla' ? 'Vanilla' : 'React'}
          </span>
        )}
      </div>

      {/* Error state */}
      {message.isError ? (
        <div className="flex items-start gap-2 text-sm text-rose-400">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="leading-relaxed">{message.content}</span>
        </div>
      ) : (
        <div className="space-y-0.5">
          {renderMarkdown(textToRender || '')}
          {/* Blinking cursor while typing */}
          {!done && (
            <span className="inline-block w-[2px] h-[1em] bg-indigo-400 align-middle ml-0.5 animate-pulse rounded-full" />
          )}
        </div>
      )}

      {/* Code card */}
      {message.codeCard && done && (
        <CodeBlock
          code={message.codeCard.code}
          language={message.codeCard.language}
          title={message.codeCard.title}
        />
      )}

      {/* Explanation card */}
      {message.explanationCard && done && (
        <div className="mt-1 p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-sm text-[var(--text-secondary)] leading-relaxed">
          <div className="text-xs font-semibold text-indigo-400 mb-1">{message.explanationCard.title}</div>
          <p>{message.explanationCard.details}</p>
        </div>
      )}

      {/* Regenerate */}
      {!message.isError && done && (
        <div className="mt-1">
          <button
            onClick={() => onRegenerate && onRegenerate(message.id)}
            className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Regenerate</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
