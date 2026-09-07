import {describe,it,expect} from 'vitest';
import {JupiterPrices,parsePrices,SOL_PRICE_MINT,PRICE_TTL} from '../../packages/adapters/src/jupiter/prices.ts';
import {createSolanaAdapter} from '../../packages/adapters/src/solana/balances.ts';
import {mockRpc} from '../fixtures/rpc.ts';
import {DEMO_ADDRESS} from '../fixtures/scenarios.ts';
import {Orchestrator} from '../../apps/api/src/services/orchestrator.ts';
const quote={usdPrice:2,decimals:9,blockId:'9007199254740993',priceChange24h:-1.5};
async function tokens(){return (await createSolanaAdapter('https://rpc.example',true,undefined,mockRpc()).read({address:DEMO_ADDRESS,now:100000,signal:AbortSignal.timeout(1000)})).data!.tokens;}
describe('Jupiter prices',()=>{
 it('validates per-mint values and preserves optional metadata',()=>{
  expect(parsePrices({[SOL_PRICE_MINT]:quote},[SOL_PRICE_MINT]).get(SOL_PRICE_MINT)?.quote).toEqual({...quote,usdPrice:'2',priceChange24h:'-1.5'});
  for(const body of [[],null,{[SOL_PRICE_MINT]:{...quote,usdPrice:-1}},{[SOL_PRICE_MINT]:{...quote,decimals:256}},{[SOL_PRICE_MINT]:{...quote,usdPrice:'NaN'}}])expect(parsePrices(body,[SOL_PRICE_MINT]).get(SOL_PRICE_MINT)?.error).toBe('PRICE_MALFORMED');
  expect(parsePrices({},[SOL_PRICE_MINT]).get(SOL_PRICE_MINT)?.error).toBe('PRICE_MISSING');
 });
 it('deduplicates native/wrapped SOL, uses server auth and exact amount multiplication without changing ownership',async()=>{
  let calls=0;const source=await tokens();const original=structuredClone(source);
  const p=new JupiterPrices(true,'test-only',async(url,init)=>{calls++;expect(new URL(String(url)).searchParams.get('ids')).toBe(SOL_PRICE_MINT);expect(init?.headers).toEqual({'x-api-key':'test-only'});return Response.json({[SOL_PRICE_MINT]:quote});},()=>100000);
  const r=await p.enrich(source);expect(calls).toBe(1);expect(source).toEqual(original);
  for(const t of r.tokens){expect(t.usd.value).toBe('18014398509.481986246');expect(t.price?.freshness.observedAt).toBeNull();expect(t.price?.priceChange24h).toBe('-1.5');const {price,usd,warnings,...ownership}=t;const {usd:_,warnings:__,...before}=source.find(s=>s.id===t.id)!;expect(ownership).toEqual(before);}
 });
 it('expires cache and never serves old values after rate limiting',async()=>{
  let now=100000,calls=0;const p=new JupiterPrices(true,'test-only',async()=>++calls===1?Response.json({[SOL_PRICE_MINT]:quote}):new Response('',{status:429}),()=>now);
  const ts=await tokens();await p.enrich(ts);now+=10000;const cached=await p.enrich(ts);expect(calls).toBe(1);expect(cached.tokens[0]?.price?.cacheAgeMs).toBe(10000);now+=PRICE_TTL;
  const failed=await p.enrich(ts);expect(failed.status.state).toBe('unavailable');expect(failed.tokens.every(t=>t.usd.value===null)).toBe(true);expect(failed.tokens[0]?.warnings.at(-1)?.code).toBe('PRICE_RATE_LIMITED');
 });
 it('rejects missing, malformed, stale and failed prices explicitly',async()=>{
  for(const [body,code] of [[{},'PRICE_MISSING'],{[SOL_PRICE_MINT]:{...quote,usdPrice:null}}, { [SOL_PRICE_MINT]:{...quote,blockId:'1'}}].map((x,i)=>i===0?x:[x,i===1?'PRICE_MALFORMED':'PRICE_STALE']) as [unknown,string][]){
   const r=await new JupiterPrices(true,'test-only',async()=>Response.json(body),()=>100000).enrich(await tokens());expect(r.tokens[0]?.usd.value).toBeNull();expect(r.tokens[0]?.warnings.at(-1)?.code).toBe(code);
  }
  const r=await new JupiterPrices(true,'test-only',async()=>{throw new Error('secret');},()=>100000).enrich(await tokens());expect(r.status.state).toBe('unavailable');expect(JSON.stringify(r)).not.toContain('secret');
 });
 it('batches 51 distinct mint keys and preserves Token-2022 restrictions',async()=>{
  const base=(await tokens())[1]!;const ts=[...'23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'].slice(0,51).map((c,i)=>({...base,id:String(i),mint:'1'.repeat(31)+c,program:'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'}));
  const sizes:number[]=[];const p=new JupiterPrices(true,'test-only',async url=>{const ids=new URL(String(url)).searchParams.get('ids')!.split(',');sizes.push(ids.length);return Response.json(Object.fromEntries(ids.map(id=>[id,quote])));},()=>100000);
  const result=await p.enrich(ts);expect(sizes).toEqual([50,1]);expect(result.tokens.map(t=>t.mint)).toEqual(ts.map(t=>t.mint));expect(result.tokens.every(t=>t.program===base.program)).toBe(false);
 });
 it('enriches the real orchestration path after normalization',async()=>{
  const fetcher:typeof fetch=(url,init)=>String(url).startsWith('https://api.jup.ag/')?Promise.resolve(Response.json({[SOL_PRICE_MINT]:quote})):mockRpc()(url,init);
  const r=await new Orchestrator({ENABLE_RPC:'true',SOLANA_RPC_URL:'https://rpc.example',ENABLE_LIVE_PRICES:'true',JUPITER_API_KEY:'test-only'},fetcher,()=>100000).read(DEMO_ADDRESS,0,'core');
  expect(r.mode).toBe('live');expect(r.data?.tokens[0]?.usd.value).not.toBeNull();expect(r.data?.positions).toEqual([]);expect(r.providers.some(p=>p.id==='jupiter-price-v3')).toBe(true);
 });
});
