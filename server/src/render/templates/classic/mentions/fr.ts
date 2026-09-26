import type { OperationNature } from '@fakturcho/shared-types';
import { TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import { formatDateForLocale } from '../../../../money/format';
import { toSharedDocumentType } from '../../../prisma-mappers';
import type { ClassicLanguage } from '../labels';
import type { MentionsBuilder } from './index';

const AUTOLIQUIDATION_MENTION =
  'Autoliquidation – TVA due par le preneur, art. 259-1 du CGI et art. 196 de la directive 2006/112/CE';
const INTRA_EU_SUPPLY_MENTION = 'Exonération de TVA, article 262 ter I du CGI';
const EXPORT_MENTION = 'Exonération de TVA, article 262 I du CGI';
// CGI art. 242 nonies A I 17°: mandatory on every invoice once the supplier
// has opted for the debits basis (paiement de la taxe d'après les débits).
const VAT_ON_DEBITS_MENTION = "Option pour le paiement de la taxe d'après les débits";

// These three grounds are FR's own statutory citations (French, since FR
// issues only in French) — a document issued in one of the app's other 6
// languages still needs a note the reader can follow. The ground itself
// (document.vatExemptionGround) is never translated, only the mention text.
const AUTOLIQUIDATION_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  fr: AUTOLIQUIDATION_MENTION,
  en: 'Reverse charge – VAT due by the customer, Art. 259-1 of the CGI and Art. 196 of Council Directive 2006/112/EC',
  de: 'Steuerschuldnerschaft des Leistungsempfängers, Art. 259-1 CGI und Art. 196 der Richtlinie 2006/112/EG',
  it: 'Inversione contabile – IVA dovuta dal destinatario, art. 259-1 del CGI e art. 196 della direttiva 2006/112/CE',
  pl: 'Odwrotne obciążenie – podatek rozlicza nabywca, art. 259-1 CGI i art. 196 dyrektywy 2006/112/WE',
  ro: 'Taxare inversă – TVA datorată de client, art. 259-1 din CGI și art. 196 din Directiva 2006/112/CE',
  bg: 'Обратно начисляване – данъкът се дължи от клиента, чл. 259-1 от CGI и чл. 196 от Директива 2006/112/ЕО',
};
const INTRA_EU_SUPPLY_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  fr: INTRA_EU_SUPPLY_MENTION,
  en: 'Intra-Community supply, Article 138 of Council Directive 2006/112/EC (Art. 262 ter I of the CGI)',
  de: 'Steuerfreie innergemeinschaftliche Lieferung gemäß Art. 138 der Richtlinie 2006/112/EG (Art. 262 ter I CGI)',
  it: 'Cessione intracomunitaria esente, articolo 138 della direttiva 2006/112/CE (art. 262 ter I del CGI)',
  pl: 'Wewnątrzwspólnotowa dostawa towarów zwolniona z VAT, art. 138 dyrektywy 2006/112/WE (art. 262 ter I CGI)',
  ro: 'Livrare intracomunitară scutită, art. 138 din Directiva 2006/112/CE (art. 262 ter I din CGI)',
  bg: 'Вътреобщностна доставка, освободена от ДДС, чл. 138 от Директива 2006/112/ЕО (чл. 262 ter I от CGI)',
};
const EXPORT_NOTE_BY_LANGUAGE: Partial<Record<ClassicLanguage, string>> = {
  fr: EXPORT_MENTION,
  en: 'Export, Article 146 of Council Directive 2006/112/EC (Art. 262 I of the CGI)',
  de: 'Steuerfreie Ausfuhrlieferung gemäß Art. 146 der Richtlinie 2006/112/EG (Art. 262 I CGI)',
  it: 'Esportazione non imponibile, articolo 146 della direttiva 2006/112/CE (art. 262 I del CGI)',
  pl: 'Eksport towarów zwolniony z VAT, art. 146 dyrektywy 2006/112/WE (art. 262 I CGI)',
  ro: 'Export scutit de TVA, art. 146 din Directiva 2006/112/CE (art. 262 I din CGI)',
  bg: 'Износ, освободен от ДДС, чл. 146 от Директива 2006/112/ЕО (чл. 262 I от CGI)',
};

export const frMentions: MentionsBuilder = ({ document, lineItems, locale }) => {
  const mentions: string[] = [];
  const categories = new Set(lineItems.map((line) => line.vatCategory));
  const ground = document.vatExemptionGround;
  const sharedType = toSharedDocumentType(document.documentType);

  if (categories.has('AE') && ground !== AUTOLIQUIDATION_MENTION) {
    mentions.push(AUTOLIQUIDATION_NOTE_BY_LANGUAGE[locale.language] ?? AUTOLIQUIDATION_MENTION);
  }
  if (categories.has('K') && ground !== INTRA_EU_SUPPLY_MENTION) {
    mentions.push(INTRA_EU_SUPPLY_NOTE_BY_LANGUAGE[locale.language] ?? INTRA_EU_SUPPLY_MENTION);
  }
  if (categories.has('G') && ground !== EXPORT_MENTION) {
    mentions.push(EXPORT_NOTE_BY_LANGUAGE[locale.language] ?? EXPORT_MENTION);
  }

  // CGI art. 283: the debits option only shifts VAT collection timing on a taxed
  // supply — it makes no sense (and must not print) on an autoliquidation or
  // exempt invoice where the supplier collects no VAT to begin with.
  const hasTaxedLine = lineItems.some((line) => line.vatRateBp > 0);
  if (document.issuerVatOnDebits && TAX_DOCUMENT_TYPES[sharedType] && hasTaxedLine) {
    mentions.push(VAT_ON_DEBITS_MENTION);
  }
  if (TAX_DOCUMENT_TYPES[sharedType]) {
    if (document.operationNature) {
      const nature = document.operationNature as OperationNature;
      mentions.push(
        `${locale.labels.operationNaturePrefix}${locale.labels.operationNatureLabels[nature]}`,
      );
    }
    if (document.deliveryAddress) {
      mentions.push(`${locale.labels.deliveryAddressPrefix}${document.deliveryAddress}`);
    }
  }

  if (TAX_DOCUMENT_TYPES[sharedType] && sharedType !== 'credit_note') {
    if (document.dueAt) {
      mentions.push(`Date d'échéance : ${formatDateForLocale(document.dueAt, 'fr')}`);
    } else if (
      document.issuedAt &&
      !document.paymentTermsNote &&
      document.paymentTermsDays == null
    ) {
      // C. com. art. L441-10 I: the 30-day default applies only when the
      // parties agreed no term; a paymentTermsNote means they did.
      const defaultDue = new Date(document.issuedAt);
      defaultDue.setUTCDate(defaultDue.getUTCDate() + 30);
      mentions.push(`Date d'échéance : ${formatDateForLocale(defaultDue, 'fr')}`);
    }
    // C. com. art. L441-9/L441-10/D441-5: the early-payment discount, the
    // late-payment penalty rate and the fixed 40 € recovery-cost indemnity are
    // all mandatory only "entre professionnels" — a consumer (B2C) client
    // never sees them.
    if (document.recipientClientType !== 'consumer') {
      mentions.push('Escompte pour paiement anticipé : néant');
      mentions.push(
        "Taux des pénalités de retard : taux d'intérêt de la BCE applicable à son opération de refinancement la plus récente, majoré de 10 points",
      );
      mentions.push('Indemnité forfaitaire pour frais de recouvrement : 40 €');
    }
  }

  return mentions;
};
