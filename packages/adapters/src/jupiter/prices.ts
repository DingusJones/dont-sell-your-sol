import { z } from 'zod';
import { D, valueOf } from '../../../domain/src/amounts.ts';
import { decimalSchema, rawSchema } from '../../../domain/src/schemas.ts';
import { addressSchema } from '../../../domain/src/wallet.ts';
import type { TokenBalance, ProviderStatus } from '../../../domain/src/types.ts';
import { parseExactJson } from '../solana/safe-json.ts';
export const SOL_PRICE_MINT='So11111111111111111111111111111111111111112';
export const PRICE_TTL=30000;
const numeric=z.union([z.string().max(180),z.number().finite()]).transform(String).refine(v=>/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(v)).refine(v=>{const n=new D(v);return n.isFinite()&&n.abs().lte('1e100')&&(n.isZero()||n.abs().gte('1e-100'));}).transform(v=>new D(v).toFixed()).pipe(decimalSchema);
const entry=z.object({usdPrice:numeric.refine(v=>new D(v).gt(0)),decimals:numeric.transform(Number).pipe(z.number().int().min(0).max(255)),blockId:z.union([rawSchema,z.number().int().nonnegative().safe().transform(String)]),priceChange24h:numeric.optional()});
type Quote=z.infer<typeof entry>;
export function parsePrices(body:unknown,ids:string[]):Map<string,{quote?:Quote;error?:string}>{
 const root=z.record(z.string(),z.unknown()).safeParse(body);const result=new Map<string,{quote?:Quote;error?:string}>();
 for(const id of ids){const value=root.success?root.data[id]:undefined;const parsed=entry.safeParse(value);result.set(id,parsed.success?{quote:parsed.data}:{error:!root.success?'PRICE_MALFORMED':value==null?'PRICE_MISSING':'PRICE_MALFORMED'});}return result;
}
export class JupiterPrices {
 private cache=new Map<string,{quote:Quote;fetched:number}>();
 constructor(private enabled:boolean,private key:string|undefined,private fetcher:typeof fetch=fetch,private clock=Date.now){}
 async enrich(tokens:TokenBalance[]):Promise<{tokens:TokenBalance[];status:ProviderStatus}>{
  const now=this.clock();const mintOf=(t:TokenBalance)=>t.mint==='native:SOL'?SOL_PRICE_MINT:t.mint;
  const ids=[...new Set(tokens.map(mintOf))];const results=new Map<string,{quote?:Quote;fetched:number;error?:string}>();
  for(const [id,c] of this.cache)if(now-c.fetched>=PRICE_TTL)this.cache.delete(id);
  const missing:string[]=[];
  for(const id of ids){const c=this.cache.get(id);if(!this.enabled||!this.key)results.set(id,{fetched:now,error:'PRICE_NOT_CONFIGURED'});else if(!addressSchema.safeParse(id).success)results.set(id,{fetched:now,error:'PRICE_INVALID_MINT'});else if(c)results.set(id,c);else missing.push(id);}
  for(let i=0;i<missing.length;i+=50){const batch=missing.slice(i,i+50);let error='PRICE_UNAVAILABLE';
   try{const url=new URL('https://api.jup.ag/price/v3');url.searchParams.set('ids',batch.join(','));const response=await this.fetcher(url,{headers:{'x-api-key':this.key!},signal:AbortSignal.timeout(8000),redirect:'error'});
    if(!response.ok){error=response.status===429?'PRICE_RATE_LIMITED':'PRICE_UNAVAILABLE';throw new Error(error);}
    const reader=response.body?.getReader();if(!reader)throw new Error();let body='';let size=0;const decoder=new TextDecoder();
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>262144){await reader.cancel();throw new Error();}body+=decoder.decode(value,{stream:true});}body+=decoder.decode();
    error='PRICE_MALFORMED';const parsed=parsePrices(parseExactJson(body),batch);const fetched=this.clock();
    for(const [id,r] of parsed){results.set(id,{...r,fetched});if(r.quote){if(this.cache.size>=2000)this.cache.delete(this.cache.keys().next().value!);this.cache.set(id,{quote:r.quote,fetched});}}
   }catch{for(const id of batch)results.set(id,{error,fetched:this.clock()});}
  }
  const completed=this.clock();let failures=0;
  const enriched=tokens.map(t=>{
   const r=results.get(mintOf(t))!;const q=r.quote;const age=Math.max(0,completed-r.fetched);let error=r.error;
   // A conservative slot-lag policy against the confirmed ownership snapshot, not a wall-clock observation claim.
   if(q&&(age>=PRICE_TTL||(t.freshness.slot!==null&&BigInt(t.freshness.slot)-BigInt(q.blockId)>150n)))error='PRICE_STALE';
   if(q&&q.decimals!==t.decimals)error='PRICE_DECIMALS_MISMATCH';
   if(error)failures++;
   const freshness={observedAt:null,fetchedAt:new Date(r.fetched).toISOString(),staleAt:new Date(r.fetched+PRICE_TTL).toISOString(),slot:q?.blockId??null,commitment:null,state:error==='PRICE_STALE'?'stale' as const:error?'unknown' as const:'fresh' as const};
   const price={value:error?null:q?.usdPrice??null,sourceId:'jupiter-price-v3',confidence:error?'unknown' as const:'estimated' as const,freshness,mint:mintOf(t),decimals:q?.decimals??null,priceChange24h:q?.priceChange24h??null,cacheAgeMs:age};
   return {...t,price,usd:{value:valueOf(t.rawAmount,t.decimals,price.value),sourceId:price.sourceId,confidence:price.confidence,freshness},warnings:[...t.warnings,{code:error??'PRICE_ESTIMATE',severity:'warning' as const,message:error?`${error}: USD valuation unavailable; ownership is unchanged.`:'Estimated spot value only. Price observation time is unavailable; freshness uses fetch age and slot lag. Not APY, health, PnL or withdrawal proceeds.',entityId:t.id,blocksValuation:!!error,blocksAction:true}]};
  });
  return {tokens:enriched,status:{id:'jupiter-price-v3',capability:'token-prices',state:!ids.length?'empty':enriched.every(t=>t.price.value===null)?'unavailable':failures?'partial':'success',attemptedAt:new Date(now).toISOString(),completedAt:new Date(completed).toISOString(),errorCode:failures?'PRICES_INCOMPLETE':null,message:!ids.length?'No normalized tokens to price.':failures?'Some token prices are unavailable; see token warnings.':'Estimated token spot prices; protocol metrics remain unavailable.',pagesComplete:failures===0,cursor:null}};
 }
}
