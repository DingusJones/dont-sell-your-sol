import type { Capability } from './types.ts';
export const gatedCapabilities: Capability[] = [
 ['native-stake','Native stake','Stake and withdraw authority discovery needs positive evidence.'],
 ['lst','LST recognition','Current mint and stake-pool registry not verified.'],
 ['jupiter-portfolio','Jupiter','Jupiter-specific fetcher reports and positive product fixtures required.'],
 ['kamino','Kamino','Indexed, refreshed positive portfolio fixtures required.'],
 ['save','Save','Positive obligations and deployment identity required.'],
 ['orca','Orca','Positive position NFT, bundle and custody fixtures required.'],
 ['jito','Jito','Stake-pool and redemption semantics unverified.'],
 ['marinade','Marinade','Authority, ticket and deployment mapping unverified.'],
 ['coinstats','CoinStats','Paid entitlement and positive Solana evidence not provided.'],
 ['meteora','Meteora','DLMM and DAMM require separate tested adapters.'],
 ['raydium','Raydium','Deployment and endpoint verification required.'],
 ['sanctum','Sanctum','Current authenticated registry unavailable.'],
 ['drift','Drift','Legacy/current deployment identity unverified.'],
 ['marginfi','Marginfi / Project 0','Deployment identity unverified.'],
].map(([id,provider,reason])=>({id:id!,provider:provider!,section:'defi',enabled:false,evidence:'unverified',reason:reason!}));
export function capabilities(rpcEnabled=false,pricesEnabled=false): Capability[] { return [
 {id:'token-prices',provider:'Jupiter Price V3',section:'core',enabled:pricesEnabled,evidence:'synthetic-only',reason:'Optional server-side spot estimates; no protocol metrics or verified production coverage.'},
 ...['sol','spl','token-2022'].map(id=>({id,provider:'Solana RPC',section:'core' as const,enabled:rpcEnabled,evidence:'synthetic-only' as const,reason:rpcEnabled?'Configured for verification; live accuracy not yet established.':'RPC disabled or not configured. Synthetic contract tests only.'})),...gatedCapabilities]; }
