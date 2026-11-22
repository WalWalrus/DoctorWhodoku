const assert=require('node:assert/strict');
globalThis.fetch=function(){assert.equal(this,globalThis);return Promise.resolve({ok:true,json:async()=>({ok:true})});};
const Publisher=require('./github-publisher.js');const p=new Publisher();p.token='test-only';
p.api('git/ref/heads/main').then(()=>console.log('PASS: default fetch context')).catch(e=>{console.error(e);process.exitCode=1});
