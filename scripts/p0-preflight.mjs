const required = [
  'APP_ENV',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'NEXT_PUBLIC_APP_URL',
  'PUBLIC_INVITATION_BASE_URL',
  'PUBLIC_INVITATION_MODE',
  'ALLOW_PUBLIC_SIGNUP',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`P0 preflight failed: missing ${missing.join(', ')}`);
  process.exit(1);
}

const allowPlaceholders = process.env.P0_PREFLIGHT_ALLOW_PLACEHOLDERS === 'true';
const strict = process.env.P0_PREFLIGHT_STRICT === 'true';
const mode = process.env.PUBLIC_INVITATION_MODE;
const appEnv = process.env.APP_ENV;

if (!['development', 'staging', 'production'].includes(appEnv)) {
  console.error('P0 preflight failed: APP_ENV must be development, staging, or production');
  process.exit(1);
}

if (!['path', 'subdomain'].includes(mode)) {
  console.error('P0 preflight failed: PUBLIC_INVITATION_MODE must be path or subdomain');
  process.exit(1);
}

if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('P0 preflight failed: anon key and service-role key must be different');
  process.exit(1);
}

for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL', 'PUBLIC_INVITATION_BASE_URL']) {
  try {
    new URL(process.env[key]);
  } catch {
    console.error(`P0 preflight failed: ${key} must be a valid absolute URL`);
    process.exit(1);
  }
}

let databaseUrl;
try {
  databaseUrl = new URL(process.env.DATABASE_URL);
} catch {
  console.error('P0 preflight failed: DATABASE_URL must be a valid PostgreSQL URL');
  process.exit(1);
}
if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
  console.error('P0 preflight failed: DATABASE_URL must use postgres:// or postgresql://');
  process.exit(1);
}

if (!allowPlaceholders && process.env.BETTER_AUTH_SECRET.length < 32) {
  console.error('P0 preflight failed: BETTER_AUTH_SECRET must be at least 32 characters');
  process.exit(1);
}

if (appEnv === 'production' && !strict) {
  console.error('P0 preflight failed: production requires P0_PREFLIGHT_STRICT=true');
  process.exit(1);
}

function requirePositiveNumber(key) {
  const value = Number(process.env[key]);
  if (!Number.isFinite(value) || value <= 0) {
    console.error(`P0 preflight failed: ${key} must be a positive number`);
    process.exit(1);
  }
}

if (strict) {
  if (process.env.ALLOW_PUBLIC_SIGNUP !== 'false') {
    console.error(`P0 preflight failed: ${appEnv} requires ALLOW_PUBLIC_SIGNUP=false in strict mode`);
    process.exit(1);
  }

  const strictRateLimitKeys = [
    'PUBLIC_SUBMISSION_RATE_LIMIT',
    'PUBLIC_SUBMISSION_RATE_WINDOW_MS',
    'PUBLIC_WEDDING_BURST_RATE_LIMIT',
    'PUBLIC_RESOLUTION_RATE_LIMIT',
    'PUBLIC_READ_RATE_LIMIT',
  ];
  const missingStrict = strictRateLimitKeys.filter((key) => !process.env[key]);
  if (missingStrict.length) {
    console.error(`P0 preflight failed: strict mode missing ${missingStrict.join(', ')}`);
    process.exit(1);
  }
  strictRateLimitKeys.forEach(requirePositiveNumber);

  for (const key of ['BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL', 'PUBLIC_INVITATION_BASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']) {
    const url = new URL(process.env[key]);
    if (url.protocol !== 'https:') {
      console.error(`P0 preflight failed: strict ${appEnv} ${key} must use https`);
      process.exit(1);
    }
    if (['localhost', '127.0.0.1', 'example.supabase.co'].includes(url.hostname)) {
      console.error(`P0 preflight failed: strict ${appEnv} ${key} still uses a placeholder/local host`);
      process.exit(1);
    }
  }

  if (['localhost', '127.0.0.1'].includes(databaseUrl.hostname)) {
    console.error(`P0 preflight failed: strict ${appEnv} DATABASE_URL still uses a local host`);
    process.exit(1);
  }

  const authOrigin = new URL(process.env.BETTER_AUTH_URL).origin;
  const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL).origin;
  if (authOrigin !== appOrigin) {
    console.error('P0 preflight failed: BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL must share the same origin in strict mode');
    process.exit(1);
  }
}

console.log(`Commerce P0 environment preflight passed (${appEnv})`);
