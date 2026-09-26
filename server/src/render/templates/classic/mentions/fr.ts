import type { OperationNature } from '@fakturcho/shared-types';
import { TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import { formatDateForLocale } from '../../../../money/format';
import { toSharedDocumentType } from '../../../prisma-mappers';
import type { MentionsBuilder } from './index';

const AUTOLIQUIDATION_MENTION =
  'Autoliquidation – TVA due par le preneur, art. 259-1 du CGI et art. 196 de la directive 2006/112/CE';
const INTRA_EU_SUPPLY_MENTION = 'Exonération de TVA, article 262 ter I du CGI';
const EXPORT_MENTION = 'Exonération de TVA, article 262 I du CGI';
// CGI art. 242 nonies A I 17°: mandatory on every invoice once the supplier
// has opted for the debits basis (paiement de la taxe d'après les débits).
const VAT_ON_DEBITS_MENTION = "Option pour le paiement de la taxe d'après les débits";

export const frMentions: MentionsBuilder = ({ document, lineItems, locale }) => {
  const mentions: string[] = [];
  const categories = new Set(lineItems.map((line) => line.vatCategory));
  const ground = document.vatExemptionGround;
  const sharedType = toSharedDocumentType(document.documentType);

  if (categories.has('AE') && ground !== AUTOLIQUIDATION_MENTION) {
    mentions.push(AUTOLIQUIDATION_MENTION);
  }
  if (categories.has('K') && ground !== INTRA_EU_SUPPLY_MENTION) {
    mentions.push(INTRA_EU_SUPPLY_MENTION);
  }
  if (categories.has('G') && ground !== EXPORT_MENTION) {
    mentions.push(EXPORT_MENTION);
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
    mentions.push('Escompte pour paiement anticipé : néant');
    mentions.push(
      "Taux des pénalités de retard : taux d'intérêt de la BCE applicable à son opération de refinancement la plus récente, majoré de 10 points",
    );
    mentions.push('Indemnité forfaitaire pour frais de recouvrement : 40 €');
  }

  return mentions;
};
