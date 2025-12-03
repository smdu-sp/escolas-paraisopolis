#!/usr/bin/env bash
set -e

IMAGE_NAME=${IMAGE_NAME:-escolas-paraisopolis:standalone}
CONTAINER_NAME=${CONTAINER_NAME:-escolas-paraisopolis}
PORT=${PORT:-3010}

# Validate required env vars
if ! grep -q "^NEXTAUTH_URL=" .env; then
  echo "[deploy] ERRO: defina NEXTAUTH_URL no .env (ex.: https://smulweb.prefeitura.sp.gov.br/caminhos-escolares/paraisopolis)" >&2
  exit 1
fi
if ! grep -q "^AUTH_SERVER=" .env; then
  echo "[deploy] AVISO: AUTH_SERVER não definido no .env; autenticação externa ficará indisponível" >&2
fi

docker build -t "$IMAGE_NAME" .

if docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}$"; then
  docker stop "$CONTAINER_NAME" || true
  docker rm "$CONTAINER_NAME" || true
fi

docker run -d --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "$PORT":"$PORT" \
  -e PORT="$PORT" \
  --add-host=host.docker.internal:host-gateway \
  --env-file .env \
  "$IMAGE_NAME"