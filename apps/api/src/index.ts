import { requestSchema, sectionRequestSchema, detailRequestSchema } from '../../../packages/domain/src/schemas.ts';
import { MANIFEST_VERSION } from '../../../packages/domain/src/completeness.ts';
import { capabilities } from '../../../packages/adapters/src/capabilities.ts';
import { Orchestrator, type Env } from './services/orchestrator.ts';
import { RateLimiter } from './services/rate-limit.ts';
import { secure } from './security/headers.ts';
export function createApi(env:Env={},fetcher:typeof fetch=fetch,clock=Date.now){
 const orchestrator=new Orchestrator(env,fetcher,clock);const ipLimiter=new RateLimiter(60);const walletLimiter=new RateLimiter(12);let active=0;
 const json=(value:unknown,status=200,extra:Record<string,string>={})=>secure(new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json',...extra}}));
 return async(request:Request):Promise<Response>=>{
  const url=new URL(request.url);const path=url.pathname;
  try {
   if(!path.startsWith('/api/'))return env.ASSETS?secure(await env.ASSETS.fetch(request)):json({error:'NOT_FOUND'},404);
   if(request.method==='GET'){
    if(path==='/api/health')return json({status:'ok',schemaVersion:'1',upstreamCoverage:'unverified'});
    if(path==='/api/v1/coverage')return json({version:MANIFEST_VERSION,scope:'Configured checks, never all Solana',capabilities:capabilities(env.ENABLE_RPC==='true'&&!!env.SOLANA_RPC_URL,env.ENABLE_LIVE_PRICES==='true'&&!!env.JUPITER_API_KEY)});
    if(path==='/api/v1/providers/status')return json({providers:capabilities(env.ENABLE_RPC==='true'&&!!env.SOLANA_RPC_URL,env.ENABLE_LIVE_PRICES==='true'&&!!env.JUPITER_API_KEY).map(c=>({id:c.id,enabled:c.enabled,evidence:c.evidence}))});
    if(path.startsWith('/api/v1/assets/'))return json({error:'ASSET_UNREGISTERED',message:'No remote images registered.'},404);
    return json({error:'NOT_FOUND'},404);
   }
   if(!['/api/v1/portfolio','/api/v1/portfolio/section','/api/v1/positions/detail'].includes(path))return json({error:'NOT_FOUND'},404);
   if(request.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405,{Allow:'POST'});
   const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'ORIGIN_NOT_ALLOWED'},403);
   if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON_REQUIRED'},415);
   if(!ipLimiter.allow(request.headers.get('cf-connecting-ip')??'local',clock()))return json({error:'RATE_LIMITED'},429,{'Retry-After':'60'});
   // Streaming bound also applies when Content-Length is absent or dishonest.
   if(Number(request.headers.get('content-length'))>2048)return json({error:'BODY_TOO_LARGE'},413);
   const reader=request.body?.getReader();let body='';let bytes=0;const decoder=new TextDecoder();
   if(reader){while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>2048){await reader.cancel();return json({error:'BODY_TOO_LARGE'},413);}body+=decoder.decode(value,{stream:true});}body+=decoder.decode();}
   let input:unknown;try{input=JSON.parse(body);}catch{return json({error:'INVALID_JSON'},400);}
   const parsed=(path.endsWith('/section')?sectionRequestSchema:path.endsWith('/detail')?detailRequestSchema:requestSchema).safeParse(input);
   if(!parsed.success)return json({error:'INVALID_REQUEST',message:'Provide a canonical Solana public address and allowed request fields.'},400);
   const {address,generation}=parsed.data;
   if(!walletLimiter.allow(address,clock())||active>=8)return json({error:'RATE_LIMITED'},429,{'Retry-After':'60'});
   active++;
   try {
    const section=path.endsWith('/section')?sectionRequestSchema.parse(input).section:undefined;
    const result=await orchestrator.read(address,generation,section);
    if(path.endsWith('/detail')){const positionId=detailRequestSchema.parse(input).positionId;const position=result.data?.positions.find(p=>p.id===positionId && p.walletId===result.walletId);return position?json({...result,data:{tokens:[],positions:[position]}}):json({error:'POSITION_UNVERIFIED',message:'Wallet ownership and position detail are not verified.'},404);}
    return json(result,result.data===null&&result.providers.some(p=>p.state==='unavailable')?503:200);
   }finally{active--;}
  }catch{return json({error:'APPLICATION_UNAVAILABLE',message:'The request could not be completed.'},503);}
 };
}
let boundEnv:Env|undefined;let handler:ReturnType<typeof createApi>|undefined;
export default {fetch(request:Request,env:Env){if(!handler||env!==boundEnv){boundEnv=env;handler=createApi(env);}return handler(request);}};
