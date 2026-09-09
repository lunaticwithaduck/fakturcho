// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IssuerCompanyFields } from './IssuerCompanyFields';
import type { IssuerProfileFormValues } from './useIssuerProfileForm';

const noop = vi.fn();

const BG_VALUES: IssuerProfileFormValues = {
  companyName: 'Тест ЕООД',
  eik: '123456789',
  mol: '',
  addressLine: 'ул. Тестова 1',
  street: '',
  postcode: '',
  city: 'София',
  country: 'BG',
  phone: '',
  vatRegistered: false,
  vatNumber: '',
  bankName: '',
  iban: '',
  bic: '',
  altIban: '',
};

const DE_VALUES: IssuerProfileFormValues = {
  ...BG_VALUES,
  country: 'DE',
  addressLine: '',
  street: 'Hauptstraße 1',
  postcode: '10115',
};

afterEach(cleanup);

describe('IssuerCompanyFields', () => {
  it('renders the Bulgarian copy unchanged for a BG issuer', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <IssuerCompanyFields values={BG_VALUES} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Фирмени данни' })).toBeTruthy();
    expect(screen.getByLabelText('Фирма')).toBeTruthy();
    expect(screen.getByLabelText('ЕИК / Булстат')).toBeTruthy();
    expect(screen.getByLabelText('МОЛ')).toBeTruthy();
    expect(screen.getByLabelText('Държава')).toBeTruthy();
    expect(screen.getByLabelText('Адрес')).toBeTruthy();
    expect(screen.getByLabelText('Град')).toBeTruthy();
    expect(screen.getByLabelText('Телефон')).toBeTruthy();
    expect(screen.queryByLabelText('Улица и номер')).toBeNull();
    expect(screen.queryByLabelText('Пощенски код')).toBeNull();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <IssuerCompanyFields values={BG_VALUES} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Company details' })).toBeTruthy();
    expect(screen.getByLabelText('Company')).toBeTruthy();
    expect(screen.getByLabelText('Address')).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('shows street and postcode instead of the single address line for a non-BG country', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <IssuerCompanyFields values={DE_VALUES} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect(screen.queryByLabelText('Адрес')).toBeNull();
    expect(screen.getByLabelText('Улица и номер')).toBeTruthy();
    expect(screen.getByLabelText('Пощенски код')).toBeTruthy();
  });

  it('does not mark the company ID as required for a non-BG country', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <IssuerCompanyFields values={DE_VALUES} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect((screen.getByLabelText('ЕИК / Булстат') as HTMLInputElement).required).toBe(false);
  });

  it('marks the company ID as required for BG', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <IssuerCompanyFields values={BG_VALUES} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect((screen.getByLabelText('ЕИК / Булстат') as HTMLInputElement).required).toBe(true);
  });
});
