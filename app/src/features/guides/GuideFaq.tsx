import { renderInline } from './renderInline';
import type { GuideFaqEntry } from './types';

interface GuideFaqProps {
  heading: string;
  entries: readonly GuideFaqEntry[];
}

export function GuideFaq({ heading, entries }: GuideFaqProps) {
  if (entries.length === 0) return null;
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold text-text">{heading}</h2>
      {entries.map((entry) => (
        <div key={entry.question} className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-text">{entry.question}</h3>
          <p className="text-base leading-relaxed text-text-muted">{renderInline(entry.answer)}</p>
        </div>
      ))}
    </section>
  );
}
