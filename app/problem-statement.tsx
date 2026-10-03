import { Fragment,createElement,useEffect,useState } from 'react';
import { ExternalLink,Globe,RefreshCw } from 'lucide-react';
import type { CatalogProblem } from '@/lib/problems';
import type { RichNode,Statement } from '@/lib/statement';
const permitted=new Set(['p','div','span','strong','b','em','i','code','pre','ul','ol','li','sup','sub','table','thead','tbody','tr','th','td','blockquote','h2','h3','h4','a','img','br','hr']);
function RichContent({nodes}:{nodes:RichNode[]}){return <>{nodes.map((n,i)=><Fragment key={i}>{renderNode(n)}</Fragment>)}</>;}
function renderNode(node:RichNode):React.ReactNode{
 if(typeof node==='string')return node;
 if(!permitted.has(node.tag))return null;
 if(node.tag==='img'){if(!node.src?.startsWith('https://'))return null;return <img className="statement-diagram" src={node.src} alt={node.alt||'Problem diagram'} loading="lazy" referrerPolicy="no-referrer"/>;}
 if(node.tag==='br'||node.tag==='hr')return createElement(node.tag);
 const children=<RichContent nodes={node.children||[]}/>;
 if(node.tag==='a')return node.href?.startsWith('https://')?<a href={node.href} target="_blank" rel="noopener noreferrer">{children}</a>:children;
 if(node.tag==='table')return <div className="statement-table-scroll"><table>{children}</table></div>;
 return createElement(node.tag,null,children);
}
export function StatementDetail({statement}:{statement:Statement}){return <><div className="statement-content description"><RichContent nodes={statement.description}/></div>{statement.examples.length>0&&<><h2 className="section-label">EXAMPLES</h2><div className="examples">{statement.examples.map((example,i)=><div className="example" key={i}><div className="example-title">{example.title}</div>{example.input!==undefined&&example.output!==undefined&&<div className="example-io"><small>INPUT</small><code>{example.input}</code><small>OUTPUT</small><code className="example-output">{example.output}</code></div>}{example.explanation&&<p className="example-explanation">{example.explanation}</p>}<div className="statement-content example-extra"><RichContent nodes={example.blocks}/></div></div>)}</div></>}{statement.constraints.length>0&&<><h2 className="section-label">CONSTRAINTS</h2><div className="statement-content statement-constraints"><RichContent nodes={statement.constraints}/></div></>}{statement.followUp.length>0&&<><h2 className="section-label">FOLLOW-UP</h2><div className="statement-content"><RichContent nodes={statement.followUp}/></div></>}<p className="version-note">{statement.attribution.label} <a href={statement.attribution.url} target="_blank" rel="noopener noreferrer">Source</a>{statement.attribution.license&&<> · <a href={statement.attribution.license} target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a></>}</p></>;}
export function ProblemStatement({problem:p}:{problem:CatalogProblem}){
 const [statement,setStatement]=useState<Statement|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{if(p.guided||p.community)return;const controller=new AbortController();setStatement(null);setError('');setLoading(true);fetch(`/api/problems/${encodeURIComponent(p.id)}/statement`,{signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error||'Could not load the full question.');return data.statement as Statement;}).then(setStatement).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[p.id,p.guided,p.community,retry]);
 const g=p.guided;
 return <>
 {g?<><p className="description">{g.description}</p><h2 className="section-label">EXAMPLES</h2><div className="examples">{g.examples.map((ex,i)=><div className="example" key={i}><div className="example-title">Example {i+1}</div><div className="example-io"><small>INPUT</small><code>{ex.input}</code><small>OUTPUT</small><code className="example-output">{ex.output}</code></div><p>{ex.note}</p></div>)}</div><h2 className="section-label">CONSTRAINTS</h2><ul className="constraints">{g.constraints.map(x=><li key={x}>{x}</li>)}</ul><p className="version-note">Practice statement is paraphrased. Reference functions are available in Python and C.</p></>:p.community?<><p className="community-attribution">Submitted by {p.contributor} · Community content, not independently reviewed.</p><p className="description question-statement">{p.description}</p></>:<>
 {loading&&<div className="statement-loading" role="status"><RefreshCw size={16}/>Loading the full question, examples, and constraints…</div>}
 {error&&<div className="statement-error" role="alert"><p>{error}</p><button className="secondary-action" onClick={()=>setRetry(x=>x+1)}>Retry question</button></div>}
 {statement&&<StatementDetail statement={statement}/>}
 </>}
 {p.source&&<section className="original-reference"><div><Globe size={17}/><h2>Practice the original question</h2></div><p>The original LeetCode page is available for reference, reviewing the latest statement, and running or submitting your solution.</p><a className="source-link" href={p.source} target="_blank" rel="noopener noreferrer">Original problem on LeetCode<ExternalLink size={13}/></a></section>}
 </>;
}
