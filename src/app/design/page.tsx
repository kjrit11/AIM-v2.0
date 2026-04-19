/**
 * Design gallery — /design
 * =========================
 *
 * Replaces Storybook for Phase 1/2 per Kevin's scoping decision.
 * Renders every primitive in every variant / size / state, and every
 * token in the locked system so we can eyeball the dark indigo palette
 * in isolation.
 *
 * As we add more primitives (Phase 2+), extend this page.
 *
 * Dev-only posture: this page is NOT auth-gated in Phase 1/2 because
 * we don't have auth yet. When auth lands, decide whether to:
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
        <p className="text-micro text-text-muted mb-2">Design system</p>
        <h1 className="text-page-title text-text-primary mb-2">
          Component gallery
        </h1>
        <p className="text-body text-text-body">
          Every primitive in every variant, every token in the locked system.
          Dark indigo — Phase 2 baseline.
        </p>
      </header>

      {/* Typography ========================================= */}
      <Section title="Typography">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-micro text-text-muted mb-1">page-title (20/28 · 500)</p>
            <div className="text-page-title text-text-primary">
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
          <div>
            <p className="text-micro text-text-muted mb-1">section (16/24 · 500)</p>
            <div className="text-section text-text-primary">
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
          <div>
            <p className="text-micro text-text-muted mb-1">body (14/21 · 400)</p>
            <div className="text-body text-text-body">
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
          <div>
            <p className="text-micro text-text-muted mb-1">caption (12/16 · 400)</p>
            <div className="text-caption text-text-secondary">
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
          <div>
            <p className="text-micro text-text-muted mb-1">
              micro (11/14 · 500 · 0.06em uppercase)
            </p>
            <div className="text-micro text-text-muted">
              Pipeline · Stage · Owner
            </div>
          </div>
          <div>
            <p className="text-micro text-text-muted mb-1">mono (13/18 · 400)</p>
            <div className="font-mono text-mono text-text-strong">
              $127,450.00 · deal-0042 · 2026-04-19T14:32Z
            </div>
          </div>
          <div>
            <p className="text-micro text-text-muted mb-1">mono-sm (12/16 · 400)</p>
            <div className="font-mono text-mono-sm text-text-strong">
              user_id=6f8a1c · lat=48ms
            </div>
          </div>
        </div>
      </Section>

      {/* Neutrals =========================================== */}
      <Section title="Neutrals (9 stops)">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Swatch color="bg-bg-page" label="bg-page" cssVar="--bg-page" border />
          <Swatch
            color="bg-bg-sidebar"
            label="bg-sidebar"
            cssVar="--bg-sidebar"
            border
          />
          <Swatch
            color="bg-bg-surface"
            label="bg-surface"
            cssVar="--bg-surface"
            border
          />
          <Swatch
            color="bg-bg-surface-hover"
            label="bg-surface-hover"
            cssVar="--bg-surface-hover"
            border
          />
          <Swatch
            color="bg-border-subtle"
            label="border-subtle"
            cssVar="--border-subtle"
            border
          />
          <Swatch
            color="bg-border-strong"
            label="border-strong"
            cssVar="--border-strong"
            border
          />
          <Swatch color="bg-text-muted" label="text-muted" cssVar="--text-muted" />
          <Swatch
            color="bg-text-secondary"
            label="text-secondary"
            cssVar="--text-secondary"
          />
          <Swatch color="bg-text-body" label="text-body" cssVar="--text-body" />
          <Swatch
            color="bg-text-strong"
            label="text-strong"
            cssVar="--text-strong"
          />
          <Swatch
            color="bg-text-primary"
            label="text-primary"
            cssVar="--text-primary"
          />
        </div>
      </Section>

      {/* Accent ============================================= */}
      <Section title="Accent — indigo (primary actions only)">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Swatch color="bg-accent" label="accent" cssVar="--accent" />
          <Swatch
            color="bg-accent-hover"
            label="accent-hover"
            cssVar="--accent-hover"
          />
          <Swatch
            color="bg-accent-subtle"
            label="accent-subtle"
            cssVar="--accent-subtle"
            border
          />
        </div>
        <p className="text-caption text-text-secondary mt-4">
          Reserved for primary buttons, focus rings, links, and brand
          moments. Never used to encode data — semantic tokens do that.
        </p>
      </Section>

      {/* Semantic pairs ===================================== */}
      <Section title="Semantic — paired foreground/background">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bg-success-bg border-border-subtle rounded-md border p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <code className="text-success-fg font-mono text-mono-sm font-medium">
                success
              </code>
              <code className="text-text-muted font-mono text-mono-sm">
                fg · bg
              </code>
            </div>
            <p className="text-success-fg text-caption">
              High win prob, healthy deals, closed-won
            </p>
          </div>

          <div className="bg-warning-bg border-border-subtle rounded-md border p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <code className="text-warning-fg font-mono text-mono-sm font-medium">
                warning
              </code>
              <code className="text-text-muted font-mono text-mono-sm">
                fg · bg
              </code>
            </div>
            <p className="text-warning-fg text-caption">
              Stalled deals, medium signal, margin alerts
            </p>
          </div>

          <div className="bg-danger-bg border-border-subtle rounded-md border p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <code className="text-danger-fg font-mono text-mono-sm font-medium">
                danger
              </code>
              <code className="text-text-muted font-mono text-mono-sm">
                fg · bg
              </code>
            </div>
            <p className="text-danger-fg text-caption">
              At-risk deals, high signal intel, closed-lost
            </p>
          </div>

          <div className="bg-info-bg border-border-subtle rounded-md border p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <code className="text-info-fg font-mono text-mono-sm font-medium">
                info
              </code>
              <code className="text-text-muted font-mono text-mono-sm">
                fg · bg
              </code>
            </div>
            <p className="text-info-fg text-caption">
              Neutral tags, in-progress, system messages
            </p>
          </div>
        </div>
      </Section>

      {/* Button ============================================= */}
      <Section title="Button">
        <div className="flex flex-col gap-8">
          <Row label="Variants (md)">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </Row>

          <Row label="Sizes (primary)">
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="primary" size="md">
              Medium
            </Button>
            <Button variant="primary" size="lg">
              Large
            </Button>
          </Row>

          <Row label="Disabled">
            <Button variant="primary" disabled>
              Primary
            </Button>
            <Button variant="secondary" disabled>
              Secondary
            </Button>
            <Button variant="ghost" disabled>
              Ghost
            </Button>
            <Button variant="danger" disabled>
              Danger
            </Button>
          </Row>
        </div>
      </Section>

      {/* Input ============================================== */}
      <Section title="Input">
        <div className="grid max-w-md grid-cols-1 gap-4">
          <div>
            <label className="text-caption text-text-muted mb-1 block">
              Default
            </label>
            <Input placeholder="Placeholder text" />
          </div>

          <div>
            <label className="text-caption text-text-muted mb-1 block">
              With value
            </label>
            <Input defaultValue="Acme Health · Q2 renewal" />
          </div>

          <div>
            <label className="text-caption text-text-muted mb-1 block">
              Error
            </label>
            <Input error defaultValue="Invalid input" />
            <p className="text-caption text-danger-fg mt-1">
              This field is required.
            </p>
          </div>

          <div>
            <label className="text-caption text-text-muted mb-1 block">
              Disabled
            </label>
            <Input disabled placeholder="Disabled input" />
          </div>
        </div>
      </Section>

      {/* Card =============================================== */}
      <Section title="Card">
        <div className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <p className="text-micro text-text-muted mb-2">Static</p>
            <h3 className="text-section text-text-primary mb-2">Static card</h3>
            <p className="text-body text-text-body">
              Default card — hairline border, ring shadow, no interactivity.
            </p>
          </Card>

          <Card interactive>
            <p className="text-micro text-text-muted mb-2">Interactive</p>
            <h3 className="text-section text-text-primary mb-2">Hover me</h3>
            <p className="text-body text-text-body">
              Hover tint via{' '}
              <code className="font-mono text-mono-sm text-text-strong">
                interactive
              </code>{' '}
              prop. Background steps up to bg-surface-hover; border stays.
            </p>
          </Card>
        </div>
      </Section>

      {/* Elevation layers =================================== */}
      <Section title="Elevation layers">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <LayerSwatch
            label="bg-page"
            bg="bg-bg-page"
            description="Page background (app root)"
          />
          <LayerSwatch
            label="bg-sidebar"
            bg="bg-bg-sidebar"
            description="Sidebar, topbar"
          />
          <LayerSwatch
            label="bg-surface"
            bg="bg-bg-surface"
            description="Cards, inputs, table rows"
          />
        </div>
      </Section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Inline helpers — only exist to demo primitives and tokens on this page
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="text-section text-text-primary mb-6">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-micro text-text-muted mb-3">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Swatch({
  color,
  label,
  cssVar,
  border = false,
}: {
  color: string;
  label: string;
  cssVar: string;
  border?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`${color} h-16 w-full rounded-md ${
          border ? 'border border-border-subtle' : ''
        }`}
      />
      <div className="flex items-baseline justify-between gap-2">
        <code className="font-mono text-mono-sm text-text-strong">{label}</code>
        <code className="font-mono text-mono-sm text-text-muted">{cssVar}</code>
      </div>
    </div>
  );
}

function LayerSwatch({
  label,
  bg,
  description,
}: {
  label: string;
  bg: string;
  description: string;
}) {
  return (
    <div
      className={`${bg} border-border-subtle flex min-h-[120px] flex-col justify-between rounded-lg border p-4`}
    >
      <code className="font-mono text-mono-sm text-text-strong">{label}</code>
      <p className="text-caption text-text-body">{description}</p>
    </div>
  );
}
