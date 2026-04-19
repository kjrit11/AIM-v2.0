import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

/**
 * Root layout — AIM v2
 * =====================
 *
 * Wires Geist (sans + mono) via next/font/google. The --font-sans and
 * --font-mono CSS variables get populated automatically by the className
 * on the <html> element.
 *
 * No shell chrome (sidebar, top bar, etc.) in Phase 1 — that's Phase 2
 * when we wire auth and the authenticated app shell.
 */

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
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{
        // Inject Geist into our CSS variable names used in globals.css
        // (next/font/google exposes its own --font-geist-sans etc.; we re-alias here)
        ['--font-sans' as string]: `var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif`,
        ['--font-mono' as string]: `var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace`,
      }}
    >
      <body>{children}</body>
    </html>
  );
}
