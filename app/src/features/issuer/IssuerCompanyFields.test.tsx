// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
  countyRegion: '',
  city: 'София',
  country: 'BG',
  phone: '',
  vatRegistered: false,
  vatNumber: '',
  bankName: '',
  iban: '',
  bic: '',
  altIban: '',
  identifiers: {},
};

const DE_VALUES: IssuerProfileFormValues = {
  ...BG_VALUES,
  country: 'NL',
  addressLine: '',
  street: 'Hauptstraße 1',
  postcode: '10115',
};

const RO_VALUES: IssuerProfileFormValues = {
  ...BG_VALUES,
  country: 'RO',
  addressLine: '',
  street: 'Strada Exemplu 1',
  postcode: '010101',
  countyRegion: '',
};

const ES_VALUES: IssuerProfileFormValues = {
  ...BG_VALUES,
  country: 'ES',
  addressLine: '',
  street: 'Calle Ejemplo 1',
  postcode: '28001',
  countyRegion: '',
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
    expect(screen.queryByLabelText('Județ')).toBeNull();
    expect(screen.queryByLabelText('Provincia')).toBeNull();
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

    expect((screen.getByLabelText('Company registration no.') as HTMLInputElement).required).toBe(
      false,
    );
  });

  it('marks the company ID as required for BG', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <IssuerCompanyFields values={BG_VALUES} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect((screen.getByLabelText('ЕИК / Булстат') as HTMLInputElement).required).toBe(true);
  });

  it('renders Județ as required for a RO issuer', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <IssuerCompanyFields values={RO_VALUES} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect((screen.getByLabelText('Județ') as HTMLInputElement).required).toBe(true);
  });

  it('renders Provincia as optional for an ES issuer', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <IssuerCompanyFields values={ES_VALUES} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect((screen.getByLabelText('Provincia') as HTMLInputElement).required).toBe(false);
  });

  it('labels the identifier field NIF/CIF for an ES issuer and CUI/CIF for a RO issuer', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <IssuerCompanyFields values={ES_VALUES} onChange={noop} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByLabelText('NIF/CIF')).toBeTruthy();
    cleanup();

    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <IssuerCompanyFields values={RO_VALUES} onChange={noop} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByLabelText('CUI/CIF')).toBeTruthy();
  });

  it('calls onChange with the county/region key when the field is edited', () => {
    const onChange = vi.fn();
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <IssuerCompanyFields values={RO_VALUES} onChange={onChange} />
      </NextIntlClientProvider>,
    );

    fireEvent.change(screen.getByLabelText('Județ'), { target: { value: 'Cluj' } });

    expect(onChange).toHaveBeenCalledWith('countyRegion', 'Cluj');
  });

  it('shows an invalid-format error on Provincia when fieldErrors flags it', () => {
    const IT_VALUES: IssuerProfileFormValues = {
      ...BG_VALUES,
      country: 'IT',
      addressLine: '',
      street: 'Via Roma 1',
      postcode: '00100',
      countyRegion: 'Roma',
    };
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <IssuerCompanyFields
          values={IT_VALUES}
          onChange={noop}
          fieldErrors={{ countyRegion: 'Provincia', identifiers: {} }}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Невалиден формат')).toBeTruthy();
  });

  it('does not show an error on Provincia when fieldErrors is empty', () => {
    const IT_VALUES: IssuerProfileFormValues = {
      ...BG_VALUES,
      country: 'IT',
      addressLine: '',
      street: 'Via Roma 1',
      postcode: '00100',
      countyRegion: 'RM',
    };
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <IssuerCompanyFields values={IT_VALUES} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect(screen.queryByText('Невалиден формат')).toBeNull();
  });
});
