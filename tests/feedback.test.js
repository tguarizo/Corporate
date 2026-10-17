import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createFeedbackStore} from '../src/feedback.js';
const payload=()=>({submissionId:randomUUID(),experience:'corporate',experienceVersion:'2',phase:'entrada',screen:'decision',audience:'customer-service',category:'terminology',term:'kits',suggestion:'Na minha equipe usamos conjuntos de materiais.'});
test('audience feedback is durable, contextual, private and idempotent across store restarts',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'coonto-feedback-'));
 try{
  const input=payload(),store=createFeedbackStore(directory);
  const replies=await Promise.all([store.submit({...input,email:'not-to-be-stored@example.test'}),store.submit(input)]);assert.equal(replies[0].receipt,replies[1].receipt);
  await createFeedbackStore(directory).submit(input);
  const text=await readFile(path.join(directory,'experience-feedback.jsonl'),'utf8'),rows=text.trim().split('\n').map(JSON.parse);
  assert.equal(rows.length,1);assert.equal(rows[0].phase,'entrada');assert.equal(rows[0].audience,'customer-service');assert.equal(rows[0].suggestion,input.suggestion);assert.ok(rows[0].receivedAt);assert.equal(rows[0].email,undefined);assert.equal((await stat(path.join(directory,'experience-feedback.jsonl'))).mode&0o777,0o600);
  await assert.rejects(store.submit({...payload(),experience:'missing'}),/invalid_feedback/);
  await assert.rejects(store.submit({...payload(),phase:'med-preparo'}),/invalid_feedback/);
  await assert.rejects(store.submit({...payload(),suggestion:' '.repeat(10)}),/invalid_feedback/);
  await assert.rejects(store.submit({...payload(),term:'x'.repeat(161)}),/invalid_feedback/);
  await assert.rejects(store.submit({...payload(),screen:'unknown'}),/invalid_feedback/);
  await assert.rejects(store.submit({...payload(),audience:'unknown'}),/invalid_feedback/);
  assert.equal((await readFile(path.join(directory,'experience-feedback.jsonl'),'utf8')).trim().split('\n').length,1);
 }finally{await rm(directory,{recursive:true,force:true})}
});
test('a damaged trailing entry does not swallow the next feedback receipt',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'coonto-feedback-'));
 try{await writeFile(path.join(directory,'experience-feedback.jsonl'),'{incomplete');const input=payload();await createFeedbackStore(directory).submit(input);const lines=(await readFile(path.join(directory,'experience-feedback.jsonl'),'utf8')).trim().split('\n');assert.equal(JSON.parse(lines[1]).submissionId,input.submissionId)}finally{await rm(directory,{recursive:true,force:true})}
});
test('feedback HTTP validates input, refuses cross-origin submissions and exposes no public read route',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'coonto-feedback-http-'));process.env.FEEDBACK_DIR=directory;const {server}=await import('../server.js');
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const post=(body,headers={})=>fetch(base+'/api/experience-feedback',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  let r=await post(payload());assert.equal(r.status,201);assert.equal((await r.json()).saved,true);
  r=await post({...payload(),experience:'medical',phase:'med-preparo',audience:'student'});assert.equal(r.status,201);
  assert.equal((await post(payload(),{Origin:'https://unrelated.example'})).status,403);
  assert.equal((await post({...payload(),suggestion:'x'.repeat(801)})).status,400);
  assert.equal((await post({})).status,400);
  assert.equal((await post({...payload(),padding:'x'.repeat(9000)})).status,413);
  assert.equal((await fetch(base+'/api/experience-feedback')).status,404);
  assert.equal((await fetch(base+'/data/feedback/experience-feedback.jsonl')).status,404);
  const rows=(await readFile(path.join(directory,'experience-feedback.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);assert.equal(rows.length,2);assert.equal(rows[1].experience,'medical');
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(directory,{recursive:true,force:true})}
});

test('narrative feedback accepts only scenes from its own edition and excludes participant history',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'coonto-story-feedback-'));
 try{const store=createFeedbackStore(directory),input={...payload(),experienceVersion:'3',phase:'portafechada',history:[{phase:'chegada',choice:'reservar'}]};await store.submit(input);const row=JSON.parse((await readFile(path.join(directory,'experience-feedback.jsonl'),'utf8')).trim());assert.equal(row.phase,'portafechada');assert.equal(row.history,undefined);await assert.rejects(store.submit({...input,phase:'entrada'}),/invalid_feedback/);await assert.rejects(store.submit({...input,experience:'medical'}),/invalid_feedback/);}finally{await rm(directory,{recursive:true,force:true})}
});

test('new story comments accept the new scenes and remain separate from earlier editions',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'coonto-v4-feedback-'));
 try{const store=createFeedbackStore(directory);await store.submit({...payload(),experienceVersion:'4',phase:'caixas-fora'});const row=JSON.parse((await readFile(path.join(directory,'experience-feedback.jsonl'),'utf8')).trim());assert.equal(row.experienceVersion,'4');assert.equal(row.phase,'caixas-fora');await assert.rejects(store.submit({...payload(),experienceVersion:'3',phase:'caixas-fora'}),/invalid_feedback/);await assert.rejects(store.submit({...payload(),experienceVersion:'4',experience:'medical',phase:'med-preparo'}),/invalid_feedback/);}finally{await rm(directory,{recursive:true,force:true})}
});

test('Ana narrative feedback is scoped to its own case and preserves earlier feedback validation',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'coonto-ana-feedback-'));try{const store=createFeedbackStore(directory);await store.submit({...payload(),experience:'medical',experienceVersion:'3',phase:'trajeto',audience:'student'});const row=JSON.parse((await readFile(path.join(directory,'experience-feedback.jsonl'),'utf8')).trim());assert.equal(row.experience,'medical');assert.equal(row.phase,'trajeto');await assert.rejects(store.submit({...payload(),experience:'corporate',experienceVersion:'3',phase:'trajeto'}),/invalid_feedback/);await assert.rejects(store.submit({...payload(),experience:'medical',experienceVersion:'2',phase:'trajeto'}),/invalid_feedback/);}finally{await rm(directory,{recursive:true,force:true})}
});
