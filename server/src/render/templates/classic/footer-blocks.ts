import { type DocumentType, getCountryConfig } from '@fakturcho/shared-types';
import type { Document } from '@prisma/client';
import { readIdentifiers } from '../../../issuer/identifiers';
import {
  addressContainsCity,
  appendCountyRegionSuffix,
  cityWithCountyRegion,
  escapeHtml,
  identifierLine,
  keepAbbreviationsWithNextWord,
  keepShortValueTogether,
  labelled,
  line,
} from './html-utils';
import type { ClassicLocaleContext } from './locale';

function formatIssuerAddress(document: Document, issuerCountry: string): string {
  const city = cityWithCountyRegion(
    document.issuerCity,
    document.issuerCountyRegion,
    issuerCountry,
  );
  const address = document.issuerAddressLine
    ? [
        document.issuerAddressLine,
        addressContainsCity(document.issuerAddressLine, document.issuerCity) ? '' : city,
      ]
        .filter(Boolean)
        .join(', ')
    : [document.issuerStreet, [document.issuerPostcode, city].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', ');
  return appendCountyRegionSuffix(
    address,
    document.issuerCity,
    document.issuerCountyRegion,
    issuerCountry,
  );
}

function groupIban(iban: string): string {
  return iban.replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ');
}

// Art. 2250 c.c.: liquidation status prints right after the company name;
// full payment of the share capital prints as "i.v." after its amount;
// a sole shareholder prints as its own notation next to the registration data.
function itCompanyNameSuffix(identifiers: Record<string, string>): string {
  return identifiers.inLiquidazione === 'true' ? ' in liquidazione' : '';
}

function itShareCapitalValue(identifiers: Record<string, string>): string | null {
  const value = identifiers.shareCapital;
  if (!value) return null;
  return identifiers.capitaleVersato === 'true' ? `${value} i.v.` : value;
}

// C. com. L526-22, R526-26: a sole trader's professional denomination must
// incorporate their name preceded or followed by "entrepreneur individuel"
// or the initials "EI" — printed next to the name, not as a separate row.
const FR_SOLE_TRADER_LEGAL_FORM = /^(ei|e\.i\.|(entrepreneur|entrepreneuse)\s+individuel(le)?)$/i;

function frSoleTraderLegalForm(identifiers: Record<string, string>): string | null {
  const legalForm = identifiers.legalForm?.trim();
  return legalForm && FR_SOLE_TRADER_LEGAL_FORM.test(legalForm) ? legalForm : null;
}

// Codul fiscal art. 316/317: the "RO" prefix denotes VAT registration, so a
// non-VAT-registered party's bare CUI must print without it.
function stripUnregisteredRoCuiPrefix(
  eik: string | null,
  country: string,
  vatRegistered: boolean,
): string | null {
  if (country !== 'RO' || vatRegistered || !eik) return eik;
  const stripped = eik.replace(/^ro/i, '').trim();
  return stripped || eik;
}

export function buildIssuerBlock(
  document: Document,
  documentType: DocumentType,
  locale: ClassicLocaleContext,
): string {
  const { labels, language } = locale;
  const addressLine = formatIssuerAddress(document, locale.issuerCountry);
  const identifiers = readIdentifiers(document.issuerIdentifiers);
  const isIt = locale.issuerCountry === 'IT';
  const isFr = locale.issuerCountry === 'FR';
  const frLegalForm = isFr ? frSoleTraderLegalForm(identifiers) : null;
  const isCz = locale.issuerCountry === 'CZ';
  const identifierRows = getCountryConfig(locale.issuerCountry)
    .identifiers.filter(
      (field) => field.kind !== 'flag' && !(frLegalForm && field.key === 'legalForm'),
    )
    .map((field) => {
      const rawValue =
        field.key === 'shareCapital' && isIt
          ? itShareCapitalValue(identifiers)
          : (identifiers[field.key] ?? null);
      return identifierLine(
        // NOZ § 435 odst. 1 sets no language for this entry: the printed
        // label follows the document language, not the CZ profile form's
        // own (Czech) label.
        isCz && field.key === 'companyRegister' && labels.companyRegisterLabel
          ? labels.companyRegisterLabel
          : field.label,
        rawValue !== null ? keepShortValueTogether(rawValue) : null,
        language,
      );
    })
    .join('');
  const socioUnicoRow = isIt && identifiers.socioUnico === 'true' ? '<div>Socio unico</div>' : '';
  const nameSuffix = isIt ? itCompanyNameSuffix(identifiers) : frLegalForm ? ` ${frLegalForm}` : '';
  const columnOne = [
    `<div class="block-title">${labels.supplierTitle}</div>`,
    document.issuerCompanyName
      ? `<div class="no-break">${escapeHtml(document.issuerCompanyName)}${escapeHtml(nameSuffix)}</div>`
      : '',
    identifierLine(
      labels.companyIdLabel,
      stripUnregisteredRoCuiPrefix(
        document.issuerEik,
        locale.issuerCountry,
        Boolean(document.issuerVatRegistered),
      ),
      language,
    ),
    identifierRows,
    socioUnicoRow,
    line(labels.vatNumberPrefix, document.issuerVatNumber),
    locale.showMol ? line(labels.molPrefix, document.issuerMol) : '',
  ].join('');
  const columnTwo = [
    addressLine
      ? `<div>${keepAbbreviationsWithNextWord(escapeHtml(addressLine), language)}</div>`
      : '',
    line(labels.phonePrefix, document.issuerPhone),
  ].join('');
  const columnThree =
    documentType === 'delivery_note'
      ? ''
      : [
          document.issuerBankName ? `<div>${escapeHtml(document.issuerBankName)}</div>` : '',
          document.issuerIban
            ? `<div class="no-break">${labelled('IBAN', language)}${escapeHtml(groupIban(document.issuerIban))}</div>`
            : '',
          line(labels.bicPrefix, document.issuerBic),
        ].join('');
  return `<div class="issuer-block">
    <div>${columnOne}</div>
    <div>${columnTwo}</div>
    <div>${columnThree}</div>
  </div>`;
}

export function buildSignatureRow(
  document: Document,
  documentType: DocumentType,
  locale: ClassicLocaleContext,
): string {
  const { labels } = locale;
  return `<div class="signature-row">
    <div>${labels.preparedByPrefix(documentType)}${escapeHtml(document.preparedBy ?? '')}</div>
    <div>${labels.recipientSignaturePrefix(documentType)}${escapeHtml(document.recipientMol ?? '')}</div>
  </div>`;
}
