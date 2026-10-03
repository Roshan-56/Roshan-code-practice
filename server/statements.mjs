import { marked } from 'marked';
import { parseFragment } from 'parse5';
import scenarios from '../lib/scenarios.json' with {type:'json'};
const allowedTags=new Set(['p','div','span','strong','b','em','i','code','pre','ul','ol','li','sup','sub','table','thead','tbody','tr','th','td','blockquote','h2','h3','h4','a','img','br','hr']);
const blockedTags=new Set(['script','style','iframe','object','embed','form','input','button','svg','math','template']);
const imageHosts=new Set(['assets.leetcode.com','assets.leetcode-cn.com','fastly.jsdelivr.net','cdn.jsdelivr.net','raw.githubusercontent.com']);
function sourceURL(problem){
 const match=problem?.solutionSource?.match(/^https:\/\/github\.com\/doocs\/leetcode\/blob\/([a-f0-9]{40})(\/solution\/[^?#]+\/README_EN\.md)$/);
 if(!match)throw new Error('This question has no supported statement source.');
 return 'https://raw.githubusercontent.com/doocs/leetcode/'+match[1]+match[2];
}
function safeLink(value,base,image=false){try{if(image&&base?.startsWith('https://github.com/doocs/leetcode/blob/'))base=base.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/');const u=new URL(value,base);if(u.protocol!=='https:'||u.username||u.password)return '';if(image&&!imageHosts.has(u.hostname))return '';return u.href;}catch{return '';}}
export function plainText(node){if(typeof node==='string')return node;const text=(node.children||[]).map(plainText).join('');return node.tag==='sup'?`^(${text})`:node.tag==='sub'?`_(${text})`:text;}
function convert(node,base){
 if(node.nodeName==='#text')return [node.value];
 if(node.nodeName==='#comment'||blockedTags.has(node.tagName))return [];
 const children=(node.childNodes||[]).flatMap(n=>convert(n,base));
 if(!allowedTags.has(node.tagName))return children;
 const tag=node.tagName;
 const attrs=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
 if(tag==='img'){const src=safeLink(attrs.src,base,true);return src?[{tag,src,alt:attrs.alt||'Problem diagram'}]:[];}
 if(tag==='a'){const href=safeLink(attrs.href,base);return href?[{tag,href,children}]:children;}
 return [{tag,children}];
}
export function parseStatement(markdown,problem){
 const marker=markdown.match(/<!--\s*description:start\s*-->([\s\S]*?)<!--\s*description:end\s*-->/i);
 const fallback=markdown.match(/##\s+Description\s*\n([\s\S]*?)(?=\n##\s+(?:Solutions|Solution)|$)/i);
 const section=marker?.[1]||fallback?.[1];if(!section||section.trim().length<20)throw new Error('The source statement could not be extracted.');
 const base=problem.solutionSource||problem.source;
 const fragment=parseFragment(marked.parse(section,{gfm:true,async:false}));
 const roots=(fragment.childNodes||[]).flatMap(n=>convert(n,base)).filter(n=>typeof n!=='string'||n.trim());
 const out={kind:'source',description:[],examples:[],constraints:[],followUp:[],attribution:{label:'Community source: Doocs contributors. Check the original problem for the current version.',url:problem.solutionSource,license:'https://creativecommons.org/licenses/by-sa/4.0/'}};
 let mode='description',current=null;
 for(const node of roots){
  const text=plainText(node).trim();
  const example=text.match(/^Example\s*(\d+)?\s*[:：.]?$/i);
  if(example){mode='examples';current={title:example[1]?`Example ${example[1]}`:`Example ${out.examples.length+1}`,blocks:[]};out.examples.push(current);continue;}
  if(/^Constraints\s*[:：]?$/i.test(text)){mode='constraints';continue;}
  if(/^Follow[- ]?up\s*[:：]/i.test(text)){mode='followUp';out.followUp.push(node);continue;}
  if(mode==='examples'&&current){
   const io=typeof node==='object'&&node.tag==='pre'?text.match(/^\s*Input\s*:?\s*([\s\S]*?)\n\s*Output\s*:?\s*([\s\S]*?)(?:\n\s*Explanation\s*:?\s*([\s\S]*))?$/i):null;
   if(io&&current.input===undefined){current.input=io[1].trim();current.output=io[2].trim();if(io[3])current.explanation=io[3].trim();}else current.blocks.push(node);
  }else out[mode].push(node);
 }
 if(out.description.map(plainText).join('').trim().length<20)throw new Error('The source did not provide a usable description.');
 return out;
}
export function createStatementService(db,catalog,fetcher=fetch){
 db.exec('CREATE TABLE IF NOT EXISTS statement_cache(source_url TEXT PRIMARY KEY,content TEXT NOT NULL,cached_at INTEGER NOT NULL)');
 const byId=new Map(catalog.map(p=>[p.id,p]));const pending=new Map();let active=0;const queue=[];
 async function gate(){if(active>=4)await new Promise(r=>queue.push(r));active++;}
 function release(){active--;queue.shift()?.();}
 async function load(id){
  if(scenarios[id])return scenarios[id];
  const problem=byId.get(id);if(!problem){const e=new Error('Unknown question.');e.status=404;throw e;}
  const url=sourceURL(problem);const cached=db.prepare('SELECT content FROM statement_cache WHERE source_url=?').get(url);if(cached)return JSON.parse(cached.content);
  if(pending.has(url))return pending.get(url);
  const task=(async()=>{await gate();try{
   const response=await fetcher(url,{signal:AbortSignal.timeout(15000),headers:{Accept:'text/plain'}});
   if(!response.ok)throw new Error(`Statement source returned ${response.status}.`);
   const declared=Number(response.headers?.get('content-length')||0);if(declared>1500000)throw new Error('Statement source is too large.');
   const markdown=await response.text();if(Buffer.byteLength(markdown)>1500000)throw new Error('Statement source is too large.');
   const statement=parseStatement(markdown,problem);db.prepare('INSERT OR REPLACE INTO statement_cache VALUES(?,?,?)').run(url,JSON.stringify(statement),Date.now());return statement;
  }catch(e){e.status=e.status||503;if(e.status===503)e.message='The full question could not be loaded right now. Retry, or open the original LeetCode problem below.';throw e;}finally{release();pending.delete(url);}})();
  pending.set(url,task);return task;
 }
 return {load,has:id=>!!scenarios[id]||byId.has(id)};
}
