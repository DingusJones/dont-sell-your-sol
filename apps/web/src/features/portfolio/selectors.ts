import type { PortfolioEnvelope, ProviderStatus } from '../../../../../packages/domain/src/types.ts';
import { completeness } from '../../../../../packages/domain/src/completeness.ts';
import { reconcile } from '../../../../../packages/domain/src/reconcile.ts';
import { isStale } from '../../../../../packages/domain/src/freshness.ts';

export interface SectionResult { data?: PortfolioEnvelope; isError: boolean }
// Keep every section's coverage, including errors after a previous successful read.
export function combineSections(sections: SectionResult[], now = Date.now()): PortfolioEnvelope | null {
 const results = sections.flatMap(q=>q.data ? [q.data] : []);
 if (!results.length) return null;
 const first = results[0]!;
 const good = results.filter(r=>r.data);
 const data = good.length ? {tokens:good.flatMap(r=>r.data!.tokens),positions:reconcile(good.flatMap(r=>r.data!.positions))} : null;
 const providers: ProviderStatus[] = sections.flatMap((q,i)=>{
  if(q.data && !q.isError) return q.data.providers;
  if(q.data) return q.data.providers.map(p=>({...p,state:'unavailable' as const,errorCode:'REFRESH_FAILED',message:'Refresh failed. Last received observations retained.',pagesComplete:false}));
  return [{id:'api',capability:i===0?'core':'defi',state:q.isError?'unavailable' as const:'loading' as const,attemptedAt:null,completedAt:null,errorCode:q.isError?'API_UNAVAILABLE':null,message:q.isError?'Section could not be loaded.':'Checking section.',pagesComplete:false,cursor:null}];
 });
 // The summary must never borrow a newer timestamp from a different section.
 const observations = good.map(r=>r.freshness).filter(f=>f.observedAt!==null).sort((a,b)=>a.observedAt!.localeCompare(b.observedAt!));
 const oldest = observations[0] ?? first.freshness;
 const stale = sections.some(q=>q.isError&&q.data?.data) || good.some(r=>isStale(r.freshness,now));
 return {...first,data,providers,completeness:completeness(providers,data),freshness:{...oldest,state:stale?'stale':oldest.state},warnings:results.flatMap(r=>r.warnings)};
}
