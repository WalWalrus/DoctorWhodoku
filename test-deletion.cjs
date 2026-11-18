const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const D=require('./editor-data'),C=require('./category-config');
const seed=Object.fromEntries(['characters','episodes','appearances','categories'].map(k=>[k,JSON.parse(fs.readFileSync(__dirname+'/'+k+'.json'))]));
const before=JSON.stringify(seed);
const gone=D.removeRecord(seed,'category','tardis');assert(!gone.categories.some(c=>c.id==='tardis'));assert(gone.characters.every(c=>!Object.hasOwn(c.storyTraits||{},'tardis')));assert.deepEqual(gone.appearances,seed.appearances);assert.deepEqual(D.validate(gone),[]);
const type=seed.characters.find(c=>seed.characters.some(p=>p.typeIds?.includes(c.id)));assert(type);
const removed=D.removeRecord(seed,'character',type.id);assert(!removed.characters.some(c=>c.id===type.id));assert(!removed.appearances.some(a=>a.characterId===type.id));assert(!removed.characters.some(c=>c.typeIds?.includes(type.id)));assert.deepEqual(removed.episodes,seed.episodes);assert.deepEqual(D.validate(removed),[]);assert.equal(JSON.stringify(seed),before);
assert.throws(()=>D.removeRecord(seed,'character','not-here'));assert.throws(()=>D.removeRecord(seed,'episode','s01e01'));
const episodesOnly=D.removeRecord(seed,'category','episode-appearance');assert.deepEqual(episodesOnly.appearances,seed.appearances);
const elements=new Map();function element(){return {value:'',checked:false,options:[],children:[],append(...xs){this.children.push(...xs);this.options.push(...xs.filter(x=>x?.tag==='option'));},replaceChildren(){this.children=[];this.options=[];},reset(){},focus(){},scrollIntoView(){}};}
const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement(tag){return {...element(),tag};},querySelectorAll(){return []}};
let allow=false,confirmation='';const context=vm.createContext({document,CategoryConfig:C,EditorData:D,localStorage:{setItem(){},getItem(){}},console,seed:structuredClone(seed),confirm:s=>{confirmation=s;return allow;}});
const script=fs.readFileSync(__dirname+'/data-editor.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace('loadFact();loadPublished();','');vm.runInContext(script,context);const run=s=>vm.runInContext(s,context);run('data=seed;refresh();');
run('el("category-select").value="tardis";el("category-select").onchange();');assert.equal(document.getElementById('delete-category').disabled,false);
run('deleteSelected("category")');assert.equal(run('JSON.stringify(data)'),before);assert(confirmation.includes('saved character facts'));
allow=true;run('deleteSelected("category")');assert.equal(run('data.categories.some(c=>c.id==="tardis")'),false);assert.equal(document.getElementById('delete-category').disabled,true);assert.equal(document.getElementById('undo-delete').disabled,false);
run('el("undo-delete").onclick()');assert.equal(run('JSON.stringify(data)'),before);
run('selectCharacter("rose-tyler");deleteSelected("character")');assert.equal(run('data.appearances.some(a=>a.characterId==="rose-tyler")'),false);assert.equal(document.getElementById('delete-character').disabled,true);run('el("undo-delete").onclick()');assert.equal(run('JSON.stringify(data)'),before);
run('selectCharacter("rose-tyler");deleteSelected("character");save("Next edit")');assert.equal(document.getElementById('undo-delete').disabled,true);
console.log('PASS: deletion cleanup, episode-template deletion, invalid selection, cancel, undo, button states, and unchanged unrelated records.');




run('data=JSON.parse('+JSON.stringify(before)+');selectCharacter("rose-tyler");');
const row=document.getElementById('character-episodes').children.find(x=>x.tag==='li');
const removeButton=row.children.find(x=>x.tag==='button'&&x.textContent==='×');
assert(removeButton);assert(removeButton.ariaLabel.includes('Rose Tyler'));
const target=seed.appearances.find(a=>a.characterId==='rose-tyler');
allow=false;removeButton.onclick();assert.equal(run('JSON.stringify(data)'),before);
assert(confirmation.includes(seed.episodes.find(e=>e.id===target.episodeId).title));
allow=true;removeButton.onclick();
const after=JSON.parse(run('JSON.stringify(data)'));
assert.equal(after.appearances.length,seed.appearances.length-1);
assert(!after.appearances.some(a=>a.characterId===target.characterId&&a.episodeId===target.episodeId));
assert.deepEqual(after.characters,seed.characters);assert.deepEqual(after.episodes,seed.episodes);
assert.deepEqual(after.appearances,seed.appearances.filter(a=>a.characterId!==target.characterId||a.episodeId!==target.episodeId));
assert.deepEqual(D.validate(after),[]);
assert.equal(document.getElementById('undo-delete').disabled,false);
run('el("undo-delete").onclick()');assert.equal(run('JSON.stringify(data)'),before);
console.log('PASS: rendered appearance remove button, named confirmation, cancel, single-link deletion, retained facts and undo.');
