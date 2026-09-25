import type { ReactNode } from 'react';
import type { Inline } from './types';

export function renderInline(inline: Inline): ReactNode[] {
  return inline.map((run, index) => {
    const key = `${index}-${run.text}`;
    let node: ReactNode = run.text;
    if (run.bold) node = <strong>{node}</strong>;
    if (run.href) {
      const external = /^https?:\/\//.test(run.href);
      node = (
        <a
          href={run.href}
          className="text-accent underline"
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
        >
          {node}
        </a>
      );
    }
    return <span key={key}>{node}</span>;
  });
}
