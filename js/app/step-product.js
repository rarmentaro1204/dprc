/* Generatore Offerte Depureco — modulo "step-product" */
/* ============== STEP 3: PRODUCT ============== */
let curCat=null, search='', showAllAcc={};
function catCounts(){const c={};DATA.machines.forEach(m=>c[m.category]=(c[m.category]||0)+1);return c;}
function buildMachineListHtml(){
  let list=DATA.machines;
  if(curCat)list=list.filter(m=>m.category===curCat);
  if(search){const q=search.toLowerCase();list=list.filter(m=>(m.name+' '+m.code).toLowerCase().includes(q));}
  list=list.slice(0,300);
  const html=list.map(m=>{
    const meta=[m.power,m.airflow,m.vacuum].filter(Boolean).join(' · ');
    return `<div class="mrow">
      <div class="info"><div class="nm">${esc(m.name)} ${m.atex?'<span class="badge">ATEX</span>':''}</div>
      <div class="meta">${esc(m.code)} · ${esc(meta||m.category)}</div></div>
      <div class="pr">${priceOf(m)?money(priceOf(m)):'<span style="color:var(--muted);font-size:12px;font-weight:600">'+t('price_tbd')+'</span>'}</div>
      <button class="btn prim sm" data-add="${esc(m.code)}">+ ${t('add')}</button></div>`;
  }).join('');
  return html||'<p class="hint">'+t('no_results')+'</p>';
}
function refreshMachineList(){
  const box=document.querySelector('.mlist'); if(!box)return;
  box.innerHTML=buildMachineListHtml();
  box.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addSolution(b.dataset.add));
}
function stepProduct(){
  const v=$('#view');
  const counts=catCounts();
  const cats=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]);
  const catHtml=cats.map(c=>`<button class="cat${c===curCat?' sel':''}" data-c="${esc(c)}">
     <div class="ttl">${esc(c)}</div><div class="cnt">${counts[c]} ${t('models')}</div></button>`).join('');
  const listHtml=buildMachineListHtml();
  v.innerHTML=`
  <div class="card">
    <h2>${t('step_product')}</h2><p class="hint">${t('hint_product')}</p>
    <div class="cat-grid">${catHtml}</div>
    <input class="search" id="i_search" placeholder="${esc(t('ph_search'))}" value="${esc(search)}">
    <div class="mlist">${listHtml}</div>
    <button class="btn ghost" id="btnCustom" style="margin-top:10px">➕ ${t('add_custom')}</button>
    <button class="btn ghost" id="btnSpares" style="margin-top:10px;margin-left:8px">🔧 ${t('add_spares_sale')}</button>
  </div>
  <div class="card">
    <h2>${t('selected_solutions')} (${S.solutions.length})</h2>
    ${S.solutions.length?renderSolList():'<p class="hint">'+t('none_selected')+'</p>'}
  </div>
  ${selectedDrawer()}`;
  v.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{curCat=(curCat===b.dataset.c?null:b.dataset.c);stepProduct();});
  $('#i_search').oninput=e=>{search=e.target.value;refreshMachineList();};
  v.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addSolution(b.dataset.add));
  if($('#btnCustom'))$('#btnCustom').onclick=addCustomSolution;
  if($('#btnSpares'))$('#btnSpares').onclick=addSparesSolution;
  v.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{S.solutions.splice(+b.dataset.del,1);stepProduct();});
  wireMove(v);
  v.querySelectorAll('[data-qty]').forEach(inp=>inp.oninput=e=>{S.solutions[+inp.dataset.qty].qty=Math.max(1,+e.target.value||1);});
  wireDrawer();
}
let drawerOpen=true;
function selectedDrawer(){
  const items=S.solutions.map((s,i)=>`<div class="ditem">
      ${s.img?`<img class="imgthumb" style="width:36px;height:36px" src="${s.img}">`:'<span style="width:36px"></span>'}
      <div style="flex:1;min-width:0"><div class="nm">${esc(s.name)}</div><div class="cd">${esc(s.code)} · ×${s.qty} · ${money(s.unit)}</div></div>
      <button class="xbtn" data-ddel="${i}">✕</button></div>`).join('');
  return `<div class="drawer${drawerOpen?'':' closed'}" id="drawer">
    <div class="dtab" data-drawer-toggle>▸ ${t('selected_solutions')} (${S.solutions.length})</div>
    <div class="dhead"><span>🛒 ${t('selected_solutions')} (${S.solutions.length})</span><button class="xbtn" data-drawer-toggle>—</button></div>
    <div class="dbody">${S.solutions.length?items:'<p class="hint" style="margin:6px 0">'+t('none_selected')+'</p>'}</div>
  </div>`;
}
function wireDrawer(){
  document.querySelectorAll('[data-drawer-toggle]').forEach(b=>b.onclick=()=>{drawerOpen=!drawerOpen;const d=$('#drawer');if(d)d.classList.toggle('closed',!drawerOpen);});
  document.querySelectorAll('[data-ddel]').forEach(b=>b.onclick=()=>{S.solutions.splice(+b.dataset.ddel,1);render();});
}
// reorder the selected products: ▲▼ buttons (the order is the order of the solutions in the offer)
function mvBtns(i){return `<span class="mvbtns"><button class="xbtn" data-mv="${i}|-1" title="${esc(t('move_up'))}" ${i===0?'disabled':''}>▲</button><button class="xbtn" data-mv="${i}|1" title="${esc(t('move_down'))}" ${i===S.solutions.length-1?'disabled':''}>▼</button></span>`;}
function moveSolution(i,d){const j=i+d;if(j<0||j>=S.solutions.length)return;
  [S.solutions[i],S.solutions[j]]=[S.solutions[j],S.solutions[i]];
  if(typeof showAllAcc!=='undefined'&&showAllAcc){const a=showAllAcc[i];showAllAcc[i]=showAllAcc[j];showAllAcc[j]=a;}
  render();}
