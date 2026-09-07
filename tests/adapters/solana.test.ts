import {it,expect,describe} from 'vitest';
import {createSolanaAdapter,normalizeTokens,TOKEN_PROGRAM,TOKEN_2022} from '../../packages/adapters/src/solana/balances.ts';
import {parseExactJson} from '../../packages/adapters/src/solana/safe-json.ts';
import {rpc,boundedText} from '../../packages/adapters/src/solana/rpc.ts';
import {mockRpc,rpcAccount} from '../fixtures/rpc.ts';
import {DEMO_ADDRESS} from '../fixtures/scenarios.ts';
const ctx={address:DEMO_ADDRESS,now:Date.now(),signal:new AbortController().signal};
describe('RPC ownership boundary',()=>{
 it('preserves u64 precision before normalization',async()=>{const r=await createSolanaAdapter('https://rpc.example',true,undefined,mockRpc()).read(ctx);expect(r.data!.tokens.find(t=>t.mint==='native:SOL')!.rawAmount).toBe('9007199254740993123');expect(r.data!.tokens[0]!.freshness.slot).toBe('9007199254740993');expect(r.data!.tokens.every(t=>t.usd.value===null)).toBe(true);});
 it('does not equate a disabled provider with empty',async()=>{const r=await createSolanaAdapter(undefined,false).read(ctx);expect(r.data).toBe(null);expect(r.statuses.every(s=>s.state==='unavailable')).toBe(true);});
 it('keeps successful tokens when native balance fails with HTTP 200',async()=>{const r=await createSolanaAdapter('https://rpc.example',true,undefined,mockRpc({fail:'getBalance'})).read(ctx);expect(r.statuses[0]!.state).toBe('unavailable');expect(r.data!.tokens.length).toBe(1);});
 it('validates mainnet before any balance is trusted',async()=>{const r=await createSolanaAdapter('https://rpc.example',true,undefined,mockRpc({wrongNetwork:true})).read(ctx);expect(r.data).toBe(null);expect(r.statuses[0]!.errorCode).toBe('WRONG_NETWORK');});
 it('retains token extension state while qualifying completeness',()=>{const r=normalizeTokens({context:{slot:'1'},value:[rpcAccount(TOKEN_2022)]},DEMO_ADDRESS,TOKEN_2022,ctx.now);expect(r.partial).toBe(true);expect(r.tokens[0]!.accounts[0]!.extensions).toContain('transferFeeAmount');expect(r.tokens[0]!.accounts[0]!.extensionData).not.toBeNull();});
 it('aggregates exact mint and program, rejects mismatched owners',()=>{const good=rpcAccount();const other=rpcAccount(TOKEN_PROGRAM,'1','So11111111111111111111111111111111111111112');const r=normalizeTokens({context:{slot:'1'},value:[good,other]},DEMO_ADDRESS,TOKEN_PROGRAM,ctx.now);expect(r.tokens[0]!.rawAmount).toBe('9007199254740993124');good.account.data.parsed.info.owner='So11111111111111111111111111111111111111112';expect(normalizeTokens({context:{slot:'1'},value:[good]},DEMO_ADDRESS,TOKEN_PROGRAM,ctx.now).partial).toBe(true);});
 it('rejects malformed and oversized data without false empty',async()=>{expect(()=>parseExactJson('{"x":01}')).toThrow();await expect(boundedText(new Response('a'.repeat(101)),100)).rejects.toThrow('RESPONSE_TOO_LARGE');await expect(rpc('https://rpc.example','getBalance',[],ctx.signal,async()=>new Response('{"result":0}'))).rejects.toThrow();});
 it('preserves escaped strings, exponent lexemes, arrays and zero',()=>{expect(parseExactJson('{"a":9007199254740993,"b":"quote\\\" 123","c":[-1.2e3,0,null,true]}')).toEqual({a:'9007199254740993',b:'quote" 123',c:['-1.2e3','0',null,true]});});
});
