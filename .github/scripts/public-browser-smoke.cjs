const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
 const options = {headless:true,executablePath:'/usr/bin/google-chrome'};
 if(proxyUrl){const u=new URL(proxyUrl);options.proxy={server:`${u.protocol}//${u.hostname}:${u.port}`};if(u.username)options.proxy.username=decodeURIComponent(u.username);if(u.password)options.proxy.password=decodeURIComponent(u.password);}
 const browser=await chromium.launch(options);
 try {
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('https://tuuvo.app.br/experience',{waitUntil:'networkidle'});assert.equal(response.status(),200);
  await page.getByRole('button',{name:'Investigar o histórico',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('sceneTitle').textContent==='Uma pista importante');
  await page.getByRole('button',{name:'Verificar os registros',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('sceneTitle').textContent==='Contexto esclarecido');
  await page.getByRole('button',{name:'Revisitar outros caminhos',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('sceneTitle').textContent==='A reclamação');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'/tmp/alpha-browser/alpha-publicada.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: public browser branching, completion, restart and mobile width; no JavaScript errors');
 } finally {await browser.close();}
})().catch(e=>{console.error(e.message);process.exit(1)});
