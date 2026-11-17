/* Shared, side-effect-free data checks used by the editor and its tests. */
(function(root){
  'use strict';
  const keys=['characters','episodes','appearances','categories'];
  const categoryConfig=typeof module!=='undefined'?require('./category-config.js'):root.CategoryConfig;
  const activeModes=['in-person','voice','broadcast'];
  const modes=[...activeModes,'still-image','archive','remains'];
  const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const nonempty=x=>typeof x==='string'&&x.trim().length>0;
  const copy=x=>JSON.parse(JSON.stringify(x));
  function validate(data){
    if(!object(data)||!keys.every(k=>Array.isArray(data[k])))return ['All four data arrays are required.'];
    const errors=categoryConfig.validate(data.categories), chars=new Set(), eps=new Set(), pairs=new Set();
    for(const c of data.characters){
      if(!object(c)||!nonempty(c.id)||!nonempty(c.name)){errors.push('Every character needs a text ID and name.');continue;}
      if(chars.has(c.id))errors.push('Duplicate character ID: '+c.id);chars.add(c.id);
      if(c.aliases!==undefined&&(!Array.isArray(c.aliases)||!c.aliases.every(nonempty)))errors.push('Aliases must be a list of names: '+c.id);
      if(c.playable!==undefined&&typeof c.playable!=='boolean')errors.push('Playable must be true or false: '+c.id);
      if(c.kind!==undefined&&!['individual','type','group','role'].includes(c.kind))errors.push('Unknown entry type: '+c.id);
      if(c.typeIds!==undefined&&(!Array.isArray(c.typeIds)||!c.typeIds.every(nonempty)))errors.push('Type IDs must be a list: '+c.id);
      if(c.storyTraits!==undefined&&!object(c.storyTraits))errors.push('Category facts must be an object: '+c.id);
    }
    for(const e of data.episodes){
      if(!object(e)||!nonempty(e.id)||!nonempty(e.title)){errors.push('Every episode needs a text ID and title.');continue;}
      if(eps.has(e.id))errors.push('Duplicate episode ID: '+e.id);eps.add(e.id);
    }
    for(const a of data.appearances){
      if(!object(a)){errors.push('Every appearance must be an object.');continue;}
      if(!chars.has(a.characterId)||!eps.has(a.episodeId))errors.push('Appearance has a missing character or episode: '+a.characterId+' / '+a.episodeId);
      if(!modes.includes(a.mode))errors.push('Unknown appearance mode: '+a.characterId+' / '+a.episodeId);
      const pair=JSON.stringify([a.characterId,a.episodeId]);if(pairs.has(pair))errors.push('Duplicate appearance: '+a.characterId+' / '+a.episodeId);pairs.add(pair);
    }
    for(const c of data.characters.filter(object)){
      if(Array.isArray(c.typeIds))for(const id of c.typeIds)if(!chars.has(id))errors.push('Missing creature type '+id+' for '+c.id);
      if(object(c.storyTraits))for(const [trait,f] of Object.entries(c.storyTraits)){
        if(!object(f)||!eps.has(f.episodeId)||!nonempty(f.evidence))errors.push('Fact needs an existing episode and scene evidence: '+c.id+' / '+trait);
        if(object(f)&&f.source!==undefined&&typeof f.source!=='string')errors.push('Fact source must be text: '+c.id+' / '+trait);
      }
    }
    for(const c of data.characters.filter(object))for(const id of Object.keys(c.storyTraits||{}))if(!data.categories.some(d=>d?.id===id))errors.push('Missing category definition: '+id);
    return [...new Set(errors)];
  }
  function readBatch(files){
    const batch={characters:[],episodes:[],appearances:[],categories:[]};
    for(const {name,value} of files){
      if(Array.isArray(value)){
        const key=name.toLowerCase().replace(/\.json$/,'');
        if(!keys.includes(key))throw Error('Array files must be named characters.json, episodes.json, appearances.json or categories.json. External formats need conversion to the documented game schema.');
        batch[key].push(...value);
      }else if(object(value)&&keys.some(k=>Array.isArray(value[k]))){
        for(const key of keys)if(value[key]!==undefined){if(!Array.isArray(value[key]))throw Error(key+' must be an array.');batch[key].push(...value[key]);}
      }else throw Error(name+': expected game data arrays or a bundle containing characters, episodes, appearances and/or categories.');
    }
    return batch;
  }
  function merge(base,batch){
    const candidate=copy(base), conflicts=[],counts={added:{},updated:{},unchanged:{}};
    function fill(old,incoming,path){
      for(const [key,value] of Object.entries(incoming)){
        if(['__proto__','constructor','prototype'].includes(key))throw Error('Unsafe field: '+key);
        if(value===null||value==='')continue;
        if(old[key]===undefined||old[key]===null||old[key]===''){old[key]=copy(value);continue;}
        if(key==='aliases'&&Array.isArray(old[key])&&Array.isArray(value)){old[key]=[...new Set([...old[key],...value])];continue;}
        if(path.endsWith('.storyTraits')){
          if(JSON.stringify(old[key])!==JSON.stringify(value))conflicts.push(path+'.'+key+': kept the complete existing fact and its evidence.');
        }
        else if(object(old[key])&&object(value))fill(old[key],value,path+'.'+key);
        else if(JSON.stringify(old[key])!==JSON.stringify(value))conflicts.push(path+'.'+key+': kept the existing value; review the incoming value manually.');
      }
    }
    for(const key of keys){
      counts.added[key]=0;counts.updated[key]=0;counts.unchanged[key]=0;
      const id=x=>key==='appearances'?JSON.stringify([x.characterId,x.episodeId]):x.id;
      const seen=new Set();
      for(const row of (batch[key]||[])){
        if(!object(row))throw Error(key+': every record must be an object.');
        const rowId=id(row);
        if(seen.has(rowId))throw Error('Duplicate incoming '+key+' record: '+rowId);seen.add(rowId);
        const old=candidate[key].find(x=>id(x)===rowId);
        if(old){const before=JSON.stringify(old);fill(old,row,key+'/'+rowId);counts[before===JSON.stringify(old)?'unchanged':'updated'][key]++;}
        else{
          const nameField=key==='characters'?'name':key==='episodes'?'title':null;
          if(nameField&&typeof row[nameField]==='string'&&candidate[key].some(x=>x[nameField]?.trim().toLowerCase()===row[nameField].trim().toLowerCase()))throw Error('Possible duplicate '+row[nameField]+': use the existing stable ID before importing.');
          const fresh={};fill(fresh,row,key+'/'+rowId);candidate[key].push(fresh);counts.added[key]++;
        }
      }
    }
    const errors=validate(candidate);if(errors.length)throw Error(errors.join('\n'));
    return {candidate,counts,conflicts};
  }
  function gaps(data,categoryDefs){
    const active=new Set(data.appearances.filter(a=>activeModes.includes(a.mode)).map(a=>a.characterId));
    const playable=data.characters.filter(c=>c.playable!==false&&active.has(c.id));
    const episodeIds=new Set(data.appearances.map(a=>a.episodeId));
    const noFacts=data.characters.filter(c=>c.playable!==false&&!Object.keys(c.storyTraits||{}).length);
    return {
      note:'Unrecorded connections are unknown, not confirmed false. These checks cannot prove that an episode cast or character history is complete.',
      coverage:[1,2,3,4,'specials'].map(series=>({series,episodes:data.episodes.filter(e=>String(e.series)===String(series)).length})),
      episodesWithoutAppearances:data.episodes.filter(e=>!episodeIds.has(e.id)).map(e=>({id:e.id,title:e.title})),
      charactersWithoutActiveAppearances:data.characters.filter(c=>c.playable!==false&&!active.has(c.id)).map(c=>({id:c.id,name:c.name})),
      charactersWithoutCategoryFacts:noFacts.map(c=>({id:c.id,name:c.name})),
      excludedCharacters:data.characters.filter(c=>c.playable===false).map(c=>({id:c.id,name:c.name,reason:c.selectionNote||'Needs an individual inclusion review.'})),
      categories:data.categories.filter(c=>c.kind==='story').map(c=>({id:c.id,label:c.label,enabled:c.enabled&&!c.needsReview,needsReview:Boolean(c.needsReview),confirmedMatches:playable.filter(p=>p.storyTraits?.[c.id]).length})),
      factsWithoutAppearance:data.characters.flatMap(c=>Object.entries(c.storyTraits||{}).filter(([,f])=>!data.appearances.some(a=>a.characterId===c.id&&a.episodeId===f.episodeId)).map(([category,f])=>({characterId:c.id,name:c.name,category,episodeId:f.episodeId})))
    };
  }
  root.EditorData={validate,readBatch,merge,gaps};
  if(typeof module!=='undefined')module.exports=root.EditorData;
})(typeof globalThis!=='undefined'?globalThis:this);

