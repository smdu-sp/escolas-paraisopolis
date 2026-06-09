#!/bin/sh
set -e
ENV_FILE="${1:-.env}"
NAME="${NAME:-escolas-paraisopolis}"
IMAGE="${IMAGE:-escolas-paraisopolis:standalone}"
docker rm -f "$NAME" || true
docker build -t "$IMAGE" .
docker run -d --name "$NAME" --network host --env-file "$ENV_FILE" --restart unless-stopped "$IMAGE"
docker ps --filter "name=$NAME"
docker logs --tail 100 "$NAME"
