import {envelopeSchema} from '../../../../../packages/domain/src/schemas.ts';
import {walletId} from '../../../../../packages/domain/src/wallet.ts';
import type {PortfolioEnvelope,Section} from '../../../../../packages/domain/src/types.ts';
export const queryKey=(address:string,section:Section,generation:number)=>['portfolio','1','solana:mainnet',address,section,generation] as const;
export async function readSection(address:string,section:Section,generation:number,signal:AbortSignal):Promise<PortfolioEnvelope>{
 const response=await fetch('/api/v1/portfolio/section',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address,section,generation}),signal});
 const body:unknown=await response.json();const parsed=envelopeSchema.safeParse(body);
 if(!parsed.success)throw new Error(response.status===429?'Too many requests. Retry in one minute.':'Portfolio service unavailable. No balance has been inferred.');
 if(parsed.data.data?.tokens.some(t=>t.walletId!==walletId(address)) || parsed.data.data?.positions.some(p=>p.walletId!==walletId(address)) || parsed.data.walletId!==walletId(address)||parsed.data.generation!==generation||parsed.data.mode!=='live')throw new Error('Response identity mismatch. Data was not displayed.');
 return parsed.data;
}
