import {test,expect} from '@playwright/test';
import {scenario} from '../fixtures/scenarios.ts';
const openDemo=async(page:import('@playwright/test').Page)=>{await page.goto('/');await page.getByRole('button',{name:'Explore a demo'}).click();await expect(page.getByText('DEMO · Synthetic data')).toBeVisible();};
test('entry validates wallet, demo details and filters work, no unsafe destinations',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'View portfolio'}).click();await expect(page.getByRole('alert')).toContainText('Solana');
 await page.getByRole('button',{name:'Explore a demo'}).click();await expect(page.getByText('DEMO · Synthetic data')).toBeVisible();
 await page.locator('.position-card>summary').first().click();await expect(page.getByText('Loan-to-value',{exact:true})).toBeVisible();await expect(page.getByText('Exact link unavailable').first()).toBeVisible();
 const value=await page.locator('.hero-value').textContent();await page.getByLabel('Hide spam').check();await expect(page.locator('.hero-value')).toHaveText(value!);
 await page.getByLabel('Unpriced only').check();await expect(page.locator('.token-row')).toHaveCount(1);
 await page.locator('.token-row>summary').click();await expect(page.getByText('9007199254740993123',{exact:false}).first()).toBeVisible();
 await expect(page.locator('a[target="_blank"]')).toHaveCount(0);
 await page.getByRole('button',{name:'Remove',exact:true}).click();await expect(page.getByLabel('Public Solana address',{exact:true})).toBeVisible();
});
test('empty, partial, stale, unavailable and unknown are distinct',async({page})=>{
 await openDemo(page);
 const states=[
  ['empty',page.locator('.holdings').getByText('No token balances in the successfully checked scope.',{exact:true})],
  ['partial',page.locator('.hero').getByText('Partial coverage',{exact:true})],
  ['stale',page.locator('.status-line').getByText('Stale snapshot · Original observation time retained',{exact:true})],
  ['unavailable',page.locator('.empty-state').getByRole('heading',{name:'We can’t establish holdings yet',exact:true})],
  ['unknown',page.locator('.position-card').getByText('Unknown deployment',{exact:true})],
  ['loading',page.locator('.status-line').getByText('Checking wallet and provider scopes…',{exact:true})],
 ] as const;
 for(const [key,state] of states){
  await page.getByLabel('Demo scenario').selectOption(key);await expect(state).toBeVisible();
  if(key==='unavailable'||key==='loading')await expect(page.locator('.hero-value')).not.toHaveText('$0.00');
 }
});
test('malicious metadata is text and keyboard disclosures are semantic',async({page})=>{
 await openDemo(page);await page.getByLabel('Demo scenario').selectOption('malicious');let dialog=false;page.on('dialog',()=>{dialog=true;});
 await expect(page.getByText('<img src=x onerror=alert(1)>',{exact:true})).toBeVisible();await expect(page.locator('.token-row img')).toHaveCount(0);expect(dialog).toBe(false);
 const summary=page.locator('.position-card>summary').first();await summary.focus();await page.keyboard.press('Enter');await expect(page.locator('.position-card').first()).toHaveAttribute('open','');await page.keyboard.press('Enter');await expect(page.locator('.position-card').first()).not.toHaveAttribute('open','');
});
test('unconfigured real API reports unavailable; remember consent and removal work',async({page})=>{
 await page.goto('/');await page.getByLabel('Public Solana address',{exact:true}).fill('11111111111111111111111111111111');await page.getByLabel('Remember this address').check();await page.getByRole('button',{name:'View portfolio'}).click();await expect(page.getByRole('heading',{name:'We can’t establish holdings yet'})).toBeVisible();await expect(page.getByText('DEMO · Synthetic data')).toHaveCount(0);expect(await page.evaluate(()=>localStorage.getItem('dsys:remembered-address:v1'))).not.toBeNull();await page.getByRole('button',{name:'Remove',exact:true}).click();expect(await page.evaluate(()=>localStorage.getItem('dsys:remembered-address:v1'))).toBeNull();
});
test('late response from previous wallet cannot replace selected wallet',async({page})=>{
 const first='11111111111111111111111111111111', second='So11111111111111111111111111111111111111112';
 await page.route('**/api/v1/portfolio/section',async route=>{const req=route.request().postDataJSON();if(req.address===first)await new Promise(r=>setTimeout(r,700));const e=scenario('sol-only');e.mode='live';e.generation=req.generation;e.walletId=`solana:mainnet:${req.address}`;if(req.section==='defi')e.data=null;else { e.data!.tokens[0]!.name=req.address===first?'OLD WALLET':'NEW WALLET';e.data!.tokens[0]!.walletId=e.walletId; }await route.fulfill({json:e});});
 await page.goto('/');await page.getByLabel('Public Solana address',{exact:true}).fill(first);await page.getByRole('button',{name:'View portfolio'}).click();await page.locator('.wallet-pill').click();await page.getByLabel('Public Solana address',{exact:true}).fill(second);await page.getByRole('button',{name:'View portfolio'}).click();await expect(page.getByText('NEW WALLET',{exact:true})).toBeVisible();await page.waitForTimeout(850);await expect(page.getByText('OLD WALLET',{exact:true})).toHaveCount(0);
});
for(const width of [320,360,390,768,1024,1440,1920])test(`responsive ledger at ${width}px has no page overflow`,async({page})=>{
 await page.setViewportSize({width,height:1000});await openDemo(page);await page.locator('.token-row>summary').nth(3).click();await page.locator('.position-card>summary').first().click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.screenshot({path:`test-results/ledger-${width}.png`,fullPage:true});
});
test('masking hides primary and expanded financial balances',async({page})=>{await openDemo(page);await page.getByRole('button',{name:'Hide balances',exact:true}).click();await page.locator('.token-row>summary').first().click();await expect(page.locator('.hero-value')).toHaveText('••••••');await expect(page.getByText('24381500200',{exact:true})).toHaveCount(0);});
