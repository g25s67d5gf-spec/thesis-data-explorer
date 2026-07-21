
const DB_NAME='pledge-explorer-db-v4', STORE='datasets', KEY='current';
let rows=[], meta={};

const PRESIDENCIES=[
  {key:'German',label:'Germany',term:'Jul–Dec 2020',trio:'Trio 2020–2021'},
  {key:'Portuguese',label:'Portugal',term:'Jan–Jun 2021',trio:'Trio 2020–2021'},
  {key:'Slovenian',label:'Slovenia',term:'Jul–Dec 2021',trio:'Trio 2020–2021'},
  {key:'French',label:'France',term:'Jan–Jun 2022',trio:'Trio 2022–2023'},
  {key:'Czech',label:'Czechia',term:'Jul–Dec 2022',trio:'Trio 2022–2023'},
  {key:'Swedish',label:'Sweden',term:'Jan–Jun 2023',trio:'Trio 2022–2023'},
  {key:'Spanish',label:'Spain',term:'Jul–Dec 2023',trio:'Trio 2023–2024'},
  {key:'Belgian',label:'Belgium',term:'Jan–Jun 2024',trio:'Trio 2023–2024'},
  {key:'Hungarian',label:'Hungary',term:'Jul–Dec 2024',trio:'Trio 2023–2024'},
  {key:'Polish',label:'Poland',term:'Jan–Jun 2025',trio:'Trio 2025–2026'},
  {key:'Danish',label:'Denmark',term:'Jul–Dec 2025',trio:'Trio 2025–2026'},
  {key:'Cypriot',label:'Cyprus',term:'Jan–Jun 2026',trio:'Trio 2025–2026'}
];

