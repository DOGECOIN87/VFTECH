(function () {
  'use strict';
  if (!window.VFTechGuideEngine || !window.VFTechKnowledge || document.getElementById('vfg-launch')) return;
  var script = document.currentScript, directory = new URL('.',script.src);
  var root = /\/design-\d+\/$/.test(directory.pathname) ? new URL('../',directory) : directory;
  var designMatch = location.pathname.match(/\/design-(\d+)\//), design = designMatch ? Number(designMatch[1]) : 3;
  var page = location.pathname.split('/').pop() || 'index.html';
  var engine = VFTechGuideEngine.create(VFTechKnowledge.records);
  var record = engine.records.find(function (item) { return item.page === page && item.design === design; }) ||
    engine.records.find(function (item) { return item.page === page; }) || engine.get('guide-about');
  var context = {page:page,design:design,recordId:record && record.id};
  function node(tag,cls,text) { var el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el; }
  function localLink(file) { return new URL(file,root).href; }
  var launch=node('button','vfg-launch');launch.id='vfg-launch';launch.type='button';
  launch.setAttribute('aria-label','Open VFTech site guide');launch.setAttribute('aria-expanded','false');launch.setAttribute('aria-controls','vfg-panel');
  launch.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8l-6 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M7 8h10M7 12h7"/></svg>';
  var panel=node('aside','vfg-panel');panel.id='vfg-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','VFTech site guide');panel.setAttribute('aria-modal','false');
  var header=node('header','vfg-head'), heading=node('div');heading.append(node('strong','','VFTech guide'),node('p','','Answers from this site. Chat stays in this tab.'));
  var close=node('button','vfg-close','×');close.type='button';close.setAttribute('aria-label','Close site guide');header.append(heading,close);
  var contextBox=node('div','vfg-context'), followLabel=node('label','vfg-follow'), follow=node('input');follow.type='checkbox';follow.checked=true;followLabel.append(follow,document.createTextNode('Follow this page'));
  var contextButton=node('button','vfg-context-button');contextButton.type='button';contextBox.append(followLabel,contextButton);
  var log=node('div','vfg-log');log.id='vfg-log';log.setAttribute('role','log');log.setAttribute('aria-live','polite');log.setAttribute('aria-relevant','additions');
  var prompts=node('div','vfg-prompts');
  ['What can VFTech build?','What are the prices?','Are the demos real data?'].forEach(function (question) {var button=node('button','',question);button.type='button';button.addEventListener('click',function(){ask(question);});prompts.append(button);});
  var form=node('form','vfg-form'), label=node('label','vfg-visually-hidden','Ask about VFTech');label.htmlFor='vfg-question';
  var input=node('input');input.id='vfg-question';input.name='question';input.placeholder='Ask about this site…';input.maxLength=600;input.autocomplete='off';input.required=true;
  var send=node('button','','Ask');send.type='submit';form.append(label,input,send);
  var links=node('nav','vfg-links');links.setAttribute('aria-label','Explore VFTech');
  [['Features','features.html'],['Pricing','features.html#prices'],['Account','account.html']].forEach(function(pair){var a=node('a','',pair[0]);a.href=localLink(pair[1]);links.append(a);});
  panel.append(header,contextBox,log,prompts,form,links);document.body.append(panel,launch);
  var navigation=node('nav','vfs-discover');navigation.setAttribute('aria-label','VFTech features and customer services');
  [['Explore features','features.html'],['Pricing','features.html#prices'],['Customer account','account.html']].forEach(function(pair){var a=node('a','',pair[0]);a.href=pair[1];navigation.append(a);});
  var footer=document.querySelector('footer');if(footer && !footer.closest('main'))footer.before(navigation);else document.querySelector('main')?.after(navigation);
  function describe() {var current=engine.get(context.recordId);contextButton.textContent=current ? 'About: '+current.title : 'About this page';}
  function open(on) {panel.hidden=!on;launch.setAttribute('aria-expanded',String(on));if(on)input.focus();else launch.focus();}
  launch.addEventListener('click',function(){open(panel.hidden);});close.addEventListener('click',function(){open(false);});
  panel.addEventListener('keydown',function(event){if(event.key==='Escape'){event.preventDefault();open(false);}});
  function message(text,kind,sources) {
    var item=node('div','vfg-message vfg-'+kind);item.append(node('p','',text));
    if(sources && sources.length){var citations=node('div','vfg-sources');sources.forEach(function(source){var a=node('a','','Source: '+source.title);var prefix=source.design===3?'':'design-'+source.design+'/';a.href=localLink(prefix+source.page+(source.anchor?'#'+source.anchor:''));citations.append(a);});item.append(citations);}
    log.append(item);while(log.children.length>40)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;
  }
  function ask(question) {if(!question.trim())return;message(question,'user');var reply=engine.answer(question,context);message(reply.text,'answer',reply.sources);input.value='';input.focus();}
  form.addEventListener('submit',function(event){event.preventDefault();ask(input.value);});
  contextButton.addEventListener('click',function(){var current=engine.get(context.recordId);if(current){message(current.text.slice(0,900),'answer',[current]);input.focus();}});
  var controls = [
    ['#sc-tab-dash,#ld-search,#ld-stage,.ld-project,.ld-reviews input','feature-dashboard'],
    ['#sc-tab-chart,[data-chart-range],#cx-chart,#cx-range,[data-cx-metric]','feature-charts'],
    ['#sc-tab-data,[data-filter],[data-sort],#vfs-stream-toggle','feature-data'],
    ['#sc-tab-acct,[data-signin],[data-signout]','feature-accounts'],
    ['#pl-tabs,[data-add-task],.pl-task,.pl-card,#pl-search,#pl-assignee','feature-board'],
    ['#book-form','guide-contact'],['#vf-account-form,#vf-code-form','guide-accounts']
  ];
  document.addEventListener('click',function(event){
    if(!follow.checked || panel.contains(event.target)||launch.contains(event.target))return;
    for(var pair of controls){if(event.target.closest(pair[0]) && engine.get(pair[1])){context.recordId=pair[1];describe();return;}}
    var section=event.target.closest('main section[id],main article[id]');if(!section)return;
    var match=engine.records.find(function(item){return item.page===page && (item.design===design || item.design===3) && item.anchor===section.id;});
    if(match){context.recordId=match.id;describe();}
  });
  describe();message('Ask about VFTech or use “About” for the part of the page you’re exploring.','answer');
  window.VFTechGuide = {ask:ask,open:function(){open(true);},context:context};
})();
