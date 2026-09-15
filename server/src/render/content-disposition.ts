import { type DocumentType, formatDocumentNumber } from '@fakturcho/shared-types';
import { type ClassicLanguage, getClassicLabels } from './templates/classic/labels';

export function buildDownloadFilename(
  documentType: DocumentType,
  isDraft: boolean,
  number: number | null,
  language: ClassicLanguage,
): string {
  const labels = getClassicLabels(language);
  const label = labels.documentType[documentType];
  const draftMarker = labels.draftLabel;
  const numberPart = isDraft || number === null ? draftMarker : formatDocumentNumber(number);
  return `${label}_${numberPart}.pdf`;
}

export function buildAsciiFallbackFilename(filename: string): string {
  const match = /_(\d+|[^_]+)\.pdf$/.exec(filename);
  if (!match) return 'document.pdf';
  const suffix = /^\d+$/.test(match[1] ?? '') ? match[1] : 'draft';
  return `document_${suffix}.pdf`;
}

export type DispositionType = 'attachment' | 'inline';

// encodeURIComponent leaves *, ', ( and ) unescaped, but RFC 5987's attr-char
// excludes them — encode what it misses so filename* is valid wherever a
// document type label carries one of those characters (e.g. "(abono)").
function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(
    /[*'()]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function buildContentDisposition(
  filename: string,
  asciiFilename: string,
  type: DispositionType = 'attachment',
): string {
  return `${type}; filename="${asciiFilename}"; filename*=UTF-8''${encodeRfc5987(filename)}`;
}
