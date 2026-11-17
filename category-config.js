(function(root){
  'use strict';
  function validate(definitions){
    if(!Array.isArray(definitions))return ['categories.json must contain an array.'];
    const errors=[],ids=new Set();let episodeCount=0;
    for(const c of definitions){
      if(!c||typeof c!=='object'||!(/^[a-z0-9]+(-[a-z0-9]+)*$/).test(c.id||'')){errors.push('Every category needs a stable lowercase ID.');continue;}
      if(['constructor','prototype','__proto__'].includes(c.id))errors.push('Reserved category ID: '+c.id);
      if(ids.has(c.id))errors.push('Duplicate category ID: '+c.id);ids.add(c.id);
      if(typeof c.label!=='string'||!c.label.trim()||typeof c.description!=='string'||!c.description.trim())errors.push('Category needs a clue name and definition: '+c.id);
      if(typeof c.enabled!=='boolean'||(c.needsReview!==undefined&&typeof c.needsReview!=='boolean'))errors.push('Category enabled and review flags must be booleans: '+c.id);
      if(!['story','episode'].includes(c.kind))errors.push('Unknown category kind: '+c.id);
      if(c.kind==='episode'){episodeCount++;if(typeof c.label!=='string'||!c.label.includes('{episode}'))errors.push('Episode clue name must contain {episode}.');}
    }
    if(episodeCount>1)errors.push('Only one episode-clue template is supported.');
    return errors;
  }
  root.CategoryConfig={validate};
  if(typeof module!=='undefined')module.exports=root.CategoryConfig;
})(typeof globalThis!=='undefined'?globalThis:this);
