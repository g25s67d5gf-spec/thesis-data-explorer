
const DB_NAME='pledge-explorer-db-v2', STORE='datasets', KEY='current';
let rows=[], meta={};

const PRESIDENCY_ORDER=['Portuguese','Slovenian','French','Czech','Swedish','Spanish','Belgian','Hungarian','Polish','Danish','Cypriot'];
const TRIOS={
  'Portuguese':{id:'Trio 2020–2021',label:'Germany · Portugal · Slovenia',color:'var(--trio1)'},
  'Slovenian':{id:'Trio 2020–2021',label:'Germany · Portugal · Slovenia',color:'var(--trio1)'},
  'French':{id:'Trio 2022–2023',label:'France · Czechia · Sweden',color:'var(--trio2)'},
  'Czech':{id:'Trio 2022–2023',label:'France · Czechia · Sweden',color:'var(--trio2)'},
  'Swedish':{id:'Trio 2022–2023',label:'France · Czechia · Sweden',color:'var(--trio2)'},
  'Spanish':{id:'Trio 2023–2024',label:'Spain · Belgium · Hungary',color:'var(--trio3)'},
  'Belgian':{id:'Trio 2023–2024',label:'Spain · Belgium · Hungary',color:'var(--trio3)'},
  'Hungarian':{id:'Trio 2023–2024',label:'Spain · Belgium · Hungary',color:'var(--trio3)'},
  'Polish':{id:'Trio 2025–2026',label:'Poland · Denmark · Cyprus',color:'var(--trio4)'},
  'Danish':{id:'Trio 2025–2026',label:'Poland · Denmark · Cyprus',color:'var(--trio4)'},
  'Cypriot':{id:'Trio 2025–2026',label:'Poland · Denmark · Cyprus',color:'var(--trio4)'}
};

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const keys=()=>Object.keys(rows[0]||{});
function field(...names){return keys().find(k=>names.some(n=>k.toLowerCase().trim()===n.toLowerCase()))}
const norm=v=>String(v??'').trim();
const uniq=a=>[...new Set(a.map(norm).filter(Boolean))];
const pct=(n,d)=>d?Math.round(n/d*1000)/10:0;

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
      await put({rows,meta});
      boot();
    }catch(err){alert('Could not read workbook: '+err.message)}
  };
  reader.readAsArrayBuffer(file);
}

function testable(){
  const s=field('Survives Step 2?','Survives Step 2');
  return s?rows.filter(r=>norm(r[s]).toUpperCase()==='Y'):rows;
}
function outcome(v){
  const x=norm(v).toLowerCase();
  if(x==='fulfilled') return 'Fulfilled';
  if(x==='partly fulfilled' || x==='partially fulfilled') return 'Partly Fulfilled';
  if(x==='not fulfilled') return 'Not Fulfilled';
  return '';
}
function evaluated(data){
  const f=field('Fulfillment','Fulfilment');
  return data.filter(r=>outcome(r[f]));
}
function presidencyList(data){
  const p=field('Presidency');
  const present=uniq(data.map(r=>r[p]));
  return PRESIDENCY_ORDER.filter(x=>present.includes(x)).concat(present.filter(x=>!PRESIDENCY_ORDER.includes(x)));
}
function trioOf(p){return TRIOS[p]?.id||'Other'}
function trioLabel(p){return TRIOS[p]?.label||'Other'}
function trioColor(p){return TRIOS[p]?.color||'#ddd'}

function boot(){
  if(!rows.length)return;
  $('#emptyState').classList.add('hidden');
  $('#app').classList.remove('hidden');
  renderAll();
}

function renderAll(){
  const data=testable(), ev=evaluated(data), p=field('Presidency'), f=field('Fulfillment','Fulfilment');
  const pres=presidencyList(data);
  const full=ev.filter(r=>outcome(r[f])==='Fulfilled').length;
  const part=ev.filter(r=>outcome(r[f])==='Partly Fulfilled').length;
  const notf=ev.filter(r=>outcome(r[f])==='Not Fulfilled').length;
  const missing=data.length-ev.length;

  $('#centerCount').textContent=pres.length;
  $('#centerPledges').textContent=`${data.length.toLocaleString()} testable pledges`;
  $('#statStatements').textContent=rows.length.toLocaleString();
  $('#statPledges').textContent=data.length.toLocaleString();
  $('#statEvaluated').textContent=ev.length.toLocaleString();
  $('#statCoverage').textContent=pct(ev.length,data.length)+'%';
  $('#statFullRate').textContent=pct(full,ev.length)+'%';

  $('#mFull').textContent=pct(full,ev.length)+'%'; $('#mFullN').textContent=`${full} evaluated pledges`;
  $('#mPart').textContent=pct(part,ev.length)+'%'; $('#mPartN').textContent=`${part} evaluated pledges`;
  $('#mNot').textContent=pct(notf,ev.length)+'%'; $('#mNotN').textContent=`${notf} evaluated pledges`;
  $('#mMissing').textContent=pct(missing,data.length)+'%'; $('#mMissingN').textContent=`${missing} testable pledges`;

  renderWheel(data,p,pres,f);
  renderTrioLegend(pres);
  renderStacked(data,p,pres,f);
  renderCoverage(data,p,pres,f);
  fillFilters(data,p,f);
  renderTable();
  renderAnalysis(data,f);
  $('#dataInfo').textContent=`${meta.name||'Workbook'} · ${rows.length.toLocaleString()} coded programme statements · ${data.length.toLocaleString()} testable pledges · loaded ${meta.loaded?new Date(meta.loaded).toLocaleString():''}`;
}

