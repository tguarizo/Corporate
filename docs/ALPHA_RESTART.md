# Coonto Corporate v0.1 — Reinício controlado (13/10/2026)

## Situação
Reinício autorizado pelo responsável após encerramento sem merge do PR #1.
Esta branch parte de develop e não contém o protótipo anterior.
Nenhum deploy é permitido até corrigir e verificar o destino de domínio.

## Ambientes
- tuuvo.com.br: site institucional, repositório tguarizo/Tuuvo.
- tuuvo.app.br: aplicação Corporate, repositório tguarizo/Corporate.
- dev.coonto.com: Coonto Educação — não modificar.

## Bloqueio técnico conhecido
O README/workflow Corporate ainda referencia corporate-dev.coonto.com e o site institucional declara tuuvo.app.br. A configuração real do Caddy na VPS não foi auditada. Corrigir o mapeamento e confirmar rotas antes do merge/deploy.

## Critérios em ordem
1. Isolamento do roteamento e dos deploys, health-check dos dois domínios, nenhuma alteração em dev.coonto.com.
2. Autenticação + controle de acesso com organizações A/B independentes; impedir leitura/escrita cruzada na API e no banco.
3. Demonstração visual responsiva de uma experiência estruturada, com decisões que alteram o estado e a próxima cena; revisitação.
4. Upload de customer_issue e assets em área privada, com validação de formatos, tamanhos e permissão; EVE gera rascunho rastreável.
5. Área interna de escrutínio/aprovação e resumo para o cliente, sem expor roteiro prévio.
6. Variante híbrida com IA controlada por regras/limites e orçamento; sem inventar política da empresa.
7. Testes automáticos, validação browser, rollback e verificação pós-publicação.

## Regras de release
- Nunca mesclar branch de desenvolvimento sem build, testes de acesso cruzado e verificação do host de publicação.
- Nunca tratar CI verde como teste visual no domínio público.
- Segredos apenas na VPS/GitHub Actions, nunca no repositório.
- Preservar a fonte e o histórico da tentativa anterior.
- Relatar somente fatos comprovados: implementado, testado, publicado, homologado.
