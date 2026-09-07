import { account } from './accounting.ts';
import type { CompletenessStatus, Portfolio, ProviderStatus } from './types.ts';
export const MANIFEST_VERSION = '2026-09-06.1';
export function completeness(providers: ProviderStatus[], data: Portfolio | null, scope = 'Configured ownership checks'): CompletenessStatus {
  const a = account(data);
  const checked = providers.filter(p=>['success','empty'].includes(p.state)&&p.pagesComplete).map(p=>p.capability);
  const debtUnknown = data?.positions.some(p=>!p.debtKnown) ?? false;
  const complete = providers.length>0 && checked.length===providers.length && !a.uncertain;
  return {manifestVersion:MANIFEST_VERSION,scope,state:complete?'complete':checked.length||data?'partial':'unknown',expected:providers.map(p=>p.capability),checked,failed:providers.filter(p=>p.state==='unavailable').map(p=>p.capability),unsupported:providers.filter(p=>['unsupported','unknown'].includes(p.state)).map(p=>p.capability),pendingPages:providers.filter(p=>p.cursor!==null).length,unpricedAssets:a.unpriced,unresolvedPositions:data?.positions.filter(p=>p.completeness!=='complete').length??0,overlapUncertainty:data?.positions.some(p=>p.overlapUncertain)??false,debtUnknown,summary:complete?'All checks in this named scope completed. This is not all Solana.':'Partial coverage. Unchecked protocols, prices, or liabilities may be missing.'};
}
