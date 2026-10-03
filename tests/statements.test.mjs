import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createStatementService,parseStatement,plainText} from '../server/statements.mjs';
const source='https://github.com/doocs/leetcode/blob/8c570e97ba7b0320392853a8769a6fcb2c277bfa/solution/0000-0099/0001.Two%20Sum/README_EN.md';
const problem={id:'lc-1',source:'https://leetcode.com/problems/two-sum/',solutionSource:source};
const markdown=`<!-- description:start -->
<p>A warehouse receives a list of integer weights. Find the index of the largest weight; choose the first index when values tie.</p>
<p><strong>Example 1:</strong></p>
<pre><strong>Input:</strong> weights = [2, 8, 5]
<strong>Output:</strong> 1
<strong>Explanation:</strong> The largest weight is at index 1.</pre>
<p><strong>Constraints:</strong></p><ul><li>1 &lt;= n &lt;= 10<sup>5</sup></li></ul>
<p><strong>Follow-up:</strong> Can you solve it in one pass?</p>
<!-- description:end -->
## Solutions
This solution must never be included in the question.`;
test('full scenario, input/output, explanations, constraints, and follow-up are preserved',()=>{const result=parseStatement(markdown,problem);assert.match(result.description.map(plainText).join(''),/warehouse/);assert.equal(result.examples.length,1);assert.equal(result.examples[0].input,'weights = [2, 8, 5]');assert.equal(result.examples[0].output,'1');assert.equal(result.examples[0].explanation,'The largest weight is at index 1.');assert.match(result.constraints.map(plainText).join(''),/10\^\(5\)/);assert.match(result.followUp.map(plainText).join(''),/one pass/);assert.ok(!JSON.stringify(result).includes('This solution'));});
test('unsafe tags, event handlers, URLs, and images are excluded from source content',()=>{const attack=markdown.replace('<!-- description:start -->','<!-- description:start --><script>alert(1)</script><iframe src="https://evil.test"></iframe><p><a href="javascript:alert(2)">bad link</a><img src="https://evil.test/tracking.png" onerror="alert(3)"></p>');const text=JSON.stringify(parseStatement(attack,problem));assert.ok(!text.includes('alert('));assert.ok(!text.includes('javascript:'));assert.ok(!text.includes('tracking.png'));assert.ok(!text.includes('iframe'));});
test('SQL schemas and multiline table input/output survive the same parser',()=>{const md=`<!-- description:start -->
<p>A store tracks products and sales. Return products without sales.</p><table><tr><th>Column</th><th>Type</th></tr><tr><td>id</td><td>integer</td></tr></table>
<p><strong>Example 1:</strong></p><pre>Input:
Products table:
+----+
| id |
+----+
| 1  |
+----+
Output:
+----+
| id |
+----+
| 1  |
+----+</pre>
<!-- description:end -->`;
const r=parseStatement(md,problem);assert.ok(r.description.some(n=>n.tag==='table'));assert.match(r.examples[0].input,/Products table/);assert.match(r.examples[0].output,/\| 1  \|/);});
test('Phone Number is available offline with a complete scenario and correct example outputs',async()=>{const db=new DatabaseSync(':memory:');const reader=createStatementService(db,[],()=>{throw Error('Network must not be used for the bundled scenario');});const statement=await reader.load('lc-17');assert.match(statement.description.map(plainText).join(''),/telephone keypad/);assert.ok(statement.constraints.length);const mapping={2:'abc',3:'def',4:'ghi',5:'jkl',6:'mno',7:'pqrs',8:'tuv',9:'wxyz'};for(const example of statement.examples){const digits=JSON.parse(example.input.split('=')[1].trim());let expected=[''];for(const d of digits)expected=expected.flatMap(prefix=>[...mapping[d]].map(letter=>prefix+letter));assert.deepEqual(JSON.parse(example.output).sort(),expected.sort());}db.close();});
test('first reads are deduplicated and persisted for subsequent offline access',async()=>{const db=new DatabaseSync(':memory:');let calls=0;const fetcher=async url=>{calls++;assert.ok(url.startsWith('https://raw.githubusercontent.com/doocs/leetcode/'));return new Response(markdown,{status:200});};const reader=createStatementService(db,[problem],fetcher);const [a,b]=await Promise.all([reader.load('lc-1'),reader.load('lc-1')]);assert.deepEqual(a,b);assert.equal(calls,1);const offline=createStatementService(db,[problem],()=>{throw Error('offline');});assert.deepEqual(await offline.load('lc-1'),a);await assert.rejects(reader.load('lc-999999'),/Unknown question/);db.close();});
test('invalid or missing source content returns a recoverable failure without poisoning cache',async()=>{const db=new DatabaseSync(':memory:');let fail=true;const reader=createStatementService(db,[problem],async()=>new Response(fail?'Unrelated page':markdown,{status:200}));await assert.rejects(reader.load('lc-1'),e=>e.status===503);assert.equal(db.prepare('SELECT count(*) AS n FROM statement_cache').get().n,0);fail=false;const r=await reader.load('lc-1');assert.equal(r.examples.length,1);db.close();});
test('design-operation examples with Input/Output labels without colons use input/output cards',()=>{const md=markdown.replace('Input:</strong> weights = [2, 8, 5]','Input</strong>\n["Inventory", "largest"]\n[[], [2, 8, 5]]').replace('Output:</strong> 1','Output</strong>\n[null, 1]').replace('Explanation:</strong>','Explanation</strong>');const r=parseStatement(md,problem);assert.match(r.examples[0].input,/Inventory/);assert.equal(r.examples[0].output,'[null, 1]');assert.ok(r.examples[0].explanation);});
