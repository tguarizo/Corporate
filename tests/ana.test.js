import test from 'node:test';import assert from 'node:assert/strict';
import {anaState,anaStep,anaNodes} from '../src/ana.js';
import {initialState,resolveStep,resumeState,benchmark,scoreHistory} from '../src/engine.js';
import {supervisionFor} from '../src/supervision.js';
const walk=choices=>{let s=initialState('medical','3');for(const choice of choices)s=resolveStep({experience:'medical',experienceVersion:'3',history:s.history,phase:s.scene.id,choice});return s};
test('Ana decisions alter the conversation, route, recorded outcome and can repair a misunderstanding',()=>{
 const route=walk(['preparar','investigar','trajeto','equipe','confirmar']);assert.equal(route.scene.id,'compareceu');assert.equal(route.finished,true);assert.deepEqual(resumeState(route.history,'medical','3'),route);
 const wrong=walk(['preparar','investigar','trajeto','equipe','sistema']);assert.equal(wrong.scene.id,'unidade-errada');assert.match(wrong.scene.text,/cartão antigo/);
 const repaired=walk(['agilizar','reparar','investigar','trajeto','equipe','confirmar']);assert.equal(repaired.scene.id,'compareceu');assert.equal(repaired.history.length,6);assert.throws(()=>scoreHistory(route.history,'medical','3'));assert.throws(()=>benchmark(100,'all','medical','3'));
});
test('uninvestigated schedules, privacy exposure and patient preference have distinct consequences',()=>{
 assert.equal(walk(['preparar','marcar16','cartao']).scene.id,'atrasada');assert.equal(walk(['preparar','investigar','manter8']).scene.id,'falta');assert.equal(walk(['corredor','insistir']).scene.id,'interrupcao');assert.equal(walk(['agilizar','paula']).scene.id,'paula');assert.equal(walk(['preparar','cobrar','rotular']).scene.id,'registro');
 const repair=walk(['corredor','reservar','investigar','trajeto','equipe','confirmar']),report=supervisionFor(repair.history,'3','medical');assert.ok(report.observations.some(o=>o.topic==='Exposição no corredor'));assert.ok(report.observations.some(o=>o.topic==='Conferência do combinado'));assert.equal(report.simulation.experience,'medical');assert.equal(report.score,undefined);
});
test('all eight Ana endings are reachable; graph is bounded and histories cannot jump or carry fake evidence',()=>{
 const seen=new Set(),endings=new Set();let longest=0;function visit(history){const s=anaState(history);seen.add(s.scene.id);longest=Math.max(longest,history.length);if(s.finished){endings.add(s.scene.id);assert.throws(()=>anaStep({history,phase:s.scene.id,choice:'confirmar'}));return}assert.ok(history.length<7);for(const c of s.scene.choices)visit(anaStep({history,phase:s.scene.id,choice:c.id}).history)}visit([]);assert.equal(endings.size,8);assert.equal(longest,7);assert.deepEqual([...seen].sort(),Object.keys(anaNodes).sort());assert.throws(()=>anaState([{phase:'centro',choice:'confirmar'}]));assert.throws(()=>walk(['preparar','sistema']));assert.deepEqual(anaState([{phase:'entrada',choice:'preparar',score:100,diagnosis:'fake'}]).history,[{phase:'entrada',choice:'preparar'}]);
});
