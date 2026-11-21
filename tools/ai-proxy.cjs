#!/usr/bin/env node
/* Imobify Studio 7.1 — servidor local opcional para Gemini. Sem dependências. */
'use strict';
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const port=Number(process.env.IMOBIFY_PORT || 8765);
const host='127.0.0.1';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/markdown; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.zip':'application/zip','.woff2':'font/woff2','.woff':'font/woff','.txt':'text/plain; charset=utf-8'};
const base=`http://${host}:${port}`;
const validOrigins=new Set([base,`http://localhost:${port}`]);
const reply=(res,status,body,headers={})=>{res.writeHead(status,{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...headers});res.end(body);};
async function gemini(req,res){
  if(!validOrigins.has(req.headers.origin || ''))return reply(res,403,JSON.stringify({error:'Origem não autorizada'}),{'Content-Type':'application/json'});
  const key=process.env.GEMINI_API_KEY;
  if(!key)return reply(res,503,JSON.stringify({error:'Configure GEMINI_API_KEY no terminal que inicia o servidor.'}),{'Content-Type':'application/json'});
  try{
    let chunks='',size=0;
    for await(const chunk of req){size+=chunk.length;if(size>160000){reply(res,413,JSON.stringify({error:'Requisição grande demais.'}),{'Content-Type':'application/json'});return;}chunks+=chunk.toString('utf8');}
    const {prompt}=JSON.parse(chunks);
    if(typeof prompt!=='string'||prompt.length<10||prompt.length>140000)throw new Error('Prompt inválido ou grande demais.');
    const model=String(process.env.GEMINI_MODEL || 'gemini-2.5-flash');
    if(!/^gemini-[a-zA-Z0-9.-]+$/.test(model))throw new Error('Modelo inválido.');
    const controller=new AbortController();const deadline=setTimeout(()=>controller.abort(),115000);
    let response;
    try{response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.15,responseMimeType:'application/json'}})});}finally{clearTimeout(deadline);}
    const json=await response.json();
    if(!response.ok)return reply(res,response.status,JSON.stringify({error:json?.error?.message || `Gemini HTTP ${response.status}`}),{'Content-Type':'application/json'});
    const text=(json.candidates || []).flatMap(x=>x.content?.parts || []).map(x=>x.text||'').join('\n');
    return reply(res,200,JSON.stringify({text}),{'Content-Type':'application/json'});
  }catch(err){return reply(res,400,JSON.stringify({error:String(err.message || err)}),{'Content-Type':'application/json'});}
}
const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url || '/',base).pathname;
  if(pathname==='/api/ai/gemini')return req.method==='POST'?gemini(req,res):reply(res,405,'Método inválido');
  if(!['GET','HEAD'].includes(req.method))return reply(res,405,'Método inválido');
  try{
    const clean=decodeURIComponent(pathname);
    if(clean.includes('\\')||clean.includes('\0')||clean.split('/').includes('..'))return reply(res,400,'Caminho inválido');
    const full=path.resolve(root,`.${clean==='/'?'/index.html':clean}`);
    if(!full.startsWith(root+path.sep))return reply(res,403,'Acesso negado');
    const stat=await fs.stat(full);
    if(!stat.isFile())return reply(res,404,'Arquivo não encontrado');
    // Arquivos ocultos e segredos não devem ser publicados pelo servidor local.
    if(clean.split('/').some(s=>s.startsWith('.') && s!=='.well-known') || /(?:\.env|auth\.json|\.pem|\.key)$/i.test(clean))return reply(res,403,'Acesso negado');
    const body=req.method==='HEAD'?'':await fs.readFile(full);
    return reply(res,200,body,{'Content-Type':mime[path.extname(full)]||'application/octet-stream','Cache-Control':'no-cache'});
  }catch{return reply(res,404,'Arquivo não encontrado');}
});
server.listen(port,host,()=>{console.log(`Imobify Studio 7.1: ${base}`);console.log('Gemini: '+(process.env.GEMINI_API_KEY?'configurado':'não configurado (modo ChatGPT/Claude/Ollama disponível)'));});
