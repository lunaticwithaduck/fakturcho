import { COMPANY } from './company';

export interface LegalSection {
  heading: string;
  paragraphs: readonly string[];
}

interface LegalDocumentProps {
  title: string;
  intro: string;
  sections: readonly LegalSection[];
}

export function LegalDocument({ title, intro, sections }: LegalDocumentProps) {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-text">{title}</h1>
        <p className="text-sm text-text-subtle">Последна актуализация: {COMPANY.lastUpdated}</p>
        <p className="text-base leading-relaxed text-text-muted">{intro}</p>
      </header>

      {sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-text">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed text-text-muted">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
