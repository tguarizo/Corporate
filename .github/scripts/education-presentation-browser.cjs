const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
(async()=>{
 const base=process.env.PRESENTATION_BASE_URL||'https://coonto.com';
 const out='/tmp/coonto-presentation-browser';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(!process.env.PRESENTATION_SKIP_HOME){
   assert.equal((await page.goto(base+'/',{waitUntil:'domcontentloaded'})).status(),200);
   await page.locator('#coonto-educadores-access a').click();
   await page.waitForURL(base+'/para-educadores.html');
  }else await page.goto(base+'/para-educadores.html');
  await page.getByRole('heading',{level:1,name:/Leve o Coonto/}).waitFor();
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  assert.equal(await page.title(),'Para educadores e instituições | Coonto');
  assert.equal(await page.getByRole('link',{name:'Experimentar o Coonto',exact:true}).first().getAttribute('href'),'https://dev.coonto.com');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:path.join(out,'educadores-desktop.png'),fullPage:true});
  const pending=page.waitForEvent('download');
  await page.getByRole('link',{name:'Baixar apresentação do Coonto — PDF, 4 páginas',exact:true}).click();
  const download=await pending;assert.equal(download.suggestedFilename(),'Coonto-Educacao-Parcerias.pdf');
  const actual=fs.readFileSync(await download.path());
  const expected=fs.readFileSync('docs/coonto-educadores/site/materiais/coonto-educacao-parcerias.pdf');
  const hash=b=>crypto.createHash('sha256').update(b).digest('hex');assert.equal(hash(actual),hash(expected));
  assert.equal(actual.subarray(0,5).toString(),'%PDF-');
  const response=await page.request.get(base+'/materiais/coonto-educacao-parcerias.pdf');assert.equal(response.status(),200);assert.match(response.headers()['content-type'],/^application\/pdf/);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:path.join(out,'educadores-mobile.png'),fullPage:true});
  await page.getByRole('link',{name:/Parcerias.*97379/}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('::notice title=Coonto presentation browser::PASS: homepage entry, educator landing page, desktop/mobile layout, correct PDF download name and exact file contents, experience link and partnership contacts');
 }finally{await browser.close()}
})().catch(e=>{console.error('::error title=Coonto presentation browser::'+e.message.replace(/\n/g,'%0A'));process.exit(1)});
