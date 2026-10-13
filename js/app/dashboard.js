/* Generatore Offerte Depureco — modulo "dashboard"
   Statistiche per commerciale: offerte mese per mese e totale anno (numero e valore), esito (vinta/persa),
   analisi vinte vs offerte, statistiche macchine offerte e vendute.
   Dati: REGISTRY.rows (registro offerte). Ogni riga: {prog,num,date,client,rep,total,machine,status,outcomeDate,wonValue,lines[]}
   status: 'open' | 'won' | 'lost'.  lines: [{code,name,category,qty,value,pkg,won}] una per macchina offerta. */
let DASH=false, dashYear=null, dashRep='';
const DSH={
 it:{title:'Dashboard commerciale',year:'Anno',rep:'Commerciale',all:'Tutti i commerciali',back:'← Torna al configuratore',
   export:'⬇ Esporta registro',nodata:'Nessuna offerta registrata per questo periodo. Le offerte compaiono qui quando premi «Salva offerta» nel passo Offerta.',
   offers:'Offerte',offered:'Valore offerto',won:'Vinte',wonVal:'Valore vinto',lost:'Perse',open:'Aperte',
   winN:'Tasso di vittoria (numero)',winV:'Tasso di vittoria (valore)',byRep:'Commerciale per commerciale',
   monthly:'Mese per mese',month:'Mese',count:'N. offerte',value:'Valore offerto',wonCount:'N. vinte',wonValue:'Valore vinto',rate:'% vinte (n.)',rateV:'% vinte (valore)',
   yearTot:'Totale anno',compare:'Offerte vs vinte',byNumber:'Per numero',byValue:'Per valore',
   mOffered:'Macchine offerte',mSold:'Macchine vendute',machine:'Macchina',times:'Volte offerta',qty:'Pezzi',valueL:'Valore',
   sold:'Vendute',cat:'Per categoria',list:'Elenco offerte e esito',num:'Offerta',date:'Data',client:'Cliente',status:'Esito',wonQ:'Valore vinto (€)',
   lines:'Macchine vendute',sOpen:'Aperta',sWon:'Vinta',sLost:'Persa',monthNames:['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'],
   hintStatus:'Segna l’esito: Vinta o Persa. Se vinta, indica quali macchine sono state vendute.',saved:'Esito salvato',savedLocal:'Esito salvato (solo su questo browser: collega la cartella per scriverlo nel registro condiviso)',
   none:'—',noSold:'Nessuna macchina ancora segnata come venduta.',noOff:'Nessuna macchina offerta.',allMachines:'Tutte'},
 en:{title:'Sales dashboard',year:'Year',rep:'Salesperson',all:'All salespeople',back:'← Back to configurator',
   export:'⬇ Export register',nodata:'No offers registered for this period. Offers appear here when you press “Save offer” in the Offer step.',
   offers:'Offers',offered:'Offered value',won:'Won',wonVal:'Won value',lost:'Lost',open:'Open',
   winN:'Win rate (count)',winV:'Win rate (value)',byRep:'Salesperson by salesperson',
   monthly:'Month by month',month:'Month',count:'Offers',value:'Offered value',wonCount:'Won',wonValue:'Won value',rate:'Win % (count)',rateV:'Win % (value)',
   yearTot:'Year total',compare:'Offers vs won',byNumber:'By count',byValue:'By value',
   mOffered:'Machines offered',mSold:'Machines sold',machine:'Machine',times:'Times offered',qty:'Units',valueL:'Value',
   sold:'Sold',cat:'By category',list:'Offers and outcome',num:'Offer',date:'Date',client:'Customer',status:'Outcome',wonQ:'Won value (€)',
   lines:'Machines sold',sOpen:'Open',sWon:'Won',sLost:'Lost',monthNames:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
   hintStatus:'Mark the outcome: Won or Lost. If won, tick which machines were sold.',saved:'Outcome saved',savedLocal:'Outcome saved (this browser only: link the folder to write it to the shared register)',
   none:'—',noSold:'No machine marked as sold yet.',noOff:'No machines offered.',allMachines:'All'}
};
function dt(k){return (DSH[LANG==='it'?'it':'en'])[k]||k;}

