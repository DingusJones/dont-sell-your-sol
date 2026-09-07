export class RateLimiter {
 private hits=new Map<string,{count:number;until:number}>();
 constructor(private limit=30,private window=60000){}
 allow(key:string,now=Date.now()):boolean {for(const [k,v] of this.hits)if(v.until<=now)this.hits.delete(k);const item=this.hits.get(key);if(item){if(item.count>=this.limit)return false;item.count++;return true;}if(this.hits.size>=10000)return false;this.hits.set(key,{count:1,until:now+this.window});return true;}
}
