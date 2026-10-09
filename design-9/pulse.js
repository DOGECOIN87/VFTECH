(function () {
  const board=document.getElementById('pl-board');if(!board)return;
  const stages={todo:'To do',working:'In progress',done:'Done'};
  const owners={Morgan:'Morgan Lee',Jordan:'Jordan Reyes',Unassigned:'Unassigned'};
  const tasks=[
    {id:1,title:'Write the about page',note:'A short introduction to the people behind Harbor Supply.',category:'Content',stage:'todo',owner:'Morgan',due:'Oct 12'},
    {id:2,title:'Connect the contact flow',note:'Keep the form clear, with a useful confirmation and a direct handoff.',category:'Development',stage:'todo',owner:'Jordan',due:'Oct 13'},
    {id:3,title:'Collect the team photos',note:'Choose the images and check permission to use them.',category:'Content',stage:'todo',owner:'Morgan',due:'Oct 14'},
    {id:4,title:'Build the responsive homepage',note:'A fast, accessible first impression on every screen.',category:'Development',stage:'working',owner:'Jordan',due:'Oct 12'},
    {id:5,title:'Add the booking flow',note:'Connect the client-owned calendar and check the full journey.',category:'Development',stage:'working',owner:'Jordan',due:'Oct 13'},
    {id:6,title:'Review the copy together',note:'Make sure every claim and call to action sounds like the business.',category:'Content',stage:'working',owner:'Morgan',due:'Oct 12'},
    {id:7,title:'Agree the project scope',note:'Goals, boundaries and the handover are written down.',category:'Planning',stage:'done',owner:'Morgan',due:'Complete'},
    {id:8,title:'Set up the client repository',note:'Source code starts in the client’s account from day one.',category:'Development',stage:'done',owner:'Jordan',due:'Complete'}
  ];
  const search=document.getElementById('pl-search'),assignee=document.getElementById('pl-assignee'),dialog=document.getElementById('pl-dialog'),form=document.getElementById('pl-task-form');
  const title=document.getElementById('pl-task-title'),note=document.getElementById('pl-task-note'),stage=document.getElementById('pl-task-stage'),owner=document.getElementById('pl-task-owner');
  let editing=null,nextId=9,view='board',returnFocus=null;
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const visible=()=>tasks.filter(t=>(assignee.value==='all'||t.owner===assignee.value)&&(`${t.title} ${t.note} ${t.category} P-${String(t.id).padStart(2,'0')}`).toLowerCase().includes(search.value.trim().toLowerCase()));
  function card(t){const initials=t.owner==='Morgan'?'ML':t.owner==='Jordan'?'JR':'—';return `<button type="button" class="pl-card" data-task="${t.id}" aria-label="Open task: ${escape(t.title)}"><span class="pl-card-top"><span class="pl-tag" data-category="${t.category}">${t.category}</span><span class="pl-id">P-${String(t.id).padStart(2,'0')}</span></span><span class="pl-card-title">${escape(t.title)}</span><span class="pl-card-note">${escape(t.note)}</span><span class="pl-card-bottom"><span class="pl-due">${t.stage==='done'?'✓':'◷'} ${escape(t.stage==='done'?'Complete':t.due)}</span><span class="pl-avatar" aria-label="${owners[t.owner]}">${initials}</span></span></button>`;}
  function render(){
    const items=visible();
    Object.keys(stages).forEach(key=>{const all=tasks.filter(t=>t.stage===key),list=items.filter(t=>t.stage===key);document.getElementById('pl-count-'+key).textContent=all.length;document.getElementById('pl-cards-'+key).innerHTML=list.length?list.map(card).join(''):'<p class="pl-no-tasks">No matching tasks in this stage.</p>';});
    const done=tasks.filter(t=>t.stage==='done').length;const progress=Math.round(done/tasks.length*100);
    document.getElementById('pl-progress-count').textContent=`${done} of ${tasks.length} completed`;
    document.getElementById('pl-progress-fill').style.width=progress+'%';
    document.getElementById('pl-progress-track').setAttribute('aria-valuenow',progress);
    document.getElementById('pl-progress-track').setAttribute('aria-valuetext',`${done} of ${tasks.length} tasks completed`);
    document.getElementById('pl-result-count').textContent=`${items.length} of ${tasks.length} sample tasks`;
    document.getElementById('pl-task-list').innerHTML=items.map(t=>`<tr><td><button type="button" data-task="${t.id}">${escape(t.title)}</button></td><td><span class="pl-stage-pill" data-stage="${t.stage}">${stages[t.stage]}</span></td><td>${owners[t.owner]}</td></tr>`).join('');
    document.getElementById('pl-list-empty').hidden=items.length!==0;
    board.hidden=view!=='board';document.getElementById('pl-list').hidden=view!=='list';
  }
  function open(id,initialStage='todo',trigger){
    returnFocus=trigger;editing=id;const t=tasks.find(t=>t.id===id);
    document.getElementById('pl-dialog-title').textContent=t?'Task details':'Add a sample task';
    title.value=t?t.title:'';note.value=t?t.note:'';stage.value=t?t.stage:initialStage;owner.value=t?t.owner:'Unassigned';
    document.getElementById('pl-save').textContent=t?'Save changes':'Add task';dialog.showModal();title.focus();
  }
  document.addEventListener('click',e=>{const task=e.target.closest('[data-task]');if(task){open(Number(task.dataset.task),'todo',task);return;}const add=e.target.closest('[data-add-task]');if(add)open(null,add.dataset.addTask||'todo',add);});
  search.addEventListener('input',render);assignee.addEventListener('change',render);
  document.querySelectorAll('[data-pulse-view]').forEach(tab=>tab.addEventListener('click',()=>{view=tab.dataset.pulseView;document.querySelectorAll('[data-pulse-view]').forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1;});render();}));
  document.getElementById('pl-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...document.querySelectorAll('[data-pulse-view]')];const i=tabs.indexOf(document.activeElement);const target=e.key==='Home'?tabs[0]:e.key==='End'?tabs.at(-1):tabs[(i+1)%tabs.length];target.click();target.focus();});
  document.getElementById('pl-close').addEventListener('click',()=>dialog.close());
  form.addEventListener('submit',e=>{e.preventDefault();if(!title.value.trim()){title.setCustomValidity('Enter a task name.');title.reportValidity();return;}title.setCustomValidity('');const existing=tasks.find(t=>t.id===editing);const values={title:title.value.trim(),note:note.value.trim(),stage:stage.value,owner:owner.value};if(existing)Object.assign(existing,values);else tasks.push({...values,id:nextId++,category:'Planning',due:'Unscheduled'});dialog.close();render();document.getElementById('pl-feedback').textContent=existing?'Sample task updated.':'Sample task added.';});
  title.addEventListener('input',()=>title.setCustomValidity(''));
  dialog.addEventListener('close',()=>{const current=editing?(view==='board'?board:document.getElementById('pl-list')).querySelector(`[data-task="${editing}"]`):null;if(current?.getClientRects().length)current.focus();else if(returnFocus?.isConnected)returnFocus.focus();else document.querySelector('[data-add-task="todo"]').focus();});
  render();
})();
