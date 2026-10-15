import {renderMaterials} from './materials.js';
const el=id=>document.getElementById(id);
let selected='corporate',edition='2';
const legacyKey=()=>selected==='corporate'?'tuuvo-jornada-alpha1':'tuuvo-jornada-medical-v1';
const storageKey=()=>edition==='1'?legacyKey():`tuuvo-jornada-${selected}-v2`;
function hasLegacy(){try{return Boolean(localStorage.getItem(legacyKey()))}catch{return false}}
const titles={corporate:'Uma conversa, muitos caminhos',medical:'Uma consulta, uma pessoa'};
let state,attempts=[],busy=false,benchRequest=0,selectedChoice=null,pendingFeedback=null;
function saved(){try{return JSON.parse(localStorage.getItem(storageKey())||'null')}catch{return null}}
function persist(){try{localStorage.setItem(storageKey(),JSON.stringify({experience:selected,experienceVersion:edition,history:state?.history||[],awaitingFeedback:Boolean(pendingFeedback),attempts:attempts.map(a=>a.history)}))}catch{el('error').textContent='Você pode continuar, mas este navegador não está salvando suas respostas.'}}
async function api(path,body){if(path.startsWith('/api/demo/')){if(body)body={...body,experience:selected,experienceVersion:edition};else path+=(path.includes('?')?'&':'?')+'experience='+selected+'&experienceVersion='+edition;}const r=await fetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});if(!r.ok)throw Error('Não foi possível continuar. Tente novamente.');return r.json()}
function show(id){
 document.querySelectorAll('video').forEach(video=>video.pause());
 el('experienceToolbar').classList.toggle('hidden',id==='catalog');
 const sources=selected==='medical'&&['welcome','results'].includes(id);
 el('sourceDetails').classList.toggle('hidden',!sources);el('sourcePanel').classList.toggle('hidden',!sources);
 for(const section of ['catalog','welcome','journey','feedback','results'])el(section).classList.toggle('hidden',section!==id);
 window.scrollTo({top:0,behavior:'auto'});
}
function syncWelcomeActions(){
 const hasProgress=Boolean(state);
 el('resume').classList.toggle('hidden',!hasProgress);el('resume').disabled=busy;
 el('resume').textContent=state?.finished&&!pendingFeedback?'Ver meu resumo':'Continuar de onde parei';
 el('start').className=hasProgress?'secondary':'primary';el('start').disabled=busy;
 el('start').textContent=hasProgress?(state.finished&&!pendingFeedback?'Fazer outra tentativa':'Recomeçar esta tentativa'):'Começar a experiência';
}
function setBusy(value){busy=value;for(const id of ['leave','catalogBack','feedbackLeave','continuePhase','resultsHome','retry'])el(id).disabled=value;}
async function start(){
 if(busy)return;setBusy(true);el('start').disabled=true;
 try{const next=await api('/api/demo/start');state=next;pendingFeedback=null;selectedChoice=null;persist();show('journey');renderPhase()}
 finally{setBusy(false);syncWelcomeActions()}
}
function createIntroPlayer(container=el('media')){
 const video=document.createElement('video');
 video.controls=true;video.preload='metadata';video.playsInline=true;video.muted=false;video.volume=1;
 video.poster=selected==='medical'?'/assets/med-preparo.svg':'/assets/illustration.png';video.src=selected==='medical'?'/assets/medical-intro.mp4':'/assets/intro.mp4?v=elevenlabs-alpha3';
 video.setAttribute('aria-label','Introdução ilustrada com narração em português');
 const track=document.createElement('track');track.kind='captions';track.srclang='pt-BR';track.label='Português';track.src=selected==='medical'?'/assets/medical-intro.vtt':'/assets/intro.vtt?v=elevenlabs-alpha3';track.default=true;video.appendChild(track);
 const play=document.createElement('button');play.className='video-play';play.textContent='Reproduzir vídeo com narração';
 const status=document.createElement('span');status.className='video-status hidden';status.setAttribute('role','status');
 play.onclick=async()=>{play.disabled=true;status.textContent='Carregando a introdução…';status.classList.remove('hidden');try{if(video.ended)video.currentTime=0;await video.play()}catch{status.textContent='Não foi possível reproduzir. Tente novamente.';play.classList.remove('hidden')}finally{play.disabled=false}};
 video.addEventListener('playing',()=>{play.classList.add('hidden');status.classList.add('hidden')});
 video.addEventListener('pause',()=>{if(!video.ended){play.textContent='Continuar vídeo';play.classList.remove('hidden')}});
 video.addEventListener('ended',()=>{play.textContent='Rever introdução';play.classList.remove('hidden')});
 video.addEventListener('error',()=>{status.textContent='O vídeo não carregou. Recarregue a página para tentar novamente.';status.classList.remove('hidden');play.disabled=false});
 container.append(video,play,status);
}
function renderPhase(){
 if(state.finished)return finish();
 const p=state.phase;selectedChoice=null;
 el('phaseCount').textContent=`ETAPA ${state.index+1} DE ${state.totalPhases}`;el('phaseLabel').textContent=p.label;
 el('phaseNotice').textContent=`Etapa ${state.index+1} de ${state.totalPhases}: ${p.label}.`;
 el('phaseTitle').textContent=p.title;el('context').textContent=p.context;el('quote').textContent=p.quote;
 el('decisionTask').textContent=p.task||'Qual é sua próxima ação?';
 renderMaterials(el('caseMaterials'),p.materials);document.querySelector('.materials-heading').classList.toggle('hidden',!p.materials?.length);
 el('progress').innerHTML=Array.from({length:state.totalPhases},(_,i)=>`<li class="${i<state.index?'done':i===state.index?'current':''}" aria-label="Etapa ${i+1}: ${i<state.index?'concluída':i===state.index?'atual':'a seguir'}" ${i===state.index?'aria-current="step"':''}></li>`).join('');
 el('media').replaceChildren();el('media').classList.toggle('hidden',edition==='2');
 if(edition==='1'&&state.index===0)createIntroPlayer();else if(edition==='1'){const image=document.createElement('img');image.src=`/assets/${p.id}.svg`;image.alt=`Ilustração da etapa: ${p.label}`;el('media').append(image)}
 const ordered=edition==='2'?p.choices.slice((state.index+1)%3).concat(p.choices.slice(0,(state.index+1)%3)):p.choices;
 el('choices').replaceChildren();
 for(const choice of ordered){
  const label=document.createElement('label');label.className='choice';
  const input=document.createElement('input');input.type='radio';input.name='decision';input.value=choice.id;input.dataset.choice=choice.id;
  const text=document.createElement('span');text.textContent=choice.text;
  input.onchange=()=>{selectedChoice=choice.id;el('choices').querySelectorAll('label').forEach(l=>l.classList.toggle('selected',l.querySelector('input').checked));el('confirmChoice').disabled=false;el('error').textContent=''};
  label.append(input,text);el('choices').append(label);
 }
 el('confirmChoice').disabled=true;el('confirmChoice').textContent='Confirmar escolha';el('error').textContent='';
 el('phaseTitle').tabIndex=-1;el('phaseTitle').focus({preventScroll:true});window.scrollTo({top:0,behavior:'auto'});
}
async function confirmChoice(){
 if(busy||!selectedChoice||pendingFeedback)return;
 const phase=state.phase,choice=phase.choices.find(c=>c.id===selectedChoice),step=state.index;
 setBusy(true);el('confirmChoice').disabled=true;el('confirmChoice').textContent='Confirmando…';el('choices').querySelectorAll('input').forEach(input=>input.disabled=true);
 try{
  state=await api('/api/demo/step',{phase:phase.id,choice:choice.id,history:state.history});
  pendingFeedback={index:step,label:phase.label,choice:choice.text,result:state.previous,reference:state.previousReference};persist();showFeedback();
 }catch(error){el('error').textContent=error.message;el('choices').querySelectorAll('input').forEach(input=>input.disabled=false);el('confirmChoice').disabled=false}
 finally{setBusy(false);el('confirmChoice').textContent='Confirmar escolha'}
}
function showFeedback(){
 show('feedback');el('feedbackCount').textContent=`ETAPA ${pendingFeedback.index+1} DE ${state.totalPhases} · CONCLUÍDA`;
 el('feedbackChoice').textContent=pendingFeedback.choice;el('carry').textContent=pendingFeedback.result;
 el('feedbackReference').textContent=pendingFeedback.reference||'';el('feedbackSource').classList.toggle('hidden',!pendingFeedback.reference);el('feedbackSource').open=false;
 el('continuePhase').textContent=state.finished?'Ver meu resumo':`Ir para a etapa ${state.index+1}`;
 el('feedbackTitle').tabIndex=-1;el('feedbackTitle').focus({preventScroll:true});
}
function continuePhase(){
 if(busy||!pendingFeedback)return;pendingFeedback=null;
 if(state.finished)finish();else{persist();show('journey');renderPhase()}
}
function finish(){attempts.push({history:state.history,report:state.report});if(attempts.length>20)attempts=[attempts[0],...attempts.slice(-19)];persist();showResults()}
function showResults(){pendingFeedback=null;show('results');el('sourceDetails').open=false;el('scoreDetails').open=false;el('evidenceDetails').open=false;const first=attempts[0]?.report||state.report,current=state.report||attempts.at(-1)?.report;renderDiagnosis(current);el('resultTitle').tabIndex=-1;el('resultTitle').focus({preventScroll:true});el('firstScore').textContent=first.total.toFixed(1);el('currentScore').textContent=current.total.toFixed(1);const gain=current.total-first.total;el('gain').textContent=`${gain>=0?'+':''}${gain.toFixed(1)} pontos em relação à primeira tentativa`;el('attemptCount').textContent=`${attempts.length} ${attempts.length===1?'tentativa salva':'tentativas salvas'}`;el('resultCount').textContent=`EXERCÍCIO CONCLUÍDO · ${current.rows.length} DE ${current.rows.length} ETAPAS`;el('resultMedicalNotice').classList.toggle('hidden',selected!=='medical');el('phaseMap').innerHTML=current.rows.map((row,i)=>`<div class="phase-row"><div class="labels"><span>${i+1}. ${row.label}</span><span>Conta ${row.weight}× no total · ${row.score}/100</span></div><div class="bar"><i style="width:${first.rows[i].score}%"></i></div><div class="bar"><i class="after" style="width:${row.score}%"></i></div></div>`).join('');el('evidence').replaceChildren();current.rows.forEach(row=>{const item=document.createElement('div');item.className='evidence-item';const heading=document.createElement('strong');heading.textContent=row.label;const text=document.createElement('p');text.textContent=row.evidence+(row.consequence?' '+row.consequence:'');const content=document.createElement('div');content.append(text);if(row.reference){const ref=document.createElement('p');ref.className='small';ref.textContent=`Fonte: ${row.reference}`;content.append(ref)}item.append(heading,content);el('evidence').appendChild(item)});updateBenchmark(first.total).catch(benchmarkUnavailable)}
function renderDiagnosis(report){
 const concerns=selected==='medical'?report.rows.filter(r=>['med-preparo','med-acolhimento'].includes(r.phase)&&r.score<100):[];el('careAlerts').classList.toggle('hidden',!concerns.length);el('careAlerts').textContent=concerns.length?'Antes de tentar de novo, veja isto: '+concerns.map(r=>r.evidence).join(' ')+' Converse sobre essas escolhas mesmo que seu total de pontos seja alto.':'';
 const ordered=[...report.rows].sort((a,b)=>b.score-a.score||b.weight-a.weight);
 const best=ordered[0],review=[...report.rows].sort((a,b)=>a.score-b.score||b.weight-a.weight)[0];
 el('diagnosisHighlightLabel').textContent=best.score>0?'Uma escolha que ajudou':'O que aconteceu';
 el('diagnosisHighlight').textContent=best.score>0?`${best.label}: ${best.evidence}`:'Nesta tentativa, nenhuma etapa chegou à pontuação máxima. Veja abaixo o que aconteceu e escolha uma ação para mudar na próxima vez.';
 el('diagnosisNextLabel').textContent=review.score<100?'Uma escolha para rever':'O que tentar agora';
 el('diagnosisNext').textContent=review.score<100?`${review.label}: ${review.evidence} Volte a essa etapa e tente outra ação.`:'Você chegou à pontuação máxima em todas as etapas. Tente outras ações para ver o que muda.';
}
const points=value=>new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}).format(value);
function benchmarkUnavailable(){el('benchmarkMean').textContent='—';el('cohortText').textContent='Comparação indisponível.';el('comparisonContent').classList.add('hidden');el('comparison').setAttribute('aria-busy','false');el('comparisonExplanation').textContent='Não foi possível carregar o grupo. Seu resumo e seus pontos continuam disponíveis.'}
async function updateBenchmark(score){
 const request=++benchRequest,scope=el('scope').value;
 el('comparison').setAttribute('aria-busy','true');el('comparisonContent').classList.add('hidden');el('comparisonExplanation').textContent='Carregando a comparação…';el('benchmarkMean').textContent='—';el('cohortText').textContent='Atualizando o grupo…';
 try{
  const data=await api(`/api/demo/benchmark?score=${score}&scope=${scope}`);if(request!==benchRequest)return;
  const mean=Math.round(data.scores.reduce((sum,value)=>sum+value,0)/data.scores.length*10)/10;
  const delta=Math.round((score-mean)*10)/10;
  el('benchmarkMean').textContent=points(mean);el('cohortText').textContent=`Média de ${data.count} exemplos inventados · 0 a 100`;
  el('comparisonScore').textContent=`${points(score)} / 100`;el('comparisonMean').textContent=`${points(mean)} / 100`;
  el('participantBar').style.width=`${score}%`;el('groupBar').style.width=`${mean}%`;
  el('comparisonExplanation').textContent=delta===0?'Sua primeira tentativa ficou na média do grupo de exemplo. Os valores estão arredondados para uma casa depois da vírgula.':`Sua primeira tentativa ficou ${points(Math.abs(delta))} pontos ${delta>0?'acima':'abaixo'} da média deste grupo de exemplo.`;
  el('comparisonContent').classList.remove('hidden');el('comparison').setAttribute('aria-busy','false');
 }catch(error){if(request===benchRequest)throw error}
}

