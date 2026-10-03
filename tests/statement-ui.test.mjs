import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=resolve(import.meta.dirname,'..');
const source=readFileSync(resolve(root,'app/problem-statement.tsx'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const file=resolve(root,`.statement-render-${process.pid}.mjs`);let component;
try{writeFileSync(file,compiled);component=await import(pathToFileURL(file).href);}finally{unlinkSync(file);}
const scenarios=JSON.parse(readFileSync(resolve(root,'lib/scenarios.json')));
test('the Phone Number scenario renders full task, mapping, input/output cards, and constraints',()=>{const html=renderToStaticMarkup(createElement(component.StatementDetail,{statement:scenarios['lc-17']}));for(const required of ['telephone keypad','EXAMPLES','Example 1','Example 2','Example 3','INPUT','OUTPUT','CONSTRAINTS','1 and 4'])assert.ok(html.includes(required),required);assert.match(html,/<table>/);assert.match(html,/<code/);assert.ok(html.indexOf('EXAMPLES')<html.indexOf('CONSTRAINTS'));});
test('the original LeetCode reference is placed after the question and constraints',()=>{const g=JSON.parse(readFileSync(resolve(root,'lib/problems.json')))[0];const html=renderToStaticMarkup(createElement(component.ProblemStatement,{problem:{...g,guided:g,topics:['Array'],companies:[]}}));assert.ok(html.indexOf('CONSTRAINTS')<html.indexOf('Practice the original question'));assert.ok(html.includes(g.source));assert.match(html,/Original problem on LeetCode/);});
test('source text is escaped instead of being injected as executable HTML',()=>{const statement={...scenarios['lc-17'],description:[{tag:'p',children:['<script>bad()</script>']},{tag:'script',children:['bad()']} ]};const html=renderToStaticMarkup(createElement(component.StatementDetail,{statement}));assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));});
