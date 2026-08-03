import { Inter } from 'next/font/google';

export const uiFont = Inter({
  subsets: ['latin', 'cyrillic', 'latin-ext', 'cyrillic-ext'],
  variable: '--font-inter',
  display: 'swap',
});
