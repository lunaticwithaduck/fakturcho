// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LegalFooter } from './LegalFooter';

afterEach(cleanup);

describe('LegalFooter', () => {
  it('omits the guides link unless the locale has a guide index', () => {
    render(<LegalFooter locale="de" />);
    expect(screen.queryByRole('link', { name: 'Leitfäden' })).toBeNull();
  });

  it('links the Bulgarian guide index at /guide', () => {
    render(<LegalFooter guideIndex />);
    expect(screen.getByRole('link', { name: 'Наръчници' }).getAttribute('href')).toBe('/guide');
  });

  it('links the locale guide index with the translated label', () => {
    render(<LegalFooter locale="de" guideIndex />);
    expect(screen.getByRole('link', { name: 'Leitfäden' }).getAttribute('href')).toBe('/de/guide');
  });
});
