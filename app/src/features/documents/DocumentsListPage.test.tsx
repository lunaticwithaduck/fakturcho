// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import type { IssuerProfileDto } from '@shared/types';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentsListPage } from './DocumentsListPage';

const BASE_PROFILE: IssuerProfileDto = {
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
};

let issuerProfileResult: { data: IssuerProfileDto | undefined; isLoading: boolean } = {
  data: BASE_PROFILE,
  isLoading: false,
};

vi.mock('@app/api', () => ({
  useListDocumentsQuery: () => ({ data: { items: [], total: 0 }, isLoading: false }),
  useGetIssuerProfileQuery: () => issuerProfileResult,
}));

afterEach(() => {
  cleanup();
  issuerProfileResult = { data: BASE_PROFILE, isLoading: false };
});

describe('DocumentsListPage', () => {
  it('renders the Bulgarian copy unchanged for the empty state', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentsListPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Документи' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Нов документ' }).length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Търсене')).toBeTruthy();
    expect(screen.getByPlaceholderText('Търсене по клиент или референция')).toBeTruthy();
    expect(screen.getByText('Нямате документи')).toBeTruthy();
    expect(screen.getByText('Създайте първия си документ, за да го видите тук.')).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentsListPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Documents' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'New document' }).length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Search')).toBeTruthy();
    expect(screen.getByText('You have no documents')).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('shows the completeness notice with a link to the profile screen when the profile is incomplete', () => {
    issuerProfileResult = {
      data: { ...BASE_PROFILE, companyName: null },
      isLoading: false,
    };

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentsListPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Profile is not ready for issuing')).toBeTruthy();
    expect(screen.getByText(/Company/)).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Go to issuer profile' });
    expect(link.getAttribute('href')).toBe('/profile');
  });

  it('hides the notice when the profile is complete', () => {
    issuerProfileResult = { data: BASE_PROFILE, isLoading: false };

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentsListPage />
      </NextIntlClientProvider>,
    );

    expect(screen.queryByText('Profile is not ready for issuing')).toBeNull();
  });

  it('hides the notice while the profile is still loading', () => {
    issuerProfileResult = { data: undefined, isLoading: true };

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentsListPage />
      </NextIntlClientProvider>,
    );

    expect(screen.queryByText('Profile is not ready for issuing')).toBeNull();
  });

  it('shows the Bulgarian notice copy with the profile link when incomplete', () => {
    issuerProfileResult = {
      data: { ...BASE_PROFILE, companyName: null },
      isLoading: false,
    };

    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentsListPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Профилът не е готов за издаване')).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Към профила на издателя' });
    expect(link.getAttribute('href')).toBe('/profile');
  });

  const countryCases: Array<{
    country: string;
    profile: Partial<IssuerProfileDto>;
    expectedField: string;
    unexpectedField?: string;
  }> = [
    {
      country: 'BG',
      profile: { country: 'BG', addressLine: null },
      expectedField: 'Address',
    },
    {
      country: 'DE',
      profile: {
        country: 'DE',
        addressLine: null,
        street: 'Hauptstrasse 1',
        postcode: '10115',
        identifiers: {},
      },
      expectedField: 'Steuernummer',
    },
    {
      country: 'ES',
      profile: { country: 'ES', addressLine: null, street: null, postcode: null },
      expectedField: 'Street and number',
      unexpectedField: 'Provincia',
    },
    {
      country: 'FR',
      profile: { country: 'FR', addressLine: null, street: null, postcode: null },
      expectedField: 'Street and number',
    },
    {
      country: 'IT',
      profile: {
        country: 'IT',
        addressLine: null,
        street: 'Via Roma 1',
        postcode: '00100',
        countyRegion: null,
      },
      expectedField: 'Provincia',
    },
    {
      country: 'PL',
      profile: { country: 'PL', addressLine: null, street: null, postcode: null },
      expectedField: 'Street and number',
    },
    {
      country: 'RO',
      profile: {
        country: 'RO',
        addressLine: null,
        street: 'Strada Exemplu 1',
        postcode: '010101',
        countyRegion: null,
      },
      expectedField: 'Județ',
    },
  ];

  it.each(countryCases)(
    'lists the $country-specific missing fields on the documents page',
    ({ profile, expectedField, unexpectedField }) => {
      issuerProfileResult = {
        data: { ...BASE_PROFILE, ...profile },
        isLoading: false,
      };

      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <DocumentsListPage />
        </NextIntlClientProvider>,
      );

      expect(screen.getByText('Profile is not ready for issuing')).toBeTruthy();
      expect(screen.getByText(new RegExp(expectedField))).toBeTruthy();
      if (unexpectedField) {
        expect(screen.queryByText(new RegExp(unexpectedField))).toBeNull();
      }
    },
  );
});