function download(){const current=state.report||attempts.at(-1).report,first=attempts[0].report;const text=['TUUVO · RESUMO DO EXERCÍCIO',`Experiência: ${titles[selected]}`,`Edição do exercício: ${current.experienceVersion}`,`Versão: ${current.version}`,`Tentativas concluídas neste navegador: ${attempts.length}`,`Primeira tentativa: ${first.total}/100`,`Tentativa mais recente: ${current.total}/100`,'',...current.rows.flatMap(r=>[`${r.label} · conta ${r.weight} vez(es) no total · ${r.score}/100`,`Escolha: ${r.choice}`,`Observação nesta situação: ${r.evidence}`,r.consequence?`O que aconteceu: ${r.consequence}`:'',r.reference?`Fonte: ${r.reference}`:'','']),'Comparação de exemplo: números inventados, sem resultados de pessoas reais.','Os pontos resumem escolhas neste exercício. Eles não comprovam sua capacidade para o trabalho.','As tentativas ficam apenas neste navegador.',...(selected==='medical'?['Fonte: Manual de habilidades da prática médica, org. Rafaela Yasmine de Sousa Ferreira, Atena Editora, 2026, capítulos 1–5.','https://doi.org/10.22533/at.ed.678260810 · CC BY 4.0 · https://creativecommons.org/licenses/by/4.0/','Adaptação da Tuuvo: personagens, imagens, escolhas e pontuação criados para esta demonstração. Sem aprovação da editora ou dos autores.','Um professor de Medicina ainda precisa revisar o caso e a pontuação. Este exercício não comprova capacidade para atender pacientes.']:[])].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=selected==='medical'?'tuuvo-consulta-minha-sintese.txt':'tuuvo-minha-sintese.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

function pause(){if(busy)return;persist();syncWelcomeActions();show('welcome')}
function goCatalog(){if(busy)return;++benchRequest;show('catalog');el('catalogTitle').tabIndex=-1;el('catalogTitle').focus({preventScroll:true})}
function resume(){if(busy||!state)return;if(pendingFeedback)showFeedback();else if(state.finished)showResults();else{show('journey');renderPhase()}}
el('start').onclick=()=>start().catch(error=>{el('start').textContent=error.message});
el('retry').onclick=()=>start().catch(error=>{el('retry').textContent=error.message});
el('leave').onclick=pause;el('feedbackLeave').onclick=pause;el('resume').onclick=resume;
el('confirmChoice').onclick=confirmChoice;el('continuePhase').onclick=continuePhase;
el('scope').onchange=()=>updateBenchmark(attempts[0].report.total).catch(benchmarkUnavailable);
el('download').onclick=download;
el('clear').onclick=()=>{if(busy)return;try{localStorage.removeItem(storageKey())}catch{}attempts=[];state=null;pendingFeedback=null;syncWelcomeActions();show('welcome')};
el('catalogBack').onclick=goCatalog;el('resultsHome').onclick=goCatalog;
async function restoreSaved(){
 const data=saved();if(!data||data.experience&&data.experience!==selected||data.experienceVersion&&data.experienceVersion!==edition)return;
 const histories=Array.isArray(data.attempts)?data.attempts.slice(0,20):[];
 const restored=await Promise.allSettled(histories.map(history=>api('/api/demo/resume',{history})));for(const item of restored)if(item.status==='fulfilled'&&item.value.finished)attempts.push({history:item.value.history,report:item.value.report});
 try{
  state=await api('/api/demo/resume',{history:data.history});
  if(data.awaitingFeedback&&state.history.length){
   const prior=await api('/api/demo/resume',{history:state.history.slice(0,-1)}),choice=prior.phase.choices.find(c=>c.id===state.history.at(-1).choice);
   pendingFeedback={index:prior.index,label:prior.phase.label,choice:choice.text,result:state.previous,reference:state.previousReference};
  }
  if(state.finished&&!pendingFeedback&&!attempts.some(a=>JSON.stringify(a.history)===JSON.stringify(state.history))){attempts.push({history:state.history,report:state.report});if(attempts.length>20)attempts=[attempts[0],...attempts.slice(-19)];persist()}
 }catch{state=null;pendingFeedback=null}
}
async function selectExperience(id,requestedEdition='2'){
 if(busy||!titles[id])return;setBusy(true);selected=id;edition=requestedEdition;state=null;attempts=[];pendingFeedback=null;selectedChoice=null;++benchRequest;
 const medical=id==='medical';el('activeExperienceLabel').textContent=titles[id];el('welcomeTitle').textContent=titles[id];el('welcomeEyebrow').textContent=medical?'CASO DA ANA · CONSULTA MÉDICA':'CASO DA MARINA · ATENDIMENTO AO CLIENTE';
 el('welcomeIntro').textContent=medical?'Você é estudante de Medicina. A médica Paula vai acompanhar seu atendimento a Ana, que faltou à última consulta. Confira a sala, as fichas e os horários.':'Você atende Marina. Ela comprou 40 conjuntos de materiais para novos funcionários e recebeu 20. Confira o pedido e escolha o que fazer para entregar o restante.';
 el('welcomePhases').textContent=medical?'7 etapas':'6 etapas';el('medicalDisclaimer').classList.toggle('hidden',!medical);
 el('editionNotice').textContent=edition==='2'?'Você está na edição prática. Os resultados ficam separados da edição anterior.':'Você está na edição anterior, com o roteiro e os resultados originais.';
 el('previousEdition').classList.toggle('hidden',edition==='1'||!hasLegacy());
 el('scope').options[0].textContent=medical?'Três turmas inventadas · 36 exemplos':'Três empresas inventadas · 36 exemplos';el('scope').options[1].textContent=medical?'Turma A inventada · 12 exemplos':'Empresa A inventada · 12 exemplos';el('scope').value='all';
 el('introDetails').open=false;el('sourceDetails').open=false;document.querySelectorAll('.saved-settings').forEach(d=>d.open=false);el('introMedia').replaceChildren();createIntroPlayer(el('introMedia'));
 show('welcome');syncWelcomeActions();el('start').textContent='Buscando suas respostas…';
 try{await restoreSaved()}finally{setBusy(false);syncWelcomeActions()}
 el('welcomeTitle').tabIndex=-1;el('welcomeTitle').focus({preventScroll:true});
}
el('select-corporate').onclick=()=>selectExperience('corporate');el('select-medical').onclick=()=>selectExperience('medical');el('previousEdition').onclick=()=>selectExperience(selected,'1');
