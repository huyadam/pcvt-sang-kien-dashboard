import React from 'react';

/**
 * Simple inline markdown parser — handles **bold**, *italic*
 */
function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

/**
 * MarkdownText — renders Markdown-like text (no external deps)
 * Supports: > blockquote, **bold**, *italic*, - bullet, + bullet, 1. numbered, plain paragraphs
 */
export function MarkdownText({ text }: { text: string }) {
  if (!text || !text.trim()) return null;

  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      result.push(
        <ul key={`ul-${listKey++}`} className="list-disc pl-5 space-y-0.5 my-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Empty line → paragraph break
    if (!trimmed) {
      flushList();
      return;
    }

    // Blockquote: "> text"
    if (trimmed.startsWith('> ')) {
      flushList();
      result.push(
        <p key={i} className="border-l-2 border-gray-300 dark:border-gray-600 pl-3 italic text-gray-600 dark:text-gray-400 my-0.5">
          {parseInline(trimmed.slice(2))}
        </p>
      );
      return;
    }

    // Bullet list: "- ", "+ ", "* "
    const bulletMatch = trimmed.match(/^[-+•] (.+)/);
    if (bulletMatch) {
      listItems.push(<li key={i}>{parseInline(bulletMatch[1])}</li>);
      return;
    }

    // Numbered item: "1. ", "2. " etc.
    const numberedMatch = trimmed.match(/^(\d+)\. (.+)/);
    if (numberedMatch) {
      flushList();
      result.push(
        <p key={i} className="my-0.5">
          <span className="font-semibold text-gray-700 dark:text-gray-300">{numberedMatch[1]}.</span>{' '}
          {parseInline(numberedMatch[2])}
        </p>
      );
      return;
    }

    // Section header-like lines (all caps or ends with ":")
    if (trimmed.endsWith(':') && trimmed.length < 80 && !trimmed.includes('http')) {
      flushList();
      result.push(
        <p key={i} className="font-semibold text-gray-800 dark:text-gray-200 mt-2 mb-0.5">
          {parseInline(trimmed)}
        </p>
      );
      return;
    }

    // Normal paragraph line
    flushList();
    result.push(
      <p key={i} className="my-0.5">
        {parseInline(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-0.5 leading-relaxed text-sm">{result}</div>;
}
