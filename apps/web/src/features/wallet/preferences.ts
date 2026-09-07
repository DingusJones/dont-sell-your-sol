const key='dsys:remembered-address:v1';
export function remembered():string {try{return localStorage.getItem(key)??'';}catch{return '';}}
export function remember(address:string|null){try{if(address)localStorage.setItem(key,address);else localStorage.removeItem(key);}catch{/* Storage is optional; session lookup still works. */}}
