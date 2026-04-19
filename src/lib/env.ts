import { z } from 'zod';

/**
 * Environment variable validation — AIM v2
 * ==========================================
 *
 * All required runtime secrets declared here. Zod parses process.env at
 * module load; a missing or empty value crashes the process with a
 * per-variable error message. Crash fast > silent failure.
 *
 * Name convention: keep NEXTAUTH_* (v4-style) rather than AUTH_* (v5-style)
 * because .env.local uses NEXTAUTH_*. NextAuth v5 reads both; we accept the
 * deprecation warning in exchange for not having to rewrite the secrets file.
 *
 * Never import this in client components. Server-only.
 */

const envSchema = z.object({
  AZURE_AD_CLIENT_ID: z
    .string()
    .min(1, 'AZURE_AD_CLIENT_ID is required (Entra app registration client ID)'),
  AZURE_AD_TENANT_ID: z
    .string()
    .min(1, 'AZURE_AD_TENANT_ID is required (CareInMotion Entra tenant ID)'),
  AZURE_AD_CLIENT_SECRET: z
    .string()
    .min(1, 'AZURE_AD_CLIENT_SECRET is required (Entra app client secret)'),
  NEXTAUTH_URL: z
    .string()
    .url('NEXTAUTH_URL must be a valid URL (e.g. http://localhost:3000)'),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 chars (generate with: openssl rand -base64 32)'),
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
