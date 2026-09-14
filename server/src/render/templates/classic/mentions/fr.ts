import { TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import { formatDateForLocale } from '../../../../money/format';
import { toSharedDocumentType } from '../../../prisma-mappers';
import type { MentionsBuilder } from './index';

const AUTOLIQUIDATION_MENTION = 'Autoliquidation, article 283 du CGI';
const INTRA_EU_SUPPLY_MENTION = 'Exonération de TVA, article 262 ter I du CGI';
const EXPORT_MENTION = 'Exonération de TVA, article 262 I du CGI';

export const frMentions: MentionsBuilder = ({ document, lineItems }) => {
  const mentions: string[] = [];
  const categories = new Set(lineItems.map((line) => line.vatCategory));
  const ground = document.vatExemptionGround;

  if (categories.has('AE') && ground !== AUTOLIQUIDATION_MENTION) {
    mentions.push(AUTOLIQUIDATION_MENTION);
  }
  if (categories.has('K') && ground !== INTRA_EU_SUPPLY_MENTION) {
    mentions.push(INTRA_EU_SUPPLY_MENTION);
  }
  if (categories.has('G') && ground !== EXPORT_MENTION) {
    mentions.push(EXPORT_MENTION);
  }

  if (TAX_DOCUMENT_TYPES[toSharedDocumentType(document.documentType)]) {
    if (document.dueAt) {
      mentions.push(`Date d'échéance : ${formatDateForLocale(document.dueAt, 'fr')}`);
    }
    mentions.push('Escompte pour paiement anticipé : néant');
    mentions.push(
      "Taux des pénalités de retard : taux d'intérêt de la BCE applicable à son opération de refinancement la plus récente, majoré de 10 points",
    );
    mentions.push('Indemnité forfaitaire pour frais de recouvrement : 40 €');
  }

  return mentions;
};
