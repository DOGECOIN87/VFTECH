/* Local, extractive answers. No fetch, model API, browser tools, or chat storage. */
(function (scope) {
  'use strict';
  var stop = new Set(('a an and are as at be been but by can could did do does for from have how i in is it its me my of on or our please that the their this to us was we what when where which who why will with would you your tell about more much looking work works explain').split(' '));
  var aliases = {
    cost:'pricing', costs:'pricing', price:'pricing', prices:'pricing', fee:'pricing', fees:'pricing', budget:'pricing', quote:'pricing',
    login:'account', signin:'account', register:'account', signup:'account', accounts:'account', customer:'account', clients:'account',
    graph:'chart', graphs:'chart', charts:'chart', charting:'chart', analytics:'chart',
    dashboards:'dashboard', metrics:'dashboard', monitoring:'console', kanban:'board', tasks:'board',
    security:'secure', captcha:'verification', turnstile:'verification', emailed:'email', contact:'contact',
    rebuilds:'rebuild', sites:'website', websites:'website', handover:'ownership', own:'ownership', owned:'ownership'
  };
  function tokens(text) {
    return Array.from(new Set(String(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').match(/[a-z0-9]+/g) || []))
      .filter(function (word) { return !stop.has(word); }).map(function (word) { return aliases[word] || word; });
  }
  function create(records) {
    var indexed = records.map(function (record) {
      return {record:record, title:tokens(record.title + ' ' + (record.tags || []).join(' ')), words:tokens(record.text)};
    });
    var vocabulary = new Set(indexed.flatMap(function (item) { return item.title.concat(item.words); }));
    function get(id) { return records.find(function (record) { return record.id === id; }); }
    function extract(record, query) {
      var sentences = record.text.match(/[^.!?]+(?:[.!?](?=\s|$)|$)/g) || [record.text];
      if (record.text.length < 650) return record.text;
      var scored = sentences.map(function (sentence, index) {
        var words = tokens(sentence);
        return {index:index, text:sentence.trim(), score:query.filter(function (word) { return words.includes(word); }).length};
      }).sort(function (a,b) { return b.score-a.score || a.index-b.index; });
      var selected = scored.slice(0,3).sort(function (a,b) { return a.index-b.index; }).map(function (item) { return item.text; }).join(' ');
      return selected.length > 900 ? selected.slice(0,897).replace(/\s+\S*$/,'') + '…' : selected;
    }
    function answer(question, context) {
      var text = String(question || '').trim().slice(0,600), words = tokens(text);
      var contextQuestion = /^(hi|hello|hey)[.! ]*$/i.test(text) || /\b(this page|looking at|this chart|this dashboard|how does (this|it) work)\b/i.test(text);
      var contextual = context && get(context.recordId);
      if (contextQuestion && contextual) return {text:extract(contextual,words), sources:[contextual], found:true};
      var known = words.filter(function (word) { return vocabulary.has(word); });
      if (!words.length || !known.length || known.length/words.length < 0.8) return boundary();
      var ranked = indexed.map(function (item) {
        var matches = known.filter(function (word) { return item.title.includes(word) || item.words.includes(word); });
        var score = matches.length * 3 + known.filter(function (word) { return item.title.includes(word); }).length * 5;
        if (context && item.record.page === context.page) score += matches.length ? 1 : 0;
        if (context && item.record.design === context.design) score += matches.length ? 1 : 0;
        return {record:item.record, score:score, coverage:matches.length/known.length};
      }).filter(function (item) { return item.coverage >= 0.8 && item.score >= 5; }).sort(function (a,b) { return b.score-a.score; });
      if (!ranked.length) return boundary();
      return {text:extract(ranked[0].record,known), sources:[ranked[0].record], found:true};
    }
    function boundary() {
      return {text:"I only answer from VFTech’s published pages. I couldn’t find an answer there. Ask about services, pricing, the demos, delivery or customer accounts.", sources:[], found:false};
    }
    return {answer:answer, get:get, records:records};
  }
  scope.VFTechGuideEngine = {create:create, tokens:tokens};
})(typeof globalThis !== 'undefined' ? globalThis : window);
