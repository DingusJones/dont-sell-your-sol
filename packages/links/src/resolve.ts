import type { LinkResolution } from './types.ts';
import { registry, REGISTRY_VERSION } from './registry.ts';
import { safeUrl } from './validate-url.ts';
export function resolve(key: string, targetIds: string[], now=Date.now()): LinkResolution {
 const route=registry.find(r=>r.key===key && r.targetIds.length===targetIds.length && r.targetIds.every((id,i)=>id===targetIds[i]) && Date.parse(r.expiresAt)>now && safeUrl(r.url,r.approvedHosts));
 return route ? {...route,registryVersion:REGISTRY_VERSION,requiresConnection:true,reason:null} : {intent:'inspect',target:'unresolved',targetIds,url:null,label:'Exact link unavailable',registryVersion:REGISTRY_VERSION,verifiedAt:null,expiresAt:null,verificationSource:null,requiresConnection:false,reason:'The destination and its entity have not been verified. No action link is enabled.'};
}
export function enabledLink(link: LinkResolution, now=Date.now()): boolean {
 if(!link.url) return false;
 return registry.some(r=>r.url===link.url && r.target===link.target && r.targetIds.length===link.targetIds.length && r.targetIds.every((id,i)=>id===link.targetIds[i]) && Date.parse(r.expiresAt)>now && safeUrl(r.url,r.approvedHosts));
}
