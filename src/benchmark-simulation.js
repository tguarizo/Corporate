import {marinaState,marinaNodes} from './marina.js';
import {marinaStateV4,marinaNodesV4} from './marina-v4.js';
import {anaState,anaNodes} from './ana.js';

export function narrativeSource(experience,edition){
 if(experience==='medical'&&edition==='3')return {state:anaState,nodes:anaNodes};
 if(experience==='corporate'&&edition==='3')return {state:marinaState,nodes:marinaNodes};
 if(experience==='corporate'&&edition==='4')return {state:marinaStateV4,nodes:marinaNodesV4};
 throw Error('invalid_experience');
}
export function observedConditions(state){
 const selected=(phase,choice)=>state.history.some(e=>e.phase===phase&&e.choice===choice),visited=new Set([...state.history.map(e=>e.phase),state.scene.id]);
 const item=(id,label,confirmed)=>({id,label,confirmed,evidence:confirmed?'Há registro desta confirmação no percurso.':'Não registrada neste percurso; isso não prova uma falha ou incapacidade.'});
 if(state.experience==='medical')return [item('presentation','Papel do estudante e escolha de Ana esclarecidos',selected('entrada','preparar')||selected('identidade','reparar')||selected('identidade','paula')||selected('privacidade','reservar')),item('routine','Rotina de Ana investigada',visited.has('rotina')),item('travel','Tempo de deslocamento conferido',visited.has('trajeto')),item('understanding','Dia, horário e unidade conferidos com Ana',state.scene.id==='compareceu')];
 return [item('context','Uso dos kits conversado com Marina',selected('chegada','marina')||selected('deposito','ligar')),item('receiver','Recebedor das 8h30 combinado',selected('reserva','recebedor')),item('trainer','Condição da extensão com a instrutora verificada',visited.has('consulta-instrutora')||visited.has('instrutora')||(state.experienceVersion==='4'&&visited.has('prazo')))];
}
const medicalOutcomes={confirmed:'Retorno no local e horário combinados',incompatible:'Horário ou trajeto incompatível','wrong-location':'Orientação levou à outra unidade',pending:'Confirmação da mensagem pendente',handoff:'Preferência por Paula respeitada',interrupted:'Paula precisou interromper a abordagem','unsupported-record':'Registro precisou de correção'};
const corporateOutcomes={entrega:'Entrega antes do início',turmas:'Turmas reorganizadas','turmas-custeadas':'Turmas reorganizadas',espera:'Entrega com espera e custo adicional',atraso:'Material compartilhado até 10h30',avulso:'Abertura adiada para 9h30',retorno:'Transporte retornou sem entregar','caixas-fora':'Kits danificados','sem-solucao':'Kits não enviados'};
export function resultCategory(state){const id=state.experience==='medical'?state.scene.outcome:state.scene.id;return {id:state.experience==='corporate'&&id==='turmas-custeadas'?'turmas':id,label:(state.experience==='medical'?medicalOutcomes:corporateOutcomes)[id]};}
function costs(state){return {entrega:480,turmas:0,'turmas-custeadas':700,espera:600,atraso:0,avulso:650,retorno:480,'caixas-fora':480,'sem-solucao':0}[state.scene.id]}
const populations=new Map();
function population(experience,edition){
 const key=experience+edition;if(populations.has(key))return populations.get(key);
 const {state:reconstruct,nodes}=narrativeSource(experience,edition),paths=[];
 function visit(history){const state=reconstruct(history);if(state.finished){paths.push(state);return}for(const c of nodes[state.scene.id].choices)visit([...history,{phase:state.scene.id,choice:c.id}])}visit([]);
 // A deterministic, invented sample, built only from reachable complete paths of this exact edition.
 let seed=experience==='medical'?7103:4103;
 const records=Array.from({length:36},(_,i)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return {group:['A','B','C'][i%3],state:paths[seed%paths.length]}});
 populations.set(key,records);return records;
}
export function simulateBenchmark(state,scope='all'){
 if(!['all','A','B','C'].includes(scope))throw Error('invalid_scope');
 const records=population(state.experience,state.experienceVersion).filter(r=>scope==='all'||r.group===scope),current=state.finished?resultCategory(state):null,counts=new Map();
 for(const r of records){const category=resultCategory(r.state);const previous=counts.get(category.id)||{...category,count:0};previous.count++;counts.set(category.id,previous)}
 if(current&&!counts.has(current.id))counts.set(current.id,{...current,count:0});
 const conditions=observedConditions(state),checks=conditions.map(c=>{const groupCount=records.filter(r=>observedConditions(r.state).find(o=>o.id===c.id).confirmed).length;return {id:c.id,label:c.label,participant:c.confirmed,groupCount,groupShare:Math.round(groupCount/records.length*100)}});
 const costsList=state.experience==='corporate'?records.map(r=>costs(r.state)):null;
 return {fictional:true,experience:state.experience,experienceVersion:state.experienceVersion,comparable:state.finished,scope,count:records.length,unit:state.experience==='medical'?'turmas fictícias':'equipes fictícias',current,checks,categories:[...counts.values()].map(c=>({...c,share:Math.round(c.count/records.length*100),isCurrent:current?.id===c.id})),costComparison:costsList&&state.finished?{participant:costs(state),mean:Math.round(costsList.reduce((a,b)=>a+b,0)/costsList.length),currency:'BRL',note:'Despesas adicionais já informadas no caso: transporte e/ou instrutora. Reposição de material danificado ainda não apurada. Menor custo não significa melhor solução.'}:null,method:'SIMULAÇÃO FICTÍCIA: 36 percursos gerados por combinações de escolhas alcançáveis neste mesmo caso e edição, divididos em três grupos de 12. Caminhos podem se repetir. Não são pessoas, resultados coletados ou referência estatística de competência.'};
}
