import { z } from 'zod';
import { rawSchema } from '../../../domain/src/schemas.ts';
import { addressSchema, walletId } from '../../../domain/src/wallet.ts';
import { freshness } from '../../../domain/src/freshness.ts';
import { aggregateTokens } from '../../../domain/src/reconcile.ts';
import type { TokenBalance, ProviderStatus } from '../../../domain/src/types.ts';
import type { ProviderAdapter, AdapterResult } from '../types.ts';
import { rpc, UpstreamError } from './rpc.ts';
export const TOKEN_PROGRAM='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022='TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
const context=z.object({slot:rawSchema});
const balanceSchema=z.object({context,value:rawSchema});
const parsedAccount=z.object({pubkey:addressSchema,account:z.object({owner:addressSchema,data:z.object({parsed:z.object({type:z.literal('account'),info:z.object({mint:addressSchema,owner:addressSchema,state:z.enum(['initialized','frozen']),tokenAmount:z.object({amount:rawSchema,decimals:rawSchema.transform(Number).pipe(z.number().int().min(0).max(255))}),delegate:addressSchema.optional(),delegatedAmount:z.object({amount:rawSchema}).optional(),extensions:z.array(z.object({extension:z.string().max(100)}).passthrough()).optional()}).passthrough()})})})});
function tokenBase(address:string,mint:string,program:string,raw:string,decimals:number,slot:string,now:number):TokenBalance {
 const f={...freshness(now),slot,commitment:'confirmed' as const};
 return {id:`${walletId(address)}:${program}:${mint}`,walletId:walletId(address),chain:'solana:mainnet',mint,program,accounts:[],rawAmount:raw,decimals,name:mint==='native:SOL'?'Solana':'Unverified token',symbol:mint==='native:SOL'?'SOL':`${mint.slice(0,4)}…${mint.slice(-4)}`,verification:mint==='native:SOL'?'verified':'unverified',spam:false,usd:{value:null,sourceId:'no-price-provider',confidence:'unknown',freshness:f},freshness:f,representedBy:null,warnings:[]};
}
export function normalizeTokens(payload:unknown,address:string,program:string,now:number): {tokens:TokenBalance[]; partial:boolean} {
 const body=z.object({context,value:z.array(z.unknown()).max(10000)}).parse(payload);
 const tokens:TokenBalance[]=[];let partial=false;
 for(const raw of body.value){
  const decoded=parsedAccount.safeParse(raw);if(!decoded.success){partial=true;continue;}
  const a=decoded.data;const info=a.account.data.parsed.info;
  if(a.account.owner!==program||info.owner!==address){partial=true;continue;}
  const t=tokenBase(address,info.mint,program,info.tokenAmount.amount,info.tokenAmount.decimals,body.context.slot,now);
  t.accounts=[{address:a.pubkey,rawAmount:t.rawAmount,frozen:info.state==='frozen',delegate:info.delegate??null,delegatedAmount:info.delegatedAmount?.amount??null,extensions:info.extensions?.map(e=>e.extension)??[],extensionData:info.extensions?{extensions:info.extensions}:null}];
  if(program===TOKEN_2022){partial=true;t.warnings.push({code:'TOKEN_2022_INCOMPLETE',severity:'warning',message:'Public account amount only. Mint extensions, transfer fees, confidential balances and withdrawability are not fully decoded.',entityId:t.id,blocksValuation:true,blocksAction:true});}
  tokens.push(t);
 }
 return {tokens:aggregateTokens(tokens),partial};
}
export function createSolanaAdapter(url:string|undefined,enabled:boolean,fallback?:string,fetcher:typeof fetch=fetch):ProviderAdapter {
 return {id:'solana-rpc',version:'1',section:'core',async read({address,signal,now}):Promise<AdapterResult>{
  const state=(capability:string,s:ProviderStatus['state'],message:string,code:string|null=null):ProviderStatus=>({id:'solana-rpc',capability,state:s,attemptedAt:new Date(now).toISOString(),completedAt:new Date(now).toISOString(),errorCode:code,message,pagesComplete:s==='success'||s==='empty',cursor:null});
  if(!url||!enabled)return {data:null,statuses:['sol','spl','token-2022'].map(c=>state(c,'unavailable','RPC is not enabled with a server-side endpoint.','NOT_CONFIGURED'))};
  // Verify the network before treating any endpoint as Solana mainnet.
  const networks=new Map<string,Promise<unknown>>();
  const call=async(method:Parameters<typeof rpc>[1],params:unknown[])=>{
   let last:unknown;for(const endpoint of [url,fallback].filter((v):v is string=>!!v)){
    try { if(!networks.has(endpoint))networks.set(endpoint,rpc(endpoint,'getGenesisHash',[],signal,fetcher)); if(await networks.get(endpoint)!=='5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp')throw new UpstreamError('WRONG_NETWORK');return await rpc(endpoint,method,params,signal,fetcher); }catch(e){last=e;}
   }throw last;
  };
  const results=await Promise.allSettled([
   call('getBalance',[address,{commitment:'confirmed'}]),
   call('getTokenAccountsByOwner',[address,{programId:TOKEN_PROGRAM},{commitment:'confirmed',encoding:'jsonParsed'}]),
   call('getTokenAccountsByOwner',[address,{programId:TOKEN_2022},{commitment:'confirmed',encoding:'jsonParsed'}])
  ]);
  const tokens:TokenBalance[]=[];const statuses:ProviderStatus[]=[];
  for(const [i,result] of results.entries()){
   const cap=['sol','spl','token-2022'][i]!;
   try {
    if(result.status==='rejected')throw result.reason;
    if(i===0){const b=balanceSchema.parse(result.value);if(BigInt(b.value)>0n) tokens.push(tokenBase(address,'native:SOL','native',b.value,9,b.context.slot,now));statuses.push(state(cap,BigInt(b.value)===0n?'empty':'success','Native lamports read at confirmed commitment.'));}
    else {const data=normalizeTokens(result.value,address,i===1?TOKEN_PROGRAM:TOKEN_2022,now);tokens.push(...data.tokens);statuses.push(state(cap,data.partial?'partial':data.tokens.length?'success':'empty',data.partial?'Account or extension decoding incomplete.':'Public token accounts checked.'));}
   }catch(error){statuses.push(state(cap,'unavailable','The balance request failed validation or could not be completed.',error instanceof UpstreamError?error.code:'SCHEMA_INVALID'));}
  }
  return {data:statuses.some(s=>s.state!=='unavailable')?{tokens,positions:[]}:null,statuses};
 }};
}
