import { JupiterPrices } from '../../../../packages/adapters/src/jupiter/prices.ts';
import type { PortfolioEnvelope, ProviderStatus, Section } from '../../../../packages/domain/src/types.ts';
import { walletId } from '../../../../packages/domain/src/wallet.ts';
import { freshness } from '../../../../packages/domain/src/freshness.ts';
import { completeness } from '../../../../packages/domain/src/completeness.ts';
import { envelopeSchema } from '../../../../packages/domain/src/schemas.ts';
import { gatedCapabilities } from '../../../../packages/adapters/src/capabilities.ts';
import { createSolanaAdapter } from '../../../../packages/adapters/src/solana/balances.ts';
import { SnapshotCache } from './cache.ts';
import { CircuitBreaker } from './circuit-breaker.ts';
export interface Env {SOLANA_RPC_URL?:string;SOLANA_RPC_FALLBACK_URL?:string;ENABLE_RPC?:string;ENABLE_LIVE_PRICES?:string;JUPITER_API_KEY?:string;ASSETS?:{fetch(request:Request):Promise<Response>}}
export class Orchestrator {
 private cache=new SnapshotCache<PortfolioEnvelope>();private pending=new Map<string,Promise<PortfolioEnvelope>>();private breaker=new CircuitBreaker();
 private prices:JupiterPrices;
 constructor(private env:Env,private fetcher:typeof fetch=fetch,private clock=Date.now){this.prices=new JupiterPrices(env.ENABLE_LIVE_PRICES==='true',env.JUPITER_API_KEY,fetcher,clock);}
 async read(address:string,generation:number,section?:Section):Promise<PortfolioEnvelope>{
  const result=await this.readBalances(address,generation,section);
  if(result.data && section!=='defi' && result.data.tokens.length){
   const priced=await this.prices.enrich(result.data.tokens);
   result.data={...result.data,tokens:priced.tokens};result.providers=[...result.providers,priced.status];
   result.completeness=completeness(result.providers,result.data,result.completeness.scope);
  }
  return envelopeSchema.parse(result);
 }
 private async readBalances(address:string,generation:number,section?:Section):Promise<PortfolioEnvelope>{
  const key=JSON.stringify(['1','adapter-1','solana:mainnet',address,section??'all']);const now=this.clock();
  const old=this.cache.get(key,now);
  if(old&&now-old.written<30000)return {...old.value,generation,requestId:crypto.randomUUID()};
  const existing=this.pending.get(key);if(existing)return {...await existing,generation,requestId:crypto.randomUUID()};
  // Shared work has its own deadline; one browser cancellation cannot cancel another reader.
  const job=this.fetch(address,section,now).then(result=>{
   if(result.data && result.providers.filter(p=>p.id==='solana-rpc').every(p=>p.state==='success'||p.state==='empty'))this.cache.set(key,result,now);
   if(old && (!result.data || result.providers.some(p=>p.state==='unavailable'))){
    return {...old.value,requestId:result.requestId,providers:result.providers,completeness:{...old.value.completeness,state:'partial' as const,failed:result.completeness.failed,summary:'Refresh failed. Showing the last successful snapshot with its original observation time.'},freshness:{...old.value.freshness,state:'stale' as const},warnings:[...old.value.warnings,{code:'STALE_FALLBACK',severity:'warning' as const,message:'Refresh failed. Last successful data retained.',entityId:null,blocksValuation:true,blocksAction:true}]};
   }return result;
  }).finally(()=>this.pending.delete(key));
  this.pending.set(key,job);return {...await job,generation};
 }
 private async fetch(address:string,section:Section|undefined,now:number):Promise<PortfolioEnvelope>{
  let data:PortfolioEnvelope['data']=null;let providers:ProviderStatus[]=[];
  if(section!=='defi'){
   const adapter=createSolanaAdapter(this.env.SOLANA_RPC_URL,this.env.ENABLE_RPC==='true'&&this.breaker.allowed(now),this.env.SOLANA_RPC_FALLBACK_URL,this.fetcher);
   const result=await adapter.read({address,now,signal:AbortSignal.timeout(20000)});data=result.data;providers=result.statuses;
   if(providers.some(p=>p.state==='unavailable'))this.breaker.failure(now);else this.breaker.success();
  }
  if(section!=='core')providers.push(...gatedCapabilities.map(c=>({id:c.id,capability:c.id,state:'unknown' as const,attemptedAt:null,completedAt:null,errorCode:'UNVERIFIED_CAPABILITY',message:c.reason,pagesComplete:false,cursor:null})));
  const envelope:PortfolioEnvelope={schemaVersion:'1',requestId:crypto.randomUUID(),walletId:walletId(address),snapshotId:crypto.randomUUID(),generation:0,mode:'live',data,providers,completeness:completeness(providers,data,section?`${section} checks`:'Configured ownership checks'),freshness:freshness(now,30000,data!==null),warnings:[],cursor:null};
  return envelopeSchema.parse(envelope);
 }
}
