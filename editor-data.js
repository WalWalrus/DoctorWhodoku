/* Shared, side-effect-free data checks used by the editor and its tests. */
(function(root){
  'use strict';
  const keys=['characters','episodes','appearances','categories'];
  const categoryConfig=typeof module!=='undefined'?require('./category-config.js'):root.CategoryConfig;
  const activeModes=['in-person','voice','broadcast'];
  const modes=[...activeModes,'still-image','archive','remains','unreviewed'];
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
  function readBatch(files,base={characters:[],episodes:[]}){
    const batch={characters:[],episodes:[],appearances:[],categories:[]};
    const external={characters:[],episodes:[]}, guestCredits=[];
    for(const {name,value} of files){
      if(Array.isArray(value)){
        if(value.some(x=>object(x)&&object(x.character))){external.characters.push(...value);continue;}
        if(value.some(x=>object(x)&&typeof x.id==='number'&&'airdate' in x&&'season' in x)){
          external.episodes.push(...value);
          for(const episode of value){
            const cast=episode?._embedded?.guestcast;
            if(cast===undefined)continue;
            if(!Array.isArray(cast))throw Error('TVmaze embedded guestcast must be an array.');
            for(const credit of cast){
              // Operator credits identify performers, not additional characters.
              if(/\boperator\b/i.test(credit?.character?.name||''))continue;
              external.characters.push(credit);guestCredits.push({episode,credit});
            }
          }
          continue;
        }
        const key=name.toLowerCase().replace(/\.json$/,'');
        if(!keys.includes(key))throw Error('Array files must be named characters.json, episodes.json, appearances.json or categories.json. External formats need conversion to the documented game schema.');
        batch[key].push(...value);
      }else if(object(value)&&keys.some(k=>Array.isArray(value[k]))){
        for(const key of keys)if(value[key]!==undefined){if(!Array.isArray(value[key]))throw Error(key+' must be an array.');batch[key].push(...value[key]);}
      }else throw Error(name+': expected game data arrays or a bundle containing characters, episodes, appearances and/or categories.');
    }
    const converted=convertTVmaze(external,base);
    batch.characters.push(...converted.characters);batch.episodes.push(...converted.episodes);
    batch.importNotes=converted.notes;
    const lookup=(kind,id)=>converted[kind].find(x=>String(x.externalIds?.tvmaze)===String(id))||base[kind]?.find(x=>String(x.externalIds?.tvmaze)===String(id));
    const pairs=new Set((base.appearances||[]).map(a=>JSON.stringify([a.characterId,a.episodeId])));
    for(const {episode,credit} of guestCredits){
      const character=lookup('characters',credit.character.id), ep=lookup('episodes',episode.id);
      if(!character||!ep)continue;
      const pair=JSON.stringify([character.id,ep.id]);if(pairs.has(pair))continue;pairs.add(pair);
      batch.appearances.push({characterId:character.id,episodeId:ep.id,mode:'unreviewed',
        source:'https://api.tvmaze.com/episodes/'+episode.id+'/guestcast',
        creditedName:credit.character.name,sourceVoice:Boolean(credit.voice),
        reviewNote:'Cast credit only. Check the scene and choose in-person, voice, broadcast, archive or another appearance mode before this counts in the game.'});
    }
    if(guestCredits.length)batch.importNotes.push(batch.appearances.length+' new guest-cast episode links staged as Unreviewed. Existing appearance modes are preserved. Operator credits are omitted; generic background roles are retained but excluded from play.');
    return batch;
  }
  function convertTVmaze(input,base){
    const result={characters:[],episodes:[],notes:[]};
    const normal=x=>String(x||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
    const names=c=>[c.name,...(c.aliases||[])].map(normal);
    const positive=x=>Number.isSafeInteger(x)&&x>0;
    for(const kind of ['episodes','characters']){
      const unique=new Map();
      for(const raw of input[kind]){
        const row=kind==='characters'?raw?.character:raw;
        if(!object(row)||!positive(row.id)||!nonempty(row.name))throw Error('Invalid TVmaze '+kind+' row: each record needs a numeric ID and name.');
        if(kind==='episodes'&&(!Number.isInteger(row.season)||row.season<0||!(row.number===null||positive(row.number))||typeof row.airdate!=='string'))throw Error('Invalid TVmaze episode: '+row.name+' (check season, number and airdate).');
        if(unique.has(row.id)&&JSON.stringify(unique.get(row.id))!==JSON.stringify(row))throw Error('Conflicting TVmaze records for '+row.name+' ('+row.id+').');
        unique.set(row.id,row);
      }
      const claimed=new Set();
      for(const row of unique.values()){
        const existing=base[kind]||[], field=kind==='episodes'?'title':'name';
        let matches=existing.filter(x=>String(x.externalIds?.tvmaze)===String(row.id));
        if(!matches.length){
          const target=normal(row.name);
          // A generic Doctor label must never select one incarnation by alias.
          const ambiguous=kind==='characters'&&(['the doctor','doctor'].includes(target)||[...unique.values()].filter(x=>normal(x.name)===target).length>1);
          if(ambiguous){result.notes.push('Skipped '+row.name+' (TVmaze '+row.id+'): identity needs manual review.');continue;}
          matches=existing.filter(x=>kind==='characters'?names(x).includes(target):normal(x.title)===target&&(!x.ukAirDate||!row.airdate||x.ukAirDate===row.airdate));
          // Handle the optional article in named Doctor incarnations only.
          if(!matches.length&&kind==='characters'&&/^the \w+ doctor$/i.test(row.name))matches=existing.filter(x=>names(x).includes(target.slice(4)));
        }
        if(matches.length>1){result.notes.push('Skipped '+row.name+': multiple existing records match.');continue;}
        const old=matches[0];
        if(old?.externalIds?.tvmaze&&String(old.externalIds.tvmaze)!==String(row.id)){result.notes.push('Skipped '+row.name+': existing record has a different TVmaze ID.');continue;}
        const id=old?.id||'tvmaze-'+(kind==='characters'?'character-':'episode-')+row.id;
        if(claimed.has(id)||(!old&&existing.some(x=>x.id===id||normal(x[field])===normal(row.name)))){result.notes.push('Skipped '+row.name+': possible duplicate; review manually.');continue;}
        claimed.add(id);
        const converted={id,[field]:old?.[field]||row.name,externalIds:{tvmaze:row.id}};
        if(kind==='episodes'){
          // Specials retain their source season separately, with no invented episode number.
          converted.series=row.type==='regular'?row.season:'specials';
          converted.tvmazeSeason=row.season;if(nonempty(row.type))converted.tvmazeType=row.type;
          if(row.number!==null)converted.episodeNumber=row.number;
          if(row.airdate)converted.ukAirDate=row.airdate;
        }else if(!old){
          const background=/^(?:(?:young|old|male|female|scared|drunk|japanese|indian|french|german|liberian|chinese|pale|sinister|mysterious|wiry|tall|little)\s+)*(?:man|woman|girl|boy|child|lad|teenager|worker|soldier|guard|security guard|policeman|police officer|newsreader|reporter|driver|taxi driver|bus driver|patient|neighbour|servant|steward|businessman|pharmacist|engineer|kitchen hand|docker|urchin|doorman|vicar|alien voice|alien voices)(?:\s*#?\d+|\s+in\s+.*)?$/i.test(row.name);
          Object.assign(converted,{kind:'individual',aliases:[],typeIds:[],playable:!background,storyTraits:{},selectionNote:background?'Generic background credit imported from TVmaze; review individually before enabling.':'Imported TVmaze character; episode links and category facts need review.'});
        }
        result[kind].push(converted);
      }
    }
    if(input.episodes.length||input.characters.length)result.notes.unshift('TVmaze converted automatically. Existing connections are retained. New records have no episode appearances or trivia facts; add those in the editor. All episodes supplied are imported, including later series and specials.');
    return result;
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
        if(key!=='appearances'&&!nonempty(row.id))throw Error(key+': each record needs a non-empty text ID. For TVmaze cast exports, keep the original character wrapper.');
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
      unreviewedAppearances:data.appearances.filter(a=>a.mode==='unreviewed').map(a=>({...a,name:data.characters.find(c=>c.id===a.characterId)?.name,title:data.episodes.find(e=>e.id===a.episodeId)?.title})),
      episodesWithoutAppearances:data.episodes.filter(e=>!episodeIds.has(e.id)).map(e=>({id:e.id,title:e.title})),
      charactersWithoutActiveAppearances:data.characters.filter(c=>c.playable!==false&&!active.has(c.id)).map(c=>({id:c.id,name:c.name})),
      charactersWithoutCategoryFacts:noFacts.map(c=>({id:c.id,name:c.name})),
      excludedCharacters:data.characters.filter(c=>c.playable===false).map(c=>({id:c.id,name:c.name,reason:c.selectionNote||'Needs an individual inclusion review.'})),
      categories:data.categories.filter(c=>c.kind==='story').map(c=>({id:c.id,label:c.label,enabled:c.enabled&&!c.needsReview,needsReview:Boolean(c.needsReview),confirmedMatches:playable.filter(p=>p.storyTraits?.[c.id]).length})),
      factsWithoutAppearance:data.characters.flatMap(c=>Object.entries(c.storyTraits||{}).filter(([,f])=>!data.appearances.some(a=>a.characterId===c.id&&a.episodeId===f.episodeId)).map(([category,f])=>({characterId:c.id,name:c.name,category,episodeId:f.episodeId})))
    };
  }
  function deletionImpact(data,kind,id){
    if(!['category','character'].includes(kind))throw Error('Unknown deletion type.');
    const record=data[kind==='category'?'categories':'characters'].find(r=>r.id===id);
    if(!record)throw Error('Select an existing '+kind+' first.');
    return {name:record.label||record.name,
      facts:kind==='category'?data.characters.filter(c=>Object.hasOwn(c.storyTraits||{},id)).length:Object.keys(record.storyTraits||{}).length,
      appearances:kind==='character'?data.appearances.filter(a=>a.characterId===id).length:0,
      typeLinks:kind==='character'?data.characters.filter(c=>(c.typeIds||[]).includes(id)).length:0};
  }
  function removeRecord(data,kind,id){
    deletionImpact(data,kind,id);
    const next=copy(data);
    if(kind==='category'){
      next.categories=next.categories.filter(c=>c.id!==id);
      for(const c of next.characters)if(c.storyTraits)delete c.storyTraits[id];
    }else{
      next.characters=next.characters.filter(c=>c.id!==id);
      next.appearances=next.appearances.filter(a=>a.characterId!==id);
      for(const c of next.characters)if(c.typeIds)c.typeIds=c.typeIds.filter(typeId=>typeId!==id);
    }
    const errors=validate(next);if(errors.length)throw Error(errors.join('\n'));
    return next;
  }
  root.EditorData={validate,readBatch,merge,gaps,deletionImpact,removeRecord};
  if(typeof module!=='undefined')module.exports=root.EditorData;
})(typeof globalThis!=='undefined'?globalThis:this);




