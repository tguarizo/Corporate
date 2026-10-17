const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),experience=params.get('experience')==='medical'?'medical':'corporate',medical=experience==='medical',edition=medical?'3':params.get('edition')==='3'?'3':'4';
let report,origin,requestId=0;
const storyPath=selectedEdition=>medical?'/ana':'/marina'+(selectedEdition==='3'?'?edition=3':'');
const element=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e};
function localHistory(selectedEdition=edition){try{const history=JSON.parse(localStorage.getItem(`coonto-${medical?'ana':'marina'}-v${selectedEdition}`)||'null');return Array.isArray(history)&&history.length?history:null}catch{return null}}
function exampleHistory(positive){return medical?[{phase:'entrada',choice:'preparar'},{phase:'escuta',choice:'investigar'},{phase:'rotina',choice:'trajeto'},{phase:'trajeto',choice:'equipe'},{phase:'centro',choice:positive?'confirmar':'sistema'}]:positive?[{phase:'chegada',choice:'reservar'},{phase:'reserva',choice:'recebedor'}]:[{phase:'chegada',choice:'reservar'},{phase:'reserva',choice:'cadastro'},{phase:'portafechada',choice:'esperar'}]}
async function load(){
 const id=++requestId,source=$('reportSource').value,example=source.startsWith('example'),selectedEdition=source==='previous'?'3':edition,history=example?exampleHistory(source==='example-positive'):localHistory(selectedEdition);
 report=null;$('reportContent').hidden=true;$('reportError').textContent='';$('benchmarkCharts').hidden=true;
 $('backStory').href=storyPath(selectedEdition);$('backStory').textContent=!medical&&selectedEdition==='3'?'Voltar à história anterior':'Voltar à experiência';$('newChallenge').hidden=medical||selectedEdition!=='3';
 origin=example?'EXEMPLO ILUSTRATIVO · escolhas criadas para demonstrar o relatório; não são resultados de uma pessoa.':'PERCURSO DESTE NAVEGADOR · caso fictício, sem identificação do participante.';origin+=' · Edição '+selectedEdition;$('reportOrigin').textContent=origin;
 if(!history){$('reportError').textContent='Ainda não há decisões salvas nesta edição. Faça a experiência ou selecione o exemplo ilustrativo.';return}
 try{const r=await fetch('/api/demo/supervision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({history,experience,experienceVersion:selectedEdition,scope:$('benchmarkScope').value})});if(!r.ok)throw Error();const data=await r.json();if(id!==requestId)return;report=data;render()}catch{if(id===requestId)$('reportError').textContent='Não foi possível carregar este registro. Troque a seleção para tentar novamente.'}
}
function render(){
 $('reportContent').hidden=false;$('reportStatus').textContent=report.complete?'Percurso concluído':'Percurso em andamento · resultado parcial';$('decisionCount').textContent=`${report.decisions} decisões registradas`;$('outcomeTitle').textContent=report.outcome.title;$('outcomeDescription').textContent=report.outcome.description;$('outcomeFacts').replaceChildren(...report.outcome.facts.map(f=>element('li',f)));
 $('conditionMap').replaceChildren(...report.conditions.map(c=>{const item=document.createElement('article');item.className='condition '+(c.confirmed?'recorded':'unrecorded');item.append(element('span',c.confirmed?'Registrado':'Não registrado'),element('strong',c.label));return item}));
 $('supervisionTimeline').replaceChildren(...report.timeline.map(t=>{const item=document.createElement('li');item.append(element('strong',t.action),element('p',t.consequence),element('p',t.detail));return item}));
 $('observations').replaceChildren(...report.observations.map(o=>{const a=document.createElement('article');a.className='observation-card';a.append(element('h4',o.topic),element('p','Evidência do caso: '+o.evidence),element('p','Conversa com o participante: '+o.question),element('p','Próxima prática: '+o.practice));return a}));
 if(!report.observations.length)$('observations').append(element('p','O percurso ainda não contém decisões suficientes para as observações previstas neste caso. Use a sequência acima para conversar sobre o que foi feito.'));
 $('reportLimits').textContent=report.limits;renderBenchmark();
}
function bar(label,value,detail,highlight=false){
 const row=document.createElement('div');row.className='chart-row'+(highlight?' highlighted':'');const heading=document.createElement('div');heading.className='chart-label';heading.append(element('span',label),element('strong',detail));const track=document.createElement('div');track.className='chart-track';track.setAttribute('aria-hidden','true');const fill=document.createElement('i');fill.style.width=Math.max(0,Math.min(100,value))+'%';track.append(fill);row.append(heading,track);return row;
}
function renderBenchmark(){
 const s=report.simulation;$('benchmarkCharts').hidden=!s.comparable;$('benchmarkStatus').textContent=s.comparable?`SIMULAÇÃO · ${s.count} percursos fictícios do mesmo caso e edição. Grupo: ${s.scope==='all'?'A + B + C':s.scope}.`:'O percurso está em andamento. A comparação ficará disponível após um desfecho, para não comparar uma tentativa parcial com exemplos concluídos.';
 if(!s.comparable)return;
 $('outcomeChart').replaceChildren(...s.categories.map(c=>bar(c.label+(c.isCurrent?' · desfecho exibido':''),c.share,`${c.count} de ${s.count} · ${c.share}%`,c.isCurrent)));
 $('checkChart').replaceChildren(...s.checks.map(c=>bar(c.label+` · no percurso exibido: ${c.participant?'registrado':'não registrado'}`,c.groupShare,`${c.groupCount} de ${s.count} · ${c.groupShare}%`,c.participant)));
 $('costPanel').hidden=!s.costComparison;
 if(s.costComparison){const c=s.costComparison,max=Math.max(700,c.mean,c.participant),money=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});$('costChart').replaceChildren(bar('Percurso exibido',100*c.participant/max,money(c.participant),true),bar('Média dos exemplos fictícios',100*c.mean/max,money(c.mean)));$('costNote').textContent=c.note;}
 $('benchmarkMethod').textContent=s.method;
}
$('reportSource').onchange=load;$('benchmarkScope').onchange=load;
$('caseSelect').value=experience;$('caseSelect').onchange=()=>{location.href='/supervisao?experience='+$('caseSelect').value};
$('exportReport').onclick=()=>{
 if(!report)return;const s=report.simulation,text=['COONTO CORPORATE · REGISTRO PARA SUPERVISÃO',medical?'ANA · UM RETORNO POSSÍVEL':'MARINA · AMANHÃ, ÀS NOVE',origin,`Edição da história: ${report.experienceVersion}`,report.complete?'Percurso concluído':'Percurso parcial',report.outcome.title,report.outcome.description,...report.outcome.facts,'',...report.conditions.map(c=>`${c.label}: ${c.confirmed?'registrado':'não registrado'}`),'',...report.timeline.flatMap(t=>[t.step+'. '+t.action,t.consequence,t.detail,'']),...report.observations.flatMap(o=>[o.topic,'Evidência: '+o.evidence,'Para conversar: '+o.question,'Prática: '+o.practice,'']),s.method,...(s.comparable?[`Grupo fictício: ${s.scope} · ${s.count} percursos`,...s.categories.map(c=>`${c.label}: ${c.count}/${s.count} (${c.share}%)`),...s.checks.map(c=>`${c.label}: ${c.groupCount}/${s.count} exemplos fictícios`),...(s.costComparison?[`Despesa do percurso: R$ ${s.costComparison.participant}; média simulada: R$ ${s.costComparison.mean}`,s.costComparison.note]:[])]:['Percurso parcial: comparação ainda indisponível.']),report.limits].join('\n');
 const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='coonto-supervisao-percurso.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
if(medical){
 $('reportTitle').textContent='Ana · Um retorno possível · registro do percurso';
 $('reportSource').querySelector('[value="example"]').textContent='Exemplo ilustrativo: cartão levou à unidade errada';$('reportSource').querySelector('[value="example-positive"]').textContent='Exemplo ilustrativo: retorno combinado com Ana';
 $('presentationPitch').textContent='“Ana faltou à consulta e quer continuar. O participante é estudante e conversa com ela acompanhado pela médica Paula. Uma vaga livre pode não caber no trabalho ou no trajeto. As escolhas mudam a conversa, o registro e o combinado de retorno. A supervisão revê as evidências e combina uma próxima prática de comunicação.”';
 $('sessionDiscussion').textContent='Comparar dois percursos: que informação ficou sem confirmação e o que isso mudou para Ana?';
 $('presentationAudience').textContent='Estudantes da área da saúde, docentes e equipes que treinam acolhimento, comunicação e organização da consulta.';$('presentationSkills').textContent='Explicar papéis, proteger a privacidade, ouvir a rotina, verificar deslocamento e conferir dia, horário e unidade com a paciente.';$('presentationStart').href='/ana';
 [...$('benchmarkScope').options].forEach(o=>o.textContent=o.textContent.replace('equipes','turmas').replace('Equipe','Turma'));
}
if(!medical&&edition!=='3'&&localHistory('3')){$('previousSource').hidden=false;if(!localHistory())$('reportSource').value='previous'}
// With no local decisions, present a clearly labelled example; never write it as a participant history.
if(!localHistory()&&$('reportSource').value!=='previous')$('reportSource').value='example';
load();
