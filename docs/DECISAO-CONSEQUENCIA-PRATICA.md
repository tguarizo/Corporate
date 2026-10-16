# Coonto Corporate: decisão, consequência e prática

O percurso tem quatro momentos: situar, agir, observar e transferir uma descoberta para a prática. A interface apresenta um momento por vez.

## A experiência e o que vem depois

1. **Situação:** personagem, conflito e informações necessárias. A ação de seguir permanece no mesmo lugar da tela.
2. **Sua escolha:** pergunta e alternativas. É possível rever os dados mantendo a opção marcada. Só a confirmação registra a ação.
3. **Consequência:** o que a pessoa escolheu, o efeito no caso e o que vale perceber. O texto explica a próxima situação ou apresenta o fechamento do percurso.
4. **Próximo passo:** escolher uma etapa, escrever uma ação concreta e definir qual sinal observar. O registro fica no navegador e pode ser baixado com o resumo. Também é possível voltar à etapa escolhida, alterar a decisão e seguir com os efeitos dessa nova tentativa.

As tentativas anteriores e a primeira comparação são preservadas. O próximo passo pessoal é associado ao percurso que o produziu; não é reaproveitado silenciosamente em uma tentativa diferente.

O retorno não usa selos de certo/errado. O roteiro continua tendo critérios e precisa mostrar consequências plausíveis. Pontos e referências ficam disponíveis em detalhes. Isso não transforma todas as ações em equivalentes nem demonstra competência profissional ou aptidão clínica.

O passo posterior fora da plataforma é experimentar a ação em contexto apropriado, observar seu efeito e discuti-lo com quem acompanha a formação. O produto atual oferece registro e exportação; não envia automaticamente esse plano a superiores, não monitora o trabalho e não demonstra que houve mudança de comportamento.

## Revisão com o público-alvo

O botão “Algo aqui não ficou claro?” permite registrar um comentário sem interromper o progresso. A pessoa informa, se desejar, sua relação com o assunto, identifica uma palavra ou trecho e sugere uma formulação. Também pode apontar problemas na situação, nas alternativas e no layout.

Cada comentário é associado ao caso, à edição, à etapa e ao momento da tela. A explicação do formulário informa que o texto será enviado à equipe e pede que não sejam incluídos dados pessoais. O envio só é confirmado após gravação no servidor; uma falha preserva o texto para nova tentativa.

Fluxo editorial para a próxima jornada:

1. Definir quem vai participar e qual situação real precisa reconhecer.
2. Escrever um caso curto, com informações concretas e escolhas compreensíveis para esse grupo.
3. Experimentar o roteiro com participantes do público-alvo e recolher palavras desconhecidas, interpretações das alternativas e sugestões de linguagem.
4. Rever primeiro os problemas que impedem entender a situação ou a decisão; registrar as mudanças de vocabulário e testar o trecho novamente.
5. Pedir revisão de quem conhece o trabalho, incluindo consequências e informações que faltam. O caso médico mantém a necessidade de revisão por professor de Medicina.
6. Avançar à próxima jornada com os problemas de compreensão identificados tratados e com os limites do caso descritos. Uma publicação técnica não substitui essa validação com pessoas.

## Onde os comentários ficam e como revisá-los

- API pública somente de escrita: `POST /api/experience-feedback`. Não há listagem pública.
- Registro de comentários: `experience-feedback.jsonl`, no diretório indicado por `FEEDBACK_DIR`. Em desenvolvimento, o padrão é `data/feedback/`, ignorado pelo Git.
- Na VPS, o publicador monta `/opt/coonto/corporate-alpha/feedback` em `/app/data/feedback`. O processo Node pode gravar; o arquivo usa permissão 0600. O diretório fica fora das releases e dos contêineres substituídos.
- O fluxo **Review Coonto audience feedback** só exporta por acionamento manual, com a chave pública RSA de quem fará a revisão. Como este repositório é público, o arquivo recebe criptografia AES-256-GCM, e a chave de conteúdo é protegida com RSA-OAEP-SHA256. O artefato `coonto-audience-feedback-encrypted` tem retenção de sete dias. Somente quem tem a chave privada correspondente pode ler os comentários; os textos não aparecem nos logs, nos artefatos em claro nem na aplicação. Não se deve enviar uma chave privada ao fluxo. O utilitário `.github/scripts/feedback-archive.cjs` permite descriptografar o arquivo localmente.
- Retornos sobre linguagem são enviados à equipe. O plano pessoal do participante permanece somente no navegador e no arquivo que ele decide baixar.

## Validação

Os testes existentes continuam cobrindo pontuação, ramificações, integridade das histórias e separação das edições. Os testes de comentários verificam armazenamento durável, deduplicação, limites dos campos, associação correta ao caso e recusa de leitura pública. A verificação de navegador cobre os dois casos, áudio, computador/celular, retomada de consequências, preservação das escolhas ao rever informações, próximo passo pessoal e nova tentativa a partir de uma etapa escolhida.

Os comentários sintéticos da verificação do formulário são interceptados no navegador. A publicação não introduz comentários fictícios no arquivo de participantes.