/* ---------- parsing / modello dati ---------- */
function parseOfferDate(v){
  if(v==null||v==='')return null;
  if(v instanceof Date)return v;
  if(typeof v==='number'&&v>20000){return new Date(Math.round((v-25569)*86400*1000));}   // seriale Excel
  const s=String(v).trim();let m;
  if((m=s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/))){let y=+m[3];if(y<100)y+=2000;return new Date(y,+m[2]-1,+m[1]);}
  if((m=s.match(/^(\d{4})-(\d{2})-(\d{2})/)))return new Date(+m[1],+m[2]-1,+m[3]);
  const d=new Date(s);return isNaN(d)?null:d;
}
function rowStatus(r){const s=String(r.status||'').toLowerCase();
  if(/^(won|vint)/.test(s))return 'won';if(/^(lost|pers)/.test(s))return 'lost';return 'open';}
function rowLines(r){
  if(Array.isArray(r.lines)&&r.lines.length)return r.lines;
  // registri vecchi: ricava le macchine dal testo "CODICE (Nome) x2 | ..."
  return String(r.machine||'').split(' | ').map(x=>x.trim()).filter(Boolean).map((x,i)=>{
    const m=x.match(/^(.*?)\s*\((.*)\)(?:\s*x(\d+))?$/);
    return m?{code:m[1].trim(),name:m[2].trim(),category:'',qty:+(m[3]||1),value:null,pkg:i+1,won:false}:{code:x,name:x,category:'',qty:1,value:null,pkg:i+1,won:false};
  });
}
function rowWonValue(r){
  if(rowStatus(r)!=='won')return 0;
  if(r.wonValue!==undefined&&r.wonValue!==null&&r.wonValue!=='')return Number(r.wonValue)||0;
  return Number(r.total)||0;
}
function offerLinesFromState(){
  // una riga per macchina offerta (le alternative sono tutte "offerte"; il commerciale segna quale è stata venduta)
  const {sols}=lineTotals();
  return sols.filter(sd=>!sd.s.sparesOnly).map(sd=>{
    const m=(DATA.machines||[]).find(x=>x.code===sd.s.code);
    return {code:sd.s.code||'',name:sd.s.name||'',category:(m&&m.category)||(sd.s.custom?'Fuori catalogo':''),
      qty:sd.s.qty||1,value:Number(sd.solTot.toFixed(2)),pkg:sd.pkg,won:false};
  });
}
const REG_LS='depureco_registry_v1';
function persistRegistryLocal(){try{localStorage.setItem(REG_LS,JSON.stringify(REGISTRY.rows));}catch(_){}}
function loadRegistryLocal(){try{const a=JSON.parse(localStorage.getItem(REG_LS)||'[]');if(Array.isArray(a)&&a.length&&!REGISTRY.rows.length)REGISTRY.rows=a;}catch(_){}}

/* ---------- aggregazioni ---------- */
function dashRows(){
  return REGISTRY.rows.filter(r=>{
    const d=parseOfferDate(r.date);
    if(!d||d.getFullYear()!==dashYear)return false;
    if(dashRep&&String(r.rep).trim()!==dashRep)return false;
    return true;
  });
}
function statsOf(rows){
  const s={n:0,v:0,wn:0,wv:0,ln:0,lv:0,on:0,ov:0};
  rows.forEach(r=>{const v=Number(r.total)||0;s.n++;s.v+=v;const st=rowStatus(r);
    if(st==='won'){s.wn++;s.wv+=rowWonValue(r);}else if(st==='lost'){s.ln++;s.lv+=v;}else{s.on++;s.ov+=v;}});
  return s;
}
const pct=(a,b)=>b>0?Math.round(a/b*100)+'%':'—';
function machineStats(rows){
  const off={},sold={},cat={};
  rows.forEach(r=>{
    const won=rowStatus(r)==='won';
    rowLines(r).forEach(l=>{
      const k=l.code||l.name;const q=Number(l.qty)||1,v=Number(l.value)||0,c=l.category||'—';
      const o=off[k]||(off[k]={code:l.code,name:l.name,times:0,qty:0,value:0,category:c});o.times++;o.qty+=q;o.value+=v;
      const cc=cat[c]||(cat[c]={off:0,sold:0,offV:0,soldV:0});cc.off+=q;cc.offV+=v;
      if(won&&l.won){const so=sold[k]||(sold[k]={code:l.code,name:l.name,times:0,qty:0,value:0,category:c});so.times++;so.qty+=q;so.value+=v;cc.sold+=q;cc.soldV+=v;}
    });
  });
  const arr=o=>Object.values(o).sort((a,b)=>b.times-a.times||b.value-a.value);
  return {off:arr(off),sold:arr(sold),cat};
}

