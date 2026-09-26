import type { DocumentDto } from '@fakturcho/shared-types';
import { toXRechnungXml } from '../../einvoice-adapters/de/xrechnung-mapper';
import { checkXRechnungReadiness } from '../../einvoice-adapters/de/xrechnung-readiness';
import { toFrenchUblXml } from '../../einvoice-adapters/fr/fr-mapper';
import { checkFrenchEinvoiceReadiness } from '../../einvoice-adapters/fr/fr-readiness';
import {
  type ToFatturaPaXmlOptions,
  toFatturaPaXml,
} from '../../einvoice-adapters/it/fatturapa-mapper';
import { checkFatturaPaReadiness } from '../../einvoice-adapters/it/fatturapa-readiness';
import { toFa3Xml } from '../../einvoice-adapters/pl/fa3-mapper';
import { checkFa3Readiness } from '../../einvoice-adapters/pl/fa3-readiness';
import { type ToCiusRoXmlOptions, toCiusRoXml } from '../../einvoice-adapters/ro/cius-ro-mapper';
import { checkCiusRoReadiness } from '../../einvoice-adapters/ro/cius-ro-readiness';
import { checkEinvoiceReadiness } from '../readiness';
import { toUblXml } from '../ubl-mapper';

export interface EinvoiceReadinessResult {
  ready: boolean;
  missingFields: string[];
}

type XmlMapper = (document: DocumentDto) => string;
type ReadinessCheck = (document: DocumentDto) => EinvoiceReadinessResult;

function ciusRoOptions(document: DocumentDto): ToCiusRoXmlOptions {
  return {
    ...(document.issuer.countyRegion ? { issuerCountyRegion: document.issuer.countyRegion } : {}),
    ...(document.recipient.countyRegion
      ? { recipientCountyRegion: document.recipient.countyRegion }
      : {}),
  };
}

function fatturaPaOptions(document: DocumentDto): ToFatturaPaXmlOptions {
  return {
    ...(document.recipient.sdiRecipientCode
      ? { sdiRecipientCode: document.recipient.sdiRecipientCode }
      : {}),
    ...(document.recipient.pec ? { pec: document.recipient.pec } : {}),
  };
}

const XML_MAPPERS_BY_ISSUER_COUNTRY: Record<string, XmlMapper> = {
  DE: (document) => toXRechnungXml(document),
  RO: (document) => toCiusRoXml(document, ciusRoOptions(document)),
  FR: (document) => toFrenchUblXml(document),
  IT: (document) => toFatturaPaXml(document, fatturaPaOptions(document)),
  PL: (document) => toFa3Xml(document),
};

const READINESS_CHECKS_BY_ISSUER_COUNTRY: Record<string, ReadinessCheck> = {
  DE: (document) => checkXRechnungReadiness(document),
  RO: (document) => checkCiusRoReadiness(document, ciusRoOptions(document)),
  FR: (document) => checkFrenchEinvoiceReadiness(document),
  IT: (document) => checkFatturaPaReadiness(document, fatturaPaOptions(document)),
  PL: (document) => checkFa3Readiness(document),
};

function normalizeCountry(issuerCountry: string | null): string | null {
  return issuerCountry ? issuerCountry.trim().toUpperCase() : null;
}

export function selectEinvoiceXmlMapper(issuerCountry: string | null): XmlMapper {
  const country = normalizeCountry(issuerCountry);
  if (country && country in XML_MAPPERS_BY_ISSUER_COUNTRY) {
    return XML_MAPPERS_BY_ISSUER_COUNTRY[country] as XmlMapper;
  }
  return toUblXml;
}

export function selectEinvoiceReadinessCheck(issuerCountry: string | null): ReadinessCheck {
  const country = normalizeCountry(issuerCountry);
  if (country && country in READINESS_CHECKS_BY_ISSUER_COUNTRY) {
    return READINESS_CHECKS_BY_ISSUER_COUNTRY[country] as ReadinessCheck;
  }
  return checkEinvoiceReadiness;
}
