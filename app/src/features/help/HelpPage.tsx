'use client';

import { GuideFaq } from '@app/features/guides/GuideFaq';
import { GuideSections } from '@app/features/guides/GuideSections';
import { GuideToc } from '@app/features/guides/GuideToc';
import { IssuerGuideLink } from '@app/features/shell/IssuerGuideLink';
import { EmptyState } from '@design/components';
import type { HelpContent } from './types';

export interface HelpPageChrome {
  pageTitle: string;
  tocLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}

interface HelpPageProps {
  content: HelpContent | undefined;
  chrome: HelpPageChrome;
}

export function HelpPage({ content, chrome }: HelpPageProps) {
  const title = content?.title ?? chrome.pageTitle;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <IssuerGuideLink className="text-sm text-accent underline" />
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-text">{title}</h1>
        {content ? (
          <p className="text-lg leading-relaxed text-text-muted">{content.intro}</p>
        ) : null}
      </header>
      {content ? (
        <>
          <GuideToc sections={content.sections} label={chrome.tocLabel} />
          <article className="flex flex-col gap-8">
            <GuideSections sections={content.sections} />
          </article>
          <GuideFaq heading={content.faqHeading} entries={content.faq} />
        </>
      ) : (
        <EmptyState title={chrome.emptyTitle} description={chrome.emptyDescription} />
      )}
    </div>
  );
}
