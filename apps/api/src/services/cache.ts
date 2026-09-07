export class SnapshotCache<T> {
 private entries=new Map<string,{value:T;written:number}>();
 constructor(private max=200,private retention=300000){}
 get(key:string,now:number):{value:T;written:number}|undefined {const item=this.entries.get(key);if(item&&now-item.written<this.retention)return structuredClone(item);this.entries.delete(key);return undefined;}
 set(key:string,value:T,now:number){for(const [k,v] of this.entries)if(now-v.written>=this.retention)this.entries.delete(k);if(this.entries.size>=this.max)this.entries.delete(this.entries.keys().next().value!);this.entries.set(key,{value:structuredClone(value),written:now});}
 clear(){this.entries.clear();}
}
