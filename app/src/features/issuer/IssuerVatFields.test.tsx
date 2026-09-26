// @vitest-environment jsdom
import enMessages from '@messages/en.json';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IssuerVatFields } from './IssuerVatFields';
import type { IssuerProfileFormValues } from './useIssuerProfileForm';

const noop = vi.fn();

const BASE_VALUES: IssuerProfileFormValues = {
  companyName: 'Test SRL',
  eik: '123456789',
  mol: '',
  addressLine: '',
  street: 'Strada Exemplu 1',
  postcode: '010101',
  countyRegion: 'Cluj',
  city: 'Cluj-Napoca',
  country: 'RO',
  phone: '',
  vatRegistered: true,
  vatNumber: 'RO18547290',
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

describe('IssuerVatFields — country-gated VAT regime switches', () => {
  it('shows the TVA la încasare switch for a RO issuer, not the FR one', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <IssuerVatFields values={BASE_VALUES} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByLabelText('Cash-basis VAT scheme (TVA la încasare)')).toBeTruthy();
    expect(
      screen.queryByLabelText("VAT on debits option (paiement d'après les débits)"),
    ).toBeNull();
  });

  it('shows the debits-basis switch for a FR issuer, not the RO one', () => {
    const frValues: IssuerProfileFormValues = { ...BASE_VALUES, country: 'FR', countyRegion: '' };
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <IssuerVatFields values={frValues} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByLabelText("VAT on debits option (paiement d'après les débits)"),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Cash-basis VAT scheme (TVA la încasare)')).toBeNull();
  });

  it('shows neither switch for a BG issuer', () => {
    const bgValues: IssuerProfileFormValues = {
      ...BASE_VALUES,
      country: 'BG',
      countyRegion: '',
      vatNumber: 'BG123456789',
    };
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <IssuerVatFields values={bgValues} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect(screen.queryByLabelText('Cash-basis VAT scheme (TVA la încasare)')).toBeNull();
    expect(
      screen.queryByLabelText("VAT on debits option (paiement d'après les débits)"),
    ).toBeNull();
  });

  it('calls onChange with vatOnCashBasis when the RO switch is toggled', () => {
    const onChange = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <IssuerVatFields values={BASE_VALUES} onChange={onChange} />
      </NextIntlClientProvider>,
    );

    fireEvent.click(screen.getByLabelText('Cash-basis VAT scheme (TVA la încasare)'));

    expect(onChange).toHaveBeenCalledWith('vatOnCashBasis', true);
  });
});
