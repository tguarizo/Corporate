# Revisão das experiências após os primeiros comentários

## Motivação

Fred Sommer considerou a navegação satisfatória, mas apontou situações abstratas, alternativas difíceis de contextualizar e pouco motivo para continuar. O responsável pelo produto esclareceu a prioridade: exercícios com textos práticos e objetivos, ações compreensíveis e imagens que apresentem informações para decidir. Não basta acrescentar narrativa ou trocar ilustrações decorativas.

## Edição prática · 2

Cada fase apresenta o papel do participante e a situação em poucas frases, uma tarefa explícita e materiais para consulta. As alternativas descrevem ações específicas. A posição das opções varia entre fases, para que a primeira alternativa não seja sempre a de maior pontuação.

- **Marina:** pedido 4821, 40 kits comprados e 20 recebidos, integração no dia seguinte. O comprovante permite identificar os 20 kits pendentes. A logística distingue estoque de transporte confirmado. O resumo do encaminhamento mostra se o horário limite foi perguntado e se uma entrega foi prometida. A confirmação fornece a janela de 8h a 8h30. A reflexão apresenta as ações escolhidas no próprio percurso.
- **Ana:** estudante sob supervisão de Paula. O plano da sala identifica a porta aberta, o prontuário de Carlos exposto e o registro de Ana na tela. O registro indica falta na terça às 8h e motivo desconhecido. A pergunta de investigação revela trabalho das 7h às 15h e cuidado com a mãe depois das 18h. A agenda apresenta 8h e 16h; o cartão final reflete a opção realmente escolhida. A informação não investigada permanece identificada como desconhecida, com possibilidade de retomada no planejamento.

Os materiais são documentos simulados em HTML acessível, com um diagrama SVG original da sala. Os dados visuais e suas equivalências textuais têm a mesma fonte no exercício. As introduções com narração ElevenLabs foram preservadas como conteúdo opcional antes do início. O retorno e o relatório vinculam a escolha a quantidades, horários, registros e consequências específicas.

## Preservação e avaliação

A edição anterior mantém seu roteiro, sua rubrica e seus arquivos de armazenamento. A interface permite abri-la quando houver registros anteriores. A edição 2 usa chaves novas e não mistura tentativas nem comparações com a edição 1. A API aceita o identificador da edição; pedidos de clientes antigos sem edição continuam usando a edição 1.

Os pesos continuam experimentais; os grupos de referência são fictícios. O caso médico permanece pendente de revisão docente e não certifica habilidade clínica. Os testes verificam a consistência entre escolhas, documentos, agenda e relatório; não demonstram que a revisão já melhorou a compreensão de pessoas reais. Essa avaliação deve ocorrer na próxima rodada com os convidados.

## Revisão de linguagem · Alpha 0.1.0-alpha.8

Após nova observação do responsável pelo produto, a revisão passou a cobrir a linguagem de toda a edição prática: apresentação, situações, tarefas, alternativas, quadros, comentários após as escolhas, resumo final e arquivo baixado.

Exemplos: “preceptora” passa a ser “médica que acompanha seu atendimento”; “prontuário” vira “ficha de atendimento”; “logística” vira “equipe de entregas”; “janela de entrega” vira “horário de entrega”; “canhoto” vira “comprovante assinado por quem receber”; “benchmark” vira “comparação com exemplos”; “síntese” vira “resumo”. Siglas como RH saem das instruções. O papel da médica é explicado na apresentação do caso e na primeira etapa.

A pontuação, as ações avaliadas, os identificadores e a separação dos históricos permanecem os mesmos da edição prática 2. A edição 1 continua preservada como registro histórico. Títulos de capítulos e da obra nas referências mantêm a identificação da fonte. A próxima leitura com os convidados deve avaliar a compreensão: passar nos testes do sistema não comprova que todas as pessoas entenderão o texto.

## Correção de fluxo e layout · Alpha 0.1.0-alpha.9

A reorganização atende ao relato de confusão ao explicar e usar a demonstração. Não acrescenta casos nem modifica alternativas ou pontuação.

- A apresentação explica o funcionamento e dá prioridade a começar, continuar uma tentativa ou abrir o resumo, conforme o histórico. Áudio, versões anteriores e informações sobre o manual ficam em seções opcionais.
- A etapa tem uma sequência visual única: situação, informações e resposta. As alternativas deixam de competir com os documentos em uma coluna lateral. A indicação de progresso aparece uma vez no topo.
- Marcar uma alternativa não envia a resposta. O participante confirma no botão “Confirmar escolha”. Uma tela separada mostra a ação escolhida e seu resultado; “Ir para a etapa N” permite avançar conscientemente. O retorno da etapa anterior deixa de aparecer antes da próxima situação.
- O resumo abre com a leitura das escolhas e ações claras. Pontos, comparação inventada, detalhes de cada etapa e gerenciamento do histórico ficam acessíveis em seções que o participante abre quando quiser.
- A folha de estilos foi reorganizada para eliminar camadas sucessivas de ajustes concorrentes. O mesmo fluxo linear vale para computador e celular.

A confirmação salva imediatamente a escolha, incluindo a informação de que o retorno ainda precisa ser lido. Após pausa, troca de caso ou recarga, a retomada abre esse retorno. A última tentativa só é concluída quando o participante escolhe ver o resumo, evitando duplicações após recarga. O retorno pendente é reconstruído a partir das respostas verificadas pela API, e não de texto arbitrário no armazenamento local.

A verificação de navegador cobre seleção sem envio, erro na confirmação com nova tentativa, retorno separado, recarga durante retorno e antes do resumo final, preservação de tentativas e versões anteriores, áudio, exportação e telas de computador e celular. A avaliação de clareza por pessoas continua sendo necessária após a revisão.
