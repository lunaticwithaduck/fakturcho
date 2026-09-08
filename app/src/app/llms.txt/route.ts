import {
  CREDIT_PACKS,
  DEFAULT_EXEMPTION_GROUND,
  EUR_BGN_PEG,
  ISSUANCE_COST_CENTS,
  perDocumentCents,
  SIGNUP_GRANT_CENTS,
  SUBSCRIPTION_TIER_IDS,
  SUBSCRIPTION_TIERS,
} from '@shared/types';

function eur(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

const packAmounts = Object.values(CREDIT_PACKS).map((pack) => eur(pack.eurCents));
const packs = `${packAmounts.slice(0, -1).join(', ')} и ${packAmounts.at(-1)}`;
const tierLines = SUBSCRIPTION_TIER_IDS.map(
  (id) =>
    `${eur(SUBSCRIPTION_TIERS[id].priceCents)} на месец дава ${eur(SUBSCRIPTION_TIERS[id].grantCents)} кредит (${eur(perDocumentCents(SUBSCRIPTION_TIERS[id].priceCents, SUBSCRIPTION_TIERS[id].grantCents))} на документ)`,
).join('; ');
const peg = String(EUR_BGN_PEG).replace('.', ',');

const CONTENT = `# Фактурчо

> Уеб приложение за издаване на фактури, проформи, кредитни и дебитни известия, оферти и стокови разписки по българските изисквания; плащане на издаден документ, без инсталация.

Фактурчо е за българско дружество или самоосигуряващо се лице. Цена: ${eur(ISSUANCE_COST_CENTS)} на издаден документ; чернови, клиенти и артикули са безплатни; кредит се зарежда с пакети от ${packs} (${eur(ISSUANCE_COST_CENTS)} на документ). Нов акаунт получава ${eur(SIGNUP_GRANT_CENTS)} начален кредит без карта. Абонамент, всеки месец: ${tierLines}; кредитът се запазва.

Продуктът поддържа номерация по редици без пропуски, ДДС по ЗДДС включително основанието ${DEFAULT_EXEMPTION_GROUND} за нерегистрирани издатели, суми в евро и лева по фиксирания курс ${peg}, PDF с кирилица и изпращане по имейл.

## Страници

- [Начало](https://www.fakturcho.com/): продукт, възможности и цени.
- [Регистрация](https://www.fakturcho.com/signup): създаване на безплатен акаунт.
- [Вход](https://www.fakturcho.com/login): вход в съществуващ акаунт.
- [Общи условия](https://www.fakturcho.com/terms): условия за ползване на услугата.
- [Политика за поверителност](https://www.fakturcho.com/privacy): обработка на лични данни.
- [Възстановяване на суми](https://www.fakturcho.com/refunds): политика за възстановяване на плащания.

Fakturcho is a web app for issuing Bulgarian-compliant invoices, proformas, credit/debit notes and quotes, billed per document.
`;

export function GET(): Response {
  return new Response(CONTENT, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
