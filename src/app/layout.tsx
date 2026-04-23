import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';

/**
 * Root layout — AIM v2
 * =====================
 *
 * Loads Inter (sans) and JetBrains Mono (mono) via next/font/google.
 * Both families expose CSS variables that override the fallback stacks
 * declared in globals.css.
 *
 * Two font families loaded concurrently — acceptable cost because:
 *  - Each family is loaded with `subsets: ['latin']` only
 *  - Only the weights we use (400 / 500 for Inter, 400 for mono) are requested
 *  - `display: 'swap'` avoids FOIT; the zinc-grey body text takes over
 *    cleanly during the first ~100ms of font load
 *
 * data-theme is not set: the app is dark-only at Phase 2 (light mode deferred,
 * see docs/DEFERRED.md).
 */

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AIM — AlignInMotion',
  description: 'Sales Command Center for CareIntelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
