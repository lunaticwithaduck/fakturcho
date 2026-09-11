// @vitest-environment jsdom
import type { AdminFeatureFlagDto } from '@fakturcho/shared-types';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeaturesScreen } from './FeaturesScreen';

const updateMock = vi.fn();
let listResult: { data: AdminFeatureFlagDto[] | undefined; isLoading: boolean; isError: boolean } =
  {
    data: [
      { key: 'EINVOICE', enabled: false, updatedAt: '2026-09-01T00:00:00.000Z' },
      { key: 'EN_LOCALE', enabled: true, updatedAt: '2026-09-02T00:00:00.000Z' },
      { key: 'PEPPOL', enabled: false, updatedAt: '2026-09-03T00:00:00.000Z' },
    ],
    isLoading: false,
    isError: false,
  };
let updateResult: { isError: boolean } = { isError: false };

vi.mock('../../api', () => ({
  useListFeatureFlagsQuery: () => listResult,
  useUpdateFeatureFlagMutation: () => [updateMock, updateResult],
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  listResult = {
    data: [
      { key: 'EINVOICE', enabled: false, updatedAt: '2026-09-01T00:00:00.000Z' },
      { key: 'EN_LOCALE', enabled: true, updatedAt: '2026-09-02T00:00:00.000Z' },
      { key: 'PEPPOL', enabled: false, updatedAt: '2026-09-03T00:00:00.000Z' },
    ],
    isLoading: false,
    isError: false,
  };
  updateResult = { isError: false };
});

describe('FeaturesScreen', () => {
  it('lists every flag with its label and updatedAt date', () => {
    render(<FeaturesScreen />);

    expect(screen.getByText('Английски език')).toBeTruthy();
    expect(screen.getByText('Е-фактура (XML)')).toBeTruthy();
    expect(screen.getByText('Изпращане през Peppol')).toBeTruthy();
    expect(screen.getByText(/Последна промяна: 02.09.2026/)).toBeTruthy();
  });

  it('reflects the enabled state on each switch', () => {
    render(<FeaturesScreen />);

    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(3);
    expect(switches[0]?.getAttribute('aria-checked')).toBe('false');
    expect(switches[1]?.getAttribute('aria-checked')).toBe('true');
  });

  it('toggling a switch calls the update mutation with the flipped value', () => {
    render(<FeaturesScreen />);

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0] as Element);

    expect(updateMock).toHaveBeenCalledWith({ key: 'EINVOICE', enabled: true });
  });

  it('shows an error alert when loading the list fails', () => {
    listResult = { data: undefined, isLoading: false, isError: true };
    render(<FeaturesScreen />);

    expect(screen.getByText('Възникна грешка при зареждане на данните.')).toBeTruthy();
  });

  it('shows an error alert when an update fails', () => {
    updateResult = { isError: true };
    render(<FeaturesScreen />);

    expect(screen.getByText('Възникна грешка при зареждане на данните.')).toBeTruthy();
  });
});
