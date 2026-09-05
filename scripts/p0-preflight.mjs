const required = [
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

if (!allowPlaceholders && process.env.BETTER_AUTH_SECRET.length < 32) {
  console.error('P0 preflight failed: BETTER_AUTH_SECRET must be at least 32 characters');
  process.exit(1);
}

if (strict) {
  if (process.env.ALLOW_PUBLIC_SIGNUP !== 'false') {
    console.error('P0 preflight failed: production requires ALLOW_PUBLIC_SIGNUP=false');
    process.exit(1);
  }

  for (const key of ['BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL', 'PUBLIC_INVITATION_BASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']) {
    const url = new URL(process.env[key]);
    if (url.protocol !== 'https:') {
      console.error(`P0 preflight failed: production ${key} must use https`);
      process.exit(1);
    }
    if (['localhost', '127.0.0.1', 'example.supabase.co'].includes(url.hostname)) {
      console.error(`P0 preflight failed: production ${key} still uses a placeholder/local host`);
      process.exit(1);
    }
  }
}

console.log('Commerce P0 environment preflight passed');
