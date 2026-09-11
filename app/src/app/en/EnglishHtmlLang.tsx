'use client';

import { useEffect } from 'react';

export function EnglishHtmlLang() {
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
