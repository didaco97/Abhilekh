import {spawn} from 'node:child_process';
import {setTimeout} from 'node:timers/promises';
import {readdir,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';

const child=spawn(process.execPath,['server/index.js'],{cwd:process.cwd(),env:{...process.env,PORT:'5174',HOST:'127.0.0.1',APP_ORIGIN:'http://127.0.0.1:5174'},stdio:'ignore',windowsHide:true});
try {
  let ready=false;
  for(let i=0;i<30;i++) {
    try {ready=(await fetch('http://127.0.0.1:5174')).ok;} catch {}
    if(ready) break;
    await setTimeout(100);
  }
  assert.ok(ready,'Production server did not start');
  assert.equal((await fetch('http://127.0.0.1:5174/.env.local')).status,404);
  assert.equal((await fetch('http://127.0.0.1:5174/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"query":""}'})).status,400);
  for(const entry of await readdir('dist/assets')) {
    if(!/\.(js|css|json)$/.test(entry)) continue;
    const contents=await readFile(resolve('dist/assets',entry),'utf8');
    assert.ok(!/pplx-|PERPLEXITY_API_KEY|api\.perplexity\.ai/.test(contents),'Server-only configuration found in client build');
  }
  console.log('Production checks passed: page, API validation, secret-file exclusion and browser bundle separation. No paid API request made.');
} finally {child.kill();}
