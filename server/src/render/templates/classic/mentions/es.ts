import type { MentionsBuilder } from './index';

const REVERSE_CHARGE_DOMESTIC =
  'Inversión del sujeto pasivo, artículo 84.Uno.2º de la Ley 37/1992 del IVA';
const REVERSE_CHARGE_CROSS_BORDER =
  'Inversión del sujeto pasivo (artículo 196 de la Directiva 2006/112/CE)';

export const esMentions: MentionsBuilder = ({ document, lineItems }) => {
  const mentions: string[] = [];
  if ((document.vatExemptionGround ?? '').includes('69.Uno.1º')) {
    mentions.push(REVERSE_CHARGE_CROSS_BORDER);
  } else if (lineItems.some((line) => line.vatCategory === 'AE')) {
    const crossBorder = Boolean(
      document.recipientCountry && document.recipientCountry !== document.issuerCountry,
    );
    mentions.push(crossBorder ? REVERSE_CHARGE_CROSS_BORDER : REVERSE_CHARGE_DOMESTIC);
  }
  if (lineItems.some((line) => line.vatCategory === 'K')) {
    mentions.push('Entrega intracomunitaria exenta, artículo 25 de la Ley 37/1992 del IVA');
  }
  if (lineItems.some((line) => line.vatCategory === 'G')) {
    mentions.push('Exportación exenta, artículo 21 de la Ley 37/1992 del IVA');
  }
  return mentions;
};
