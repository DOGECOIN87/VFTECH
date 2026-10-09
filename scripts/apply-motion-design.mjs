// Intentionally operates on one design at a time so it can be checked and committed separately.
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
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
if(!profiles[n])throw Error('Choose exactly one design number, 1–10.');
const dir=n===1?'site':`design-${n}`;
const options=JSON.stringify(profiles[n]).replaceAll('"','&quot;');
for(const file of readdirSync(dir).filter(f=>f.endsWith('.html')&&!['compare.html','404.html'].includes(f))){
  const path=dir+'/'+file;let html=readFileSync(path,'utf8');
  html=html.replace(/<main id="main"(?![^>]*\btabindex=)/,'<main id="main" tabindex="-1"');
  if(!html.includes('href="motion.css"'))html=html.replace('</head>','<link rel="stylesheet" href="motion.css">\n</head>');
  if(!html.includes('data-vf-motion-suite'))html=html.replace('</body>',`<script src="motion-loader.js" defer data-vf-motion-suite data-motion-options="${options}"></script>\n</body>`);
  writeFileSync(path,html);
}
const path=dir+'/site.js';let js=readFileSync(path,'utf8');
const start=js.indexOf('/* ---- scroll reveal:');
if(start<0)throw Error('Missing existing reveal block in '+path);
const before=js.slice(0,start),after=js.slice(start).replace("if ('IntersectionObserver' in window) {", "if ('IntersectionObserver' in window && !document.querySelector('script[data-vf-motion-suite]')) {");
writeFileSync(path,before+after);
console.log('Motion applied to '+profiles[n].name+' only.');
