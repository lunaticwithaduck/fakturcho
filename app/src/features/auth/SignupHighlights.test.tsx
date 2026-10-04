// @vitest-environment jsdom

import { loadMessages } from '@app/i18n/locale';
import { PUBLISHED_LOCALES } from '@shared/types';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SIGNUP_FAQ_ITEM_COUNT, SignupHighlights } from './SignupHighlights';

afterEach(cleanup);

describe('SignupHighlights', () => {
  it.each(PUBLISHED_LOCALES)(
    'renders the landing capabilities and the first FAQ answers for %s',
    async (locale) => {
      const { capabilities, faq } = (await loadMessages(locale)).marketing;
      const { container } = render(<SignupHighlights capabilities={capabilities} faq={faq} />);

      expect(screen.getByRole('heading', { level: 2, name: capabilities.heading })).toBeTruthy();
      expect(screen.getByRole('heading', { level: 2, name: faq.heading })).toBeTruthy();
      expect(screen.getAllByRole('listitem')).toHaveLength(capabilities.items.length);
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(SIGNUP_FAQ_ITEM_COUNT);
      for (const item of faq.items.slice(0, SIGNUP_FAQ_ITEM_COUNT)) {
        expect(screen.getByRole('heading', { level: 3, name: item.question })).toBeTruthy();
        expect(container.textContent).toContain(item.answer);
      }
      expect(faq.items.length).toBeGreaterThanOrEqual(SIGNUP_FAQ_ITEM_COUNT);
      cleanup();
    },
  );

  it('leaves out FAQ entries past the cut', () => {
    render(
      <SignupHighlights
        capabilities={{ heading: 'Caps', items: ['one'] }}
        faq={{
          heading: 'FAQ',
          items: Array.from({ length: SIGNUP_FAQ_ITEM_COUNT + 2 }, (_, i) => ({
            question: `Q${i}`,
            answer: `A${i}`,
          })),
        }}
      />,
    );
    const faqSection = screen.getByRole('heading', { name: 'FAQ' }).parentElement as HTMLElement;
    expect(within(faqSection).queryByText(`Q${SIGNUP_FAQ_ITEM_COUNT}`)).toBeNull();
    expect(within(faqSection).getByText(`Q${SIGNUP_FAQ_ITEM_COUNT - 1}`)).toBeTruthy();
  });
});