const TRIOS={
  'Trio 2020–2021':{label:'Germany · Portugal · Slovenia',period:'July 2020 – December 2021',color:'var(--trio1)'},
  'Trio 2022–2023':{label:'France · Czechia · Sweden',period:'January 2022 – June 2023',color:'var(--trio2)'},
  'Trio 2023–2024':{label:'Spain · Belgium · Hungary',period:'July 2023 – December 2024',color:'var(--trio3)'},
  'Trio 2025–2026':{label:'Poland · Denmark · Cyprus',period:'January 2025 – June 2026',color:'var(--trio4)'}
};

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const keys=()=>Object.keys(rows[0]||{});
function field(...names){return keys().find(k=>names.some(n=>k.toLowerCase().trim()===n.toLowerCase()))}
const norm=v=>String(v??'').trim();
const uniq=a=>[...new Set(a.map(norm).filter(Boolean))];
const pct=(n,d)=>d?Math.round(n/d*1000)/10:0;
const escapeHtml=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function db(){return new Promise((res,rej)=>{const q=indexedDB.open(DB_NAME,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(STORE))q.result.createObjectStore(STORE)};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function put(v){const d=await db();return new Promise((res,rej)=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).put(v,KEY);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
async function get(){const d=await db();return new Promise((res,rej)=>{const q=d.transaction(STORE).objectStore(STORE).get(KEY);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function del(){const d=await db();return new Promise((res,rej)=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).delete(KEY);t.oncomplete=res;t.onerror=()=>rej(t.error)})}

function parseFile(file){
  const reader=new FileReader();
  reader.onload=async e=>{
    try{
      const wb=XLSX.read(e.target.result,{type:'array'});
      const sheetName=wb.SheetNames.includes('Pledge Coding')?'Pledge Coding':wb.SheetNames[0];
      rows=XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{defval:''});
      meta={name:file.name,loaded:new Date().toISOString(),sheet:sheetName};
      await put({rows,meta}); boot();
    }catch(err){alert('Could not read workbook: '+err.message)}
  };
  reader.readAsArrayBuffer(file);
}

function testable(){
  const s=field('Survives Step 2?','Survives Step 2');
  return s?rows.filter(r=>norm(r[s]).toUpperCase()==='Y'):rows;
}
function isSpecific(r){
  const s=field('Specific / Vague');
  if(!s)return true;
  const v=norm(r[s]).toLowerCase();
  return v==='s'||v==='specific';
}
function specificPledges(){return testable().filter(isSpecific)}
function outcome(v){
  const x=norm(v).toLowerCase();
  if(x==='fulfilled')return'Fulfilled';
  if(x==='partly fulfilled'||x==='partially fulfilled')return'Partly Fulfilled';
  if(x==='not fulfilled')return'Not Fulfilled';
  return'';
}
function evaluatedSpecific(data=specificPledges()){
  const f=field('Fulfillment','Fulfilment');
  return data.filter(r=>outcome(r[f]));
}
function pmeta(key){return PRESIDENCIES.find(p=>p.key===key)||{key,label:key,term:'',trio:'Other'}}
function trioOf(key){return pmeta(key).trio}
function trioColor(key){return TRIOS[trioOf(key)]?.color||'#ddd'}
function presidencyList(data){
  const p=field('Presidency'), present=uniq(data.map(r=>r[p]));
  return PRESIDENCIES.filter(x=>present.includes(x.key)).map(x=>x.key).concat(present.filter(x=>!PRESIDENCIES.some(y=>y.key===x)));
}

function boot(){
  if(!rows.length)return;
  $('#emptyState').classList.add('hidden');$('#app').classList.remove('hidden');renderAll();
}

function renderAll(){
  const all=testable(), specific=specificPledges(), ev=evaluatedSpecific(specific);
  const p=field('Presidency'), f=field('Fulfillment','Fulfilment'), pres=presidencyList(all);
  const full=ev.filter(r=>outcome(r[f])==='Fulfilled').length;
  const part=ev.filter(r=>outcome(r[f])==='Partly Fulfilled').length;
  const notf=ev.filter(r=>outcome(r[f])==='Not Fulfilled').length;

  $('#centerCount').textContent=pres.length;
  $('#centerSpecific').textContent=`${specific.length.toLocaleString()} specific pledges`;
  $('#statStatements').textContent=rows.length.toLocaleString();
  $('#statTestable').textContent=all.length.toLocaleString();
  $('#statSpecific').textContent=specific.length.toLocaleString();
  $('#statFullRate').textContent=pct(full,ev.length)+'%';
  $('#statPartRate').textContent=pct(part,ev.length)+'%';
  $('#statNotRate').textContent=pct(notf,ev.length)+'%';
  $('#statAtLeast').textContent=pct(full+part,ev.length)+'%';

  renderCycle(all,specific,p,pres,f);
  renderTrioLegend(specific,p,f);
  renderStacked($('#stackedChart'),specific,p,pres,f,false);
  fillFilters(all,p);
  renderTable();
  renderAnalysis(all,specific,p,f,pres);
  $('#dataInfo').textContent=`${meta.name||'Workbook'} · ${rows.length.toLocaleString()} coded statements · ${all.length.toLocaleString()} testable pledges · ${specific.length.toLocaleString()} specific pledges · loaded ${meta.loaded?new Date(meta.loaded).toLocaleString():''}`;
}

function renderCycle(all,specific,p,pres,f){
  const box=$('#cycle');box.innerHTML='';
  pres.forEach((key,i)=>{
    const pm=pmeta(key), a=360/pres.length*i-90;
    const d=document.createElement('div');d.className='term';d.style.transform=`rotate(${a}deg)`;
    d.innerHTML=`<div class="term-card" style="--seg:${trioColor(key)}"><div style="transform:rotate(${-a}deg);text-align:right"><b>${pm.label}</b><small>${pm.term}</small></div></div>`;
    const sp=specific.filter(r=>norm(r[p])===key), ev=evaluatedSpecific(sp), full=ev.filter(r=>outcome(r[f])==='Fulfilled').length, part=ev.filter(r=>outcome(r[f])==='Partly Fulfilled').length, notf=ev.filter(r=>outcome(r[f])==='Not Fulfilled').length;
    d.onmouseenter=()=>showTip(`<b>${pm.label} Presidency</b><br>${pm.term}<br>${pm.trio}<br><br>${sp.length} specific pledges<br>${pct(full,ev.length)}% fulfilled · ${pct(part,ev.length)}% partly · ${pct(notf,ev.length)}% not fulfilled`);
    d.onmousemove=moveTip;d.onmouseleave=hideTip;
    d.onclick=()=>{$('.nav[data-view="pledges"]').click();$('#presFilter').value=key;$('#trioFilter').value='';renderTable()};
    box.appendChild(d);
  });
}

function renderTrioLegend(specific,p,f){
  const el=$('#trioLegend');el.innerHTML='';
  Object.entries(TRIOS).forEach(([id,t])=>{
    const sp=specific.filter(r=>trioOf(norm(r[p]))===id), ev=evaluatedSpecific(sp);
    const full=ev.filter(r=>outcome(r[f])==='Fulfilled').length, part=ev.filter(r=>outcome(r[f])==='Partly Fulfilled').length, notf=ev.filter(r=>outcome(r[f])==='Not Fulfilled').length;
    const d=document.createElement('div');d.className='trio-item';d.style.background=t.color;
    d.innerHTML=`<b>${id}</b>${t.label}`;
    d.onmouseenter=()=>showTip(`<b>${id}</b><br>${t.label}<br>${t.period}<br><br>${sp.length} specific pledges<br>${pct(full,ev.length)}% fulfilled<br>${pct(part,ev.length)}% partly fulfilled<br>${pct(notf,ev.length)}% not fulfilled<br><b>${pct(full+part,ev.length)}% at least partly fulfilled</b>`);
    d.onmousemove=moveTip;d.onmouseleave=hideTip;el.appendChild(d);
  });
}

function showTip(html){const tip=$('#tooltip');tip.innerHTML=html;tip.classList.remove('hidden')}
function moveTip(e){const tip=$('#tooltip');tip.style.left=e.clientX+14+'px';tip.style.top=e.clientY+14+'px'}
function hideTip(){$('#tooltip').classList.add('hidden')}

function renderStacked(el,data,p,groups,f,byTrio){
  el.innerHTML='';
  groups.forEach(group=>{
    const sub=byTrio?data.filter(r=>trioOf(norm(r[p]))===group):data.filter(r=>norm(r[p])===group);
    const ev=evaluatedSpecific(sub), full=ev.filter(r=>outcome(r[f])==='Fulfilled').length, part=ev.filter(r=>outcome(r[f])==='Partly Fulfilled').length, notf=ev.filter(r=>outcome(r[f])==='Not Fulfilled').length;
    const label=byTrio?group:pmeta(group).label;
    el.insertAdjacentHTML('beforeend',`<div class="stack-row"><b>${escapeHtml(label)}</b><div class="stack"><div class="seg-full" style="width:${pct(full,ev.length)}%"></div><div class="seg-part" style="width:${pct(part,ev.length)}%"></div><div class="seg-not" style="width:${pct(notf,ev.length)}%"></div></div><span>${ev.length} pledges</span></div>`);
  });
}

function fillSelect(el,vals,labelFn=x=>x){
  const first=el.options[0].outerHTML;
  el.innerHTML=first+vals.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(labelFn(v))}</option>`).join('');
}
function fillFilters(data,p){
  const t=field('Pledge Type'),s=field('Specific / Vague');
  const pres=presidencyList(data);
  fillSelect($('#presFilter'),pres,x=>pmeta(x).label);
  fillSelect($('#trioFilter'),Object.keys(TRIOS));
  fillSelect($('#specFilter'),uniq(data.map(r=>r[s])));
  fillSelect($('#fulFilter'),['Fulfilled','Partly Fulfilled','Not Fulfilled','Ignored for fulfilment analysis']);
  fillSelect($('#typeFilter'),uniq(data.map(r=>r[t])));
}
function fulfilmentDisplay(r){
  const f=field('Fulfillment','Fulfilment');
  if(!isSpecific(r))return'Ignored for fulfilment analysis';
  return outcome(r[f])||'No fulfilment result';
}
function renderTable(){
  const data=testable(),p=field('Presidency'),t=field('Pledge Type'),s=field('Statement'),sec=field('Section'),notes=field('Notes'),spec=field('Specific / Vague');
  let filtered=data.filter(r=>{
    const fd=fulfilmentDisplay(r);
    return(!$('#presFilter').value||norm(r[p])===$('#presFilter').value)
      &&(!$('#trioFilter').value||trioOf(norm(r[p]))===$('#trioFilter').value)
      &&(!$('#specFilter').value||norm(r[spec])===$('#specFilter').value)
      &&(!$('#fulFilter').value||fd===$('#fulFilter').value)
      &&(!$('#typeFilter').value||norm(r[t])===$('#typeFilter').value);
  });
  const q=$('#searchBox').value.toLowerCase();
  if(q)filtered=filtered.filter(r=>[r[s],r[sec],r[notes]].join(' ').toLowerCase().includes(q));
  const cols=[p,sec,s,spec,t].filter(Boolean);
  $('#tableHead').innerHTML='<tr><th>Trio</th>'+cols.map(c=>`<th>${escapeHtml(c)}</th>`).join('')+'<th>Fulfilment analysis status</th></tr>';
  $('#tableBody').innerHTML=filtered.slice(0,500).map(r=>'<tr><td>'+escapeHtml(trioOf(norm(r[p])))+'</td>'+cols.map(c=>`<td class="${c===s?'statement':''}">${escapeHtml(c===p?pmeta(norm(r[c])).label:r[c])}</td>`).join('')+`<td>${escapeHtml(fulfilmentDisplay(r))}</td></tr>`).join('');
  $('#tableCount').textContent=`Showing ${Math.min(filtered.length,500).toLocaleString()} of ${filtered.length.toLocaleString()} matching pledges${filtered.length>500?' (first 500 shown)':''}.`;
}

function donut(el,items){
  const total=items.reduce((s,x)=>s+x.value,0)||1;let start=0;
  const cols=['var(--ok)','var(--part)','var(--no)','#c8d7e2'];
  const grad=items.map((x,i)=>{const end=start+x.value/total*360,s=`${cols[i%cols.length]} ${start}deg ${end}deg`;start=end;return s}).join(',');
  el.innerHTML=`<div class="donut-box"><div class="donut" style="background:conic-gradient(${grad})"></div><div class="legend-list">${items.map((x,i)=>`<div><span class="legend-dot" style="background:${cols[i%cols.length]}"></span>${escapeHtml(x.label)} <b>${x.value}</b> (${pct(x.value,total)}%)</div>`).join('')}</div></div>`;
}
function renderBars(el,items){
  const max=Math.max(...items.map(x=>x[1]),1);
  el.innerHTML=items.map(([v,c])=>`<div class="bar-row"><b>${escapeHtml(v)}</b><div class="bar-track"><div class="bar-fill" style="width:${c/max*100}%"></div></div><span>${c}</span></div>`).join('');
}
function categoryCounts(data,col,limit=12){
  const c={};data.forEach(r=>{const v=norm(r[col])||'Missing';c[v]=(c[v]||0)+1});
  return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,limit);
}
function renderAnalysis(all,specific,p,f,pres){
  renderStacked($('#analysisPresStack'),specific,p,pres,f,false);
  renderStacked($('#analysisTrioStack'),specific,p,Object.keys(TRIOS),f,true);

  renderBars($('#specificByPres'),pres.map(key=>[pmeta(key).label,specific.filter(r=>norm(r[p])===key).length]));
  renderBars($('#specificByTrio'),Object.keys(TRIOS).map(id=>[id,specific.filter(r=>trioOf(norm(r[p]))===id).length]));

  const ev=evaluatedSpecific(specific),full=ev.filter(r=>outcome(r[f])==='Fulfilled').length,part=ev.filter(r=>outcome(r[f])==='Partly Fulfilled').length,notf=ev.filter(r=>outcome(r[f])==='Not Fulfilled').length;
  donut($('#outcomeDonut'),[{label:'Fulfilled',value:full},{label:'Partly fulfilled',value:part},{label:'Not fulfilled',value:notf}]);

  const specCol=field('Specific / Vague'),sCount=all.filter(isSpecific).length;
  donut($('#specificDonut'),[{label:'Specific',value:sCount},{label:'Vague',value:all.length-sCount}]);

  const type=field('Pledge Type');
  const types=uniq(specific.map(r=>r[type]));
  renderTypeFulfilment($('#fulfilmentByType'),specific,type,types,f);

  renderBars($('#typeBars'),categoryCounts(all,type,12));
  renderBars($('#sectionBars'),categoryCounts(all,field('Section'),12));
}

$$('.nav').forEach(b=>b.onclick=()=>{
  $$('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  $$('.view').forEach(v=>v.classList.add('hidden'));$('#view-'+b.dataset.view).classList.remove('hidden');
});
$$('.subtab').forEach(b=>b.onclick=()=>{
  $$('.subtab').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  $$('.analysis-pane').forEach(x=>x.classList.add('hidden'));$('#analysis-'+b.dataset.analysis).classList.remove('hidden');
});
['fileInput','fileInput2'].forEach(id=>$('#'+id).onchange=e=>e.target.files[0]&&parseFile(e.target.files[0]));
$('#replaceData').onclick=()=>$('#fileInput2').click();
$('#deleteData').onclick=async()=>{if(confirm('Delete the locally stored dataset from this browser?')){await del();location.reload()}};
['searchBox','presFilter','trioFilter','specFilter','fulFilter','typeFilter'].forEach(id=>$('#'+id).addEventListener(id==='searchBox'?'input':'change',renderTable));
(async()=>{const saved=await get();if(saved){rows=saved.rows||[];meta=saved.meta||{};boot()}})();

function renderTypeFulfilment(el,data,typeField,types,f){
  el.innerHTML='';
  types.forEach(type=>{
    const sub=data.filter(r=>norm(r[typeField])===type),ev=evaluatedSpecific(sub);
    const full=ev.filter(r=>outcome(r[f])==='Fulfilled').length,part=ev.filter(r=>outcome(r[f])==='Partly Fulfilled').length,notf=ev.filter(r=>outcome(r[f])==='Not Fulfilled').length;
    el.insertAdjacentHTML('beforeend',`<div class="stack-row"><b>${escapeHtml(type)}</b><div class="stack"><div class="seg-full" style="width:${pct(full,ev.length)}%"></div><div class="seg-part" style="width:${pct(part,ev.length)}%"></div><div class="seg-not" style="width:${pct(notf,ev.length)}%"></div></div><span>${ev.length} pledges</span></div>`);
  });
}
