'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';

function EnglishHtmlLang() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.lang;
    root.lang = 'en';
    return () => {
      root.lang = previous;
    };
  }, []);
  return null;
}

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <EnglishHtmlLang />
      {children}
    </>
  );
}
