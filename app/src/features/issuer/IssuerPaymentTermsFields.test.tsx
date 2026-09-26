// @vitest-environment jsdom
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IssuerPaymentTermsFields } from './IssuerPaymentTermsFields';
import type { IssuerProfileFormValues } from './useIssuerProfileForm';

const noop = vi.fn();

const BASE_VALUES: IssuerProfileFormValues = {
  companyName: 'Test SRL',
  eik: '123456789',
  mol: '',
  addressLine: '',
  street: 'Via Roma 1',
  postcode: '00100',
  countyRegion: '',
  city: 'Roma',
  country: 'IT',
  phone: '',
  vatRegistered: false,
  vatNumber: '',
  bankName: '',
  iban: '',
  bic: '',
  altIban: '',
  identifiers: {},
  vatOnCashBasis: false,
  vatOnDebits: false,
  defaultPaymentTermsDays: null,
};

afterEach(cleanup);

describe('IssuerPaymentTermsFields', () => {
  it('shows "no default" when unset', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <IssuerPaymentTermsFields values={BASE_VALUES} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('No default — choose per document')).toBeTruthy();
  });

  it('shows the chosen default term', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <IssuerPaymentTermsFields
          values={{ ...BASE_VALUES, defaultPaymentTermsDays: 14 }}
          onChange={noop}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('14 days')).toBeTruthy();
  });

  it('calls onChange with defaultPaymentTermsDays', () => {
    const onChange = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <IssuerPaymentTermsFields values={BASE_VALUES} onChange={onChange} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByLabelText('Default term')).toBeTruthy();
  });
});
