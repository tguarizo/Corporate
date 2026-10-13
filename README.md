# Coonto Corporate — v0.1 Alpha

**Aplicação-alvo:** https://tuuvo.app.br (pendente de verificação do roteamento no Caddy e de publicação).
**Site institucional:** https://tuuvo.com.br — projeto independente em tguarizo/Tuuvo.
**Coonto Educação:** https://dev.coonto.com — preservar.

## Infraestrutura existente
- Serviço Node.js/Docker, porta externa local 127.0.0.1:3200
- PostgreSQL 16 isolado para Corporate
- Branch de publicação planejada: develop
- GitHub Actions: .github/workflows/deploy-dev.yml
- Diretório de implantação atual configurável por secret DEV_DEPLOY_PATH, valor padrão /opt/coonto/corporate-dev
- Health check: /api/health

## Situação real
O repositório inicialmente fazia referência a corporate-dev.coonto.com.
A configuração do Caddy e dos domínios na VPS ainda não foi auditada.
**Nenhum merge em develop ou deploy para tuuvo.app.br deve ocorrer antes de comprovar o roteamento exclusivo da aplicação e a preservação do site institucional.**
A aplicação atual é somente uma página provisória e health check: NÃO implementa autenticação, multi-tenant, EVE ou IA híbrida.

Consulte docs/ALPHA_RESTART.md para os critérios e a sequência de desenvolvimento.
