/* The gallery groups the website directions and the new product workspaces. */
(function () {
  const filters=[...document.querySelectorAll('[data-design-view]')];
  const cards=[...document.querySelectorAll('[data-design-group]')];
  if(!filters.length)return;
  const valid=['all','websites','workspaces'];
  function show(view,updateUrl){
    if(!valid.includes(view))view='all';
    let count=0;
    for(const card of cards){card.hidden=view!=='all'&&card.dataset.designGroup!==view;if(!card.hidden)count++;}
    for(const filter of filters)filter.setAttribute('aria-pressed',String(filter.dataset.designView===view));
    document.getElementById('review-count').textContent=`${count} ${count===1?'design':'designs'}`;
    if(updateUrl){try{const url=new URL(location.href);if(view==='all')url.searchParams.delete('view');else url.searchParams.set('view',view);history.replaceState(null,'',url);}catch{}}
  }
  for(const filter of filters)filter.addEventListener('click',()=>show(filter.dataset.designView,true));
  let initial='all';try{initial=new URL(location.href).searchParams.get('view')||'all';}catch{}
  show(initial,false);
})();
