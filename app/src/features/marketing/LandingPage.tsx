'use client';

import { PRICING } from '@app/features/legal/company';
import { LegalFooter } from '@app/features/legal/LegalFooter';
import brandIcon from '@app/features/shell/brand-icon.png';
import { Button, Card } from '@design/components';
import Image from 'next/image';
import Link from 'next/link';

const CAPABILITIES = [
  'Фактури, проформи, кредитни и дебитни известия, оферти и стокови разписки.',
  'Номерация по редици — десетразредни номера, без пропуски, без повторения.',
  'ДДС по ЗДДС, включително основание за неначисляване при нерегистриран издател.',
  'Суми в евро и в лева по фиксирания курс, с изписване на сумата с думи.',
  'Готов PDF с кирилица, който се изтегля или изпраща по имейл.',
];

export function LandingPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-12 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image src={brandIcon} alt="" className="h-9 w-9" priority />
          <span className="text-lg font-bold text-text">Фактурчо</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/login">Вход</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Създай акаунт</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-10">
        <section className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-text">
            Фактури, които отговарят на българските изисквания
          </h1>
          <p className="text-lg leading-relaxed text-text-muted">
            Уеб приложение за българско дружество или самоосигуряващо се лице. Съставяте документа в
            браузъра, а Фактурчо се грижи за номерацията, ДДС режима и оформлението.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-text">Какво можете да издавате</h2>
          <ul className="flex flex-col gap-2">
            {CAPABILITIES.map((capability) => (
              <li key={capability} className="text-base leading-relaxed text-text-muted">
                {capability}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-text">Цени</h2>
          <div className="grid gap-4 sm:grid-cols-1">
            <Card className="flex flex-col gap-2 p-5">
              <h3 className="text-base font-semibold text-text">Плащате според ползването</h3>
              <p className="text-2xl font-bold text-text">{PRICING.perDocument}</p>
              <p className="text-sm leading-relaxed text-text-muted">
                За всеки издаден документ. Чернови, клиенти и артикули са безплатни. Кредит се
                зарежда с пакети от {PRICING.packs}, чрез банков превод.
              </p>
            </Card>
          </div>
          <p className="text-sm text-text-muted">
            Нов акаунт получава {PRICING.signupGrant} кредит при регистрация.
          </p>
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}
