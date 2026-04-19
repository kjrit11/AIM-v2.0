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
      <h1 className="text-page-title text-text-primary mb-2">AIM v2</h1>
      <p className="text-body text-text-body mb-10">
        Phase 2 scaffold — dark indigo design system. No auth, no data yet.
      </p>

      <div className="flex flex-col gap-3">
        <Link
          href="/design"
          className="text-accent-hover underline underline-offset-4 hover:text-accent"
        >
          → Component gallery (/design)
        </Link>
      </div>
    </main>
  );
}
