# Coonto Corporate Alpha — reconstrução limpa

Este é um novo código-base, sem dependência do protótipo anterior. Execute `npm test` e `npm start` (Node.js 22+). Abra http://localhost:3000.

## Estado real
Demonstração estruturada visual e responsiva, motor de estados determinístico e testes unitários. **Não** contém ainda multi-tenancy, autenticação corporativa, EVE, IA híbrida ou termômetro validado. Nenhuma API privada de clientes é disponibilizada nesta entrega.

## Publicação
Alvo aprovado: https://tuuvo.app.br. Sem mudança de DNS/Caddy até validação independente do roteamento. O site tuuvo.com.br e o Coonto Educação são serviços separados. Este novo ramo não tem workflow de deploy intencionalmente, para evitar publicação no host errado.

## Critérios antes de aceitar clientes
Implementar PostgreSQL com isolamento tenant/RLS, autenticação, segregação de dados, upload privado com antivírus/limites, EVE rastreável, auditoria de decisões, políticas de IA e testes de segurança e navegador.
