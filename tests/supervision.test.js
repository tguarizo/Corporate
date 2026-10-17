import test from 'node:test';
import assert from 'node:assert/strict';
import {marinaStateV4,marinaStepV4,marinaNodesV4} from '../src/marina-v4.js';
import {marinaState} from '../src/marina.js';
import {supervisionFor} from '../src/supervision.js';
import {initialState,resolveStep,resumeState,benchmark} from '../src/engine.js';
function walk(ids){let state=initialState('corporate','4');for(const choice of ids)state=resolveStep({experience:'corporate',experienceVersion:'4',history:state.history,phase:state.scene.id,choice});return state}
test('new dependencies add difficulty and have different costs without changing previous stories',()=>{
 const old=marinaState([{phase:'chegada',choice:'marina'},{phase:'prioridades',choice:'regular'}]);assert.ok(old.finished);assert.match(old.scene.text,/não pagou frete extra/);
 const newState=walk(['marina','regular']);assert.equal(newState.finished,false);assert.equal(newState.scene.id,'instrutora');assert.match(newState.scene.text,/700/);
 const before=walk(['marina','conferir']);assert.equal(before.scene.id,'consulta-instrutora');assert.match(before.scene.text,/reserva.*encerrou/);
 const complete=walk(['marina','conferir','cobrir']);assert.ok(complete.finished);assert.match(complete.scene.facts.join(' '),/700/);assert.deepEqual(resumeState(complete.history,'corporate','4'),complete);assert.throws(()=>benchmark(0,'all','corporate','4'));assert.throws(()=>initialState('medical','4'));
});
test('absurd actions cause an escalation or damaged materials and remain recoverable where plausible',()=>{
 const escalation=walk(['encerrar']);assert.equal(escalation.scene.id,'reclamacao');assert.equal(escalation.finished,false);
 const recovery=walk(['encerrar','avulso']);assert.equal(recovery.scene.id,'avulso');assert.equal(recovery.finished,true);
 const unresolved=walk(['encerrar','insistir']);assert.equal(unresolved.scene.id,'sem-solucao');assert.match(unresolved.scene.text,/não saíram/);
 const damage=walk(['reservar','deixar']);assert.equal(damage.scene.id,'caixas-fora');assert.match(damage.scene.facts.join(' '),/32 kits/);
});
test('supervision reconstructs evidence from canonical actions, distinguishes partial results and avoids grading',()=>{
 const state=walk(['reservar','cadastro','esperar']),report=supervisionFor(state.history,'4');assert.equal(report.complete,true);assert.equal(report.timeline.length,3);assert.match(report.timeline[1].consequence,/lado de fora/);assert.equal(report.observations.some(o=>o.topic==='Confirmação de recebimento'),true);assert.match(report.outcome.facts.join(' '),/600/);assert.equal(report.score,undefined);assert.match(report.limits,/Não comprova/);
 assert.equal(supervisionFor(state.history.slice(0,1),'4').complete,false);assert.equal(supervisionFor([],'4').decisions,0);assert.throws(()=>supervisionFor([{phase:'reserva',choice:'recebedor'}],'4'));assert.throws(()=>supervisionFor([],'2'));
 const old=supervisionFor([{phase:'chegada',choice:'marina'},{phase:'prioridades',choice:'regular'}],'3');assert.equal(old.complete,true);assert.equal(old.observations.some(o=>o.topic==='Dependências de uma solução'),false);
});
test('all new paths terminate in eight reachable endings and reject forged or impossible histories',()=>{
 const seen=new Set(),endings=new Set();function visit(history){const s=marinaStateV4(history);seen.add(s.scene.id);if(s.finished){endings.add(s.scene.id);assert.throws(()=>marinaStepV4({history,phase:s.scene.id,choice:'regular'}));return}assert.ok(history.length<4);for(const c of s.scene.choices)visit(marinaStepV4({history,phase:s.scene.id,choice:c.id}).history)}visit([]);assert.deepEqual([...seen].sort(),Object.keys(marinaNodesV4).sort());assert.equal(endings.size,8);assert.throws(()=>walk(['deposito','deixar']));
 const forged=supervisionFor([{phase:'chegada',choice:'reservar',score:100,action:'fake',cost:0}],'4');assert.match(forged.timeline[0].action,/480/);assert.equal(forged.timeline[0].score,undefined);
});
