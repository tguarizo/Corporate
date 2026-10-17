const crypto=require('node:crypto');
const fs=require('node:fs');
const algorithm='RSA-OAEP-256/AES-256-GCM';
function encryptFeedback(data,publicPem){
 const publicKey=crypto.createPublicKey(publicPem);
 if(publicKey.asymmetricKeyType!=='rsa'||publicKey.asymmetricKeyDetails.modulusLength<2048)throw Error('Recipient must supply an RSA public key of at least 2048 bits');
 const key=crypto.randomBytes(32),iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
 const ciphertext=Buffer.concat([cipher.update(data),cipher.final()]);
 return {algorithm,key:crypto.publicEncrypt({key:publicKey,oaepHash:'sha256',padding:crypto.constants.RSA_PKCS1_OAEP_PADDING},key).toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')};
}
function decryptFeedback(envelope,privatePem){
 if(envelope.algorithm!==algorithm)throw Error('Unsupported archive');
 const key=crypto.privateDecrypt({key:privatePem,oaepHash:'sha256',padding:crypto.constants.RSA_PKCS1_OAEP_PADDING},Buffer.from(envelope.key,'base64'));
 const decipher=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(envelope.iv,'base64'));decipher.setAuthTag(Buffer.from(envelope.tag,'base64'));
 return Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext,'base64')),decipher.final()]);
}
module.exports={encryptFeedback,decryptFeedback};
if(require.main===module){
 const [mode,keyFile,input,output]=process.argv.slice(2);
 if(!['encrypt','decrypt'].includes(mode)||!keyFile||!input||!output)throw Error('Usage: feedback-archive.cjs encrypt|decrypt key.pem input output');
 const key=fs.readFileSync(keyFile),data=fs.readFileSync(input);
 const result=mode==='encrypt'?Buffer.from(JSON.stringify(encryptFeedback(data,key))):decryptFeedback(JSON.parse(data),key);
 fs.writeFileSync(output,result,{mode:0o600});
}
