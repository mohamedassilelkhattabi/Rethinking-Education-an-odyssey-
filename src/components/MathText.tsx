import katex from 'katex';
import { useMemo } from 'react';

interface MathSegment {
  kind: 'text' | 'inline' | 'display';
  content: string;
}

/** Split text containing $$...$$ display math and $...$ inline math into structured segments. */
export function parseMathSegments(input: string): MathSegment[] {
  if (!input) return [];
  const out: MathSegment[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$(?:\\.|[^$\\])+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      out.push({ kind: 'text', content: input.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('$$') && token.endsWith('$$')) {
      out.push({ kind: 'display', content: token.slice(2, -2).trim() });
    } else {
      out.push({ kind: 'inline', content: token.slice(1, -1).trim() });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < input.length) {
    out.push({ kind: 'text', content: input.slice(lastIndex) });
  }
  return out;
}

export function renderLatexHtml(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
    });
  } catch {
    return latex;
  }
}

export function MathText({ text, className = '' }: { text: string; className?: string }) {
  const segments = useMemo(() => parseMathSegments(text), [text]);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.kind === 'text') return <span key={i}>{seg.content}</span>;
        const html = renderLatexHtml(seg.content, seg.kind === 'display');
        if (seg.kind === 'display') {
          return (
            <span
              key={i}
              className="my-2 block overflow-x-auto py-1 text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return <span key={i} className="inline-block align-baseline" dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </span>
  );
}
