import type { DocumentDto } from '@fakturcho/shared-types';
import { toXRechnungXml } from '../../einvoice-adapters/de/xrechnung-mapper';
import { checkXRechnungReadiness } from '../../einvoice-adapters/de/xrechnung-readiness';
import { toFacturaeXml } from '../../einvoice-adapters/es/facturae-mapper';
import { checkFacturaeReadiness } from '../../einvoice-adapters/es/facturae-readiness';
import { toFrenchUblXml } from '../../einvoice-adapters/fr/fr-mapper';
import { checkFrenchEinvoiceReadiness } from '../../einvoice-adapters/fr/fr-readiness';
import { toFatturaPaXml } from '../../einvoice-adapters/it/fatturapa-mapper';
import { checkFatturaPaReadiness } from '../../einvoice-adapters/it/fatturapa-readiness';
import { toFa3Xml } from '../../einvoice-adapters/pl/fa3-mapper';
import { checkFa3Readiness } from '../../einvoice-adapters/pl/fa3-readiness';
import { toCiusRoXml } from '../../einvoice-adapters/ro/cius-ro-mapper';
import { checkCiusRoReadiness } from '../../einvoice-adapters/ro/cius-ro-readiness';
import { checkEinvoiceReadiness } from '../readiness';
import { toUblXml } from '../ubl-mapper';

export interface EinvoiceReadinessResult {
  ready: boolean;
  missingFields: string[];
}

type XmlMapper = (document: DocumentDto) => string;
type ReadinessCheck = (document: DocumentDto) => EinvoiceReadinessResult;

const XML_MAPPERS_BY_ISSUER_COUNTRY: Record<string, XmlMapper> = {
  DE: (document) => toXRechnungXml(document),
  RO: (document) => toCiusRoXml(document),
  FR: (document) => toFrenchUblXml(document),
  ES: (document) => toFacturaeXml(document),
  IT: (document) => toFatturaPaXml(document),
  PL: (document) => toFa3Xml(document),
};

const READINESS_CHECKS_BY_ISSUER_COUNTRY: Record<string, ReadinessCheck> = {
  DE: (document) => checkXRechnungReadiness(document),
  RO: (document) => checkCiusRoReadiness(document),
  FR: (document) => checkFrenchEinvoiceReadiness(document),
  ES: (document) => checkFacturaeReadiness(document),
  IT: (document) => checkFatturaPaReadiness(document),
  PL: (document) => checkFa3Readiness(document),
};

export function selectEinvoiceXmlMapper(issuerCountry: string | null): XmlMapper {
  if (issuerCountry && issuerCountry in XML_MAPPERS_BY_ISSUER_COUNTRY) {
    return XML_MAPPERS_BY_ISSUER_COUNTRY[issuerCountry] as XmlMapper;
  }
  return toUblXml;
}

export function selectEinvoiceReadinessCheck(issuerCountry: string | null): ReadinessCheck {
  if (issuerCountry && issuerCountry in READINESS_CHECKS_BY_ISSUER_COUNTRY) {
    return READINESS_CHECKS_BY_ISSUER_COUNTRY[issuerCountry] as ReadinessCheck;
  }
  return checkEinvoiceReadiness;
}
