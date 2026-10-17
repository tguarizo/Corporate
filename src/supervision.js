import {anaSupervision} from './ana-supervision.js';
import {anaState} from './ana.js';
import {observedConditions,simulateBenchmark} from './benchmark-simulation.js';
import {marinaState} from './marina.js';
import {marinaStateV4} from './marina-v4.js';

export function supervisionFor(history,edition='4',experience='corporate',scope='all'){
 if(experience==='medical'&&edition==='3'){const state=anaState(history);return {...anaSupervision(history),conditions:observedConditions(state),simulation:simulateBenchmark(state,scope)};}
 if(experience!=='corporate')throw Error('invalid_experience');
 if(!['3','4'].includes(edition))throw Error('invalid_edition');
 const reconstruct=edition==='4'?marinaStateV4:marinaState,state=reconstruct(history);
 const timeline=state.trail.map((entry,i)=>{
  const consequence=reconstruct(state.history.slice(0,i+1)).scene;
  return {step:i+1,scene:entry.title,action:entry.action,consequence:consequence.title,detail:consequence.text};
 });
 const selected=(phase,choice)=>state.history.some(e=>e.phase===phase&&e.choice===choice);
 const observations=[];
 if(selected('chegada','encerrar'))observations.push({topic:'Conferência da informação',evidence:'O chamado foi encerrado com base no status do sistema, apesar do recibo de 20 unidades.',question:'Que conferência permitiria resolver a divergência antes de encerrar o atendimento?',practice:'Revisar um pedido com divergência entre sistema e comprovante e definir a evidência necessária para encerrá-lo.'});
 if(selected('chegada','marina'))observations.push({topic:'Entendimento da operação do cliente',evidence:'A primeira ação foi conversar com Marina. Isso revelou a divisão em duas turmas e abriu alternativas de horário.',question:'Que informação essa conversa trouxe? Que condição ainda faltava confirmar?',practice:'Em dupla, levantar horários, dependências e custos antes de propor uma mudança ao cliente.'});
 if(selected('chegada','deposito'))observations.push({topic:'Verificação operacional',evidence:'O participante conferiu o depósito antes de decidir o envio. A localização dos kits foi confirmada às 15h55.',question:'Como usar os cinco minutos restantes sem deixar condições importantes em aberto?',practice:'Simular uma passagem de atendimento com prazo curto e registrar o que foi confirmado e o que ficou pendente.'});
 if(edition==='4'&&selected('prioridades','regular'))observations.push({topic:'Dependências de uma solução',evidence:'A rota regular foi escolhida antes de confirmar as condições da extensão com a instrutora. O custo apareceu depois de Marina avisar a turma.',question:'Quem precisava confirmar a mudança antes de ela ser comunicada?',practice:'Mapear responsáveis e confirmações antes de anunciar uma alteração de programação.'});
 if(selected('prioridades','conferir'))observations.push({topic:'Custo de investigar antes de agir',evidence:'A condição da instrutora foi verificada antes da confirmação da turma; nesse intervalo, encerrou a reserva das 8h30.',question:'Que informação vale o tempo de busca? O que poderia ser verificado em paralelo?',practice:'Comparar dois planos para reunir informações sem perder um prazo de contratação.'});
 if(selected('reserva','recebedor'))observations.push({topic:'Coordenação da entrega',evidence:'O participante solicitou um recebedor às 8h30. Marina combinou a entrada com João e enviou o contato.',question:'Quais confirmações transformaram o veículo reservado em uma entrega recebida?',practice:'Preparar uma passagem para a logística com horário, recebedor, contato e confirmação de recebimento.'});
 if(selected('reserva','cadastro'))observations.push({topic:'Confirmação de recebimento',evidence:'O motorista foi orientado a usar o telefone do cadastro; não havia recebedor combinado. A porta estava fechada na chegada.',question:'Por que um telefone cadastrado não assegurou o recebimento?',practice:'Ensaiar a confirmação de um recebedor antes de despachar uma entrega fora do horário de funcionamento.'});
 if(selected('reserva','deixar'))observations.push({topic:'Entrega e integridade dos materiais',evidence:'Foi autorizada a entrega na calçada sem recebedor. Neste caso, oito kits foram danificados pela chuva.',question:'Qual comprovação deveria existir antes de marcar uma entrega como concluída?',practice:'Rever o procedimento para ausência de recebedor, incluindo integridade dos volumes e responsabilidade pela guarda.'});
 if(selected('reclamacao','insistir'))observations.push({topic:'Resposta à contestação',evidence:'Mesmo após a reabertura pela gerência, a orientação foi manter o chamado fechado. Os kits continuaram no depósito.',question:'Como retomar a solução quando o registro interno é contestado por uma evidência?',practice:'Simular a reabertura de uma reclamação com divergência documental e combinar um responsável pela resolução.'});
 return {conditions:observedConditions(state),simulation:simulateBenchmark(state,scope),experience:'corporate',experienceVersion:edition,complete:state.finished,decisions:state.history.length,outcome:{title:state.scene.title,description:state.scene.text,facts:state.scene.facts},timeline,observations,limits:'Este registro descreve escolhas em um caso fictício. Não comprova competência profissional, intenção ou comportamento no trabalho. Pontos não observados neste percurso não devem ser tratados como falhas.'};
}
