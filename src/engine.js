import {marinaState,marinaStep} from './marina.js';
import {phases,corporateMaterials} from './corporate.js';
import {medicalPhases,medicalMaterials,medicalContext} from './medical.js';
import * as legacy from './legacy-engine.js';
export {phases};
export const VERSION='0.1.0-alpha.12';
export const experiences=[{id:'corporate',version:'3',title:'Amanhã, às nove',format:'narrative',decisions:{min:2,max:3},endings:6},{id:'medical',version:'2',title:'Uma consulta, uma pessoa',phases:7}];
function checkEdition(edition){if(!['1','2','3'].includes(edition))throw Error('invalid_edition');}
function scenario(experience){if(!experiences.some(e=>e.id===experience))throw Error('invalid_experience');return experience==='medical'?medicalPhases:phases;}
export function validateHistory(history,experience='corporate',edition='2'){
 checkEdition(edition);if(edition==='3'){if(experience!=='corporate')throw Error('invalid_experience');return marinaState(history).history;}if(edition==='1')return legacy.validateHistory(history,experience);
 const list=scenario(experience);if(!Array.isArray(history)||history.length>list.length)throw Error('invalid_history');
 return history.map((entry,i)=>{const phase=list[i];if(!entry||entry.phase!==phase.id||!phase.choices.some(c=>c.id===entry.choice))throw Error('invalid_history');return {phase:phase.id,choice:entry.choice};});
}
function materials(phase,history,experience){return experience==='medical'?medicalMaterials(phase,history):corporateMaterials(phase,history);}
export function scoreHistory(history,experience='corporate',edition='2'){
 checkEdition(edition);if(edition==='3')throw Error('unscored_experience');if(edition==='1')return legacy.scoreHistory(history,experience);
 const list=scenario(experience),h=validateHistory(history,experience);if(h.length!==list.length)throw Error('incomplete');
 const rows=h.map((entry,i)=>{const p=list[i],c=p.choices.find(c=>c.id===entry.choice);return {phase:p.id,label:p.label,weight:p.weight,score:c.score,choice:c.text,evidence:c.evidence,consequence:c.consequence,task:p.task,reference:p.reference||null};});
 return {version:VERSION,experience,experienceVersion:'2',total:Math.round(rows.reduce((s,r)=>s+r.score*r.weight,0)/rows.reduce((s,r)=>s+r.weight,0)*10)/10,rows};
}
function stateFor(history,experience){
 const list=scenario(experience),h=validateHistory(history,experience),original=list[h.length];
 const phase=original?{...original,context:experience==='medical'?medicalContext(original,h):original.context,materials:materials(original,h,experience)}:null;
 const previous=h.length?list[h.length-1]:null,choice=previous?.choices.find(c=>c.id===h.at(-1).choice);
 return {version:VERSION,experience,experienceVersion:'2',history:h,finished:!phase,phase,index:h.length,totalPhases:list.length,report:!phase?scoreHistory(h,experience):null,previous:choice?choice.evidence+' '+choice.consequence:null,previousReference:previous?.reference||null,previousOutcome:choice?{observation:choice.evidence,consequence:choice.consequence}:null};
}
export function initialState(experience='corporate',edition='2'){checkEdition(edition);if(edition==='3'){if(experience!=='corporate')throw Error('invalid_experience');return marinaState();}return edition==='1'?legacy.initialState(experience):stateFor([],experience);}
export function resumeState(history,experience='corporate',edition='2'){checkEdition(edition);if(edition==='3'){if(experience!=='corporate')throw Error('invalid_experience');return marinaState(history);}return edition==='1'?legacy.resumeState(history,experience):stateFor(history,experience);}
export function resolveStep(input){const edition=input?.experienceVersion||'2';checkEdition(edition);if(edition==='3'){if(input.experience!=='corporate')throw Error('invalid_experience');return marinaStep(input);}if(edition==='1')return legacy.resolveStep(input);if(!input||typeof input.choice!=='string')throw Error('invalid');const experience=input.experience||'corporate',list=scenario(experience),h=validateHistory(input.history,experience);if(h.length===list.length||input.phase!==list[h.length].id)throw Error('invalid_phase');return stateFor([...h,{phase:input.phase,choice:input.choice}],experience);}
// Fictional reference scores, never participant data. All records use identical phase weights.
export function benchmark(total,scope='all',experience='corporate',edition='2'){checkEdition(edition);if(edition==='3')throw Error('unscored_experience');if(edition==='1')return legacy.benchmark(total,scope,experience);const phases=scenario(experience);const refs=Array.from({length:36},(_,j)=>({group:['A','B','C'][Math.floor(j/12)],total:phases.reduce((s,p,k)=>s+Math.max(5,Math.min(95,Math.round((experience==='medical'?55:58)+16*Math.sin((j+1)*.72+k*.85)+(j%7-3)*3)))*p.weight,0)/phases.reduce((s,p)=>s+p.weight,0)})).filter(r=>scope==='all'||r.group===scope);if(!refs.length)throw Error('invalid_scope');const percentile=100*refs.reduce((s,r)=>s+(r.total<total?1:r.total===total?.5:0),0)/refs.length;return {fictional:true,experience,experienceVersion:'2',count:refs.length,percentile:Math.round(percentile),scores:refs.map(r=>Math.round(r.total))};}
