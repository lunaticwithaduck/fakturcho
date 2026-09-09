import type { Locale } from '@shared/types';
import { getMarketingContent } from './content';

interface LandingFaqProps {
  locale?: Locale;
}

export function LandingFaq({ locale = 'bg' }: LandingFaqProps) {
  const content = getMarketingContent(locale);
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-text">{content.faq.heading}</h2>
      <div className="flex flex-col gap-6">
        {content.faq.items.map((item) => (
          <div key={item.question} className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-text">{item.question}</h3>
            <p className="text-sm leading-relaxed text-text-muted">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
