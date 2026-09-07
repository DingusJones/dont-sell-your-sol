import { parseExactJson } from './safe-json.ts';
import { z } from 'zod';
export class UpstreamError extends Error { constructor(public code: string) { super(code); } }
export async function boundedText(response: Response, max=4_000_000): Promise<string> {
 if(Number(response.headers.get('content-length'))>max) throw new UpstreamError('RESPONSE_TOO_LARGE');
 const reader=response.body?.getReader(); if(!reader) throw new UpstreamError('EMPTY_BODY');
 const chunks: Uint8Array[]=[]; let size=0;
 try { while(true) {const {done,value}=await reader.read(); if(done) break;size+=value.length;if(size>max) throw new UpstreamError('RESPONSE_TOO_LARGE');chunks.push(value);} } catch(e){await reader.cancel();throw e;}
 const joined=new Uint8Array(size);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.length;}return new TextDecoder().decode(joined);
}
export async function rpc(url: string, method: 'getBalance'|'getTokenAccountsByOwner'|'getGenesisHash', params: unknown[], signal: AbortSignal, fetcher: typeof fetch=fetch): Promise<unknown> {
 try {
  const endpoint=new URL(url); if(endpoint.protocol!=='https:') throw new UpstreamError('INVALID_SERVER_CONFIGURATION');
  const response=await fetcher(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.any([signal,AbortSignal.timeout(8000)]),redirect:'error'});
  if(!response.ok) throw new UpstreamError(response.status===429?'RATE_LIMITED':'UPSTREAM_HTTP');
  // Preserve numeric lexemes BEFORE JavaScript can round a u64.
  const payload=z.object({jsonrpc:z.literal('2.0'),id:z.literal('1'),result:z.unknown().optional(),error:z.unknown().optional()}).passthrough().parse(parseExactJson(await boundedText(response)));
  if('error' in payload || !('result' in payload)) throw new UpstreamError('UPSTREAM_ERROR');
  return payload.result;
 } catch(error) { if(error instanceof UpstreamError) throw error; throw new UpstreamError('UPSTREAM_INVALID_OR_UNAVAILABLE'); }
}
