import type { PortfolioEnvelope, TokenBalance, DeFiPosition, Observation, ProviderStatus } from '../../packages/domain/src/types.ts';
import { freshness } from '../../packages/domain/src/freshness.ts';
import { completeness } from '../../packages/domain/src/completeness.ts';
import { resolve } from '../../packages/links/src/resolve.ts';
import { walletId } from '../../packages/domain/src/wallet.ts';
import { TOKEN_PROGRAM, TOKEN_2022 } from '../../packages/adapters/src/solana/balances.ts';
// Synthetic identities and valuations. Never a captured public wallet or provider response.
export const DEMO_ADDRESS='11111111111111111111111111111111';
export const scenarioNames=['rich','sol-only','empty','partial','stale','unavailable','unknown','loading','negative','overlap','malicious','pagination','spl','spam','lending','lp-vault','rewards','exact-link-unavailable'] as const;
export const scenarioLabels:Record<string,string>={rich:'Full ownership ledger',spl:'SPL & Token-2022',spam:'Spam & unverified assets',lending:'Lending supply & borrow','lp-vault':'LP & queued vault',rewards:'Claimable & accrued rewards','exact-link-unavailable':'Exact links unavailable', 'sol-only':'SOL only',empty:'Verified empty scope',partial:'One provider fails',stale:'Stale snapshot',unavailable:'All providers unavailable',unknown:'Unknown protocol',loading:'Loading',negative:'Negative net value',overlap:'Overlapping observations',malicious:'Untrusted metadata',pagination:'Incomplete pagination'};
export function scenario(name:string,now=Date.now()):PortfolioEnvelope {
 const f=freshness(name==='stale'?now-240000:now,60000);
 if(name==='stale')f.state='stale';
 const o=(value:string|null):Observation=>({value,sourceId:'synthetic-fixture',confidence:value===null?'unknown':'estimated',freshness:f});
 const id=walletId(DEMO_ADDRESS);
 const t=(key:string,symbol:string,label:string,raw:string,decimals:number,value:string|null,mint=DEMO_ADDRESS):TokenBalance=>({id:key,walletId:id,chain:'solana:mainnet',mint,program:TOKEN_PROGRAM,accounts:[{address:mint,rawAmount:raw,frozen:false,delegate:null,delegatedAmount:null,extensions:[],extensionData:null}],rawAmount:raw,decimals,name:label,symbol,verification:key==='sol'?'verified':'unverified',spam:false,usd:o(value),freshness:f,representedBy:null,warnings:[]});
 const tokens=[t('sol','SOL','Solana','24381500200',9,'3657.22503','native:SOL'),t('usdc','USDC','USD Coin · sample','2840500000',6,'2840.50','So11111111111111111111111111111111111111112'),t('lst','sSOL','Example liquid stake receipt','8200000000',9,'1394','TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),t('unpriced','SEED','Unpriced asset','9007199254740993123',9,null,'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),t('spam','USDC','Unverified same-symbol token','1000000',6,null,'Stake11111111111111111111111111111111111111')];
 tokens[0]!.accounts[0]!.address=DEMO_ADDRESS;
 tokens[0]!.program='native';
 tokens[4]!.spam=true;
 tokens[3]!.program=TOKEN_2022;
 tokens[3]!.accounts[0]!.frozen=true;
 tokens[3]!.accounts[0]!.extensions=['transferFeeAmount'];
 tokens[3]!.accounts[0]!.extensionData={withheldAmount:'250'};
 tokens[3]!.warnings=[{code:'EXTENSIONS_INCOMPLETE',severity:'warning',message:'Transfer-fee and frozen state restrict movement. Displayed amount is not a withdrawable amount.',entityId:'unpriced',blocksValuation:true,blocksAction:true}];
 const p=(key:string,type:DeFiPosition['type'],protocol:string,label:string,value:string):DeFiPosition=>({id:key,walletId:id,protocol,version:'synthetic-v1',programIds:['synthetic-program'],account:`synthetic:${key}`,entityId:`synthetic:entity:${key}`,subaccount:null,name:label,type,assets:[{id:`${key}:asset`,mint:'native:SOL',symbol:'SOL',rawAmount:'10000000000',decimals:9,role:type==='lending'?'collateral':'underlying',usd:o(value),underlyingOf:key,inclusion:'included'}],debts:[],debtKnown:true,rewards:[],health:null,withdrawal:{state:'unknown',explanation:'Illustrative position only. Withdrawal availability is not verified.',unlockAt:null},staking:null,liquidity:null,sourceId:'synthetic-fixture',authority:'native',freshness:f,completeness:'complete',representedBy:null,overlapUncertain:false,link:resolve(key,[`synthetic:${key}`]),warnings:[]});
 const positions=[p('lend','lending','Kamino · sample','SOL collateral / USDC borrow','4200'),p('lp','liquidity','Orca · sample','SOL / USDC concentrated liquidity','1862.48'),p('stake','staking','Native stake · sample','Delegated SOL','1500'),p('vault','vault','Example vault','Queued vault redemption','720'),p('liquid','staking','LST · sample','Liquid staking exposure','1394'),p('lock','locked','Jupiter · sample','Timed token lock','360')];
 positions[0]!.debts=[{id:'borrow',mint:'synthetic:usdc',symbol:'USDC',rawAmount:'1250000000',decimals:6,principal:'1200000000',borrowIndex:null,usd:o('1250'),riskPrice:o('1')}];
 positions[0]!.health={metric:'Loan-to-value',value:'29.76',unit:'%',direction:'lower-safer',threshold:'75',explanation:'Synthetic protocol-specific risk example. Display prices do not establish liquidation safety.',oracleFreshness:f};
 positions[0]!.withdrawal={state:'constrained',explanation:'Collateral supports an outstanding loan. Review repayment and health at the protocol.',unlockAt:null};
 positions[1]!.liquidity={positionMint:'synthetic:position-nft',pool:'synthetic:pool',lower:'120',upper:'180',range:'in-range',stakedIn:'synthetic:farm'};
 positions[1]!.assets[0]!.rawAmount='6000000000';
 positions[1]!.assets[0]!.usd=o('900');
 positions[1]!.assets.push({...positions[1]!.assets[0]!,id:'lp:usdc',mint:'synthetic:usdc',symbol:'USDC',rawAmount:'962480000',decimals:6,usd:o('962.48')});
 positions[1]!.rewards=[{id:'fees',mint:'synthetic:usdc',symbol:'USDC',rawAmount:'18420000',decimals:6,state:'claimable',unlockAt:null,usd:o('18.42'),alreadyIncluded:false},{id:'pending',mint:'synthetic:reward',symbol:'RWD',rawAmount:'2500000',decimals:6,state:'accrued',unlockAt:null,usd:o(null),alreadyIncluded:false}];
 positions[2]!.staking={stakeAuthority:DEMO_ADDRESS,withdrawAuthority:DEMO_ADDRESS,activation:'deactivating',activeRaw:'10000000000',inactiveRaw:'0',validator:'synthetic:validator',epoch:'900'};
 positions[2]!.withdrawal={state:'locked',explanation:'Deactivation is pending an epoch transition. Authority and lockup must also permit withdrawal.',unlockAt:'After epoch transition; time unknown'};
 positions[3]!.withdrawal={state:'locked',explanation:'Shares have a queued redemption; underlying assets are not immediately available.',unlockAt:'2026-09-10T00:00:00Z'};
 tokens[2]!.representedBy='liquid';
 positions[5]!.withdrawal={state:'locked',explanation:'Vesting does not imply the reward is already claimable.',unlockAt:'2026-10-01T00:00:00Z'};
 const status=(capability:string,state:ProviderStatus['state']='success'):ProviderStatus=>({id:'synthetic-fixture',capability,state,attemptedAt:f.fetchedAt,completedAt:f.fetchedAt,errorCode:null,message:'Synthetic scenario, not provider evidence.',pagesComplete:state==='success'||state==='empty',cursor:null});
 let data:PortfolioEnvelope['data']={tokens,positions};let providers=[status('sample-core'),status('sample-defi')];
 if(name==='spl'||name==='spam')data={tokens,positions:[]};
 if(name==='lending')data={tokens:[],positions:[positions[0]!]};
 if(name==='lp-vault')data={tokens:[],positions:[positions[1]!,positions[3]!]};
 if(name==='rewards')data={tokens:[],positions:[positions[1]!]};
 if(name==='exact-link-unavailable')data={tokens:[],positions:[positions[3]!]};
 if(name==='sol-only')data={tokens:tokens.slice(0,1),positions:[]};
 if(name==='empty'){data={tokens:[],positions:[]};providers=[status('sample-core','empty'),status('sample-defi','empty')];}
 if(name==='partial'){data={tokens,positions:positions.slice(0,2)};providers[1]=status('sample-defi','unavailable');}
 if(name==='unavailable'){data=null;providers=providers.map(p=>({...p,state:'unavailable',pagesComplete:false,errorCode:'SYNTHETIC_OUTAGE'}));}
 if(name==='loading'){data=null;providers=providers.map(p=>({...p,state:'loading',pagesComplete:false,completedAt:null}));}
 if(name==='unknown'){positions.push({...p('unknown','unknown','Unknown deployment','Position details incomplete','0'),assets:[],debtKnown:false,completeness:'unknown'});providers.push(status('unknown-deployment','unknown'));}
 if(name==='negative')positions[0]!.debts[0]!.usd=o('25000');
 if(name==='overlap')positions.push({...positions[0]!,sourceId:'synthetic-aggregator',authority:'aggregator'});
 if(name==='malicious'){tokens[4]!.name='<img src=x onerror=alert(1)>';tokens[4]!.symbol='<script>alert(1)</script>';}
 if(name==='pagination'){providers[1]={...status('sample-defi','partial'),cursor:'synthetic-page-2'};}
 return {schemaVersion:'1',requestId:`demo-${name}`,walletId:id,snapshotId:`demo-${name}-${now}`,generation:0,mode:'demo',data,providers,completeness:completeness(providers,data,'Synthetic fixture coverage only'),freshness:f,warnings:[],cursor:providers.find(p=>p.cursor)?.cursor??null};
}
