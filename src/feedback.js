import {mkdir,readFile,appendFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {VERSION} from './engine.js';
import {phases as oldCorporate} from './legacy-engine.js';
import {medicalPhases as oldMedical} from './medical-v1.js';
import {phases} from './corporate.js';
import {medicalPhases} from './medical.js';

const audiences=['not-specified','customer-service','health-professional','student','educator','other'];
const categories=['terminology','context','choices','layout'];
const screens=['situation','decision','consequence','results'];
function validate(input){
 if(!input||typeof input!=='object'||!['corporate','medical'].includes(input.experience)||!['1','2'].includes(input.experienceVersion))throw Error('invalid_feedback');
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(input.submissionId||''))throw Error('invalid_feedback');
 if(!audiences.includes(input.audience)||!categories.includes(input.category)||!screens.includes(input.screen))throw Error('invalid_feedback');
 const list=input.experienceVersion==='1'?(input.experience==='medical'?oldMedical:oldCorporate):(input.experience==='medical'?medicalPhases:phases);
 const allowed=list.map(p=>p.id);
 if(!allowed.includes(input.phase))throw Error('invalid_feedback');
 if(typeof input.term!=='string'||input.term.length>160||typeof input.suggestion!=='string'||input.suggestion.trim().length<3||input.suggestion.length>800)throw Error('invalid_feedback');
 return {submissionId:input.submissionId.toLowerCase(),experience:input.experience,experienceVersion:input.experienceVersion,phase:input.phase,screen:input.screen,audience:input.audience,category:input.category,term:input.term.trim(),suggestion:input.suggestion.trim()};
}
export function createFeedbackStore(directory){
 const file=path.join(directory,'experience-feedback.jsonl');let queue=Promise.resolve();
 async function write(input){
  const entry=validate(input);
  await mkdir(directory,{recursive:true,mode:0o700});
  let previous='';try{const info=await stat(file);if(info.size>10*1024*1024)throw Error('feedback_capacity');previous=await readFile(file,'utf8')}catch(error){if(error.code!=='ENOENT')throw error}
  const duplicate=previous.split('\n').some(line=>{try{return JSON.parse(line).submissionId===entry.submissionId}catch{return false}});
  if(!duplicate)await appendFile(file,(previous&&!previous.endsWith('\n')?'\n':'')+JSON.stringify({...entry,receivedAt:new Date().toISOString(),version:VERSION})+'\n',{encoding:'utf8',mode:0o600,flush:true});
  return {saved:true,receipt:entry.submissionId};
 }
 return {submit(input){const next=queue.then(()=>write(input));queue=next.catch(()=>{});return next;}};
}
