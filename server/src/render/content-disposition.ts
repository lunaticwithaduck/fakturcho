import {
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
  formatDocumentNumber,
} from '@fakturcho/shared-types';

export function buildDownloadFilename(
  documentType: DocumentType,
  isDraft: boolean,
  number: number | null,
): string {
  const label = DOCUMENT_TYPE_LABELS[documentType];
  const numberPart = isDraft || number === null ? 'Чернова' : formatDocumentNumber(number);
  return `${label}_${numberPart}.pdf`;
}

export function buildAsciiFallbackFilename(filename: string): string {
  const match = /_(\d+|Чернова)\.pdf$/.exec(filename);
  if (!match) return 'document.pdf';
  const suffix = match[1] === 'Чернова' ? 'draft' : match[1];
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
