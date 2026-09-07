import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve('dist/web');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://artifact.invalid/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.startsWith('/api/'))return route.fulfill({status:503,contentType:'application/json',body:'{"error":"OFFLINE_ARTIFACT"}'});
  const file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(root+'/'))return route.abort();
  await route.fulfill({body:await readFile(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
 });
 await page.goto('https://artifact.invalid/');
 await page.getByRole('button',{name:'Explore a demo'}).click();
 await page.getByText('DEMO · Synthetic data').waitFor();
 await mkdir('test-results',{recursive:true});
 for(const width of [320,390,768,1440,1920]){
  await page.setViewportSize({width,height:1000});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Overflow at ${width}`);
  await page.screenshot({path:`test-results/artifact-${width}.png`,fullPage:true});
 }
 for(const key of ['sol-only','spl','spam','lending','lp-vault','rewards','overlap','partial','unavailable','stale','exact-link-unavailable','empty','unknown','loading']){
  await page.getByLabel('Demo scenario').selectOption(key);
  if(['unavailable','loading'].includes(key) && await page.locator('.hero-value').textContent()==='$0.00')throw Error('False zero');
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Built artifact: 5 viewport checks and 14 scenario transitions passed.');
} finally {await browser.close();}
