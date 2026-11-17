const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const D=require('./editor-data.js'),C=require('./category-config.js');
const data=Object.fromEntries(['characters','episodes','appearances','categories'].map(k=>[k,JSON.parse(fs.readFileSync(__dirname+'/'+k+'.json'))]));
assert.deepEqual(D.validate(data),[]);
const initial=JSON.stringify(data.characters);
const elements=new Map();function element(){return {value:'',checked:false,options:[],children:[],append(...xs){this.children.push(...xs);this.options.push(...xs.filter(x=>x?.tag==='option'));},replaceChildren(){this.children=[];this.options=[];},reset(){},focus(){},scrollIntoView(){}};}
const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement(tag){return {...element(),tag};},querySelectorAll(){return []}};
const context=vm.createContext({document,CategoryConfig:C,EditorData:D,localStorage:{setItem(){},getItem(){}},console,seed:structuredClone(data)});
const html=fs.readFileSync(__dirname+'/data-editor.html','utf8');let script=html.match(/<script>([\s\S]*?)<\/script>/)[1];script=script.replace('loadFact();loadPublished();','');vm.runInContext(script,context);vm.runInContext('data=seed;refresh();',context);
function run(s){return vm.runInContext(s,context);}
function set(id,value){document.getElementById(id).value=value;}
function clickSave(){run('el("category-form").onsubmit({preventDefault(){}})');}
set('category-select','tardis');run('el("category-select").onchange()');document.getElementById('category-enabled').checked=false;clickSave();assert.equal(run('data.categories.find(c=>c.id==="tardis").enabled'),false);assert.equal(run('JSON.stringify(data.characters)'),initial);
set('category-label','TARDIS traveller');clickSave();assert.equal(run('data.categories.find(c=>c.id==="tardis").needsReview'),false);
set('category-description','Changed definition for test');clickSave();assert.equal(run('data.categories.find(c=>c.id==="tardis").needsReview'),true);assert.equal(run('JSON.stringify(data.characters)'),initial);
document.getElementById('category-reviewed').checked=true;document.getElementById('category-enabled').checked=true;clickSave();assert.equal(run('data.categories.find(c=>c.id==="tardis").needsReview'),false);
run('editingCategory=null');set('category-id','test-category');set('category-label','Test category');set('category-description','Test definition');clickSave();assert(run('data.categories.some(c=>c.id==="test-category")'));assert(document.getElementById('trait').options.some(o=>o.value==='test-category'));
const merged=D.merge(data,D.readBatch([{name:'categories.json',value:[{id:'new-category',label:'New clue',description:'A definition.',enabled:false,kind:'story'}]}]));assert.equal(merged.counts.added.categories,1);assert.equal(JSON.stringify(merged.candidate.characters),initial);
assert(C.validate([...data.categories,data.categories[0]]).length);
for(const file of ['index.html','DoctorWhodoku.html']){
 let s=fs.readFileSync(__dirname+'/'+file,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];new Function(s);s=s.slice(0,s.indexOf('function cellLabel'));
 const test=new Function('d','assert',s+`const active=new Set(d.appearances.filter(a=>['in-person','voice','broadcast'].includes(a.mode)).map(a=>a.characterId));characters=d.characters.filter(c=>c.playable!==false&&active.has(c.id));categories=makeCategories(characters,d.episodes,d.appearances,d.categories);for(let i=0;i<12;i++){const p=generatePuzzle();assert(p);assert(p.cells.every(c=>c.length>=2));assert(hasDistinctSolution(p.cells));}const off=d.categories.map(c=>({...c,enabled:false}));assert.equal(makeCategories(characters,d.episodes,d.appearances,off).length,0);const paused=d.categories.map(c=>({...c,needsReview:true}));assert.equal(makeCategories(characters,d.episodes,d.appearances,paused).length,0);const noEpisodes=d.categories.map(c=>({...c,enabled:c.kind==='story'&&c.enabled}));assert(!makeCategories(characters,d.episodes,d.appearances,noEpisodes).some(c=>c.family==='episode'));`);test(structuredClone(data),assert);
}
console.log('PASS: category add/rename/disable/re-enable, evidence preservation, definition review, import, validation, and 24 valid grids across both game pages.');
