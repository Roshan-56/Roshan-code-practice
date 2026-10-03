import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from './app.mjs';
const root=resolve(import.meta.dirname,'..');
const app=createApp({dataDir:process.env.DATA_DIR||resolve(root,'data'),staticDir:resolve(root,'dist'),catalog:JSON.parse(readFileSync(resolve(root,'lib/catalog.json'))),enhanced:JSON.parse(readFileSync(resolve(root,'lib/problems.json'))),secureCookies:process.env.NODE_ENV==='production',appOrigin:process.env.APP_ORIGIN||process.env.RENDER_EXTERNAL_URL||''});
app.server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log(`Roshan code practice is listening on port ${process.env.PORT||3000}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>app.close().then(()=>process.exit(0)));
