# Coonto Corporate

Repositório da plataforma Coonto Corporate (v0.1 Alpha).

## Domínios & Ambientes
- **Desenvolvimento:** `https://corporate-dev.coonto.com`
- **Healthcheck:** `https://corporate-dev.coonto.com/api/health`

## Arquitetura
- **App:** Aplicação Node.js / Next.js na porta interna `3200`.
- **Database:** PostgreSQL 16 dedicado com volume persistente isolado (`corporate_postgres`).
- **Proxy Reverso & SSL:** Caddy com certificados automáticos Let's Encrypt.

## Deploy Contínuo (CI/CD)
O deploy é realizado automaticamente via GitHub Actions em push na branch `develop`:
1. Empacota a aplicação
2. Envia para a VPS (`/opt/coonto/corporate-dev`)
3. Executa backup de segurança do PostgreSQL
4. Executa `./corporate.sh install` com validação de healthcheck e suporte a rollback (`./corporate.sh rollback`).
