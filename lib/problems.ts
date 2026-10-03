import data from './problems.json';
import catalog from './catalog.json';
export type { Language } from './languages';
import { languageInfo, type Language } from './languages';
export type GuidedProblem = {
 id:string;title:string;category:string;difficulty:string;pattern:string;description:string;
 constraints:string[];examples:{input:string;output:string;note:string}[];hints:string[];steps:string[];
 solutions:Partial<Record<Language,string>>;starters:Partial<Record<Language,string>>;
 time:string|Partial<Record<Language,string>>;space:string;complexityExplanation:string;source:string;
};
export type CatalogProblem = {
 id:string;number?:number;title:string;difficulty:string;topics:string[];source:string;solutionSource?:string;
 companies:string[];description?:string;community?:boolean;contributor?:string;createdAt?:number;
 guided?:GuidedProblem;
};
export const guidedProblems = data as GuidedProblem[];
const key = (url:string) => url.replace(/\/$/,'');
export const seedProblems:CatalogProblem[] = (catalog as CatalogProblem[]).map(p=>{
 const guided=guidedProblems.find(g=>g.source&&key(g.source)===key(p.source));
 return guided?{...p,id:guided.id,guided}:p;
});
for(const guided of guidedProblems)if(!seedProblems.some(p=>p.id===guided.id))seedProblems.push({id:guided.id,title:guided.title,difficulty:guided.difficulty,topics:[guided.category==='Graphs'?'Graph':guided.category==='Trees'?'Tree':guided.category==='Arrays'?'Array':guided.category==='Searching'?'Binary Search':'Dynamic Programming'],source:guided.source,companies:[],guided});
export const topics = [...new Set(seedProblems.flatMap(p=>p.topics))].sort();
export const companies = [...new Set(seedProblems.flatMap(p=>p.companies))].sort();
export const complexityOptions = ['O(1)','O(log n)','O(n)','O(n log n)','O(n²)','O(n³)','O(2ⁿ)','O(n!)','O(V + E)','O(V²)','O(V)','O(h)','O(k × A)','O(A)','O(n × S)','O(S)'];
export function starterFor(p:CatalogProblem,l:Language){return p.guided?.starters[l]??languageInfo(l).starter;}
export function expectedTime(p:GuidedProblem,l:Language){return typeof p.time==='string'?p.time:p.time[l];}
export function checkComplexity(p:GuidedProblem,l:Language,time:string,space:string){return{timeCorrect:time===expectedTime(p,l),spaceCorrect:space===p.space};}
export function strategyHints(p:CatalogProblem){
 const tags=p.topics;
 const first='Write down the input, output, and constraints from the question statement. Manually trace the smallest valid case and one boundary case.';
 let second='Describe a correct brute-force approach before optimizing. Identify repeated work and choose a data structure that avoids it.';
 if(tags.includes('Dynamic Programming'))second='Try defining a state with a precise meaning. Work out the transition, base cases, and evaluation order; then check whether previous rows can be discarded.';
 else if(tags.includes('Graph'))second='Choose an adjacency representation and identify whether you need connectivity, traversal order, or shortest paths. Distinguish directed from undirected edges.';
 else if(tags.includes('Tree')||tags.includes('Binary Tree'))second='Decide what each subtree should return to its parent. Trace a leaf, a single-child node, and a skewed tree before combining results.';
 else if(tags.includes('Binary Search'))second='Find a monotonic condition. State your interval invariant and check how both bounds change when the condition is true or false.';
 else if(tags.includes('Sliding Window'))second='Ask what makes a window valid and what changes when you extend it. Check whether validity can be restored by moving the left boundary.';
 else if(tags.includes('Hash Table'))second='Ask which information you need to remember from earlier elements. Choose a lookup key and decide whether to query before or after inserting the current value.';
 else if(tags.includes('Database'))second='Write down the required rows and grouping keys. Consider joins, NULL values, duplicates, and whether filtering belongs before or after aggregation.';
 return [first,second,'Count how often each input element or state is visited. Include recursion, queues, tables, and sorting memory in your space bound. Test duplicate values, empty inputs when allowed, and extreme cases.'];
}