function wireMove(root){root.querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>{const[i,d]=b.dataset.mv.split('|').map(Number);moveSolution(i,d);});}
function renderSolList(){
  return S.solutions.map((s,i)=>`<div class="sol">
    <div class="head"><div><div class="nm">${esc(s.name)} ${s.atex?'<span class="badge">ATEX</span>':''}${s.sparesOnly?'<span class="badge" style="background:#4a4a4a">'+t('spares_sale_badge')+'</span>':''}</div>
    <div class="cd">${s.sparesOnly?(s.accessories.length+' '+t('accessories').toLowerCase()):esc(s.code)+' · '+money(s.unit)}</div></div>
    <span style="display:inline-flex;gap:6px;align-items:center">${mvBtns(i)}<button class="xbtn" data-del="${i}">✕</button></span></div>
    ${s.sparesOnly?'':`<div class="addbar"><label class="fld" style="max-width:120px">${t('qty')}
      <input type="number" min="1" value="${s.qty}" data-qty="${i}"></label></div>`}
  </div>`).join('');
}
function addCustomSolution(){
  S.solutions.push({code:'',name:t('new_machine'),desc:'',atex:false,unit:0,qty:1,img:'',imgs:[],specs:{},accessories:[],custom:true});
  step=3;maxReached=Math.max(maxReached,3);render();
}
function addSparesSolution(){
  S.solutions.push({code:'',name:t('spares_sale_title'),desc:'',atex:false,unit:0,qty:1,img:'',imgs:[],specs:{},accessories:[],sparesOnly:true});
  step=3;maxReached=Math.max(maxReached,3);render();
}
function addSolution(code){
  const m=DATA.machines.find(x=>x.code===code);if(!m)return;
  const ex=S.solutions.find(s=>s.code===code);
  if(ex){ ex.qty=(ex.qty||1)+1; flash('✓ '+m.name+'  ×'+ex.qty); stepProduct(); return; }
  const specs={};SPEC_FIELDS.forEach(([k])=>{if(m[k])specs[k]=m[k];});
  const sol={code:m.code,name:m.name,desc:m.desc||'',atex:!!m.atex,unit:priceOf(m),qty:1,img:'',imgs:[],specs,accessories:[]};
  S.solutions.push(sol);
  // auto image from loaded Immagini folder (matched by code)
  const _u=imgUrlForCode(m.code);if(_u){sol.img=_u;sol.imgs=[_u];}
  flash('✓ '+m.name);
  stepProduct();
}
let _flashT;
function flash(msg){let f=$('#flash');if(!f){f=ce('div');f.id='flash';f.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--navy);color:#fff;padding:10px 20px;border-radius:8px;z-index:99;font-size:13px;font-weight:600';document.body.appendChild(f);}f.textContent=msg;f.style.opacity='1';clearTimeout(_flashT);_flashT=setTimeout(()=>f.style.opacity='0',1600);}

/* ============== OPTIONAL MATRIX (backend Excel: Matrice_Optional_*.xlsx) ============== */
