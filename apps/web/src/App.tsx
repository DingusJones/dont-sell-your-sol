import {useEffect,useMemo,useState} from 'react';
import {useQueries,useQueryClient} from '@tanstack/react-query';
import type {PortfolioEnvelope} from '../../../packages/domain/src/types.ts';
import {combineSections} from './features/portfolio/selectors.ts';
import {reconcile} from '../../../packages/domain/src/reconcile.ts';
import {account} from '../../../packages/domain/src/accounting.ts';
import {D,usd,amount} from '../../../packages/domain/src/amounts.ts';
import {scenario,scenarioNames,scenarioLabels,DEMO_ADDRESS} from '../../../tests/fixtures/scenarios.ts';
import {AppHeader} from './components/AppHeader.tsx';
import {PortfolioHero} from './components/PortfolioHero.tsx';
import {PortfolioNavigation,type View} from './components/PortfolioNavigation.tsx';
import {TokenList} from './components/TokenList.tsx';
import {PositionCard} from './features/positions/PositionCard.tsx';
import {CoveragePanel} from './components/CoveragePanel.tsx';
import {WalletEntry} from './features/wallet/WalletEntry.tsx';
import {remember} from './features/wallet/preferences.ts';
import {queryKey,readSection} from './features/portfolio/client.ts';
export function App(){
 const client=useQueryClient();const [address,setAddress]=useState<string|null>(null);const [demo,setDemo]=useState(false);const [scenarioKey,setScenarioKey]=useState('rich');const [revision,setRevision]=useState(0);const [generation,setGeneration]=useState(0);const [changing,setChanging]=useState(false);const [view,setView]=useState<View>('Overview');const [search,setSearch]=useState('');const [hideSpam,setHideSpam]=useState(false);const [unpriced,setUnpriced]=useState(false);const [sort,setSort]=useState('value');const [masked,setMasked]=useState(false);const [page,setPage]=useState(1);const [clockTick,tick]=useState(0);
 useEffect(()=>{const id=setInterval(()=>tick(n=>n+1),15000);return()=>clearInterval(id);},[]);
 const queries=useQueries({queries:(['core','defi'] as const).map(section=>({queryKey:queryKey(address??'',section,generation),queryFn:({signal}:{signal:AbortSignal})=>readSection(address!,section,generation,signal),enabled:!!address&&!demo,refetchInterval:60000,refetchIntervalInBackground:false}))});
 const sample=useMemo(()=>scenario(scenarioKey),[scenarioKey,revision]);
 const snapshot=useMemo<PortfolioEnvelope|null>(()=>{
  if(demo)return sample;
  return combineSections(queries);
 },[demo,sample,clockTick,queries[0]!.data,queries[1]!.data,queries[0]!.isError,queries[1]!.isError]);
 const busy=!demo&&!!address&&queries.some(q=>q.isFetching);
 const loading=demo?scenarioKey==='loading':busy&&!snapshot?.data;
 const refresh=()=>{if(demo)setRevision(n=>n+1);else void Promise.all(queries.map(q=>q.refetch()));};
 const clear=()=>{void client.cancelQueries({queryKey:['portfolio']});client.removeQueries({queryKey:['portfolio']});remember(null);setAddress(null);setDemo(false);setChanging(false);setGeneration(n=>n+1);setView('Overview');setSearch('');setPage(1);};
 const select=(next:string,isDemo=false)=>{void client.cancelQueries({queryKey:['portfolio']});client.removeQueries({queryKey:['portfolio']});setGeneration(n=>n+1);setAddress(next);setDemo(isDemo);setChanging(false);setView('Overview');setSearch('');setHideSpam(false);setUnpriced(false);setPage(1);};
 const tokens=(snapshot?.data?.tokens??[]).filter(t=>(!hideSpam||!t.spam)&&(!unpriced||t.usd.value===null)&&(!search||`${t.name} ${t.symbol}`.toLowerCase().includes(search.toLowerCase())||t.mint.includes(search))).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):a.usd.value===null?1:b.usd.value===null?-1:new D(b.usd.value).comparedTo(a.usd.value));
 const allPositions=reconcile(snapshot?.data?.positions??[]);
 const positions=allPositions.filter(p=>(view!=='Staking'||p.type==='staking')&&(view!=='Lending'||p.type==='lending')&&(view!=='LPs & Pools'||p.type==='liquidity')&&(!search||`${p.name} ${p.protocol}`.toLowerCase().includes(search.toLowerCase())||p.account.includes(search))).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):new D(account({tokens:[],positions:[b]}).net??'-1e180').comparedTo(account({tokens:[],positions:[a]}).net??'-1e180'));
 const showTokens=view==='Overview'||view==='Tokens';const showPositions=view!=='Tokens'&&view!=='Rewards';
 const rewards=allPositions.flatMap(p=>p.rewards.map(r=>({...r,positionName:p.name})));
 const error=queries.find(q=>q.isError)?.error;
 return <><AppHeader address={address} demo={demo} onChange={()=>setChanging(v=>!v)} onRemove={clear} onRefresh={refresh} refreshing={busy}/><main id="main">
 {!address?<section className="welcome"><div className="eyebrow">A CLEARER PICTURE OF YOUR SOLANA</div><h1>Your SOL has<br/>places to be<span className="accent">.</span></h1><p className="welcome-lead">See what you hold. Understand where it is.<br/>Know what still needs checking.</p><WalletEntry onSubmit={a=>select(a)} onDemo={()=>select(DEMO_ADDRESS,true)}/><div className="welcome-principles"><div><span>01</span><h2>Ownership first</h2><p>Tokens, positions and liabilities in one quiet ledger.</p></div><div><span>02</span><h2>Uncertainty visible</h2><p>Unpriced assets and missing coverage stay in view.</p></div><div><span>03</span><h2>Always read-only</h2><p>No signatures. No transactions. Your wallet stays yours.</p></div></div></section>:<>
 {changing&&<section className="change-wallet"><h2>Change watched address</h2><WalletEntry compact onSubmit={a=>select(a)} onDemo={()=>select(DEMO_ADDRESS,true)}/><button onClick={()=>setChanging(false)}>Cancel</button></section>}
 {demo&&<div className="demo-banner"><div><strong>DEMO · Synthetic data</strong><span>Illustrative holdings, prices and identities. Not a live wallet.</span></div><label>Scenario<select aria-label="Demo scenario" value={scenarioKey} onChange={e=>{setScenarioKey(e.target.value);setPage(1);}}>{scenarioNames.map(k=><option value={k} key={k}>{scenarioLabels[k]}</option>)}</select></label></div>}
 <div role="status" className="status-line">{loading?'Checking wallet and provider scopes…':snapshot?.freshness.state==='stale'?'Stale snapshot · Original observation time retained':snapshot?.data?'Ownership snapshot available. Review coverage below.':'Provider unavailable. Your assets have not disappeared.'}</div>
 <PortfolioHero snapshot={snapshot} loading={loading} masked={masked} onMask={()=>setMasked(v=>!v)}/>
 <PortfolioNavigation value={view} onChange={v=>{setView(v);setPage(1);}}/>
 <div className="content-layout"><section className="holdings"><div className="ledger-toolbar"><label className="search-label"><span className="sr-only">Search holdings</span><input placeholder="Search asset, protocol or mint" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></label><label className="sort-label">Sort<select value={sort} onChange={e=>setSort(e.target.value)}><option value="value">Value</option><option value="name">Name</option></select></label></div>{showTokens&&<div className="filters"><label className="check"><input type="checkbox" checked={hideSpam} onChange={e=>setHideSpam(e.target.checked)}/> Hide spam ({snapshot?.data?.tokens.filter(t=>t.spam).length??0})</label><label className="check"><input type="checkbox" checked={unpriced} onChange={e=>setUnpriced(e.target.checked)}/> Unpriced only</label><span className="small muted">Filters never change totals.</span></div>}
 {error&&<div className="inline-warning" role="alert">{error.message} {snapshot?.data?'Last received data retained; observation age is unchanged.':''}</div>}
 {loading&&!snapshot?.data?<div className="loading-state" aria-label="Loading ownership"><div className="skeleton"/><div className="skeleton"/><p>Checking balances independently from protocol positions…</p></div>:!snapshot?.data?<div className="empty-state"><span className="empty-icon" aria-hidden="true">◌</span><h2>We can’t establish holdings yet</h2><p>{scenarioKey==='unknown'?'Ownership is not yet verified.':'No successful ownership snapshot is available. This does not mean the address is empty.'}</p><button onClick={refresh}>Retry portfolio</button></div>:<>
 {showTokens&&<section aria-labelledby="tokens-title"><div className="section-title"><h2 id="tokens-title">Wallet holdings <span className="muted">{tokens.length}</span></h2><button className="text-button" onClick={()=>demo?setRevision(n=>n+1):void queries[0]!.refetch()}>↻ Refresh tokens</button></div>{tokens.length?<TokenList tokens={tokens.slice(0,page*30)} masked={masked}/>:<p className="empty-section">{snapshot.completeness.state==='complete'&&!search&&!unpriced&&!hideSpam?'No token balances in the successfully checked scope.':'No matching token rows. Coverage may be incomplete.'}</p>}{tokens.length>page*30&&<button onClick={()=>setPage(n=>n+1)}>Show 30 more holdings</button>}</section>}
 {showPositions&&<section aria-labelledby="positions-title"><div className="section-title"><h2 id="positions-title">{view==='Overview'?'Across protocols':view} <span className="muted">{positions.length}</span></h2><button className="text-button" onClick={()=>demo?setRevision(n=>n+1):void queries[1]!.refetch()}>↻ Refresh positions</button></div>{positions.length?positions.slice(0,page*30).map(p=><PositionCard key={p.id} position={p} masked={masked}/>):<p className="empty-section">{snapshot.completeness.state==='complete'?'No matching positions in this checked scope.':'Protocol coverage is unverified. No decoded positions does not establish no positions.'}</p>}{positions.length>page*30&&<button onClick={()=>setPage(n=>n+1)}>Show 30 more positions</button>}</section>}
 {view==='Rewards'&&<section><div className="section-title"><h2>Rewards & fees</h2></div><p className="muted">Shown separately; never added automatically to net value.</p>{rewards.length?rewards.map(r=><article className="reward-row" key={r.id}><div><strong>{r.symbol} · {r.state}</strong><p className="muted">{r.positionName}</p></div><div>{masked?'••••':r.rawAmount===null?'Unknown amount':amount(r.rawAmount,r.decimals)}<p>{masked?'••••':usd(r.usd.value)}</p></div></article>):<p>No verified separate rewards in the available data.</p>}</section>}
 {snapshot.completeness.pendingPages>0&&<div className="inline-warning">Pagination incomplete. More positions may exist; this snapshot is partial.</div>}
 </>}
 </section><CoveragePanel snapshot={snapshot} onRetry={refresh}/></div></>}
 </main><footer><span>Dont sell your Sol<span className="accent">.</span></span><p>A read-only view, with its limits in plain sight.</p><details><summary>Privacy & coverage</summary><p>Addresses stay in session memory unless you opt in to remembering one on this device. Live lookups go to this app’s server and its configured RPC provider. No analytics, signing, or wallet database. Successful snapshots can be cached for up to five minutes in server memory. Demo data stays local. Protocol decoding, prices and exact destinations are unverified.</p></details></footer></>;
}
