import Link from 'next/link';
import { COMPANY, describeEntity } from './company';

const LINKS = [
  { href: '/terms', label: 'Общи условия' },
  { href: '/privacy', label: 'Политика за поверителност' },
  { href: '/refunds', label: 'Възстановяване на суми' },
] as const;

export function LegalFooter() {
  return (
    <footer className="flex flex-col items-center gap-3 border-t border-border pt-6 text-center">
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm text-text-muted underline">
            {link.label}
          </Link>
        ))}
        <a href={`mailto:${COMPANY.supportEmail}`} className="text-sm text-text-muted underline">
          Контакт
        </a>
      </nav>
      <p className="text-xs text-text-subtle">{describeEntity()}</p>
    </footer>
  );
}
