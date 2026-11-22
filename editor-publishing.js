(function(){
'use strict';
const publisher=new GitHubPublisher(), status=el('publish-status');let connectedData=null,working=false;
const message=s=>{status.textContent=s;};
function buttons(){el('github-connect').disabled=working;el('github-disconnect').disabled=working||!publisher.token;el('publish-all').disabled=working||!connectedData;}
el('github-connect').onclick=async()=>{
 working=true;buttons();message('Connecting to GitHub…');const token=el('github-token').value;el('github-token').value='';connectedData=null;
 try{await publisher.connect(token);connectedData=await publisher.readData();const issues=validate(connectedData);if(issues.length)throw Error('Published data needs repair before publishing.');message('Connected to DoctorWhodoku. Publish all changes will show a comparison before saving.');}
 catch(e){publisher.disconnect();connectedData=null;message(e.message);}
 finally{working=false;buttons();}
};
el('github-disconnect').onclick=()=>{publisher.disconnect();connectedData=null;el('github-token').value='';buttons();message('Disconnected. Local draft kept.');};
el('publish-all').onclick=async()=>{
 if(working||!connectedData)return;
 const issues=validate(data);if(issues.length){message('Fix validation errors before publishing: '+issues.join(' '));return;}
 const snapshot=clone(data),names=['characters','episodes','appearances','categories'];
 const summary=names.map(n=>{
  const key=r=>n==='appearances'?JSON.stringify([r.characterId,r.episodeId]):r.id;
  const old=new Map(connectedData[n].map(r=>[key(r),r])),next=new Map(snapshot[n].map(r=>[key(r),r]));
  return n+': '+[...next].filter(([id])=>!old.has(id)).length+' added, '+[...old].filter(([id])=>!next.has(id)).length+' removed, '+[...next].filter(([id,r])=>old.has(id)&&JSON.stringify(old.get(id))!==JSON.stringify(r)).length+' changed';
 }).join('\n');
 if(!confirm('Publish this saved draft to the live game?\n\n'+summary+'\n\nThis replaces all four published data files together. Check removals carefully if this is an older draft. Unsaved form inputs are not included.'))return;
 working=true;buttons();message('Publishing all four files…');
 try{
  const result=await publisher.publish(snapshot);connectedData=snapshot;
  // Edits made while the request ran are deliberately kept for the next publish.
  const more=JSON.stringify(data)!==JSON.stringify(snapshot);if(!more)dirty=false;
  message((result.unchanged?'These files already match GitHub.':'Saved to GitHub ('+result.sha.slice(0,7)+'). The live game updates when GitHub Pages finishes deploying.')+(more?' You have additional local edits to publish.':''));
 }catch(e){message(e.message+' No local edits were discarded. If the connection dropped during publishing, reconnect to check GitHub before retrying.');}
 finally{working=false;buttons();}
};
window.addEventListener('draft-saved',()=>{if(!working)message('Unpublished changes saved on this device.'+(connectedData?' Ready to publish.':' Connect to GitHub to publish.'));});
window.addEventListener('pagehide',()=>publisher.disconnect());
})();
