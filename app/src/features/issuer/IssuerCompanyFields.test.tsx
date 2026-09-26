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
  vatOnCashBasis: false,
  vatOnDebits: false,
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

const CZ_VALUES: IssuerProfileFormValues = {
  ...BG_VALUES,
  country: 'CZ',
  eik: '',
  addressLine: '',
  street: 'Václavské náměstí 1',
  postcode: '110 00',
  city: 'Praha',
};

const DE_VALUES_NO_HRB: IssuerProfileFormValues = {
  ...BG_VALUES,
  country: 'DE',
  eik: '',
  addressLine: '',
  street: 'Musterstraße 1',
  postcode: '10115',
  city: 'Berlin',
};

const DE_VALUES_WITH_HRB: IssuerProfileFormValues = {
  ...DE_VALUES_NO_HRB,
  eik: 'HRB 12345',
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

  it('renders the Czech company-register identifier as required with its legal hint', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <IssuerCompanyFields values={CZ_VALUES} onChange={noop} />
      </NextIntlClientProvider>,
    );

    const field = screen.getByLabelText('Zápis v obchodním rejstříku') as HTMLInputElement;
    expect(field.required).toBe(true);
    expect(screen.getByText(/§ 435/)).toBeTruthy();
  });

  it('does not mark Registergericht/Sitz as required for a DE issuer with no Handelsregisternummer', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <IssuerCompanyFields values={DE_VALUES_NO_HRB} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect((screen.getByLabelText('Registergericht') as HTMLInputElement).required).toBe(false);
    expect((screen.getByLabelText('Sitz') as HTMLInputElement).required).toBe(false);
  });

  it('marks Registergericht/Sitz as required for a DE issuer once a Handelsregisternummer is entered', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <IssuerCompanyFields values={DE_VALUES_WITH_HRB} onChange={noop} />
      </NextIntlClientProvider>,
    );

    expect((screen.getByLabelText('Registergericht') as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText('Sitz') as HTMLInputElement).required).toBe(true);
  });
});
