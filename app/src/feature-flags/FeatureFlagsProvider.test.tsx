// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeatureFlagsProvider, useFeatureFlags } from './FeatureFlagsProvider';

function FlagsProbe() {
  const flags = useFeatureFlags();
  return <span>{JSON.stringify(flags)}</span>;
}

describe('FeatureFlagsProvider', () => {
  it('exposes the flags it is given to useFeatureFlags', () => {
    render(
      <FeatureFlagsProvider flags={{ EN_LOCALE: true, EINVOICE: false, PEPPOL: true }}>
        <FlagsProbe />
      </FeatureFlagsProvider>,
    );

    expect(screen.getByText('{"EN_LOCALE":true,"EINVOICE":false,"PEPPOL":true}')).toBeTruthy();
  });

  it('defaults to all flags off outside any provider', () => {
    render(<FlagsProbe />);

    expect(screen.getByText('{"EN_LOCALE":false,"EINVOICE":false,"PEPPOL":false}')).toBeTruthy();
  });
});
