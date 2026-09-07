import { D } from './amounts.ts';
import type { Portfolio } from './types.ts';
import { reconcile } from './reconcile.ts';
export function account(portfolio: Portfolio | null) {
  if(!portfolio) return { assets: null, debts: null, net: null, unpriced: 0, uncertain: true, excluded: 0 };
  const positions = reconcile(portfolio.positions);
  let assets = new D(0), debts = new D(0), priced = 0, unpriced = 0, excluded = 0;
  let uncertain = positions.some(p=>!p.debtKnown || p.overlapUncertain || p.completeness !== 'complete');
  const represented = new Set(positions.map(p=>p.id));
  const parents = new Map(positions.filter(p=>p.representedBy).map(p=>[p.id,p.representedBy!]));
  for(const id of parents.keys()) { const seen=new Set<string>();let current:string|undefined=id;while(current && parents.has(current)){if(seen.has(current)){uncertain=true;break;}seen.add(current);current=parents.get(current);} }
  for (const token of portfolio.tokens) {
    if(token.representedBy) { excluded++; if(!represented.has(token.representedBy)) uncertain=true; continue; }
    if(token.usd.value === null) { unpriced++; continue; }
    assets=assets.plus(token.usd.value); priced++;
  }
  for(const p of positions) {
    if(p.representedBy || p.overlapUncertain) { excluded++; uncertain ||= p.overlapUncertain || !represented.has(p.representedBy!); continue; }
    for(const a of p.assets) {
      if(a.inclusion !== 'included') { if(a.inclusion==='unknown') uncertain=true; continue; }
      if(a.usd.value===null) unpriced++; else { assets=assets.plus(a.usd.value); priced++; }
    }
    for(const d of p.debts) { if(d.usd.value===null) {unpriced++; uncertain=true;} else {debts=debts.plus(d.usd.value); priced++;} }
  }
  // Rewards are separately disclosed, never added automatically.
  const empty = !portfolio.tokens.length && !positions.length;
  return { assets: priced || empty ? assets.toFixed() : null, debts: positions.some(p=>!p.debtKnown) ? null : debts.toFixed(), net: priced || empty ? assets.minus(debts).toFixed() : null, unpriced, uncertain: uncertain || unpriced>0, excluded };
}
