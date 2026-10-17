import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {createRequire} from 'node:module';
const {encryptFeedback,decryptFeedback}=createRequire(import.meta.url)('../.github/scripts/feedback-archive.cjs');
test('feedback export is readable only with the recipient key and rejects tampered contents',()=>{
 const keys=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
 const text=Buffer.from(JSON.stringify({feedback:[{term:'kits',suggestion:'conjuntos de materiais'}]}));
 const envelope=encryptFeedback(text,keys.publicKey);assert.deepEqual(decryptFeedback(envelope,keys.privateKey),text);assert.equal(JSON.stringify(envelope).includes('conjuntos de materiais'),false);
 const bytes=Buffer.from(envelope.ciphertext,'base64');bytes[0]^=1;assert.throws(()=>decryptFeedback({...envelope,ciphertext:bytes.toString('base64')},keys.privateKey));
 const other=generateKeyPairSync('rsa',{modulusLength:2048,privateKeyEncoding:{type:'pkcs8',format:'pem'}});assert.throws(()=>decryptFeedback(envelope,other.privateKey));
});
