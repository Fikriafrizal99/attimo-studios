# Self-Host Docker Runbook

This runbook deploys the commerce branch on a single self-managed Ubuntu/Docker server while keeping PostgreSQL and asset storage on Supabase Cloud.

## Target topology

```text
LAN / later Internet
       |
       v
Ubuntu server
  Docker
   └─ wedding-app :3000
       |
       └─ Supabase Cloud
          ├─ PostgreSQL / Better Auth
          └─ Storage
```

For the first smoke test, expose the app only on the local network. Add HTTPS/domain/Cloudflare Tunnel after the LAN deployment is healthy.

## 1. Prerequisites

Required on the server:

- Git
- Docker Engine
- Docker Compose plugin (`docker compose`)

Verify:

```bash
git --version
docker --version
docker compose version
```

## 2. Clone and select the commerce branch

```bash
git clone https://github.com/Fikriafrizal99/attimo-studios.git
cd attimo-studios
git switch develop/commerce-foundation
```

For an existing clone:

```bash
git fetch origin
git switch develop/commerce-foundation
git pull --ff-only origin develop/commerce-foundation
```

## 3. Create the server environment file

```bash
cp .env.docker.example .env.production
nano .env.production
```

`.env.production` is gitignored and must never be committed.

Use the real Supabase URL/public key/service-role key, PostgreSQL connection string, and Better Auth secret.

For initial LAN testing:

```env
APP_BIND=0.0.0.0
APP_PORT=3000
P0_PREFLIGHT_STRICT=false

BETTER_AUTH_URL=http://SERVER_LAN_IP:3000
NEXT_PUBLIC_APP_URL=http://SERVER_LAN_IP:3000
PUBLIC_INVITATION_BASE_URL=http://SERVER_LAN_IP:3000
PUBLIC_INVITATION_MODE=path
ALLOW_PUBLIC_SIGNUP=false
```

Replace `SERVER_LAN_IP` with the server's actual LAN address, for example `192.168.1.50`.

`NEXT_PUBLIC_*` values are compiled into the browser bundle. If the public app URL or public Supabase values change, rebuild the image instead of only restarting the container.

## 4. Validate before build

The application preflight can be checked inside deployment. First validate the Compose interpolation:

```bash
docker compose --env-file .env.production config >/dev/null
```

If this command fails, fix the environment file before continuing.

## 5. Deploy

Recommended:

```bash
bash scripts/deploy-self-host.sh
```

The script:

1. validates Compose,
2. builds the image with only public build arguments,
3. starts/replaces `wedding-app`,
4. waits for Docker health status.

Equivalent manual deployment:

```bash
docker compose --env-file .env.production build --pull wedding-app
docker compose --env-file .env.production up -d --remove-orphans wedding-app
```

## 6. Check container and health

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=100 wedding-app
curl http://127.0.0.1:3000/api/health
```

Expected health response contains:

```json
{"status":"ok","service":"wedding-invitation"}
```

From another device on the same LAN, open:

```text
http://SERVER_LAN_IP:3000
```

Do not port-forward `3000` from the router to the public internet during this LAN phase.

If UFW blocks LAN access, allow only the actual LAN subnet instead of opening the port globally. Example for a `192.168.1.0/24` network:

```bash
sudo ufw allow from 192.168.1.0/24 to any port 3000 proto tcp
```

Adapt the subnet to the real network.

## 7. Bootstrap the first operator

After the container is healthy:

```bash
docker compose --env-file .env.production exec wedding-app bun run admin:bootstrap
```

The command asks for operator email/name and hidden password input. It temporarily enables signup only inside that one-shot CLI process. The web deployment keeps `ALLOW_PUBLIC_SIGNUP=false`.

After creation, log in through `/login` and confirm `/signup` is unavailable/redirected.

## 8. First end-to-end smoke test

From the dashboard:

1. create a draft wedding,
2. fill couple and primary event data,
3. upload one JPEG/WebP under 5 MB,
4. add a guest and copy the personalized URL,
5. publish the invitation,
6. open it from another phone/browser on the LAN,
7. submit RSVP and a wish,
8. confirm the data appears only for that wedding.

Also verify a draft wedding is not publicly accessible.

## 9. Common operations

Update code and redeploy:

```bash
git pull --ff-only origin develop/commerce-foundation
bash scripts/deploy-self-host.sh
```

View logs:

```bash
docker compose --env-file .env.production logs -f wedding-app
```

Restart without rebuild:

```bash
docker compose --env-file .env.production restart wedding-app
```

Stop:

```bash
docker compose --env-file .env.production down
```

The Compose file has no local database volume because business data/assets remain in Supabase Cloud.

## 10. Move from LAN to HTTPS/domain

After LAN testing passes:

1. configure the public domain/tunnel/reverse proxy,
2. change `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, and `PUBLIC_INVITATION_BASE_URL` to the final `https://...` URL,
3. set `P0_PREFLIGHT_STRICT=true`,
4. rebuild the image because `NEXT_PUBLIC_APP_URL` is a build-time value,
5. deploy again,
6. verify login, publish URLs, RSVP, uploads, and personalized guest URLs through HTTPS.

A Cloudflare Tunnel can be added after this stage without moving Supabase to the home server.

## Security rules

- Never commit `.env.production`.
- Never place `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, or `BETTER_AUTH_SECRET` in Docker build args.
- Public signup stays disabled.
- Do not expose PostgreSQL from the home server; the app connects outbound to Supabase.
- Do not expose port 3000 directly to the internet once the public tunnel/reverse proxy is active.
- Rotate credentials immediately if a secret is accidentally committed or printed publicly.
