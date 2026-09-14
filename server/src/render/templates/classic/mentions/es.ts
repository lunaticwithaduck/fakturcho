import type { MentionsBuilder } from './index';

export const esMentions: MentionsBuilder = ({ lineItems }) => {
  const mentions: string[] = [];
  if (lineItems.some((line) => line.vatCategory === 'AE')) {
    mentions.push('Inversión del sujeto pasivo, artículo 84.Uno.2º de la Ley 37/1992 del IVA');
  }
  if (lineItems.some((line) => line.vatCategory === 'K')) {
    mentions.push('Entrega intracomunitaria exenta, artículo 25 de la Ley 37/1992 del IVA');
  }
  if (lineItems.some((line) => line.vatCategory === 'G')) {
    mentions.push('Exportación exenta, artículo 21 de la Ley 37/1992 del IVA');
  }
  return mentions;
};
