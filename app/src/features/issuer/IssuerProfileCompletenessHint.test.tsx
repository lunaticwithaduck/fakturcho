// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import type { IssuerProfileDto } from '@shared/types';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it } from 'vitest';
import { IssuerProfileCompletenessHint } from './IssuerProfileCompletenessHint';

const BASE: IssuerProfileDto = {
  id: '1',
  companyName: 'Тест ЕООД',
  eik: '123456789',
  mol: null,
  addressLine: 'ул. Тестова 1',
  street: null,
  postcode: null,
  countyRegion: null,
  city: 'София',
  country: 'BG',
  phone: null,
  vatRegistered: false,
  vatNumber: null,
  bankName: null,
  iban: null,
  bic: null,
  altIban: null,
  peppolEndpointId: null,
  peppolScheme: null,
  identifiers: {},
  vatOnCashBasis: false,
  vatOnDebits: false,
};

afterEach(cleanup);

describe('IssuerProfileCompletenessHint', () => {
  it('renders nothing for a complete profile', () => {
    const { container } = render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <IssuerProfileCompletenessHint profile={BASE} />
      </NextIntlClientProvider>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('names the missing Bulgarian field', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <IssuerProfileCompletenessHint profile={{ ...BASE, companyName: null }} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(/Фирма/)).toBeTruthy();
  });

  it('names the missing county field as Județ for a RO profile', () => {
    const roProfile: IssuerProfileDto = {
      ...BASE,
      country: 'RO',
      addressLine: null,
      street: 'Strada Exemplu 1',
      postcode: '010101',
      countyRegion: null,
    };
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <IssuerProfileCompletenessHint profile={roProfile} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(/Județ/)).toBeTruthy();
  });

  it('names the missing county field as Provincia for an IT profile', () => {
    const itProfile: IssuerProfileDto = {
      ...BASE,
      country: 'IT',
      addressLine: null,
      street: 'Via Roma 1',
      postcode: '00100',
      countyRegion: null,
    };
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <IssuerProfileCompletenessHint profile={itProfile} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(/Provincia/)).toBeTruthy();
  });

  it('names the missing identifier field with the issuer country acronym', () => {
    const plProfile: IssuerProfileDto = {
      ...BASE,
      country: 'PL',
      addressLine: null,
      street: 'ul. Testowa 1',
      postcode: '00-001',
      eik: null,
    };
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <IssuerProfileCompletenessHint profile={plProfile} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(/NIP/)).toBeTruthy();
  });
});
