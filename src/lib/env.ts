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
  // Required
  ANTHROPIC_API_KEY: z
    .string()
    .min(1, 'ANTHROPIC_API_KEY is required (Anthropic API key for claude-sonnet-4-6)'),

  // Optional — required for Phase 3 Databricks SQL access
  DATABRICKS_WAREHOUSE_ID: z.string().optional(),
  DATABRICKS_SERVER_HOSTNAME: z.string().optional(),
  DATABRICKS_HTTP_PATH: z.string().optional(),

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
