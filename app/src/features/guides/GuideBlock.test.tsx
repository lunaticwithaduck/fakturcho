// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { GuideBlock } from './GuideBlock';
import type { GuideBlock as GuideBlockData } from './types';

afterEach(cleanup);

describe('GuideBlock', () => {
  it('renders a paragraph with bold and link runs', () => {
    const block: GuideBlockData = {
      type: 'p',
      inline: [
        { text: 'plain ' },
        { text: 'bold', bold: true },
        { text: ' and ' },
        { text: 'a link', href: 'https://example.com' },
      ],
    };
    render(<GuideBlock block={block} />);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    const link = screen.getByRole('link', { name: 'a link' });
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('renders an h3 heading block', () => {
    render(<GuideBlock block={{ type: 'h3', text: 'Subsection' }} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Subsection' })).toBeTruthy();
  });

  it('renders an unordered list', () => {
    const block: GuideBlockData = {
      type: 'ul',
      items: [[{ text: 'one' }], [{ text: 'two' }]],
    };
    render(<GuideBlock block={block} />);
    expect(screen.getByText('one')).toBeTruthy();
    expect(screen.getByText('two')).toBeTruthy();
  });

  it('renders an ordered list', () => {
    const block: GuideBlockData = {
      type: 'ol',
      items: [[{ text: 'first' }], [{ text: 'second' }]],
    };
    const { container } = render(<GuideBlock block={block} />);
    expect(container.querySelector('ol')).toBeTruthy();
  });

  it('renders a table with a thead and semantic cells', () => {
    const block: GuideBlockData = {
      type: 'table',
      head: ['A', 'B'],
      rows: [['1', '2']],
    };
    const { container } = render(<GuideBlock block={block} />);
    expect(container.querySelector('table thead th')?.textContent).toBe('A');
    expect(container.querySelector('table tbody td')?.textContent).toBe('1');
    expect(container.querySelector('.overflow-x-auto')).toBeTruthy();
  });
});
