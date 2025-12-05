#!/bin/sh
set -e
ENV_FILE="${1:-.env}"
BIND="${BIND:-127.0.0.1}"
PORT="${PORT:-3010}"
NAME="${NAME:-escolas-paraisopolis}"
IMAGE="${IMAGE:-escolas-paraisopolis:standalone}"
docker rm -f "$NAME" || true
docker build -t "$IMAGE" .
docker run -d --name "$NAME" -p "$BIND:$PORT:$PORT" --env-file "$ENV_FILE" --restart unless-stopped "$IMAGE"
docker ps --filter "name=$NAME"
docker logs --tail 100 "$NAME"
