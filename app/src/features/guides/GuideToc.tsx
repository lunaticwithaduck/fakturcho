import type { GuideSection } from './types';

interface GuideTocProps {
  sections: readonly GuideSection[];
  label: string;
}

export function GuideToc({ sections, label }: GuideTocProps) {
  if (sections.length === 0) return null;
  return (
    <nav
      aria-label={label}
      className="flex flex-col gap-2 rounded-md border border-border bg-surface-raised p-4"
    >
      <p className="text-sm font-semibold text-text">{label}</p>
      <ul className="flex flex-col gap-1 text-sm">
        {sections.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="text-accent underline">
              {section.heading}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
