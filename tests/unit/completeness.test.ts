import {it,expect} from 'vitest';
import {completeness} from '../../packages/domain/src/completeness.ts';
import {scenario} from '../fixtures/scenarios.ts';
import {ageLabel} from '../../packages/domain/src/freshness.ts';
import {CircuitBreaker} from '../../apps/api/src/services/circuit-breaker.ts';
import {SnapshotCache} from '../../apps/api/src/services/cache.ts';
it('missing pages and unknown index evidence cannot establish empty',()=>{const s=scenario('empty');const p=s.providers[0]!;for(const state of ['unknown','partial','unavailable'] as const)expect(completeness([{...p,state,pagesComplete:false}],s.data).state).not.toBe('complete');expect(completeness([{...p,pagesComplete:false,cursor:'next'}],s.data).pendingPages).toBe(1);});
it('stale age uses original observation time',()=>expect(ageLabel(scenario('stale',1000000).freshness,1000000)).toBe('Stale · Observed 4m ago'));
it('circuit opens after repeated failures and cache expires',()=>{const b=new CircuitBreaker();b.failure(0);b.failure(0);b.failure(0);expect(b.allowed(1000)).toBe(false);expect(b.allowed(30001)).toBe(true);b.success();expect(b.allowed(0)).toBe(true);const c=new SnapshotCache<string>(2,100);c.set('a','value',0);expect(c.get('a',99)?.value).toBe('value');expect(c.get('a',100)).toBeUndefined();});
