const $=id=>document.getElementById(id),edition=new URLSearchParams(location.search).get('edition')==='3'?'3':'4';
let report,origin,requestId=0;
$('backStory').href='/marina'+(edition==='3'?'?edition=3':'');
function element(tag,text){const e=document.createElement(tag);e.textContent=text;return e}
function localHistory(selectedEdition=edition){try{const history=JSON.parse(localStorage.getItem(`coonto-marina-v${selectedEdition}`)||'null');return Array.isArray(history)&&history.length?history:null}catch{return null}}
function exampleHistory(){return [{phase:'chegada',choice:'reservar'},{phase:'reserva',choice:'cadastro'},{phase:'portafechada',choice:'esperar'}]}
async function load(){
 const id=++requestId,example=$('reportSource').value==='example',selectedEdition=$('reportSource').value==='previous'?'3':edition,history=example?exampleHistory():localHistory(selectedEdition);report=null;$('reportContent').hidden=true;$('reportError').textContent='';
 $('backStory').href='/marina'+(selectedEdition==='3'?'?edition=3':'');$('backStory').textContent=selectedEdition==='3'?'Voltar à história anterior':'Voltar à experiência';$('newChallenge').hidden=selectedEdition!=='3';
 origin=example?'EXEMPLO ILUSTRATIVO · escolhas criadas para demonstrar o relatório; não são resultados de uma pessoa.':'PERCURSO DESTE NAVEGADOR · caso fictício, sem identificação do participante.';origin+=' · Edição '+selectedEdition;$('reportOrigin').textContent=origin;
 if(!history){$('reportError').textContent='Ainda não há decisões salvas nesta edição. Faça a experiência ou selecione o exemplo ilustrativo.';return}
 try{const r=await fetch('/api/demo/supervision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({history,experienceVersion:selectedEdition})});if(!r.ok)throw Error();const data=await r.json();if(id!==requestId)return;report=data;render()}catch{if(id===requestId)$('reportError').textContent='Não foi possível carregar este registro. Troque a seleção para tentar novamente.'}
}
function render(){
 $('reportContent').hidden=false;$('reportStatus').textContent=report.complete?'Percurso concluído':'Percurso em andamento · resultado parcial';$('decisionCount').textContent=`${report.decisions} decisões registradas`;$('outcomeTitle').textContent=report.outcome.title;$('outcomeDescription').textContent=report.outcome.description;$('outcomeFacts').replaceChildren(...report.outcome.facts.map(f=>element('li',f)));
 $('supervisionTimeline').replaceChildren(...report.timeline.map(t=>{const item=document.createElement('li');item.append(element('strong',t.action),element('p',t.consequence),element('p',t.detail));return item}));
 $('observations').replaceChildren(...report.observations.map(o=>{const a=document.createElement('article');a.className='observation-card';a.append(element('h4',o.topic),element('p','Evidência do caso: '+o.evidence),element('p','Conversa com o participante: '+o.question),element('p','Próxima prática: '+o.practice));return a}));
 if(!report.observations.length)$('observations').append(element('p','O percurso ainda não contém decisões suficientes para as observações previstas neste caso. Use a sequência acima para conversar sobre o que foi feito.'));
 $('reportLimits').textContent=report.limits;
}
$('reportSource').onchange=load;
$('exportReport').onclick=()=>{if(!report)return;const text=['COONTO CORPORATE · REGISTRO PARA SUPERVISÃO',origin,`Edição da história: ${report.experienceVersion}`,report.complete?'Percurso concluído':'Percurso parcial',report.outcome.title,report.outcome.description,...report.outcome.facts,'',...report.timeline.flatMap(t=>[t.step+'. '+t.action,t.consequence,t.detail,'']),...report.observations.flatMap(o=>[o.topic,'Evidência: '+o.evidence,'Para conversar: '+o.question,'Prática: '+o.practice,'']),report.limits].join('\n'),url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='coonto-supervisao-percurso.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
// Show the empty local state first; an example is an explicit choice, never a fake participant result.
if(edition!=='3'&&localHistory('3')){$('previousSource').hidden=false;if(!localHistory())$('reportSource').value='previous'}
load();
