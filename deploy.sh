#!/usr/bin/env bash
set -e

IMAGE_NAME=${IMAGE_NAME:-escolas-paraisopolis:standalone}
CONTAINER_NAME=${CONTAINER_NAME:-escolas-paraisopolis}
PORT=${PORT:-3010}

docker build -t "$IMAGE_NAME" .

if docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}$"; then
  docker stop "$CONTAINER_NAME" || true
  docker rm "$CONTAINER_NAME" || true
fi

docker run -d --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "$PORT":"$PORT" \
  -e PORT="$PORT" \
  --env-file .env \
  "$IMAGE_NAME"