#!/usr/bin/env bash
# Creates the `recipes` bucket in local Minio and sets an anonymous download policy.
# Idempotent: safe to run repeatedly.
# Requires: docker-compose stack up with the `minio` service reachable on localhost:9000.
set -euo pipefail

BUCKET="${MINIO_BUCKET:-recipes}"
ENDPOINT="${MINIO_ENDPOINT:-http://host.docker.internal:9010}"
ACCESS_KEY="${MINIO_ACCESS_KEY:-minio}"
SECRET_KEY="${MINIO_SECRET_KEY:-minio12345}"
HEALTH_PORT="${MINIO_HEALTH_PORT:-9010}"

echo "→ Waiting for Minio at $ENDPOINT..."
for i in {1..30}; do
  if curl -fsS "http://localhost:${HEALTH_PORT}/minio/health/live" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker run --rm --network host --entrypoint sh minio/mc:latest -c "
  mc alias set local '$ENDPOINT' '$ACCESS_KEY' '$SECRET_KEY' >/dev/null &&
  (mc ls local/$BUCKET >/dev/null 2>&1 || mc mb local/$BUCKET) &&
  mc anonymous set download local/$BUCKET
"

echo "✓ Bucket '$BUCKET' ready (public-read)."
