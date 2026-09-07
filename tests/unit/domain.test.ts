import { describe, it, expect } from 'vitest';
import { amount, valueOf, usd } from '../../packages/domain/src/amounts.ts';
import { addressSchema, isAddress } from '../../packages/domain/src/wallet.ts';
import { account } from '../../packages/domain/src/accounting.ts';
import { scenario } from '../fixtures/scenarios.ts';
import { reconcile, aggregateTokens } from '../../packages/domain/src/reconcile.ts';
import { envelopeSchema } from '../../packages/domain/src/schemas.ts';
describe('safe domain invariants',()=>{
 it('validates decoded public keys, preserves case, accepts off-curve keys',()=>{
   expect(addressSchema.parse(' 11111111111111111111111111111111 ')).toBe('11111111111111111111111111111111');
   expect(isAddress('0'.repeat(32))).toBe(false); expect(isAddress('1'.repeat(31))).toBe(false);
 });
 it('never rounds atomic amounts or maps unknown to zero',()=>{
   expect(amount('9007199254740993123',9)).toBe('9007199254.740993123');
   expect(valueOf('123',2,null)).toBe(null); expect(usd(null)).toBe('Unavailable'); expect(usd('0')).toBe('$0.00');
   expect(()=>amount('1e6',9)).toThrow(); expect(()=>amount('1',-1)).toThrow();
 });
 it('amount conversion preserves integers across 500 deterministic generated u64s',()=>{let raw=17n;for(let i=0;i<500;i++){raw=(raw*6364136223846793005n+1442695040888963407n)%2n**64n;expect(valueOf(raw.toString(),9,'1000000000')).toBe(raw.toString());}});
 it('validates every synthetic scenario',()=>{for(const key of ['rich','sol-only','empty','partial','stale','unavailable','unknown','loading','negative','overlap','malicious','pagination']) expect(()=>envelopeSchema.parse(scenario(key))).not.toThrow();});
 it('overlap is idempotent and ordering independent',()=>{
   const p=scenario('rich').data!; const position=p.positions[0]!;
   const duplicate={...position,sourceId:'aggregator',authority:'aggregator' as const};
   expect(reconcile([position,duplicate])).toEqual(reconcile([duplicate,position]));
   expect(account({...p,positions:[...p.positions,duplicate]}).net).toBe(account(p).net);
 });
 it('known debt cannot increase net; missing debt qualifies it',()=>{
   const p=scenario('rich').data!; const before=account(p);
   const loan=p.positions.find(x=>x.type==='lending')!;
   const next=structuredClone(p); next.positions.find(x=>x.id===loan.id)!.debts[0]!.usd.value='999999';
   expect(Number(account(next).net)).toBeLessThan(Number(before.net));
   next.positions[0]!.debtKnown=false; expect(account(next).uncertain).toBe(true);
 });
 it('token aggregation is account-order invariant and idempotent',()=>{
   const tokens=scenario('rich').data!.tokens;const t=tokens[0]!;
   expect(aggregateTokens([t,t])[0]!.rawAmount).toBe(t.rawAmount);
   expect(aggregateTokens([t,...tokens])).toEqual(aggregateTokens([...tokens,t]));
 });
 it('outage never yields zero; empty can yield a scoped zero',()=>{expect(account(scenario('unavailable').data).net).toBe(null);expect(account(scenario('empty').data).net).toBe('0');});
});
