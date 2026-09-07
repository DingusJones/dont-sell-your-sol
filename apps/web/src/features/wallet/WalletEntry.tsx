import {useState} from 'react';
import {addressSchema} from '../../../../../packages/domain/src/wallet.ts';
import {remember,remembered} from './preferences.ts';
export function WalletEntry({onSubmit,onDemo,compact=false}:{onSubmit:(address:string)=>void;onDemo:()=>void;compact?:boolean}){
 const [input,setInput]=useState(remembered);const [persist,setPersist]=useState(false);const [error,setError]=useState('');
 return <form className={`wallet-entry ${compact?'compact':''}`} onSubmit={e=>{e.preventDefault();const result=addressSchema.safeParse(input);if(!result.success){setError(result.error.issues[0]!.message);return;}setError('');remember(persist?result.data:null);onSubmit(result.data);}}>
  <label htmlFor="wallet-address">Public Solana address</label><div className="entry-controls"><input id="wallet-address" autoComplete="off" spellCheck={false} value={input} onChange={e=>setInput(e.target.value)} placeholder="Paste a Solana address" aria-invalid={!!error} aria-describedby={error?'wallet-error':'wallet-help'}/><button className="primary" type="submit">View portfolio <span aria-hidden="true">↗</span></button></div>
  {error&&<p id="wallet-error" role="alert" className="danger">{error}</p>}<p id="wallet-help" className="muted">Public address only. Read-only, no wallet connection or signing.</p>
  <div className="entry-options"><label className="check"><input type="checkbox" checked={persist} onChange={e=>setPersist(e.target.checked)}/> Remember this address on this device</label><button type="button" className="text-button" onClick={onDemo}>Explore a demo →</button></div>
 </form>;
}
