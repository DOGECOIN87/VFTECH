/* All monitoring values are local demo fixtures. No requests leave this page. */
(function () {
  const chart = document.getElementById('cx-chart');
  if (!chart) return;
  const environment = document.getElementById('cx-environment');
  const metric = document.getElementById('cx-metric');
  const level = document.getElementById('cx-level');
  const events = [...document.querySelectorAll('[data-event-level]')];
  let range = '1h', revision = 0;
  const samples = [118,122,116,129,138,121,126,132,145,131,124,119,128,136,127,122,131,125,124,128,122,118,124,126];
  function render() {
    const staging = environment.value === 'staging';
    const values = samples.map((v,i) => Math.round((v + (range === '15m' ? ((i % 3) - 1) * 5 : range === '24h' ? ((i % 5) - 2) * 9 : 0) + (revision % 3) * 2) * (staging ? 1.18 : 1) * (metric.value === 'requests' ? 1.7 : metric.value === 'errors' ? .002 : 1)));
    const max = metric.value === 'requests' ? 400 : metric.value === 'errors' ? 1 : 250;
    const unit = metric.value === 'requests' ? 'req/min' : metric.value === 'errors' ? '%' : 'ms';
    const label = metric.options[metric.selectedIndex].text;
    const points = values.map((v,i) => `${48+i*22.1},${218-v/max*174}`);
    chart.querySelector('.line').setAttribute('d','M'+points.join(' L'));
    chart.querySelector('.area').setAttribute('d','M48,218 L'+points.join(' L')+' L556,218 Z');
    chart.querySelectorAll('[data-y]').forEach(e => { e.textContent = `${Math.round(max*Number(e.dataset.y)*100)/100}`; });
    chart.querySelector('[data-chart-unit]').textContent = unit;
    chart.querySelector('[data-chart-title]').textContent = `${label}, ${environment.value}, last ${range}. Sample data.`;
    document.getElementById('cx-chart-description').textContent = `${label} · last ${range} · ${unit}`;
    document.getElementById('cx-window').textContent = range === '15m' ? '15 minutes ago → now' : range === '24h' ? '24 hours ago → now' : '1 hour ago → now';
    document.getElementById('cx-chart-values').innerHTML = values.filter((_,i)=>i%4===0).map((v,i)=>`<tr><td>Sample ${i*4+1}</td><td>${v} ${unit}</td></tr>`).join('');
    document.getElementById('cx-latency').innerHTML = `${staging ? 149 + revision%3*2 : 126 + revision%3*2}<small> ms</small>`;
    document.getElementById('cx-requests').textContent = staging ? '842' : '12,846';
    document.getElementById('cx-env-label').textContent = staging ? 'staging' : 'production';
    document.getElementById('cx-snapshot').textContent = `Sample snapshot ${String(revision+1).padStart(2,'0')} · ${environment.value}`;
  }
  environment.addEventListener('change',render);
  metric.addEventListener('change',render);
  document.querySelectorAll('[data-range]').forEach(button => button.addEventListener('click',() => {
    range = button.dataset.range;
    document.querySelectorAll('[data-range]').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
    render();
  }));
  document.getElementById('cx-refresh').addEventListener('click',() => { revision++;render(); });
  level.addEventListener('change',() => {
    let count=0;
    events.forEach(e=> { e.hidden=level.value !== 'all' && e.dataset.eventLevel !== level.value; if(!e.hidden)count++; });
    document.getElementById('cx-event-count').textContent=`${count} sample events`;
    document.getElementById('cx-empty').hidden=count!==0;
  });
  document.querySelectorAll('[data-service-note]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-service-note]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    document.getElementById('cx-service-note').textContent=button.dataset.serviceNote;
  }));
  document.getElementById('cx-export').addEventListener('click',()=>{
    const rows=[['time','level','event','environment'],...events.filter(e=>!e.hidden).map(e=>[e.querySelector('time').textContent,e.dataset.eventLevel,e.querySelector('p').textContent,environment.value])];
    const csv=rows.map(row=>row.map(v=>'"'+v.replaceAll('"','""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='vftech-sample-events.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  render();
})();
