# syntax=docker/dockerfile:1

FROM oven/bun:1.4.2-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS builder
WORKDIR /app
COPY . .

# NEXT_PUBLIC_* values are compiled into the browser bundle and therefore
# must be supplied at image build time. No private secrets are accepted here.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    SUPABASE_SERVICE_ROLE_KEY=build-only-service-role-key \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    BETTER_AUTH_SECRET=build-only-secret-012345678901234567890123456789 \
    BETTER_AUTH_URL=${NEXT_PUBLIC_APP_URL} \
    PUBLIC_INVITATION_BASE_URL=${NEXT_PUBLIC_APP_URL} \
    PUBLIC_INVITATION_MODE=path \
    ALLOW_PUBLIC_SIGNUP=false

RUN bun run build

FROM oven/bun:1.4.2-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Install runtime dependencies only. Real secrets are injected by Compose at
# container runtime and never copied into the image.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=builder --chown=bun:bun /app/.next ./.next
COPY --from=builder --chown=bun:bun /app/public ./public
COPY --chown=bun:bun next.config.ts ./next.config.ts
COPY --chown=bun:bun scripts/p0-preflight.mjs ./scripts/p0-preflight.mjs
COPY --chown=bun:bun scripts/bootstrap-admin.ts ./scripts/bootstrap-admin.ts
COPY --chown=bun:bun lib/auth.ts ./lib/auth.ts

USER bun
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD bun -e "fetch('http://127.0.0.1:3000/api/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["sh", "-c", "bun run p0:preflight && exec bun run start"]
