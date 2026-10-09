(function () {
  const open=document.getElementById('mn-search-open');if(!open)return;
  const dialog=document.getElementById('mn-search-dialog'),search=document.getElementById('mn-search-input'),results=document.getElementById('mn-search-results');
  const guides=[
    {title:'Getting started',description:'A clear introduction to systems you own.',href:'index.html',keywords:'start overview ownership'},
    {title:'What you own',description:'Source code, accounts, portable data and documentation.',href:'index.html#ownership',keywords:'handover repository credentials ownership'},
    {title:'Website rebuilds',description:'Rebuild your website and choose a scope that fits.',href:'websites.html',keywords:'web website tiers pricing plans migrate'},
    {title:'AI integration',description:'Practical workflows with a person in control.',href:'ai.html',keywords:'automation integration ai human review'},
    {title:'Advisory',description:'Decide what to change and what to keep.',href:'advisory.html',keywords:'assessment strategy advice audit'},
    {title:'The delivery path',description:'From conversation to build, cutover and handover.',href:'index.html#delivery',keywords:'process timeline delivery steps'},
    {title:'Handover & ongoing care',description:'A documented exit and optional support.',href:'process.html#exit',keywords:'handover support ownership maintenance care'},
    {title:'About VFTech',description:'The person and principles behind the work.',href:'about.html',keywords:'kevin van flandern business experience'},
    {title:'Start a conversation',description:'Share the problem and agree a useful next step.',href:'contact.html',keywords:'contact book meeting conversation'}
  ];
  function render(){const query=search.value.trim().toLowerCase();const items=guides.filter(g=>`${g.title} ${g.description} ${g.keywords}`.toLowerCase().includes(query));results.replaceChildren();for(const guide of items){const li=document.createElement('li'),a=document.createElement('a'),strong=document.createElement('strong'),small=document.createElement('small');a.href=guide.href;strong.textContent=guide.title;small.textContent=guide.description;a.append(strong,small);li.append(a);results.append(li);}document.getElementById('mn-search-status').textContent=`${items.length} ${items.length===1?'result':'results'}`;document.getElementById('mn-search-empty').hidden=items.length!==0;}
  let navigating=false;
  function show(){navigating=false;search.value='';render();dialog.showModal();search.focus();}
  open.addEventListener('click',show);search.addEventListener('input',render);
  document.getElementById('mn-search-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{if(!navigating)open.focus();});
  document.addEventListener('keydown',e=>{const target=e.target;if((e.key==='/'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'))&&!dialog.open&&!target.closest('input,textarea,select,[contenteditable="true"]')){e.preventDefault();show();}});
  dialog.addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp'].includes(e.key))return;const links=[...results.querySelectorAll('a')];if(!links.length)return;e.preventDefault();const i=links.indexOf(document.activeElement);const next=e.key==='ArrowDown'?i+1:i-1;if(next<0){search.focus();return;}links[next%links.length].focus();});
  results.addEventListener('click',e=>{if(e.target.closest('a')){navigating=true;dialog.close();}});
  const sections=[...document.querySelectorAll('.mn-sect')];const links=[...document.querySelectorAll('[data-mono-section]')];let queued=false;
  function update(){queued=false;let current=sections[0]?.id;for(const section of sections)if(section.getBoundingClientRect().top<=155)current=section.id;for(const link of links){if(link.dataset.monoSection===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}}
  window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});update();
})();
