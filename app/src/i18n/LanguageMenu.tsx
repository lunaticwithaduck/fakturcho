'use client';

import {
  Button,
  ChevronDown,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Globe,
} from '@design/components';
import type { Locale } from '@shared/types';
import { PUBLISHED_LOCALES } from '@shared/types';
import { AUTONYMS, NAV_LABELS } from './languageNames';
import { LOCALE_QUERY_PARAM } from './localeRedirect';

interface LanguageMenuProps {
  locale: Locale;
  currentPath: string;
  enabled: boolean;
}

export function LanguageMenu({ locale, currentPath, enabled }: LanguageMenuProps) {
  if (!enabled) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          iconLeft={Globe}
          iconRight={ChevronDown}
          aria-label={`${NAV_LABELS[locale]}: ${AUTONYMS[locale]}`}
        >
          {AUTONYMS[locale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {PUBLISHED_LOCALES.map((code) => (
          <DropdownMenuItem key={code} asChild>
            <a
              href={`${currentPath}?${LOCALE_QUERY_PARAM}=${code}`}
              lang={code}
              aria-current={locale === code ? 'true' : undefined}
              className={locale === code ? 'font-semibold' : undefined}
            >
              {AUTONYMS[code]}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