function renderWheel(data,p,pres,f){
  const w=$('#wheel');w.innerHTML='';
  pres.forEach((name,i)=>{
    const a=360/pres.length*i-90;
    const d=document.createElement('div');
    d.className='segment'; d.style.transform=`rotate(${a}deg)`;
    d.innerHTML=`<div class="segment-inner" style="--seg:${trioColor(name)}"><span style="transform:rotate(${-a}deg)">${name.replace('Portuguese','Portugal').replace('Slovenian','Slovenia').replace('French','France').replace('Czech','Czechia').replace('Swedish','Sweden').replace('Spanish','Spain').replace('Belgian','Belgium').replace('Hungarian','Hungary').replace('Polish','Poland').replace('Danish','Denmark').replace('Cypriot','Cyprus')}</span></div>`;
    const sub=data.filter(r=>norm(r[p])===name), ev=evaluated(sub), full=ev.filter(r=>outcome(r[f])==='Fulfilled').length;
    d.onmouseenter=()=>{const tip=$('#tooltip');tip.innerHTML=`<b>${name} Presidency</b><br>${trioLabel(name)}<br><br>${sub.length} testable pledges<br>${ev.length} evaluated<br>${ev.length?pct(full,ev.length)+'% fully fulfilled':'No evaluated pledges yet'}`;tip.classList.remove('hidden')};
    d.onmousemove=e=>{const tip=$('#tooltip');tip.style.left=e.clientX+14+'px';tip.style.top=e.clientY+14+'px'};
    d.onmouseleave=()=>$('#tooltip').classList.add('hidden');
    d.onclick=()=>{$('.nav[data-view="pledges"]').click();$('#presFilter').value=name;$('#trioFilter').value='';renderTable()};
    w.appendChild(d);
  });
}

function renderTrioLegend(pres){
  const groups=[];
  pres.forEach(p=>{const id=trioOf(p);if(!groups.some(g=>g.id===id))groups.push({id,label:trioLabel(p),color:trioColor(p)})});
  $('#trioLegend').innerHTML=groups.map(g=>`<div class="trio-item" style="background:${g.color}"><b>${g.id}</b>${g.label}</div>`).join('');
}

function renderStacked(data,p,pres,f){
  const box=$('#stackedChart');box.innerHTML='';
  pres.forEach(name=>{
    const ev=evaluated(data.filter(r=>norm(r[p])===name));
    const full=ev.filter(r=>outcome(r[f])==='Fulfilled').length, part=ev.filter(r=>outcome(r[f])==='Partly Fulfilled').length, notf=ev.filter(r=>outcome(r[f])==='Not Fulfilled').length;
    box.insertAdjacentHTML('beforeend',`<div class="stack-row"><b>${name}</b><div class="stack">${ev.length?`<div class="seg-full" style="width:${pct(full,ev.length)}%"></div><div class="seg-part" style="width:${pct(part,ev.length)}%"></div><div class="seg-not" style="width:${pct(notf,ev.length)}%"></div>`:''}</div><span>${ev.length} eval.</span></div>`);
  });
}

function renderCoverage(data,p,pres,f){
  const box=$('#coverageBars');box.innerHTML='';
  pres.forEach(name=>{
    const sub=data.filter(r=>norm(r[p])===name), ev=evaluated(sub), val=pct(ev.length,sub.length);
    box.insertAdjacentHTML('beforeend',`<div class="bar-row"><b>${name}</b><div class="bar-track"><div class="bar-fill" style="width:${val}%"></div></div><span>${val}%</span></div>`);
  });
}

