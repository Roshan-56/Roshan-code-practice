import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { gzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { LANGUAGE_IDS } from './languages.mjs';
import { createStatementService } from './statements.mjs';
const derive = promisify(scrypt);
const digest = value => createHash('sha256').update(value).digest('hex');
const normalize = title => title.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function canonicalLink(value) {
 if (!value) return null;
 try { const u = new URL(value); if(u.protocol !== 'https:' || u.hostname !== 'leetcode.com' || u.port || u.username || u.password) return null;
 const m = u.pathname.match(/^\/problems\/([a-z0-9-]+)\/(?:description\/)?$/) || u.pathname.match(/^\/problems\/([a-z0-9-]+)$/);
 return m ? `https://leetcode.com/problems/${m[1]}/` : null; } catch { return null; }
}
class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
const fail = (status,message) => { throw new HttpError(status,message); };
export function createApp({dataDir, staticDir, catalog, enhanced, secureCookies=false, appOrigin='', statementFetch=fetch}) {
 mkdirSync(dataDir,{recursive:true});
 const db = new DatabaseSync(resolve(dataDir,'practice.sqlite'));
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,username TEXT NOT NULL UNIQUE COLLATE NOCASE,salt TEXT NOT NULL,hash TEXT NOT NULL,points INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,csrf TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS drafts(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,problem_id TEXT NOT NULL,language TEXT NOT NULL,code TEXT NOT NULL,updated_at INTEGER NOT NULL,PRIMARY KEY(user_id,problem_id,language));
 CREATE TABLE IF NOT EXISTS completions(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,problem_id TEXT NOT NULL,completed INTEGER NOT NULL,PRIMARY KEY(user_id,problem_id));
 CREATE TABLE IF NOT EXISTS questions(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),title TEXT NOT NULL,normalized_title TEXT NOT NULL UNIQUE,difficulty TEXT NOT NULL,topics TEXT NOT NULL,description TEXT NOT NULL,source TEXT UNIQUE,created_at INTEGER NOT NULL);
 PRAGMA user_version=1;`);
 const seeds = [...catalog,...enhanced];
 const statementService=createStatementService(db,catalog,statementFetch);
 const seedIds = new Set(seeds.map(p=>p.id));
 const seedTitles = new Set(seeds.map(p=>normalize(p.title)));
 const seedLinks = new Set(seeds.map(p=>canonicalLink(p.source)).filter(Boolean));
 const topics = new Set(catalog.flatMap(p=>p.topics));
 const buckets = new Map(), gzipCache = new Map();
 function rate(key,max,windowMs) { const now=Date.now(); let b=buckets.get(key); if(!b||b.until<now){b={count:0,until:now+windowMs};buckets.set(key,b);} if(++b.count>max) fail(429,'Too many requests. Try again later.'); if(buckets.size>10000) for(const [k,v] of buckets)if(v.until<now)buckets.delete(k); }
 function session(req) {
  const token = req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('roshan_session='))?.slice(15);
  if(!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return db.prepare('SELECT users.id,username,points,csrf FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires>?').get(digest(token),Date.now()) || null;
 }
 function requireUser(req) { const u=session(req); if(!u)fail(401,'Sign in to save progress or contribute a question.'); return u; }
 function profile(u){return u?{id:u.id,username:u.username,points:u.points}:null;}
 function cookie(res,token,maxAge=86400){res.setHeader('Set-Cookie',`roshan_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureCookies?'; Secure':''}`);}
 function signIn(res,u) { const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex'); db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(digest(token),u.id,csrf,Date.now()+86400000); db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now()); cookie(res,token); return {user:profile(u),csrfToken:csrf}; }
 function writeGuard(req,u) { const origin = appOrigin || `${secureCookies?'https':'http'}://${req.headers.host}`; if(req.headers.origin!==origin)fail(403,'Request origin is not allowed.'); if(u && req.headers['x-csrf-token']!==u.csrf)fail(403,'Your session changed. Refresh and try again.'); }
 async function body(req) { if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'Use JSON for this request.'); let total=0,parts=[];for await(const c of req){total+=c.length;if(total>70000)fail(413,'Request is too large.');parts.push(c);} try{const b=JSON.parse(Buffer.concat(parts).toString());if(!b||typeof b!=='object'||Array.isArray(b))throw Error();return b;}catch{fail(400,'Invalid JSON request.');} }
 const json = (res,status,data) => {res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 function isProblem(id){return typeof id==='string' && (seedIds.has(id) || (/^community-\d+$/.test(id)&&!!db.prepare('SELECT id FROM questions WHERE id=?').get(Number(id.slice(10)))));}
 function contributed(){return db.prepare('SELECT questions.*,users.username FROM questions JOIN users ON users.id=questions.user_id ORDER BY questions.id DESC').all().map(p=>({id:`community-${p.id}`,title:p.title,difficulty:p.difficulty,topics:JSON.parse(p.topics),source:p.source||'',description:p.description,contributor:p.username,companies:[],community:true,createdAt:p.created_at}));}
 const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://assets.leetcode.com https://assets.leetcode-cn.com https://fastly.jsdelivr.net https://cdn.jsdelivr.net https://raw.githubusercontent.com; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  try {
   const url=new URL(req.url,'http://localhost'),path=url.pathname;
   const ip=secureCookies&&typeof req.headers['x-forwarded-for']==='string'?req.headers['x-forwarded-for'].split(',')[0].trim():req.socket.remoteAddress||'unknown';
   const statementRoute=path.match(/^\/api\/problems\/(lc-\d+)\/statement$/);
   if(statementRoute&&req.method==='GET'){rate(`statement:${ip}`,120,60000);return json(res,200,{statement:await statementService.load(statementRoute[1])});}
   if(path==='/api/health'&&req.method==='GET')return json(res,200,{ok:true});
   if(path==='/api/auth/me'&&req.method==='GET'){const u=session(req);return json(res,200,{user:profile(u),csrfToken:u?.csrf||''});}
   if(path==='/api/auth/register'&&req.method==='POST'){
    writeGuard(req); rate(`register:${ip}`,8,3600000);const b=await body(req);
    if(typeof b.username!=='string'||!/^[a-zA-Z0-9_]{3,24}$/.test(b.username))fail(400,'Use 3–24 letters, numbers, or underscores for your username.');
    if(typeof b.password!=='string'||b.password.length<10||b.password.length>128)fail(400,'Use a password of 10–128 characters.');
    const salt=randomBytes(16).toString('hex'),hash=(await derive(b.password,salt,64)).toString('hex');
    let id;try{id=db.prepare('INSERT INTO users(username,salt,hash,created_at) VALUES(?,?,?,?)').run(b.username,salt,hash,Date.now()).lastInsertRowid;}catch(e){if(String(e).includes('UNIQUE'))fail(409,'That username is already taken.');throw e;}
    return json(res,201,signIn(res,db.prepare('SELECT id,username,points FROM users WHERE id=?').get(id)));
   }
   if(path==='/api/auth/login'&&req.method==='POST'){
    writeGuard(req);rate(`login:${ip}`,25,900000);const b=await body(req);
    if(typeof b.username!=='string'||typeof b.password!=='string'||b.password.length>128)fail(400,'Enter your username and password.');
    const u=db.prepare('SELECT * FROM users WHERE username=?').get(b.username);
    const actual=await derive(b.password,u?.salt||'00000000000000000000000000000000',64),expected=u?Buffer.from(u.hash,'hex'):Buffer.alloc(64);
    if(!timingSafeEqual(actual,expected)||!u)fail(401,'Username or password is incorrect.');
    return json(res,200,signIn(res,u));
   }
   if(path==='/api/auth/logout'&&req.method==='POST'){
    const u=requireUser(req);writeGuard(req,u);const token=req.headers.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('roshan_session=')).slice(15);db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token));cookie(res,'',0);return json(res,200,{ok:true});
   }
   if(path==='/api/questions'&&req.method==='GET')return json(res,200,{questions:contributed()});
   if(path==='/api/questions'&&req.method==='POST'){
    const u=requireUser(req);writeGuard(req,u);rate(`contribute:${u.id}`,10,3600000);const b=await body(req);
    if(typeof b.title!=='string'||b.title.trim().length<5||b.title.length>140)fail(400,'Use a descriptive title of 5–140 characters.');
    if(!['Easy','Medium','Hard'].includes(b.difficulty))fail(400,'Choose Easy, Medium, or Hard.');
    if(!Array.isArray(b.topics)||!b.topics.length||b.topics.length>5||b.topics.some(t=>!topics.has(t)))fail(400,'Choose between 1 and 5 catalog topics.');
    if(typeof b.description!=='string'||b.description.trim().length<100||b.description.length>8000)fail(400,'Write an original statement of 100–8,000 characters, including input, output, and an example.');
    const link=canonicalLink(b.source);if(b.source&&!link)fail(400,'Use an https://leetcode.com/problems/.../ URL.');
    const title=b.title.trim(),normalized=normalize(title);if(normalized.length<5)fail(400,'Use a meaningful question title.');
    if(seedTitles.has(normalized)||(link&&seedLinks.has(link)))fail(409,'This question is already in the library. Find it using search.');
    const count=db.prepare('SELECT count(*) AS n FROM questions WHERE user_id=? AND created_at>?').get(u.id,Date.now()-86400000).n;
    if(count>=5)fail(429,'You can add up to 5 questions per day. Come back tomorrow.');
    db.exec('BEGIN IMMEDIATE');let id;
    try{ id=db.prepare('INSERT INTO questions(user_id,title,normalized_title,difficulty,topics,description,source,created_at) VALUES(?,?,?,?,?,?,?,?)').run(u.id,title,normalized,b.difficulty,JSON.stringify([...new Set(b.topics)]),b.description.trim(),link,Date.now()).lastInsertRowid;db.prepare('UPDATE users SET points=points+10 WHERE id=?').run(u.id);db.exec('COMMIT'); }
    catch(e){db.exec('ROLLBACK');if(String(e).includes('UNIQUE'))fail(409,'This question is already in the library. Duplicate submissions do not earn points.');throw e;}
    return json(res,201,{question:contributed().find(p=>p.id===`community-${id}`),user:profile(db.prepare('SELECT * FROM users WHERE id=?').get(u.id)),pointsEarned:10});
   }
   if(path==='/api/practice'){
    const u=requireUser(req);
    if(req.method==='GET')return json(res,200,{drafts:db.prepare('SELECT problem_id,language,code FROM drafts WHERE user_id=?').all(u.id),completions:db.prepare('SELECT problem_id,completed FROM completions WHERE user_id=?').all(u.id)});
    if(req.method==='POST'){
     writeGuard(req,u);rate(`save:${u.id}`,180,60000);const b=await body(req);if(!isProblem(b.problemId))fail(400,'Unknown problem.');
     if(b.action==='draft'){
      if(!LANGUAGE_IDS.includes(b.language)||typeof b.code!=='string'||b.code.length>50000)fail(400,'Choose a supported language and a draft up to 50,000 characters.');
      db.prepare('INSERT INTO drafts VALUES(?,?,?,?,?) ON CONFLICT(user_id,problem_id,language) DO UPDATE SET code=excluded.code,updated_at=excluded.updated_at').run(u.id,b.problemId,b.language,b.code,Date.now());
     }else if(b.action==='complete'&&typeof b.completed==='boolean')db.prepare('INSERT INTO completions VALUES(?,?,?) ON CONFLICT(user_id,problem_id) DO UPDATE SET completed=excluded.completed').run(u.id,b.problemId,b.completed?1:0);
     else fail(400,'Invalid practice action.');return json(res,200,{ok:true});
    }
   }
   if(path.startsWith('/api/'))return json(res,404,{error:'API route not found.'});
   if(req.method!=='GET'&&req.method!=='HEAD')fail(405,'Method not allowed.');
   let decoded;try{decoded=decodeURIComponent(path);}catch{fail(400,'Invalid path.');}
   let file=resolve(staticDir,'.'+decoded);if(!file.startsWith(resolve(staticDir)+sep)&&file!==resolve(staticDir))fail(403,'Invalid path.');
   if(!existsSync(file)||!statSync(file).isFile()){if(extname(decoded))fail(404,'File not found.');file=resolve(staticDir,'index.html');}
   if(!existsSync(file))fail(503,'Build the frontend with npm run build.');
   const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
   let payload=readFileSync(file);
   if(/(?:^|,)\s*gzip(?:[,;]|$)/.test(req.headers['accept-encoding']||'')&&['.js','.css','.html'].includes(extname(file))){const cached=file.includes(`${sep}assets${sep}`);payload=cached&&gzipCache.has(file)?gzipCache.get(file):gzipSync(payload);if(cached)gzipCache.set(file,payload);res.setHeader('Content-Encoding','gzip');res.setHeader('Vary','Accept-Encoding');}
   res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':extname(file)==='.html'?'no-cache':file.includes(`${sep}assets${sep}`)?'public, max-age=31536000, immutable':'public, max-age=3600'});res.end(req.method==='HEAD'?undefined:payload);
  }catch(e){if(!res.headersSent)json(res,e.status||500,{error:e.status?e.message:'Something went wrong. Try again.'});else res.end();if(!e.status)console.error('Request failed:',e.message);}
 });
 return {server,db,close:async()=>{await new Promise((r,j)=>server.close(e=>e?j(e):r()));db.close();}};
}
