/* Credentials live only in this instance's memory; requests go only to GitHub. */
(function(root){
'use strict';
const names=['characters','episodes','appearances','categories'];
class Publisher{
 constructor(request=globalThis.fetch){this.request=request;this.token='';this.baseline=null;this.busy=false;}
 disconnect(){this.token='';this.baseline=null;}
 async api(path,method='GET',body){
  if(!this.token)throw Error('Connect to GitHub first.');
  const response=await this.request('https://api.github.com/repos/WalWalrus/DoctorWhodoku/'+path,{method,cache:'no-store',headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+this.token,'Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok)throw Error(response.status===401?'GitHub authentication expired or is invalid. Reconnect.':response.status===403?'GitHub denied access. Check token Contents permission, expiry and rate limits.':response.status===409||response.status===422?'GitHub rejected the update: the branch changed or a branch rule prevents publishing. Your draft is safe.':'GitHub request failed (HTTP '+response.status+'). Your draft is safe.');
  return response.json();
 }
 async snapshot(){
  const ref=await this.api('git/ref/heads/main');const commit=await this.api('git/commits/'+ref.object.sha);const tree=await this.api('git/trees/'+commit.tree.sha);
  if(tree.truncated)throw Error('Could not read the complete repository tree.');
  const files=Object.fromEntries(names.map(n=>{const e=tree.tree.find(e=>e.path===n+'.json'&&e.type==='blob');if(!e)throw Error('Missing published '+n+'.json');return[n,e.sha]}));
  return {head:ref.object.sha,tree:commit.tree.sha,files};
 }
 async connect(token){
  this.disconnect();this.token=token.trim();
  try{this.baseline=await this.snapshot();return this.baseline;}catch(e){this.disconnect();throw e;}
 }
 async readData(snapshot=this.baseline){
  const values=await Promise.all(names.map(async n=>{const b=await this.api('git/blobs/'+snapshot.files[n]);if(b.encoding!=='base64')throw Error('Unsupported GitHub data encoding.');return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b.content.replace(/\s/g,'')),c=>c.charCodeAt(0))));}));
  return Object.fromEntries(names.map((n,i)=>[n,values[i]]));
 }
 async publish(data){
  if(this.busy)throw Error('A publish is already running.');
  if(!this.baseline)throw Error('Connect to GitHub first.');
  this.busy=true;
  try{
   const current=await this.snapshot();
   if(names.some(n=>current.files[n]!==this.baseline.files[n]))throw Error('Published data changed since you connected. Disconnect and reconnect to compare the latest version before publishing. Your draft is safe.');
   const tree=await this.api('git/trees','POST',{base_tree:current.tree,tree:names.map(n=>({path:n+'.json',mode:'100644',type:'blob',content:JSON.stringify(data[n],null,2)+'\n'}))});
   if(tree.sha===current.tree)return {unchanged:true,sha:current.head};
   const commit=await this.api('git/commits','POST',{message:'Publish Doctor Whodoku editor data',tree:tree.sha,parents:[current.head]});
   await this.api('git/refs/heads/main','PATCH',{sha:commit.sha,force:false});
   // Retain the exact committed snapshot, never silently adopt a later writer's data.
   this.baseline={head:commit.sha,tree:tree.sha,files:Object.fromEntries(names.map(n=>[n,tree.tree.find(e=>e.path===n+'.json').sha]))};
   return {sha:commit.sha};
  }finally{this.busy=false;}
 }
}
root.GitHubPublisher=Publisher;if(typeof module!=='undefined')module.exports=Publisher;
})(globalThis);
