import { LanguageSwitcher } from '@app/i18n/LanguageSwitcher';
import type { Locale } from '@shared/types';
import { COMPANY } from './company';

export interface LegalSection {
  heading: string;
  paragraphs: readonly string[];
}

interface LegalDocumentProps {
  title: string;
  intro: string;
  sections: readonly LegalSection[];
  lastUpdatedLabel?: string;
  locale?: Locale;
  currentPath?: string;
  enEnabled?: boolean;
}

export function LegalDocument({
  title,
  intro,
  sections,
  lastUpdatedLabel,
  locale = 'bg',
  currentPath,
  enEnabled = false,
}: LegalDocumentProps) {
  const updatedLabel = lastUpdatedLabel ?? `Последна актуализация: ${COMPANY.lastUpdated}`;
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        {currentPath ? (
          <div className="flex justify-end">
            <LanguageSwitcher locale={locale} currentPath={currentPath} enabled={enEnabled} />
          </div>
        ) : null}
        <h1 className="text-3xl font-bold text-text">{title}</h1>
        <p className="text-sm text-text-subtle">{updatedLabel}</p>
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
