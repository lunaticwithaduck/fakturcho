import { DOCUMENT_TYPES, type DocumentType } from '@fakturcho/shared-types';

export function toSharedDocumentType(value: string): DocumentType {
  const lowered = value.toLowerCase();
  const match = DOCUMENT_TYPES.find((type) => type === lowered);
  if (!match) throw new Error(`Unknown document type: ${value}`);
  return match;
}
