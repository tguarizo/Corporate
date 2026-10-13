import http from 'node:http'; import {readFile} from 'node:fs/promises'; import {fileURLToPath} from 'node:url'; import path from 'node:path';
import {resolveStep,initialState} from './src/engine.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const send=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj));};
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{status:'ok',service:'coonto-corporate',version:'0.1.0-alpha.0'});
 if(req.method==='GET'&&url.pathname==='/api/demo/start')return send(res,200,initialState());
 if(req.method==='POST'&&url.pathname==='/api/demo/step'){
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8192)return send(res,413,{error:'too_large'});}
  let payload;try{payload=JSON.parse(raw)}catch{return send(res,400,{error:'invalid_json'})}
  try{return send(res,200,resolveStep(payload))}catch{return send(res,400,{error:'invalid_step'})}
 }
 if(req.method==='GET'&&(url.pathname==='/'||url.pathname==='/experience')){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(await readFile(path.join(root,'public','index.html')));return;}
 if(req.method==='GET'&&url.pathname==='/app.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});res.end(await readFile(path.join(root,'public','app.js')));return;}
 return send(res,404,{error:'not_found'});
 }catch{send(res,500,{error:'internal_error'})}});
if(import.meta.url===new URL('file://'+process.argv[1]).href)server.listen(Number(process.env.PORT||3000),'0.0.0.0');
export {server};
