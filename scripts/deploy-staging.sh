#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-.env.staging}"
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-endriya-staging}"
SERVICE="wedding-app"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed or not available in PATH." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin is required (docker compose)." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "$ENV_FILE is missing. Copy .env.staging.example to $ENV_FILE and fill the private staging values." >&2
  exit 1
fi

# Read APP_PORT without sourcing arbitrary shell from the env file.
APP_PORT_VALUE="$(awk -F= '$1 == "APP_PORT" {print $2}' "$ENV_FILE" | tail -n1 | tr -d '\r' || true)"
APP_PORT_VALUE="${APP_PORT_VALUE:-3100}"

compose=(docker compose --project-name "$PROJECT_NAME" --env-file "$ENV_FILE")

echo "[1/5] Validating isolated staging Compose configuration..."
"${compose[@]}" config >/dev/null

echo "[2/5] Building staging image..."
"${compose[@]}" build --pull "$SERVICE"

echo "[3/5] Starting staging container..."
"${compose[@]}" up -d "$SERVICE"

container_id="$("${compose[@]}" ps -q "$SERVICE")"
if [[ -z "$container_id" ]]; then
  echo "Staging container did not start." >&2
  exit 1
fi

echo "[4/5] Waiting for container health..."
for _ in $(seq 1 40); do
  running="$(docker inspect -f '{{.State.Running}}' "$container_id" 2>/dev/null || echo false)"
  if [[ "$running" != "true" ]]; then
    echo "Staging container exited before becoming healthy." >&2
    "${compose[@]}" logs --tail=120 "$SERVICE" || true
    exit 1
  fi

  health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id" 2>/dev/null || echo unknown)"
  if [[ "$health" == "healthy" ]]; then
    break
  fi
  if [[ "$health" == "unhealthy" ]]; then
    echo "Staging container is unhealthy." >&2
    "${compose[@]}" logs --tail=120 "$SERVICE" || true
    exit 1
  fi
  sleep 3
done

health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id" 2>/dev/null || echo unknown)"
if [[ "$health" != "healthy" ]]; then
  echo "Timed out waiting for staging container health." >&2
  "${compose[@]}" logs --tail=120 "$SERVICE" || true
  exit 1
fi

echo "[5/5] Verifying application readiness against the staging database..."
ready_url="http://127.0.0.1:${APP_PORT_VALUE}/api/ready"
for _ in $(seq 1 20); do
  if response="$(curl --fail --silent --show-error "$ready_url" 2>/dev/null)"; then
    if printf '%s' "$response" | grep -q '"status":"ready"'; then
      echo "ENDRIYA staging deployment ready."
      "${compose[@]}" ps
      echo "Local staging endpoint: http://127.0.0.1:${APP_PORT_VALUE}"
      exit 0
    fi
  fi
  sleep 3
done

echo "Staging container is healthy but /api/ready did not become ready." >&2
"${compose[@]}" logs --tail=120 "$SERVICE" || true
exit 1
