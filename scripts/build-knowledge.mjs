// The guide reads only these bundled excerpts, never an external page or model.
import {readFileSync,writeFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
const records=[],seen=new Set();
const pages=['index.html','websites.html','ai.html','advisory.html','process.html','about.html','contact.html','features.html','account.html'];
for(const design of [3,6,7,8,9,10])for(const page of design===3?pages:['index.html']){
  const {document}=parseHTML(readFileSync(`design-${design}/${page}`,'utf8'));
  const main=document.querySelector('main');
  if(!main)continue;
  main.querySelectorAll('script,style,svg,form,button,input,select,textarea,.vh,[aria-hidden=true]').forEach(el=>el.remove());
  const sections=[...main.querySelectorAll('[data-vf-record]'),...main.querySelectorAll('section')];
  for(const [i,section] of sections.entries()){
    if(section.querySelector('[data-vf-record]')||section.closest('[data-vf-record]')!==null&&!section.hasAttribute('data-vf-record'))continue;
    const text=section.textContent.replace(/\s+/g,' ').trim();if(text.length<60||seen.has(text))continue;seen.add(text);
    const title=section.querySelector('h1,h2,h3')?.textContent.replace(/\s+/g,' ').trim()||document.title.split('·')[0].trim();
    records.push({id:section.dataset.vfRecord||`${design}-${page.replace('.html','')}-${section.id||i}`,design,page,anchor:section.id||'',title,tags:(section.dataset.vfTags||'').split(' ').filter(Boolean),text});
  }
}
const out=`/* Generated from visible VFTech page content. Run node scripts/build-knowledge.mjs after editing content. */\nwindow.VFTechKnowledge = ${JSON.stringify({version:1,records})};\n`;
if(process.argv.includes('--check')){if(readFileSync('site/guide-knowledge.js','utf8')!==out)throw Error('Guide corpus is stale. Run node scripts/build-knowledge.mjs.');}else writeFileSync('site/guide-knowledge.js',out);
console.log(`${records.length} local guide excerpts.`);
