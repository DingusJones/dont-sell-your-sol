import type { DeFiPosition, Portfolio, TokenBalance } from './types.ts';
const rank = { native: 0, aggregator: 1, unknown: 2 };
export function reconcile(positions: DeFiPosition[]): DeFiPosition[] {
  const groups = new Map<string, DeFiPosition[]>();
  for (const p of positions) {
    const key = JSON.stringify([p.walletId,p.protocol,p.version,[...p.programIds].sort(),p.account,p.subaccount]);
    groups.set(key, [...(groups.get(key) ?? []),p]);
  }
  return [...groups.values()].map(g => {
    const sorted = [...g].sort((a,b) => rank[a.authority]-rank[b.authority] || (b.freshness.observedAt ?? '').localeCompare(a.freshness.observedAt ?? '') || a.sourceId.localeCompare(b.sourceId));
    const winner = sorted[0]!;
    const conflicting = sorted.some(p => rank[p.authority] === rank[winner.authority] && JSON.stringify([p.assets,p.debts]) !== JSON.stringify([winner.assets,winner.debts]));
    return {...winner, overlapUncertain: winner.overlapUncertain || conflicting, warnings: [...new Map(g.flatMap(p=>p.warnings).map(w=>[w.code,w])).values()]};
  }).sort((a,b)=>a.id.localeCompare(b.id));
}
export function aggregateTokens(tokens: TokenBalance[]): TokenBalance[] {
  const accounts = new Map<string,string>();
  const groups = new Map<string,TokenBalance>();
  for (const token of tokens) {
    const key = JSON.stringify([token.chain,token.walletId,token.mint,token.program]);
    const existing = groups.get(key);
    if(existing && existing.decimals !== token.decimals) throw new Error('DECIMAL_CONFLICT');
    const unique = token.accounts.filter(a=>{
      const k = `${token.walletId}:${a.address}`;
      const signature = JSON.stringify([key,a]);
      if(accounts.has(k)) { if(accounts.get(k)!==signature) throw new Error('ACCOUNT_CONFLICT'); return false; }
      accounts.set(k,signature); return true;
    });
    if(token.accounts.length && !unique.length) continue;
    const raw = token.accounts.length ? unique.reduce((v,a)=>v+BigInt(a.rawAmount),0n) : BigInt(token.rawAmount);
    if(existing) {
      existing.rawAmount = (BigInt(existing.rawAmount)+raw).toString(); existing.accounts.push(...unique);
      // A token-level USD observation cannot be apportioned across overlapping accounts.
      // Reprice the merged holding in a separate mint-keyed valuation stage.
      existing.usd = {...existing.usd,value:null,confidence:'unknown'};
      existing.warnings = [...existing.warnings.filter(w=>w.code!=='AGGREGATED_VALUE_UNVERIFIED'),{code:'AGGREGATED_VALUE_UNVERIFIED',severity:'warning',message:'Combined account balance needs a fresh mint-keyed valuation.',entityId:existing.id,blocksValuation:true,blocksAction:false}];
    }
    else groups.set(key,{...token,rawAmount:raw.toString(),accounts:[...unique]});
  }
  return [...groups.values()].sort((a,b)=>a.id.localeCompare(b.id));
}
export function normalizedPortfolio(p: Portfolio): Portfolio { return {tokens:aggregateTokens(p.tokens),positions:reconcile(p.positions)}; }
