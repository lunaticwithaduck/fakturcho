import { guidesLlmsSection } from '@app/features/guides/llmsSection';
import { allGuides } from '@app/features/guides/registry';
import {
  CREDIT_PACKS,
  ISSUANCE_COST_CENTS,
  perDocumentCents,
  SIGNUP_GRANT_CENTS,
  SUBSCRIPTION_TIER_IDS,
  SUBSCRIPTION_TIERS,
} from '@shared/types';

function eur(cents: number): string {
  return `${(cents / 100).toFixed(2)} €`;
}

const packAmounts = Object.values(CREDIT_PACKS).map((pack) => eur(pack.eurCents));
const packs = `${packAmounts.slice(0, -1).join(', ')} and ${packAmounts.at(-1)}`;
const tierLines = SUBSCRIPTION_TIER_IDS.map(
  (id) =>
    `${eur(SUBSCRIPTION_TIERS[id].priceCents)} per month grants ${eur(SUBSCRIPTION_TIERS[id].grantCents)} credit (${eur(perDocumentCents(SUBSCRIPTION_TIERS[id].priceCents, SUBSCRIPTION_TIERS[id].grantCents))} per document)`,
).join('; ');
const guidesSection = guidesLlmsSection('Invoicing guides', allGuides());

const CONTENT = `# Fakturcho

> A web app for issuing EU-compliant invoices, proformas, credit and debit notes, quotes and delivery notes, with structured e-invoicing built in; pay per issued document, no installation required.

Fakturcho is for a company or sole trader established anywhere in the EU. Price: ${eur(ISSUANCE_COST_CENTS)} per issued document; drafts, clients and catalogue items are free; credit tops up in packs of ${packs} (${eur(ISSUANCE_COST_CENTS)} per document). A new account gets ${eur(SIGNUP_GRANT_CENTS)} starting credit with no card. Subscription, per month: ${tierLines}; credit carries over.

The product supports gap-free sequential numbering and VAT by country, including local rates, exemptions and cross-border reverse charge with a VIES check. For Germany, France, Italy, Poland, Romania, Spain and Bulgaria it also generates the national e-invoice XML (XRechnung, Chorus Pro, FatturaPA, KSeF FA(3), RO CIUS-RO, Facturae) or Peppol BIS 3.0, ready to upload to the national platform or send over Peppol, plus a PDF in the country's language sent by email.

## Pages

- [Home](https://www.fakturcho.com/en): product, features and pricing.
- [Sign up](https://www.fakturcho.com/en/signup): create a free account.
- [Log in](https://www.fakturcho.com/en/login): log in to an existing account.
- [Terms of Service](https://www.fakturcho.com/en/terms): terms for using the service.
- [Privacy Policy](https://www.fakturcho.com/en/privacy): personal data processing.
- [Refunds](https://www.fakturcho.com/en/refunds): refund policy for payments.
${guidesSection}
Bulgarian version: [https://www.fakturcho.com/llms.txt](https://www.fakturcho.com/llms.txt).
`;

export function GET(): Response {
  return new Response(CONTENT, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
