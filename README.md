# Tuuvo · Coonto Corporate Alpha 0.1

Demonstração pública em https://tuuvo.app.br/experience, com seis fases, escolhas que alteram o contexto seguinte, vídeo ilustrado com legendas, imagens, gráfico por fase e síntese para download.

## Desenvolvimento

Node.js 22 ou superior. Sem dependências npm de execução.

```sh
npm test
PORT=3305 npm start
```

A aplicação oferece `/`, `/experience`, `/coonto`, `/api/health`, `/api/demo/start`, `/api/demo/step`, `/api/demo/resume` e `/api/demo/benchmark`. Os testes HTTP cobrem rejeição de históricos inválidos e entrega parcial do vídeo. O teste de navegador em `.github/scripts/public-browser-smoke.cjs` cobre mídia, seis fases, pausa/retomada, duas tentativas, benchmark, download e celular. Use `ALPHA_BASE_URL` e `CHROME_PATH` para validação local.

## Pontuação e limites

Os pesos das seis fases são 1, 3, 2, 2, 3 e 1. Os resultados variam entre 0 e 100 segundo critérios definidos nesta demonstração. O servidor reconstrói resultados e observações a partir das escolhas, rejeitando históricos fora de ordem e escolhas inexistentes. As alternativas têm consequências narrativas, mas todas as pessoas passam pelas mesmas fases.

A pontuação é uma hipótese de desenho, sem validação psicométrica. O benchmark usa somente 36 registros fictícios, divididos entre três organizações igualmente fictícias; nenhuma pessoa ou empresa real integra a referência. A comparação usa a primeira tentativa. As tentativas seguintes mostram evolução separadamente.

O navegador guarda o primeiro percurso e até 19 percursos posteriores, sem identificação pessoal. O participante pode apagar os registros ou baixar sua síntese. Não existe ainda autenticação, armazenamento central de resultados, avaliação enviada a superiores ou comparação entre organizações reais.

## Mídias

A imagem de abertura é uma ilustração original produzida para esta demonstração. O vídeo é uma animação dessa ilustração, com narração sintética em português, três cenas e legendas. As outras fases usam ilustrações SVG. Os recursos são servidos pelo próprio aplicativo e o vídeo suporta intervalos de bytes.

## Publicação e isolamento

O serviço Alpha usa o contêiner `coonto-corporate-alpha`, na rede `corporate_alpha_internal`. O Caddy encaminha somente `tuuvo.app.br` para esse serviço. `tuuvo.com.br` e `dev.coonto.com` devem permanecer nos serviços existentes.

A publicação usa os segredos já configurados no GitHub Actions e uma identidade SSH previamente auditada. Nunca copie credenciais para o código, os logs ou o chat. O helper `.github/scripts/publish-alpha.py` valida o arquivo do Caddy e a preservação dos outros encaminhamentos, cria backup e reverte a configuração em caso de falha. O workflow de publicação deve identificar o commit exato da aplicação e validar a versão esperada após o deploy.
