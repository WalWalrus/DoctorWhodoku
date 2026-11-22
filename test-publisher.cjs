const assert=require('node:assert/strict'),Publisher=require('./github-publisher.js');
const names=['characters','episodes','appearances','categories'];
function mock({changed=false,race=false,denied=false}={}){
 const calls=[];let reads=0;
 const request=async(url,options)=>{
  assert(url.startsWith('https://api.github.com/repos/WalWalrus/DoctorWhodoku/'));calls.push({url,...options});
  const p=url.split('/DoctorWhodoku/')[1];let value;
  if(denied)return {ok:false,status:401};
  if(p==='git/ref/heads/main'){reads++;value={object:{sha:'head'}};}
  else if(p==='git/commits/head')value={tree:{sha:'base'}};
  else if(p==='git/trees/base')value={tree:names.map(n=>({path:n+'.json',type:'blob',sha:changed&&reads>1?'changed':n}))};
  else if(p.startsWith('git/blobs/'))value={encoding:'base64',content:Buffer.from('[]').toString('base64')};
  else if(p==='git/trees')value={sha:'newtree',tree:names.map(n=>({path:n+'.json',sha:'new-'+n}))};
  else if(p==='git/commits')value={sha:'newcommit'};
  else if(p==='git/refs/heads/main'){assert.equal(JSON.parse(options.body).force,false);if(race)return {ok:false,status:422};value={};}
  else throw Error('Unexpected path '+p);
  return {ok:true,json:async()=>value};
 };return {calls,request};
}
(async()=>{
 const data=Object.fromEntries(names.map(n=>[n,[]]));
 const m=mock(),p=new Publisher(m.request);await assert.rejects(()=>p.publish(data),/Connect/);
 await p.connect('test-token');assert.deepEqual(await p.readData(),data);await p.publish(data);
 const writes=m.calls.filter(c=>c.method!=='GET');assert.equal(writes.length,3);
 assert.deepEqual(JSON.parse(writes[0].body).tree.map(x=>x.path),names.map(n=>n+'.json'));
 assert.equal(JSON.parse(writes[0].body).base_tree,'base');assert.deepEqual(JSON.parse(writes[1].body).parents,['head']);
 assert.equal(p.baseline.head,'newcommit');p.disconnect();assert.equal(p.token,'');
 const conflict=mock({changed:true}),c=new Publisher(conflict.request);await c.connect('test');await assert.rejects(()=>c.publish(data),/changed since/);assert(!conflict.calls.some(x=>x.method!=='GET'));
 const race=mock({race:true}),r=new Publisher(race.request);await r.connect('test');await assert.rejects(()=>r.publish(data),/branch changed/);assert.equal(r.busy,false);assert.equal(r.baseline.head,'head');
 const denied=new Publisher(mock({denied:true}).request);await assert.rejects(()=>denied.connect('bad'),/authentication/);assert.equal(denied.token,'');
 console.log('PASS: fixed GitHub destination, atomic four-file commit, no force, conflict/race rejection, auth failure cleanup and disconnect.');
})().catch(e=>{console.error(e);process.exitCode=1});
