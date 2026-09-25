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

describe('renderClassicTemplateHtml — PL KOD I / ES VERI*FACTU QR blocks', () => {
  it('omits both QR blocks when neither is supplied', () => {
    const html = renderClassicTemplateHtml(baseInput());
    expect(html).not.toContain('class="ksef-qr"');
    expect(html).not.toContain('class="verifactu-qr-row"');
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

  it('prints the VERI*FACTU QR with no legend when the record was not sent to AEAT', () => {
    const html = renderClassicTemplateHtml(
      baseInput({ verifactuQr: { svg: '<svg data-fake="verifactu"></svg>', legend: null } }),
    );
    expect(html).toContain('class="verifactu-qr-row"');
    expect(html).toContain('<svg data-fake="verifactu"></svg>');
    expect(html).not.toContain('class="qr-legend"');
  });

  it('prints the VERI*FACTU legend only when one is supplied', () => {
    const html = renderClassicTemplateHtml(
      baseInput({ verifactuQr: { svg: '<svg></svg>', legend: 'VERI*FACTU' } }),
    );
    expect(html).toContain('<div class="qr-legend">VERI*FACTU</div>');
  });

  it('escapes the KOD I label', () => {
    const html = renderClassicTemplateHtml(
      baseInput({ ksefQr: { svg: '<svg></svg>', label: '<script>' } }),
    );
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});
