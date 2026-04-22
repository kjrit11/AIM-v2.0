import { z } from 'zod';

/**
 * Environment variable validation — AIM v2
 * ==========================================
 *
 * All required runtime secrets declared here. Zod parses process.env at
 * module load; a missing or empty value crashes the process with a
 * per-variable error message. Crash fast > silent failure.
 *
 * Auto-injected vars (DATABRICKS_*, NEXT_DEPLOYMENT_ID) are provided by
 * Databricks Apps at runtime in prod and absent in dev — hence optional.
 * Do not list them in .env.example as fields to fill.
 *
 * Never import this in client components. Server-only.
 */

const envSchema = z.object({
  // Required — Anthropic
  ANTHROPIC_API_KEY: z
    .string()
    .min(1, 'ANTHROPIC_API_KEY is required (Anthropic API key for claude-sonnet-4-6)'),

  // Required — catalog routing (Phase 3a). No NODE_ENV-based default; crash
  // if unset so we never accidentally hit prod data from a dev process.
  AIM_CATALOG: z
    .string()
    .min(1, 'AIM_CATALOG is required. Values: sales (prod), sales_dev (dev/local), sales_demo (Phase 9)'),

  // Required — Databricks SQL connection (Phase 3a)
  DATABRICKS_WAREHOUSE_ID: z
    .string()
    .min(1, 'DATABRICKS_WAREHOUSE_ID is required'),
  DATABRICKS_SERVER_HOSTNAME: z
    .string()
    .min(1, 'DATABRICKS_SERVER_HOSTNAME is required'),
  DATABRICKS_HTTP_PATH: z
    .string()
    .min(1, 'DATABRICKS_HTTP_PATH is required'),

  // Optional — preferred auth for local dev (PAT). Prod uses the auto-injected
  // service principal (DATABRICKS_CLIENT_ID + DATABRICKS_CLIENT_SECRET).
  DATABRICKS_TOKEN: z.string().optional(),

  // Optional — Sentry. Phase 3a scaffolds the config; DSN acquisition is
  // deferred. When empty, all Sentry code paths no-op.
  SENTRY_DSN: z.string().optional(),

  // Auto-injected by Databricks Apps at runtime (absent in dev)
  DATABRICKS_HOST: z.string().optional(),
  DATABRICKS_CLIENT_ID: z.string().optional(),
  DATABRICKS_CLIENT_SECRET: z.string().optional(),
  DATABRICKS_APP_NAME: z.string().optional(),
  DATABRICKS_APP_PORT: z.string().optional(),
  DATABRICKS_APP_URL: z.string().optional(),
  DATABRICKS_WORKSPACE_ID: z.string().optional(),
  NEXT_DEPLOYMENT_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`\nInvalid environment configuration:\n${issues}\n`);
  throw new Error('Environment validation failed — see errors above');
}

export const env = parsed.data;
