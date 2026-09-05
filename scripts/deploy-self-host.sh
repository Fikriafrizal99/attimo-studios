#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE=".env.production"
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
  echo "$ENV_FILE is missing. Copy .env.docker.example to $ENV_FILE and fill real values." >&2
  exit 1
fi

echo "[1/4] Validating Compose configuration..."
docker compose --env-file "$ENV_FILE" config >/dev/null

echo "[2/4] Building production image..."
docker compose --env-file "$ENV_FILE" build --pull "$SERVICE"

echo "[3/4] Starting container..."
docker compose --env-file "$ENV_FILE" up -d --remove-orphans "$SERVICE"

container_id="$(docker compose --env-file "$ENV_FILE" ps -q "$SERVICE")"
if [[ -z "$container_id" ]]; then
  echo "Container did not start." >&2
  exit 1
fi

echo "[4/4] Waiting for health check..."
for _ in $(seq 1 40); do
  running="$(docker inspect -f '{{.State.Running}}' "$container_id" 2>/dev/null || echo false)"
  if [[ "$running" != "true" ]]; then
    echo "Container exited before becoming healthy." >&2
    docker compose --env-file "$ENV_FILE" logs --tail=120 "$SERVICE" || true
    exit 1
  fi

  health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id" 2>/dev/null || echo unknown)"
  if [[ "$health" == "healthy" ]]; then
    echo "Deployment healthy."
    docker compose --env-file "$ENV_FILE" ps
    echo "Published port: $(docker compose --env-file "$ENV_FILE" port "$SERVICE" 3000)"
    exit 0
  fi

  if [[ "$health" == "unhealthy" ]]; then
    echo "Container is unhealthy." >&2
    docker compose --env-file "$ENV_FILE" logs --tail=120 "$SERVICE" || true
    exit 1
  fi

  sleep 3
done

echo "Timed out waiting for a healthy container." >&2
docker compose --env-file "$ENV_FILE" logs --tail=120 "$SERVICE" || true
exit 1