/* ---------- render ---------- */
function barPair(label,a,b,aLab,bLab,fmt){
  const max=Math.max(a,b,1);
  return `<div style="margin:12px 0"><div style="font-weight:700;color:var(--navy);margin-bottom:6px">${esc(label)}</div>
    <div style="display:flex;align-items:center;gap:8px;margin:3px 0"><span style="width:90px;font-size:12px;color:var(--muted)">${esc(aLab)}</span><div style="flex:1;background:var(--soft);border-radius:4px"><div style="width:${a/max*100}%;background:var(--navy);height:20px;border-radius:4px"></div></div><b style="min-width:110px;text-align:right">${fmt(a)}</b></div>
    <div style="display:flex;align-items:center;gap:8px;margin:3px 0"><span style="width:90px;font-size:12px;color:var(--muted)">${esc(bLab)}</span><div style="flex:1;background:var(--soft);border-radius:4px"><div style="width:${b/max*100}%;background:var(--red);height:20px;border-radius:4px"></div></div><b style="min-width:110px;text-align:right">${fmt(b)}</b></div></div>`;
}
function monthlyChart(months){
  const W=900,H=220,pad=34,bw=(W-pad*2)/12;
  const max=Math.max(1,...months.map(m=>Math.max(m.v,m.wv)));
  let g='';
  months.forEach((m,i)=>{
    const x=pad+i*bw, h1=(m.v/max)*(H-60), h2=(m.wv/max)*(H-60);
    g+=`<rect x="${x+6}" y="${H-30-h1}" width="${bw/2-8}" height="${h1}" fill="#171717"><title>${money(m.v)}</title></rect>`;
    g+=`<rect x="${x+bw/2}" y="${H-30-h2}" width="${bw/2-8}" height="${h2}" fill="#AA1917"><title>${money(m.wv)}</title></rect>`;
    g+=`<text x="${x+bw/2}" y="${H-12}" text-anchor="middle" font-size="12" fill="#6f6f6f">${dt('monthNames')[i]}</text>`;
    if(m.n)g+=`<text x="${x+bw/2}" y="${H-34-Math.max(h1,h2)}" text-anchor="middle" font-size="11" font-weight="700" fill="#171717">${m.n}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${g}</svg>
    <div style="font-size:12px;color:var(--muted);margin-top:4px"><span style="display:inline-block;width:10px;height:10px;background:#171717;margin-right:4px"></span>${dt('offered')} &nbsp; <span style="display:inline-block;width:10px;height:10px;background:#AA1917;margin-right:4px"></span>${dt('wonVal')} &nbsp; (${dt('count')})</div>`;
}
function renderDashboard(){
  const v=$('#view');
  loadRegistryLocal();
  const years=[...new Set(REGISTRY.rows.map(r=>{const d=parseOfferDate(r.date);return d?d.getFullYear():null;}).filter(Boolean))].sort((a,b)=>b-a);
  const cur=new Date().getFullYear();
  if(!years.includes(cur))years.unshift(cur);
  if(dashYear==null||!years.includes(dashYear))dashYear=years.includes(cur)?cur:years[0];
  const reps=[...new Set(REGISTRY.rows.map(r=>String(r.rep||'').trim()).filter(Boolean))].sort();
  if(dashRep&&!reps.includes(dashRep))dashRep='';
  const rows=dashRows();
  const st=statsOf(rows);
  const head=`<div class="card">
    <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between">
      <h2 style="margin:0">📊 ${dt('title')}</h2>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
        <label class="fld" style="min-width:110px">${dt('year')}<select id="d_year">${years.map(y=>`<option${y===dashYear?' selected':''}>${y}</option>`).join('')}</select></label>
        <label class="fld" style="min-width:220px">${dt('rep')}<select id="d_rep"><option value="">${dt('all')}</option>${reps.map(r=>`<option${r===dashRep?' selected':''}>${esc(r)}</option>`).join('')}</select></label>
        <button class="btn ghost sm" id="d_export">${dt('export')}</button>
        <button class="btn nav sm" id="d_back">${dt('back')}</button>
      </div></div></div>`;
  if(!rows.length){
    v.innerHTML=head+`<div class="card"><p class="hint" style="margin:0">${dt('nodata')}</p></div>`;wireDash();return;
  }
  const kpi=(l,val,sub,c)=>`<div style="flex:1;min-width:150px;border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:#fff">
      <div style="font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--muted)">${l}</div>
      <div style="font-size:28px;font-weight:900;color:${c||'var(--navy)'};line-height:1.2">${val}</div>
      <div style="font-size:12px;color:var(--muted)">${sub||'&nbsp;'}</div></div>`;
  const kpis=`<div class="card"><div style="display:flex;flex-wrap:wrap;gap:12px">
    ${kpi(dt('offers'),st.n,money(st.v))}
    ${kpi(dt('won'),st.wn,money(st.wv),'var(--red)')}
    ${kpi(dt('lost'),st.ln,money(st.lv))}
    ${kpi(dt('open'),st.on,money(st.ov))}
    ${kpi(dt('winN'),pct(st.wn,st.n),st.wn+' / '+st.n)}
    ${kpi(dt('winV'),pct(st.wv,st.v),money(st.wv)+' / '+money(st.v))}
  </div></div>`;
  // per commerciale (solo quando si guardano tutti)
  let byRep='';
  if(!dashRep){
    const all=REGISTRY.rows.filter(r=>{const d=parseOfferDate(r.date);return d&&d.getFullYear()===dashYear;});
    const names=[...new Set(all.map(r=>String(r.rep||'').trim()||'—'))].sort();
    byRep=`<div class="card"><h2>${dt('byRep')}</h2><div style="overflow:auto"><table class="ptable" style="font-size:13px">
      <tr><th>${dt('rep')}</th><th class="r">${dt('count')}</th><th class="r">${dt('value')}</th><th class="r">${dt('wonCount')}</th><th class="r">${dt('wonValue')}</th><th class="r">${dt('rate')}</th><th class="r">${dt('rateV')}</th></tr>
      ${names.map(n=>{const s=statsOf(all.filter(r=>(String(r.rep||'').trim()||'—')===n));
        return `<tr style="cursor:pointer" data-pickrep="${esc(n)}"><td><b>${esc(n)}</b></td><td class="r">${s.n}</td><td class="r">${money(s.v)}</td><td class="r">${s.wn}</td><td class="r">${money(s.wv)}</td><td class="r">${pct(s.wn,s.n)}</td><td class="r">${pct(s.wv,s.v)}</td></tr>`;}).join('')}
    </table></div></div>`;
  }
  // mese per mese
  const months=Array.from({length:12},()=>({n:0,v:0,wn:0,wv:0}));
  rows.forEach(r=>{const d=parseOfferDate(r.date);const m=months[d.getMonth()];m.n++;m.v+=Number(r.total)||0;
    if(rowStatus(r)==='won'){m.wn++;m.wv+=rowWonValue(r);}});
  const monthly=`<div class="card"><h2>${dt('monthly')}${dashRep?' · '+esc(dashRep):''} · ${dashYear}</h2>
    ${monthlyChart(months)}
    <div style="overflow:auto;margin-top:10px"><table class="ptable" style="font-size:13px">
      <tr><th>${dt('month')}</th><th class="r">${dt('count')}</th><th class="r">${dt('value')}</th><th class="r">${dt('wonCount')}</th><th class="r">${dt('wonValue')}</th><th class="r">${dt('rate')}</th><th class="r">${dt('rateV')}</th></tr>
      ${months.map((m,i)=>`<tr><td>${dt('monthNames')[i]}</td><td class="r">${m.n||'—'}</td><td class="r">${m.n?money(m.v):'—'}</td><td class="r">${m.wn||'—'}</td><td class="r">${m.wn?money(m.wv):'—'}</td><td class="r">${m.n?pct(m.wn,m.n):'—'}</td><td class="r">${m.n?pct(m.wv,m.v):'—'}</td></tr>`).join('')}
      <tr style="font-weight:800;background:var(--soft)"><td>${dt('yearTot')}</td><td class="r">${st.n}</td><td class="r">${money(st.v)}</td><td class="r">${st.wn}</td><td class="r">${money(st.wv)}</td><td class="r">${pct(st.wn,st.n)}</td><td class="r">${pct(st.wv,st.v)}</td></tr>
    </table></div></div>`;
  // vinte vs offerte
  const compare=`<div class="card"><h2>${dt('compare')}</h2><div class="grid g2">
    <div>${barPair(dt('byNumber'),st.n,st.wn,dt('offers'),dt('won'),x=>String(x))}</div>
    <div>${barPair(dt('byValue'),st.v,st.wv,dt('offered'),dt('wonVal'),money)}</div></div></div>`;
  // macchine
  const ms=machineStats(rows);
  const mTable=(arr,empty)=>arr.length?`<div style="overflow:auto"><table class="ptable" style="font-size:13px"><tr><th>${dt('machine')}</th><th class="r">${dt('times')}</th><th class="r">${dt('qty')}</th><th class="r">${dt('valueL')}</th></tr>
      ${arr.slice(0,15).map(x=>`<tr><td><b>${esc(x.name||x.code)}</b><br><span style="color:var(--muted);font-size:11px">${esc(x.code||'')}</span></td><td class="r">${x.times}</td><td class="r">${x.qty}</td><td class="r">${x.value?money(x.value):'—'}</td></tr>`).join('')}</table></div>`:`<p class="hint">${empty}</p>`;
  const catRows=Object.entries(ms.cat).sort((a,b)=>b[1].off-a[1].off);
  const cmax=Math.max(1,...catRows.map(c=>c[1].off));
  const machines=`<div class="card"><h2>${dt('mOffered')} · ${dt('mSold')}</h2><div class="grid g2">
      <div><h3 style="margin:0 0 6px;font-size:15px;color:var(--navy)">${dt('mOffered')}</h3>${mTable(ms.off,dt('noOff'))}</div>
      <div><h3 style="margin:0 0 6px;font-size:15px;color:var(--red)">${dt('mSold')}</h3>${mTable(ms.sold,dt('noSold'))}</div></div>
    <h3 style="margin:18px 0 6px;font-size:15px;color:var(--navy)">${dt('cat')}</h3>
    ${catRows.map(([c,x])=>`<div style="margin:6px 0"><div style="font-size:12.5px;font-weight:700">${esc(c)} <span style="color:var(--muted);font-weight:400">· ${x.off} ${dt('offers').toLowerCase()} / ${x.sold} ${dt('sold').toLowerCase()}</span></div>
      <div style="background:var(--soft);border-radius:4px;position:relative;height:16px"><div style="width:${x.off/cmax*100}%;background:var(--navy);height:16px;border-radius:4px"></div><div style="width:${x.sold/cmax*100}%;background:var(--red);height:16px;border-radius:4px;position:absolute;top:0;left:0"></div></div></div>`).join('')}
  </div>`;
  // elenco offerte con esito
  const sorted=[...rows].sort((a,b)=>parseOfferDate(b.date)-parseOfferDate(a.date)||String(b.num).localeCompare(String(a.num)));
  const list=`<div class="card"><h2>${dt('list')}</h2><p class="hint">${dt('hintStatus')}</p>
    <div style="overflow:auto"><table class="ptable" style="font-size:13px">
    <tr><th>${dt('num')}</th><th>${dt('date')}</th><th>${dt('client')}</th>${dashRep?'':`<th>${dt('rep')}</th>`}<th class="r">${dt('value')}</th><th>${dt('status')}</th><th>${dt('lines')} / ${dt('wonQ')}</th></tr>
    ${sorted.map(r=>{const idx=REGISTRY.rows.indexOf(r);const s=rowStatus(r);const ls=rowLines(r);
      const stSel=`<select data-st="${idx}" style="padding:6px;border-radius:7px;border:1px solid var(--line);font-weight:700;color:${s==='won'?'var(--red)':s==='lost'?'#6f6f6f':'var(--navy)'}">
        <option value="open"${s==='open'?' selected':''}>${dt('sOpen')}</option><option value="won"${s==='won'?' selected':''}>${dt('sWon')}</option><option value="lost"${s==='lost'?' selected':''}>${dt('sLost')}</option></select>`;
      const wonCell=s==='won'?`<div>${ls.map((l,li)=>`<label style="display:block;font-size:12px"><input type="checkbox" data-won="${idx}|${li}"${l.won?' checked':''}> ${esc(l.name||l.code)}${l.qty>1?' ×'+l.qty:''}${l.value?' · '+money(l.value):''}</label>`).join('')}
        <label style="font-size:12px;display:block;margin-top:4px">${dt('wonQ')} <input type="number" step="0.01" data-wonval="${idx}" value="${rowWonValue(r)}" style="width:120px;padding:5px;border:1px solid var(--line);border-radius:6px"></label></div>`
        :`<span style="color:var(--muted);font-size:12px">${esc(String(r.machine||'').slice(0,80))}</span>`;
      return `<tr><td><b>${esc(r.num)}</b></td><td>${esc(parseOfferDate(r.date).toLocaleDateString('it-IT'))}</td><td>${esc(r.client)}</td>${dashRep?'':`<td>${esc(r.rep)}</td>`}<td class="r">${money(r.total)}</td><td>${stSel}</td><td>${wonCell}</td></tr>`;}).join('')}
    </table></div></div>`;
  v.innerHTML=head+kpis+byRep+monthly+compare+machines+list;
  wireDash();
}
async function dashPersist(msg){
  persistRegistryLocal();
  let ok=false;try{ok=await writeRegistryBack();}catch(_){}
  flash(ok?dt('saved'):dt('savedLocal'));
}
function wireDash(){
  const v=$('#view');
  $('#d_year').onchange=e=>{dashYear=+e.target.value;renderDashboard();};
  $('#d_rep').onchange=e=>{dashRep=e.target.value;renderDashboard();};
  $('#d_back').onclick=()=>toggleDashboard(false);
  $('#d_export').onclick=()=>{try{downloadRegistry();}catch(e){flash(t('load_err'));}};
  v.querySelectorAll('[data-pickrep]').forEach(tr=>tr.onclick=()=>{dashRep=tr.dataset.pickrep==='—'?'':tr.dataset.pickrep;renderDashboard();});
  v.querySelectorAll('[data-st]').forEach(sel=>sel.onchange=async()=>{
    const r=REGISTRY.rows[+sel.dataset.st];if(!r)return;
    r.status=sel.value;r.outcomeDate=sel.value==='open'?'':new Date().toLocaleDateString('it-IT');
    if(sel.value==='won'){
      r.lines=rowLines(r).map(l=>({...l}));
      // di default risulta venduta la prima soluzione (pacchetto 1); il commerciale può correggere con le caselle
      const first=Math.min(...r.lines.map(l=>l.pkg||1));
      r.lines.forEach(l=>{l.won=(l.pkg||1)===first;});
      r.wonValue='';
    }else{r.lines=rowLines(r).map(l=>({...l,won:false}));r.wonValue='';}
    await dashPersist();renderDashboard();
  });
  v.querySelectorAll('[data-won]').forEach(cb=>cb.onchange=async()=>{
    const [i,li]=cb.dataset.won.split('|').map(Number);const r=REGISTRY.rows[i];
    r.lines=rowLines(r).map(l=>({...l}));r.lines[li].won=cb.checked;
    if(r.wonValue===''||r.wonValue==null||!r.wonManual){   // valore vinto = somma delle macchine vendute (finché non lo si modifica a mano)
      const sum=r.lines.filter(l=>l.won).reduce((x,l)=>x+(Number(l.value)||0),0);
      r.wonValue=sum||'';
    }
    await dashPersist();renderDashboard();
  });
  v.querySelectorAll('[data-wonval]').forEach(inp=>inp.onchange=async()=>{
    const r=REGISTRY.rows[+inp.dataset.wonval];if(!r)return;
    r.wonValue=inp.value===''?'':Number(inp.value);r.wonManual=true;
    await dashPersist();renderDashboard();
  });
}
function toggleDashboard(on){
  DASH=on;
  const hide=on?'none':'';
  $('#stepper').style.display=hide;
  const nb=document.querySelector('.navbar');if(nb)nb.style.display=hide;
  const b=$('#dashBtn');if(b)b.classList.toggle('on',on);
  render();
}
