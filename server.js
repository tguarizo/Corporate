import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {resolveStep,initialState,resumeState,VERSION,benchmark,experiences} from './src/engine.js';
import {createFeedbackStore} from './src/feedback.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const feedbackStore=createFeedbackStore(process.env.FEEDBACK_DIR||path.join(root,'data','feedback'));
const security={'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'};
const send=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...security});res.end(JSON.stringify(obj));};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.mp4':'video/mp4','.vtt':'text/vtt; charset=utf-8','.pdf':'application/pdf'};
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{status:'ok',service:'coonto-corporate',version:VERSION});
 if(req.method==='GET'&&url.pathname==='/api/experiences')return send(res,200,{experiences});
 if(req.method==='POST'&&url.pathname==='/api/experience-feedback'){
  if(!req.headers['content-type']?.startsWith('application/json'))return send(res,415,{error:'json_required'});
  if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return send(res,403,{error:'invalid_origin'})}catch{return send(res,403,{error:'invalid_origin'})}}
  req.setEncoding('utf8');let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>8192)return send(res,413,{error:'too_large'});}
  let body;try{body=JSON.parse(raw)}catch{return send(res,400,{error:'invalid_json'})}
  try{return send(res,201,await feedbackStore.submit(body))}catch(error){return send(res,error.message==='invalid_feedback'?400:503,{error:error.message==='invalid_feedback'?'invalid_feedback':'feedback_unavailable'})}
 }
 if(req.method==='GET'&&url.pathname==='/api/demo/start'){try{return send(res,200,initialState(url.searchParams.get('experience')||'corporate',url.searchParams.get('experienceVersion')||'1'))}catch{return send(res,400,{error:'invalid_experience'})}}
 if(req.method==='GET'&&url.pathname==='/api/demo/benchmark'){const score=Number(url.searchParams.get('score'));if(!Number.isFinite(score)||score<0||score>100)return send(res,400,{error:'invalid_score'});try{return send(res,200,benchmark(score,url.searchParams.get('scope')||'all',url.searchParams.get('experience')||'corporate',url.searchParams.get('experienceVersion')||'1'))}catch{return send(res,400,{error:'invalid_scope'})}}
 if(req.method==='POST'&&['/api/demo/step','/api/demo/resume'].includes(url.pathname)){
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>8192)return send(res,413,{error:'too_large'});}
  let payload;try{payload=JSON.parse(raw)}catch{return send(res,400,{error:'invalid_json'})}
  try{return send(res,200,url.pathname.endsWith('resume')?resumeState(payload.history,payload.experience||'corporate',payload.experienceVersion||'1'):resolveStep({...payload,experienceVersion:payload.experienceVersion||'1'}))}catch{return send(res,400,{error:'invalid_step'})}
 }
 let file;
 if(['/','/experience','/coonto'].includes(url.pathname))file='index.html';
 else if(url.pathname==='/marina')file='marina.html';
 else if(['/app.js','/materials.js','/styles.css','/marina.js','/marina.css'].includes(url.pathname))file=url.pathname.slice(1);
 else if(url.pathname==='/materiais/coonto-educacao-parcerias.pdf')file='materiais/coonto-educacao-parcerias.pdf';
 else if(/^\/assets\/[a-z0-9-]+\.(svg|png|mp4|vtt)$/.test(url.pathname))file=url.pathname.slice(1);
 if(file&&['GET','HEAD'].includes(req.method)){
  const full=path.join(root,'public',file);let info;try{info=await stat(full)}catch{return send(res,404,{error:'not_found'})}
  const headers={...security,'Content-Type':mime[path.extname(file)],'Accept-Ranges':'bytes','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; media-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"};
  if(file==='materiais/coonto-educacao-parcerias.pdf')headers['Content-Disposition']='attachment; filename="Coonto-Educacao-Parcerias.pdf"';
  let start=0,end=info.size-1,status=200;
  if(req.headers.range){const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!m||(!m[1]&&!m[2]))return send(res,416,{error:'invalid_range'});if(!m[1]){start=Math.max(0,info.size-Number(m[2]));}else{start=Number(m[1]);if(m[2])end=Math.min(Number(m[2]),end);}if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end()}status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;}
  headers['Content-Length']=end-start+1;res.writeHead(status,headers);if(req.method==='HEAD')return res.end();const stream=createReadStream(full,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);return;
 }
 return send(res,404,{error:'not_found'});
 }catch{if(!res.headersSent)send(res,500,{error:'internal_error'});else res.destroy()}});
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)server.listen(Number(process.env.PORT||3000),'0.0.0.0');
export {server};
