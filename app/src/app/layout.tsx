import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '../store/providers';
import { uiFont } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Фактурчо',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bg" className={uiFont.variable}>
      <body className="bg-surface font-sans text-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
