#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"
COMMAND="${1:-help}"

log(){ printf '\n[Corporate] %s\n' "$*"; }
warn(){ printf '\n[Corporate][ATENÇÃO] %s\n' "$*" >&2; }
fail(){ printf '\n[Corporate][ERRO] %s\n' "$*" >&2; exit 1; }

load_env(){
  [[ -f .env ]] || configure
  sed -i 's/\r$//' .env
  set -a
  source .env
  set +a
}

configure(){
  [[ -f .env ]] && return 0
  log "Criando arquivo .env a partir de .env.example..."
  cp .env.example .env
  local db_pass
  db_pass="$(openssl rand -hex 24)"
  sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${db_pass}/" .env
  chmod 600 .env
  log "Arquivo .env configurado com credenciais seguras e isoladas."
}

wait_health(){
  load_env
  log "Aguardando serviço ficar saudável em http://127.0.0.1:${APP_PORT:-3200}/api/health..."
  for _ in $(seq 1 30); do
    if curl -fsS --max-time 5 "http://127.0.0.1:${APP_PORT:-3200}/api/health" >/dev/null 2>&1; then
      log "Coonto Corporate respondeu com sucesso ao healthcheck!"
      return 0
    fi
    sleep 2
  done
  docker compose logs --tail=40 app >&2 || true
  fail "O serviço Coonto Corporate não respondeu ao healthcheck no tempo esperado."
}

backup_db(){
  load_env
  if docker compose ps --status running 2>/dev/null | grep 'db' >/dev/null; then
    mkdir -p backups
    local stamp file
    stamp="$(date -u +%Y%m%dT%H%M%SZ)"
    file="backups/corporate-db-${stamp}.sql.gz"
    log "Gerando backup do banco em ${file}..."
    docker compose exec -T db pg_dump -U "${POSTGRES_USER:-corporate_app}" "${POSTGRES_DB:-corporate_dev}" | gzip > "$file" || warn "Falha ao gerar backup prévio"
  fi
}

deploy(){
  log "Iniciando implantação do Coonto Corporate Dev (/opt/coonto/corporate-dev)"
  configure
  load_env

  if docker image inspect coonto-corporate-dev:current >/dev/null 2>&1; then
    log "Registrando versão atual como coonto-corporate-dev:previous para rollback"
    docker tag coonto-corporate-dev:current coonto-corporate-dev:previous
  fi

  backup_db

  log "Iniciando PostgreSQL dedicado"
  docker compose up -d db

  log "Construindo e iniciando aplicação"
  docker compose build app
  docker compose up -d app

  log "Conectando rede corporate_internal ao proxy Caddy"
  docker network connect corporate_internal caddy_global 2>/dev/null || true

  wait_health
  log "Deploy do Coonto Corporate concluído com sucesso!"
}

rollback(){
  log "Iniciando rollback para a versão anterior..."
  docker image inspect coonto-corporate-dev:previous >/dev/null 2>&1 || fail "Nenhuma imagem anterior disponível para rollback."
  docker tag coonto-corporate-dev:current "coonto-corporate-dev:failed-$(date -u +%Y%m%dT%H%M%SZ)"
  docker tag coonto-corporate-dev:previous coonto-corporate-dev:current
  docker compose up -d --no-build app
  wait_health
  log "Rollback do Coonto Corporate concluído com sucesso!"
}

status(){
  load_env
  log "Status dos serviços Coonto Corporate:"
  docker compose ps
  echo
  log "Checagem de rota local:"
  curl -fsS --max-time 5 "http://127.0.0.1:${APP_PORT:-3200}/api/health" || warn "Healthcheck local falhou"
  echo
}

case "$COMMAND" in
  install|update) deploy ;;
  rollback) rollback ;;
  backup) backup_db ;;
  status) status ;;
  logs) docker compose logs --tail=100 -f app ;;
  *)
    cat <<'HELP'
Coonto Corporate Management Script

Uso:
  ./corporate.sh install    - Constrói e implanta o ambiente
  ./corporate.sh rollback   - Reverte para a versão estável anterior
  ./corporate.sh backup     - Executa dump comprimido do PostgreSQL
  ./corporate.sh status     - Exibe o estado e saúde dos serviços
  ./corporate.sh logs       - Acompanha os logs em tempo real
HELP
    ;;
esac
