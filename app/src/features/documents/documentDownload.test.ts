import { describe, expect, it } from 'vitest';
import { canDownloadDocument } from './documentDownload';

describe('canDownloadDocument', () => {
  it('refuses a draft — an unpaid document is preview-only', () => {
    expect(canDownloadDocument('draft')).toBe(false);
  });

  it('allows every issued status', () => {
    expect(canDownloadDocument('sent')).toBe(true);
    expect(canDownloadDocument('overdue')).toBe(true);
    expect(canDownloadDocument('paid')).toBe(true);
    expect(canDownloadDocument('cancelled')).toBe(true);
  });
});
