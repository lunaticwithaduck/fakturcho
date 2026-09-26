import { describe, expect, it } from 'vitest';
import { renderClassicTemplateHtml } from './template';
import { buildFakeDocument, buildFakeLineItems } from './testing/fake-document';

const vatChargedPresentation = {
  vatCharged: true,
  showExemptionLine: false,
  exemptionGround: null,
};

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    document: buildFakeDocument(),
    lineItems: buildFakeLineItems(),
    presentation: vatChargedPresentation,
    isDraft: false,
    language: 'en' as const,
    ...overrides,
  };
}

describe('renderClassicTemplateHtml — PL KOD I QR block', () => {
  it('omits the QR block when none is supplied', () => {
    const html = renderClassicTemplateHtml(baseInput());
    expect(html).not.toContain('class="ksef-qr"');
  });

  it('prints the KOD I QR with the KSeF number label when set', () => {
    const html = renderClassicTemplateHtml(
      baseInput({
        ksefQr: {
          svg: '<svg data-fake="kod-i"></svg>',
          label: '1234563218-20260905-010203ABCDEF-4A5B6C-7D',
        },
      }),
    );
    expect(html).toContain('class="ksef-qr"');
    expect(html).toContain('<svg data-fake="kod-i"></svg>');
    expect(html).toContain(
      '<div class="qr-label">1234563218-20260905-010203ABCDEF-4A5B6C-7D</div>',
    );
  });

  it('escapes the KOD I label', () => {
    const html = renderClassicTemplateHtml(
      baseInput({ ksefQr: { svg: '<svg></svg>', label: '<script>' } }),
    );
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});
