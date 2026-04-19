/**
 * Design gallery — /design
 * =========================
 *
 * Replaces Storybook for Phase 1 per Kevin's scoping decision.
 * Renders every primitive in every variant / size / state,
 * so we can eyeball them in isolation.
 *
 * As we add more primitives (Phase 2+), extend this page.
 * When the app has meaningful routes, this page stays — it's useful
 * during development even in production builds (gated or not, TBD).
 *
 * Dev-only posture: this page is NOT auth-gated in Phase 1 because
 * we don't have auth yet. When auth lands in Phase 2, decide whether to:
 *   (a) leave /design public (useful for Figma-free collaboration)
 *   (b) gate it to logged-in internal users
 *   (c) only serve it in dev builds
 */

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function DesignGalleryPage() {
  return (
    <main className="mx-auto max-w-page px-6 py-8">
      <header className="mb-12">
        <p className="text-eyebrow text-text-tertiary mb-2">
          Design system
        </p>
        <h1 className="text-h1 text-text-primary mb-2">Component gallery</h1>
        <p className="text-body-lg text-text-tertiary">
          Every primitive in every variant. Phase 1 baseline.
        </p>
      </header>

      {/* Button ============================================= */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Button</h2>

        <div className="flex flex-col gap-8">
          <Row label="Variants (md)">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </Row>

          <Row label="Sizes (primary)">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </Row>

          <Row label="Disabled">
            <Button variant="primary" disabled>Primary</Button>
            <Button variant="secondary" disabled>Secondary</Button>
            <Button variant="ghost" disabled>Ghost</Button>
            <Button variant="danger" disabled>Danger</Button>
          </Row>
        </div>
      </section>

      {/* Input ============================================== */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Input</h2>

        <div className="grid max-w-md grid-cols-1 gap-4">
          <div>
            <label className="text-body-sm text-text-secondary mb-1 block">
              Default
            </label>
            <Input placeholder="Placeholder text" />
          </div>

          <div>
            <label className="text-body-sm text-text-secondary mb-1 block">
              With value
            </label>
            <Input defaultValue="Some text" />
          </div>

          <div>
            <label className="text-body-sm text-text-secondary mb-1 block">
              Error
            </label>
            <Input error defaultValue="Invalid input" />
            <p className="text-body-sm text-danger mt-1">
              This field is required.
            </p>
          </div>

          <div>
            <label className="text-body-sm text-text-secondary mb-1 block">
              Disabled
            </label>
            <Input disabled placeholder="Disabled input" />
          </div>
        </div>
      </section>

      {/* Card =============================================== */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Card</h2>

        <div className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <p className="text-eyebrow text-text-tertiary mb-2">Static</p>
            <h3 className="text-h3 text-text-primary mb-2">Static card</h3>
            <p className="text-body text-text-tertiary">
              Default card — subtle border, light shadow, no interactivity.
            </p>
          </Card>

          <Card interactive>
            <p className="text-eyebrow text-text-tertiary mb-2">Interactive</p>
            <h3 className="text-h3 text-text-primary mb-2">Hover me</h3>
            <p className="text-body text-text-tertiary">
              Hover tint via <code className="font-mono text-mono-sm">interactive</code> prop.
              Cursor becomes pointer.
            </p>
          </Card>
        </div>
      </section>

      {/* Typography ========================================= */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Typography</h2>

        <div className="flex flex-col gap-4">
          <div className="text-h1 text-text-primary">h1 — Page title</div>
          <div className="text-h2 text-text-primary">h2 — Section title</div>
          <div className="text-h3 text-text-primary">h3 — Subsection title</div>
          <div className="text-h4 text-text-primary">h4 — Small heading</div>
          <div className="text-body-lg text-text-primary">body-lg — Intro body text</div>
          <div className="text-body text-text-primary">body — Default body text (14px)</div>
          <div className="text-body-sm text-text-tertiary">body-sm — Secondary body</div>
          <div className="text-caption text-text-tertiary">caption — Metadata and tiny labels</div>
          <div className="text-mono text-text-primary">mono — 123.45 · deal-0042 · 2026-04-18</div>
          <div className="text-eyebrow text-text-tertiary uppercase tracking-wider">
            eyebrow — Section eyebrow
          </div>
        </div>
      </section>

      {/* Color tokens ======================================= */}
      <section className="mb-16">
        <h2 className="text-h2 text-text-primary mb-6">Color tokens (light)</h2>

        <div className="grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          <Swatch color="bg-brand" label="brand" />
          <Swatch color="bg-accent" label="accent" />
          <Swatch color="bg-accent-hover" label="accent-hover" />
          <Swatch color="bg-success" label="success" />
          <Swatch color="bg-warning" label="warning" />
          <Swatch color="bg-danger" label="danger" />
          <Swatch color="bg-info" label="info" />
          <Swatch color="bg-bg-page" label="bg-page" border />
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Inline helpers — kept in this file because they only exist to demo primitives
// ---------------------------------------------------------------------------

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-eyebrow text-text-tertiary mb-3 tracking-wider">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Swatch({
  color,
  label,
  border = false,
}: {
  color: string;
  label: string;
  border?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`${color} h-16 w-full rounded-md ${border ? 'border border-border-subtle' : ''}`}
      />
      <code className="font-mono text-mono-sm text-text-tertiary">{label}</code>
    </div>
  );
}
