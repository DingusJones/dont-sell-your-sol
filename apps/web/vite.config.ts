import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { createApi } from '../api/src/index.ts';
function localApi():Plugin {
 const env=loadEnv('development',process.cwd(),'');
 const api=createApi({SOLANA_RPC_URL:env.SOLANA_RPC_URL, SOLANA_RPC_FALLBACK_URL:env.SOLANA_RPC_FALLBACK_URL,ENABLE_RPC:env.ENABLE_RPC,ENABLE_LIVE_PRICES:env.ENABLE_LIVE_PRICES,JUPITER_API_KEY:env.JUPITER_API_KEY});
 const attach=(server:{middlewares:{use:Function}})=>{server.middlewares.use(async(req:import('node:http').IncomingMessage,res:import('node:http').ServerResponse,next:()=>void)=>{
  if(!req.url?.startsWith('/api/'))return next();
  try{const chunks:Buffer[]=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>2048){res.writeHead(413,{'Content-Type':'application/json'});res.end('{"error":"BODY_TOO_LARGE"}');return;}chunks.push(chunk);}
   const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
   const result=await api(new Request(`http://${req.headers.host}${req.url}`,{method:req.method,headers,body:['GET','HEAD'].includes(req.method??'GET')?undefined:Buffer.concat(chunks)}));
   res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());
  }catch{res.writeHead(503);res.end('{"error":"APPLICATION_UNAVAILABLE"}');}
 });};
 return {name:'same-origin-local-api',configureServer:attach,configurePreviewServer:attach};
}
export default defineConfig({base:process.env.GITHUB_ACTIONS?'/dont-sell-your-sol/':'/',root:fileURLToPath(new URL('.',import.meta.url)),plugins:[react(),localApi()],server:{host:'127.0.0.1',port:5173},preview:{host:'127.0.0.1',port:4173},build:{outDir:'../../dist/web',emptyOutDir:true}});
