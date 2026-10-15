# Catálogo da Alpha

A Alpha 0.1.0-alpha.7 oferece dois cenários em https://tuuvo.app.br/experience:

- **Uma conversa, muitos caminhos** (`corporate`, cenário edição 2): caso da Marina, seis fases com pedido de 40 kits, comprovante de 20 recebidos, atualização de estoque e janela de entrega.
- **Uma consulta, uma pessoa** (`medical`, cenário edição 2): caso fictício da Ana, sete fases sobre comunicação em uma consulta simulada com estudante supervisionado. Não contém prescrição ou diagnóstico de pacientes.

A referência anterior continua preservada na tag `demo-alpha-0.1.0-alpha.5`.

## Conteúdo e direitos

O caso médico adapta princípios dos capítulos 1–5 de *Manual de habilidades da prática médica*, organizado por Rafaela Yasmine de Sousa Ferreira, Atena Editora, 2026. DOI informado no arquivo: https://doi.org/10.22533/at.ed.678260810. A página 3 do PDF declara CC BY 4.0: https://creativecommons.org/licenses/by/4.0/.

Roteiro, personagens, consequências, ilustrações, narração e critérios digitais são adaptações/criações da Tuuvo. Nenhuma imagem da capa ou de terceiros foi reutilizada. Os créditos, a licença e a indicação de adaptação aparecem na experiência médica e na síntese exportada. Não se sugere endosso da organizadora ou da editora.

Este é um protótipo educacional, com roteiro e rubrica ainda pendentes de revisão por docente da área médica. Os sete pesos iguais e as pontuações são experimentais; escolhas na tela não comprovam habilidade clínica. Privacidade e concordância para participação do estudante recebem comentários próprios no resultado, sem serem ocultados pela média.

## Consequências e registros

A pergunta de exploração pode revelar que Ana trabalha em turnos e cuida da mãe. A informação repercute no planejamento. Se não for explorada, uma pergunta posterior permite retomá-la ao pactuar o acompanhamento. As consequências pertencem ao cenário fictício, sem prometer respostas de pessoas reais.

A API usa `experienceVersion=2` para esta edição e `experienceVersion=1` para a anterior, além de `experience=corporate|medical` no início e na comparação, e o campo `experience` nos pedidos de decisão/retomada. Históricos de outro cenário e escolhas inválidas são rejeitados. Sem identificador, os endpoints antigos continuam usando o caso corporativo da edição 1, para preservar clientes antigos.

Os percursos ficam no navegador, sem coleta central: `tuuvo-jornada-corporate-v2` e `tuuvo-jornada-medical-v2` para a edição prática. As chaves anteriores `tuuvo-jornada-alpha1` e `tuuvo-jornada-medical-v1` são preservadas e acessíveis pelo botão “Abrir edição anterior”, sem recalcular os resultados com o roteiro novo. Cada cenário mantém seu primeiro percurso e até 19 posteriores. Pausar, retomar, apagar e exportar afetam somente o cenário escolhido. Os grupos de comparação são gerados separadamente, sempre fictícios e identificados como tais.

## Verificação e mídia

`npm test` cobre pontuação, validação, isolamento de cenários, API, revelação e reparação da informação. Os scripts `.github/scripts/public-browser-smoke.cjs` e `.github/scripts/medical-browser-smoke.cjs` verificam as jornadas, áudio decodificado, retomada, histórico legado, troca de experiência, relatórios, fontes e celular.

As introduções narradas são opcionais na apresentação de cada caso. Durante as decisões, documentos visuais e um plano da sala substituem as ilustrações genéricas. A introdução médica usa três cenas SVG originais e narração ElevenLabs `eleven_multilingual_v2`, com legenda e alternativa textual no contexto da fase. Os áudios e a procedência ficam em `public/assets/narration-medical/`; a chave não integra o aplicativo. Para reconstruir o vídeo em máquina com Chromium, Playwright, FFmpeg e FFprobe: `node .github/scripts/build-medical-intro.cjs`.
