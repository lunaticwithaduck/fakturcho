import {
  type DocumentType,
  formatDocumentNumber,
  getDocumentTypeLabel,
} from '@fakturcho/shared-types';
import type { ClassicLanguage } from './templates/classic/labels';

export function buildDownloadFilename(
  documentType: DocumentType,
  isDraft: boolean,
  number: number | null,
  language: ClassicLanguage,
): string {
  const label = getDocumentTypeLabel(documentType, language);
  const draftMarker = language === 'bg' ? 'Чернова' : 'Draft';
  const numberPart = isDraft || number === null ? draftMarker : formatDocumentNumber(number);
  return `${label}_${numberPart}.pdf`;
}

export function buildAsciiFallbackFilename(filename: string): string {
  const match = /_(\d+|Чернова|Draft)\.pdf$/.exec(filename);
  if (!match) return 'document.pdf';
  const suffix = match[1] === 'Чернова' || match[1] === 'Draft' ? 'draft' : match[1];
  return `document_${suffix}.pdf`;
}

export type DispositionType = 'attachment' | 'inline';

export function buildContentDisposition(
  filename: string,
  asciiFilename: string,
  type: DispositionType = 'attachment',
): string {
  return `${type}; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
