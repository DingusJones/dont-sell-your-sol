import {describe,it,expect} from 'vitest';
import {scenario,scenarioNames} from '../fixtures/scenarios.ts';
import {aggregateTokens} from '../../packages/domain/src/reconcile.ts';
import {completeness} from '../../packages/domain/src/completeness.ts';
import {envelopeSchema} from '../../packages/domain/src/schemas.ts';

describe('conservative reconciliation regressions',()=>{
 it('does not reuse one account valuation for an aggregated balance',()=>{
  const a=scenario('rich').data!.tokens[1]!;
  const b=structuredClone(a);b.accounts[0]!.address='11111111111111111111111111111111';
  const merged=aggregateTokens([a,b])[0]!;
  expect(merged.rawAmount).toBe((BigInt(a.rawAmount)*2n).toString());
  expect(merged.usd.value).toBeNull();
  expect(merged.warnings.some(w=>w.code==='AGGREGATED_VALUE_UNVERIFIED')).toBe(true);
 });
 it('does not report complete for unknown liabilities or conflicting overlap',()=>{
  const e=scenario('rich');e.data!.positions[0]!.debtKnown=false;
  expect(completeness(e.providers,e.data).state).toBe('partial');
  e.data!.positions[0]!.debtKnown=true;e.data!.positions[0]!.overlapUncertain=true;
  expect(completeness(e.providers,e.data).state).toBe('partial');
 });
 it('keeps missing price distinct from missing debt',()=>{
  const e=scenario('rich');expect(completeness(e.providers,e.data).debtUnknown).toBe(false);
 });
 it('validates the full selectable fixture catalogue',()=>{
  for(const name of scenarioNames)expect(()=>envelopeSchema.parse(scenario(name))).not.toThrow();
 });
});

import {combineSections} from '../../apps/web/src/features/portfolio/selectors.ts';
it('a failed refresh qualifies retained data and preserves oldest observation',()=>{
 const core=scenario('sol-only',100000), defi=scenario('lending',120000);
 const result=combineSections([{data:core,isError:false},{data:defi,isError:true}],125000)!;
 expect(result.freshness.observedAt).toBe(core.freshness.observedAt);
 expect(result.freshness.state).toBe('stale');
 expect(result.completeness.failed).not.toHaveLength(0);
 expect(result.completeness.state).toBe('partial');
 expect(result.data!.positions).toHaveLength(1);
});
it('time passing makes retained observations stale without rewriting timestamps',()=>{
 const core=scenario('sol-only',100000);
 const result=combineSections([{data:core,isError:false}],200000)!;
 expect(result.freshness.state).toBe('stale');
 expect(result.freshness.observedAt).toBe(core.freshness.observedAt);
});
