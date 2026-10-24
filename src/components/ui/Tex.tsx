import katex from 'katex';
import { useMemo } from 'react';

/** KaTeX renderer for the page's own (trusted) formula strings. */
export default function Tex({ children, block = false, className = '' }: { children: string; block?: boolean; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false, strict: 'ignore', output: 'html' }),
    [children, block]
  );
  const Tag = block ? 'div' : 'span';
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
