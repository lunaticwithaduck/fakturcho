import { describe, expect, it } from 'vitest';
import type { VatPresentation } from '../../../money/vat';
import { renderClassicTemplateHtml } from './template';
import { buildFakeDocument, buildFakeLineItems } from './testing/fake-document';

const PL_B2B_SERVICES_GROUND =
  'usługa niepodlegająca opodatkowaniu na terytorium kraju – art. 28b ustawy o podatku od towarów i usług';
const PL_INSURANCE_GROUND =
  'usługi ubezpieczeniowe – art. 43 ust. 1 pkt 37 ustawy o podatku od towarów i usług';

function render(exemptionGround: string, vatCategory: string): string {
  const presentation: VatPresentation = {
    vatCharged: false,
    showExemptionLine: true,
    exemptionGround,
  };
  return renderClassicTemplateHtml({
    document: buildFakeDocument({ vatExemptionGround: exemptionGround, issuerCountry: 'PL' }),
    lineItems: buildFakeLineItems({ vatCategory, vatRateBp: 0 }),
    presentation,
    isDraft: false,
    language: 'pl',
    issuerCountry: 'PL',
  });
}

// art. 106e ust. 1 pkt 18: a B2B service to an EU business is not subject to
// Polish VAT at all (art. 28b), so it must not read as an exemption, and the
// buyer's self-assessment is announced by the "odwrotne obciążenie" mention.
describe('PL B2B EU service (art. 28b, not-subject) invoice', () => {
  it('prints the ground without "Podstawa zwolnienia:" and adds the reverse-charge mention', () => {
    const html = render(PL_B2B_SERVICES_GROUND, 'AE');
    expect(html).toContain(`<div class="exemption">${PL_B2B_SERVICES_GROUND}</div>`);
    expect(html).not.toContain(`Podstawa zwolnienia: ${PL_B2B_SERVICES_GROUND}`);
    expect(html).toContain('odwrotne obciążenie');
  });
});

describe('PL domestic VAT exemption (art. 43 ust. 1 pkt 37)', () => {
  it('keeps the "Podstawa zwolnienia:" prefix — this is a real exemption, not a note', () => {
    const html = render(PL_INSURANCE_GROUND, 'E');
    expect(html).toContain(`Podstawa zwolnienia: ${PL_INSURANCE_GROUND}`);
  });
});