function fillSelect(el,vals){
  const first=el.options[0].outerHTML;
  el.innerHTML=first+vals.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
}
function escapeHtml(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
function fillFilters(data,p,f){
  const t=field('Pledge Type');
  fillSelect($('#presFilter'),presidencyList(data));
  const trios=uniq(presidencyList(data).map(trioOf));
  fillSelect($('#trioFilter'),trios);
  fillSelect($('#fulFilter'),['Fulfilled','Partly Fulfilled','Not Fulfilled','Not yet evaluated']);
  fillSelect($('#typeFilter'),uniq(data.map(r=>r[t])));
}

function renderTable(){
  const data=testable(), p=field('Presidency'), f=field('Fulfillment','Fulfilment'), t=field('Pledge Type'), s=field('Statement'), sec=field('Section'), notes=field('Notes'), spec=field('Specific / Vague');
  let filtered=data.filter(r=>{
    const o=outcome(r[f]);
    const of=o||'Not yet evaluated';
    return (!$('#presFilter').value||norm(r[p])===$('#presFilter').value)
      &&(!$('#trioFilter').value||trioOf(norm(r[p]))===$('#trioFilter').value)
      &&(!$('#fulFilter').value||of===$('#fulFilter').value)
      &&(!$('#typeFilter').value||norm(r[t])===$('#typeFilter').value);
  });
  const q=$('#searchBox').value.toLowerCase();
  if(q)filtered=filtered.filter(r=>[r[s],r[sec],r[notes]].join(' ').toLowerCase().includes(q));
  const cols=[p,sec,s,spec,t,f].filter(Boolean);
  $('#tableHead').innerHTML='<tr><th>Trio</th>'+cols.map(c=>`<th>${escapeHtml(c)}</th>`).join('')+'</tr>';
  $('#tableBody').innerHTML=filtered.slice(0,500).map(r=>'<tr><td>'+escapeHtml(trioOf(norm(r[p])))+'</td>'+cols.map(c=>`<td class="${c===s?'statement':''}">${escapeHtml(c===f?(outcome(r[c])||'Not yet evaluated'):r[c])}</td>`).join('')+'</tr>').join('');
  $('#tableCount').textContent=`Showing ${Math.min(filtered.length,500).toLocaleString()} of ${filtered.length.toLocaleString()} matching pledges${filtered.length>500?' (first 500 shown)':''}.`;
}

function donut(el, items){
  const total=items.reduce((s,x)=>s+x.value,0)||1;
  let start=0;
  const cols=['var(--ok)','var(--part)','var(--no)','var(--pending)'];
  const grad=items.map((x,i)=>{const end=start+x.value/total*360;const s=`${cols[i%cols.length]} ${start}deg ${end}deg`;start=end;return s}).join(',');
  el.innerHTML=`<div class="donut-box"><div class="donut" style="background:conic-gradient(${grad})"></div><div class="legend-list">${items.map((x,i)=>`<div><span class="legend-dot" style="background:${cols[i%cols.length]}"></span>${escapeHtml(x.label)} <b>${x.value}</b> (${pct(x.value,total)}%)</div>`).join('')}</div></div>`;
}

function renderAnalysis(data,f){
  const ev=evaluated(data), full=ev.filter(r=>outcome(r[f])==='Fulfilled').length, part=ev.filter(r=>outcome(r[f])==='Partly Fulfilled').length, notf=ev.filter(r=>outcome(r[f])==='Not Fulfilled').length;
  donut($('#outcomeDonut'),[{label:'Fulfilled',value:full},{label:'Partly fulfilled',value:part},{label:'Not fulfilled',value:notf}]);
  donut($('#evalDonut'),[{label:'Evaluated',value:ev.length},{label:'Not yet evaluated',value:data.length-ev.length}]);

  const t=field('Pledge Type'), spec=field('Specific / Vague'), sec=field('Section');
  renderCategoryBars($('#typeBars'),data,t,12);
  renderCategoryBars($('#specificBars'),data,spec,12);
  renderCategoryBars($('#sectionBars'),data,sec,12);
}

function renderCategoryBars(el,data,col,limit){
  if(!col){el.innerHTML='<p class="muted">Variable not found in workbook.</p>';return}
  const counts={};data.forEach(r=>{const v=norm(r[col])||'Missing';counts[v]=(counts[v]||0)+1});
  const arr=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,limit), max=Math.max(...arr.map(x=>x[1]),1);
  el.innerHTML=arr.map(([v,c])=>`<div class="bar-row"><b>${escapeHtml(v)}</b><div class="bar-track"><div class="bar-fill" style="width:${c/max*100}%"></div></div><span>${c}</span></div>`).join('');
}

$$('.nav').forEach(b=>b.onclick=()=>{
  $$('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  $$('.view').forEach(v=>v.classList.add('hidden'));$('#view-'+b.dataset.view).classList.remove('hidden');
});
['fileInput','fileInput2'].forEach(id=>$('#'+id).onchange=e=>e.target.files[0]&&parseFile(e.target.files[0]));
$('#replaceData').onclick=()=>$('#fileInput2').click();
$('#deleteData').onclick=async()=>{if(confirm('Delete the locally stored dataset from this browser?')){await del();location.reload()}};
['searchBox','presFilter','trioFilter','fulFilter','typeFilter'].forEach(id=>$('#'+id).addEventListener(id==='searchBox'?'input':'change',renderTable));

(async()=>{const saved=await get();if(saved){rows=saved.rows||[];meta=saved.meta||{};boot()}})();
