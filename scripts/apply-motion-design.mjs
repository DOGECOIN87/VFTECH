// Intentionally operates on one design at a time so it can be checked and committed separately.
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {parseHTML} from 'linkedom';
const n=Number(process.argv[2]);
const profiles={
  1:{name:'Drafting',distance:12,duration:.48,stagger:.03,magnet:2,beam:false},
  2:{name:'Kiln',distance:22,duration:.7,stagger:.06,magnet:4,beam:false},
  3:{name:'Signal',distance:24,duration:.6,stagger:.04,magnet:3,beam:false},
  4:{name:'Phosphor',distance:8,duration:.36,stagger:.02,magnet:0,beam:true},
  5:{name:'Orbit',distance:30,duration:.7,stagger:.05,magnet:4,beam:false},
  6:{name:'Lumen',distance:18,duration:.56,stagger:.04,magnet:3,beam:false},
  7:{name:'Ledger',distance:12,duration:.4,stagger:.03,magnet:0,beam:false},
  8:{name:'Console',distance:8,duration:.36,stagger:.02,magnet:0,beam:true},
  9:{name:'Pulse',distance:14,duration:.48,stagger:.04,magnet:0,beam:false},
  10:{name:'Mono',distance:10,duration:.5,stagger:.03,magnet:0,beam:false}
};
const studioIntro='.hero-eyebrow,.hero-title,.hero-sub,.cta-row,.hero-note';
const studioReveal='.sect-aside>*,.ledger>div,.frame .cell,.sits>.sit,.closing-grid>div,.x-head,.x-results>*,.x-answer';
const studioCards='.frame .cell,.sits>.sit,.callout';
const homes={
  1:{intro:studioIntro,reveal:studioReveal,cards:studioCards,distance:20,duration:.65},
  2:{intro:studioIntro,reveal:studioReveal,cards:studioCards,distance:32,duration:.8},
  3:{intro:studioIntro,reveal:studioReveal,cards:studioCards,distance:32,duration:.72},
  4:{intro:studioIntro,reveal:studioReveal,cards:'.frame .cell,.sits>.sit,.flowfig',distance:18,duration:.6},
  5:{intro:studioIntro,reveal:'.rx-section-head,.rx-service,.rx-support,.rx-stats>div,.x-head,.x-answer,.rx-closing>div',cards:'.rx-service,.rx-support',distance:32,duration:.8},
  6:{intro:'.lm-announce,.hero-title,.hero-sub,.cta-row,.lm-note',reveal:'.lm-window,.lm-sec .lm-label,.lm-sec .lm-h2,.lm-card,.lm-stat,.lm-plan,.lm-closing-card',cards:'.lm-window,.lm-card,.lm-stat,.lm-plan,.lm-closing-card',distance:28,duration:.75},
  7:{intro:'.ld-heading h1,.ld-heading .ld-primary',reveal:'.ld-metric,.ld-panel',cards:'.ld-metric,.ld-panel',distance:24,panelDistance:0,duration:.65},
  8:{intro:'.cx-topline,.cx-heading h1,.cx-heading p,.cx-controls',reveal:'.cx-metric,.cx-panel',cards:'.cx-metric,.cx-panel',distance:22,panelDistance:0,duration:.65},
  9:{intro:'.pl-breadcrumb,.pl-heading h1,.pl-heading p,.pl-team,.pl-progress',reveal:'.pl-column,.pl-board-note',cards:'.pl-column',distance:24,panelDistance:0,duration:.65},
  10:{intro:'.mn-path,.mn-article>header h1,.mn-intro,.mn-byline',reveal:'.mn-article>section',cards:'.mn-callout,.mn-route-list>a',distance:22,duration:.7}
};
if(!profiles[n])throw Error('Choose exactly one design number, 1–10.');
const dir=n===1?'site':`design-${n}`;
const {document}=parseHTML(readFileSync(dir+'/index.html','utf8'));
const main=document.querySelector('main');
for(const key of ['intro','reveal','cards'])if(!main.querySelector(homes[n][key]))throw Error('No actual homepage '+key+' targets for '+profiles[n].name);
if(![...main.querySelectorAll(homes[n].intro)].includes(main.querySelector('h1')))throw Error('The homepage heading is missing from '+profiles[n].name+' intro.');
for(const file of readdirSync(dir).filter(f=>f.endsWith('.html')&&!['compare.html','404.html'].includes(f))){
  const path=dir+'/'+file;let html=readFileSync(path,'utf8');
  const options=JSON.stringify(file==='index.html'?{...profiles[n],home:homes[n]}:profiles[n]).replaceAll('"','&quot;');
  html=html.replace(/<main id="main"(?![^>]*\btabindex=)/,'<main id="main" tabindex="-1"');
  if(file==='index.html')html=html.replace(/<main id="main"(?![^>]*\bdata-vf-home-motion)/,'<main id="main" data-vf-home-motion');
  if(!html.includes('href="motion.css"'))html=html.replace('</head>','<link rel="stylesheet" href="motion.css">\n</head>');
  if(!html.includes('data-vf-motion-suite'))html=html.replace('</body>',`<script src="motion-loader.js" defer data-vf-motion-suite data-motion-options="${options}"></script>\n</body>`);
  else html=html.replace(/data-motion-options="[^"]*"/,'data-motion-options="'+options+'"');
  writeFileSync(path,html);
}
const path=dir+'/site.js';let js=readFileSync(path,'utf8');
const start=js.indexOf('/* ---- scroll reveal:');
if(start<0)throw Error('Missing existing reveal block in '+path);
const before=js.slice(0,start),after=js.slice(start).replace("if ('IntersectionObserver' in window) {", "if ('IntersectionObserver' in window && !document.querySelector('script[data-vf-motion-suite]')) {");
writeFileSync(path,before+after);
console.log('Motion applied to '+profiles[n].name+' only.');
