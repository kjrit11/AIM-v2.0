/**
 * Placeholder home page — Phase 1
 * =================================
 *
 * Real app shell + auth-gated routing comes in Phase 2.
 * For now, this just verifies Tailwind + tokens + primitives work.
 *
 * Visit /design to see the component gallery.
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-page px-6 py-8">
      <h1 className="text-h1 text-text-primary mb-2">AIM v2</h1>
      <p className="text-body-lg text-text-tertiary mb-10">
        Phase 1 scaffold — design system only. No auth, no data.
      </p>

      <div className="flex flex-col gap-3">
        <Link
          href="/design"
          className="text-accent hover:text-accent-hover underline underline-offset-4"
        >
          → Component gallery (/design)
        </Link>
      </div>
    </main>
  );
}
