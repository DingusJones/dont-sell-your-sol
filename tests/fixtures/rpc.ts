import {TOKEN_PROGRAM,TOKEN_2022} from '../../packages/adapters/src/solana/balances.ts';
import {DEMO_ADDRESS} from './scenarios.ts';
export const mint='So11111111111111111111111111111111111111112';
export function rpcAccount(program=TOKEN_PROGRAM,raw='9007199254740993123',account=DEMO_ADDRESS){return {pubkey:account,account:{owner:program,data:{parsed:{type:'account',info:{mint,owner:DEMO_ADDRESS,state:'initialized',tokenAmount:{amount:raw,decimals:'9'},...(program===TOKEN_2022?{extensions:[{extension:'transferFeeAmount',state:{withheldAmount:'12'}}]}:{})}}}}};}
export function mockRpc(options:{fail?:string;zero?:boolean;wrongNetwork?:boolean}={}):typeof fetch {
 return (async(_url:unknown,init?:RequestInit)=>{
  const {method,params}=JSON.parse(init!.body as string);
  if(options.fail===method)return new Response(JSON.stringify({jsonrpc:'2.0',id:1,error:{message:'private upstream URL and key must not leak'}}));
  if(method==='getGenesisHash')return new Response(JSON.stringify({jsonrpc:'2.0',id:1,result:options.wrongNetwork?'wrong':'5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'}));
  if(method==='getBalance')return new Response(`{"jsonrpc":"2.0","id":1,"result":{"context":{"slot":9007199254740993},"value":${options.zero?'0':'9007199254740993123'}}}`);
  const program=params[1].programId;const value=options.zero||program===TOKEN_2022?[]:[rpcAccount()];
  // JSON-RPC decimals/slot are numeric lexemes, converted before normalization.
  const body=JSON.stringify({jsonrpc:'2.0',id:1,result:{context:{slot:123},value}}).replace('"decimals":"9"','"decimals":9');
  return new Response(body);
 }) as typeof fetch;
}
