/* Generatore Offerte Depureco — modulo "step-options" */
const OPT_GROUP_ORDER=['Filtrazione','Struttura','Costruzione','Pulizia filtro','Accessori','Altro'];
let OPT_CATALOG={};      // optional code -> {group,order,desc}
let MATRIX_INFO={file:'',machines:0};
function optGroupSlug(g){return String(g||'Altro').toLowerCase().replace(/[^a-z]+/g,'_').replace(/^_|_$/g,'');}
function optGroupLabel(g){const k='og_'+optGroupSlug(g);const v=t(k);return v===k?g:v;}
// one price sheet: row "Codice Macchina" = optional codes, next row "Descrizione", then one row per machine (blank cell = not available)
function parseMatrixSheet(sheet){
  const aoa=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
  const hi=aoa.findIndex(r=>norm(r[0]).toLowerCase()==='codice macchina');if(hi<0)return null;
  const codes=aoa[hi].map(norm);
  const grpRow=(hi>0&&norm(aoa[hi-1][0]).toLowerCase()==='gruppo')?aoa[hi-1].map(norm):[];
  const di=(aoa[hi+1]&&norm(aoa[hi+1][0]).toLowerCase()==='descrizione')?hi+1:-1;
  const descs=di>=0?aoa[di].map(norm):[];
  const rows={};
  for(let i=(di>=0?di:hi)+1;i<aoa.length;i++){
    const r=aoa[i];const m=norm(r[0]);if(!m)continue;
    const o={};
    for(let j=1;j<codes.length;j++){if(!codes[j])continue;const v=r[j];if(v===''||v==null)continue;o[codes[j]]=num(v);}
    rows[m]=o;
  }
  return {codes,descs,grpRow,rows};
}
function applyMatrixWorkbook(wb,fileName){
  const find=k=>wb.SheetNames.find(n=>n.toLowerCase().includes(k));
  const s0=find('optional_l0')||find('l0'),sE=find('optional_le')||find('_le');
  const p0=s0?parseMatrixSheet(wb.Sheets[s0]):null,pE=sE?parseMatrixSheet(wb.Sheets[sE]):null;
  if(!p0&&!pE)return false;
  // catalogue (group / order / description per optional) + prices still to verify
  OPT_CATALOG={};
  const sC=find('catalogo');
  if(sC)sheetRows(wb.Sheets[sC],['codice']).forEach(r=>{const c=norm(r.Codice);if(c)OPT_CATALOG[c]={group:norm(r.Gruppo),order:num(r.Ordine),desc:norm(r.Descrizione)};});
  const CHECK=new Set();
  const sV=find('verific');
  if(sV)sheetRows(wb.Sheets[sV],['macchina']).forEach(r=>{const m=norm(r.Macchina),o=norm(r.Optional);if(m&&o)CHECK.add(m+'|'+o);});
  const hdrInfo={};
  [p0,pE].forEach(p=>{if(!p)return;p.codes.forEach((c,j)=>{if(!c||j===0)return;hdrInfo[c]=hdrInfo[c]||{};if(p.descs[j]&&!hdrInfo[c].desc)hdrInfo[c].desc=p.descs[j];if(p.grpRow[j]&&!hdrInfo[c].group)hdrInfo[c].group=p.grpRow[j];});});
  const gOf=c=>{const g=(OPT_CATALOG[c]&&OPT_CATALOG[c].group)||(hdrInfo[c]&&hdrInfo[c].group)||'Altro';
    const hit=OPT_GROUP_ORDER.find(x=>x.toLowerCase()===g.toLowerCase());return hit||'Altro';};
  Object.keys(MACHINE_OPTIONALS).forEach(k=>delete MACHINE_OPTIONALS[k]);
  const machines=new Set([...Object.keys(p0?p0.rows:{}),...Object.keys(pE?pE.rows:{})]);
  machines.forEach(m=>{
    const a0=(p0&&p0.rows[m])||{},aE=(pE&&pE.rows[m])||{};
    const list=[...new Set([...Object.keys(a0),...Object.keys(aE)])].map(c=>({
      code:c,desc:(OPT_CATALOG[c]&&OPT_CATALOG[c].desc)||(hdrInfo[c]&&hdrInfo[c].desc)||'',
      l0:a0[c],le:aE[c],group:gOf(c),order:(OPT_CATALOG[c]&&OPT_CATALOG[c].order)||9999,check:CHECK.has(m+'|'+c)}));
    list.sort((x,y)=>OPT_GROUP_ORDER.indexOf(x.group)-OPT_GROUP_ORDER.indexOf(y.group)||x.order-y.order||x.code.localeCompare(y.code));
    MACHINE_OPTIONALS[m]=list;
  });
  MATRIX_INFO={file:fileName,machines:machines.size};
  return true;
}
function handleMatrix(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const wb=XLSX.read(ev.target.result,{type:'array'});
      if(!applyMatrixWorkbook(wb,file.name)){flash(t('matrix_err'));return;}
      if($('#matTxt'))$('#matTxt').textContent='âœ“ '+file.name;
      flash(t('matrix_ok').replace('%n',MATRIX_INFO.machines));
      if(step===3)render();
    }catch(err){console.error(err);flash(t('matrix_err'));}
  };
  reader.readAsArrayBuffer(file);
}
/* ============== STEP 4: OPTIONS ============== */
function stepOptions(){
  const v=$('#view');
  if(!S.solutions.length){v.innerHTML=`<div class="card"><h2>${t('step_options')}</h2><p class="hint">${t('add_product_first')}</p></div>`;return;}
  const LT=lineTotals();
  const solHtml=S.solutions.map((s,si)=>{
    const accRows=s.accessories.map((a,ai)=>`<div style="display:flex;gap:8px;align-items:center;margin-top:8px">
      <span style="position:relative;display:inline-block;width:40px;height:40px;flex:0 0 auto">
        ${a.img?`<img class="imgthumb" style="width:40px;height:40px" src="${a.img}">`:'<span class="imgthumb" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:16px;color:#c7ccd6">+</span>'}
        <input type="file" accept="image/*" title="${esc(t('change_image'))}" data-accimgadd="${si}-${ai}" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:40px;height:40px">
        ${a.img?`<button class="xbtn" data-accimgdel="${si}-${ai}" title="${esc(t('remove_line'))}" style="position:absolute;right:-6px;top:-6px;width:16px;height:16px;min-width:0;font-size:9px;padding:0;line-height:16px;border-radius:50%">✕</button>`:''}
      </span>
      <div class="acc-row" style="flex:1;margin-top:0">
        <input placeholder="${t('code')}" value="${esc(a.code)}" data-acc="${si}-${ai}-code">
        <input placeholder="${t('description')}" value="${esc(a.desc)}" data-acc="${si}-${ai}-desc">
        <input type="number" min="1" placeholder="${t('qty')}" value="${a.qty}" data-acc="${si}-${ai}-qty">
        <input type="number" step="0.01" placeholder="${t('unit_price')}" value="${a.price}" data-acc="${si}-${ai}-price">
        <input type="text" inputmode="decimal" placeholder="${esc(t('extra_disc_ph'))}" title="${esc(t('extra_disc_tip'))} (${esc(discLabel())})" value="${a.disc==null?'':esc(a.disc)}" data-acc="${si}-${ai}-disc">
        <button class="xbtn" data-accdel="${si}-${ai}">✕</button>
      </div></div>`).join('');
    const opts=machineOptionals(s.code), spares=machineSpares(s.code);
    const imgs=ensureImgs(s);
    const showAll=showAllAcc[si];
    const chipsOf=(arr,kind)=>arr.map(o=>`<button class="chip" style="cursor:pointer" data-add${kind}="${si}|${esc(o.code)}">+ ${esc(o.code)} <span style="color:#6f6f6f;margin-left:4px">${money(liteP(o))}</span></button>`).join('');
    // optionals of THIS machine (from the backend matrix), grouped Filtrazione / Struttura / Costruzione / ...
    const optChip=o=>`<button class="chip opt${o.check?' chk':''}" data-addopt="${si}|${esc(o.code)}" title="${esc(o.desc||'')}${o.check?' — '+esc(t('verify_price')):''}">
        <span class="oc">+ ${esc(o.code)}${o.check?' <span style="color:#d97706">⚠</span>':''}</span>${o.desc?`<span class="od">${esc(o.desc.length>70?o.desc.slice(0,68)+'…':o.desc)}</span>`:''}<span class="op">${money(liteP(o))}</span></button>`;
    const optGroups=OPT_GROUP_ORDER.map(g=>{const arr=opts.filter(o=>(o.group||'Altro')===g);
      return arr.length?`<div class="optgrp"><div class="optgrp-t">${esc(optGroupLabel(g))} (${arr.length})</div><div class="optchips">${arr.map(optChip).join('')}</div></div>`:'';}).join('');
    const optBlock=opts.length?`<div style="margin:8px 0 4px;font-size:12px;color:#4a4a4a;font-weight:700">${t('selectable_options')} (${opts.length})
        <button class="btn ghost sm" data-addallopt="${si}" style="margin-left:8px">+ ${t('add_all_options')}</button></div>${optGroups}`
      :(s.sparesOnly||s.custom?'':`<div class="hint" style="margin:8px 0">${MATRIX_INFO.machines?t('no_options_machine'):'📦 '+t('load_matrix')}</div>`);
    const sprBlock=spares.length?`<div style="margin:8px 0 4px;font-size:12px;color:#4a4a4a;font-weight:700">${t('spare_parts')} (${spares.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">${chipsOf(spares,'spare')}</div>`:'';
    const editor=s.sparesOnly?`<div style="margin:8px 0;display:grid;grid-template-columns:1fr;gap:6px">
        <input class="pe" data-sol="${si}-name" value="${esc(s.name)}" placeholder="${t('spares_sale_title')}">
        <textarea class="pe" data-sol="${si}-desc" placeholder="${t('spares_sale_desc_ph')}" style="min-height:56px">${esc(s.desc||'')}</textarea>
      </div>`:`<details class="prodedit" open style="margin:8px 0">
      <summary style="cursor:pointer;font-size:12px;color:#4a4a4a;font-weight:700">✏️ ${t('edit_product')}</summary>
      <div style="display:grid;grid-template-columns:2fr 1fr 1fr .8fr auto;gap:6px;margin-top:8px;align-items:end">
        <label class="fl">${t('machine_name')}<input class="pe" data-sol="${si}-name" value="${esc(s.name)}" placeholder="${t('new_machine')}"></label>
        <label class="fl">${t('code')}<input class="pe" data-sol="${si}-code" value="${esc(s.code)}" placeholder="${t('code')}"></label>
        <label class="fl">${t('unit_price')}<input class="pe" type="number" step="0.01" data-sol="${si}-unit" value="${s.unit}" placeholder="${t('unit_price')}"></label>
        <label class="fl">${t('discount')} % ${t('machine_disc_sfx')}<input class="pe" type="text" inputmode="decimal" data-sol="${si}-disc" value="${s.disc==null?'':esc(s.disc)}" placeholder="${esc(t('extra_disc_ph'))}" title="${esc(t('extra_disc_tip'))} (${esc(discLabel())})"></label>
        <label style="font-size:11px;display:flex;align-items:center;gap:4px;padding-bottom:8px"><input type="checkbox" data-sol="${si}-atex" ${s.atex?'checked':''}>ATEX</label>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px">
        ${SPEC_FIELDS.map(([k])=>`<label class="fl">${t('spec_'+k)}<input class="pe" data-solspec="${si}-${k}" value="${esc(s.specs[k]||'')}" placeholder="${t('spec_'+k)}"></label>`).join('')}
      </div>
    </details>`;
    return `<div class="sol">
      <div class="head"><div><div class="nm">${solLabel(LT.sols[si])} — ${esc(s.name)}${s.sparesOnly?` <span class="badge" style="background:#4a4a4a">${t('spares_sale_badge')}</span>`:''}</div>
      ${s.sparesOnly?'':`<div class="cd">${esc(s.code)}</div>`}</div>${mvBtns(si)}</div>
      ${si>0?`<label style="display:flex;align-items:center;gap:8px;margin:8px 0 2px;padding:8px 10px;border:1px dashed var(--line);border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;background:${s.sameOrder?'#eaf6ef':'transparent'}">
        <input type="checkbox" data-sameorder="${si}" ${s.sameOrder?'checked':''}> ${t('same_order_chk')}</label>`:''}
      ${editor}
      ${s.sparesOnly?'':`<div class="addbar" style="flex-wrap:wrap;gap:10px">
        <label class="btn ghost sm" style="display:inline-flex;align-items:center">➕ ${t('add_image')}
          <input type="file" accept="image/*" multiple style="display:none" data-imgadd="${si}"></label>
        ${imgs.map((u,ii)=>`<span style="position:relative;display:inline-block">
          <img class="imgthumb" src="${u}"${ii===0?' style="outline:2px solid var(--red);outline-offset:1px"':''}>
          ${ii!==0?`<button class="xbtn" data-imgmain="${si}-${ii}" title="Imposta come principale" style="position:absolute;left:-7px;top:-7px;background:#4a4a4a">★</button>`:''}
          <button class="xbtn" data-imgdel="${si}-${ii}" title="Rimuovi" style="position:absolute;right:-7px;top:-7px">✕</button>
        </span>`).join('')}
      </div>`}
      ${s.sparesOnly?'':optBlock}
      ${s.sparesOnly?'':sprBlock}
      <div style="margin-top:10px;font-size:12.5px;font-weight:700;color:#4a4a4a">${t('accessories')}</div>
      <div style="position:relative;margin-top:4px">
        <input class="search" style="margin:0" id="accpick-${si}" autocomplete="off" placeholder="🔎 ${esc(t('ph_acc_search'))}">
        <div id="accsugg-${si}" style="position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid var(--line);border-radius:8px;box-shadow:0 8px 20px rgba(0,0,0,.12);z-index:20;max-height:240px;overflow:auto;display:none"></div>
      </div>
      ${s.accessories.length?`<div class="acc-row acc-head" style="margin-left:48px;padding-left:0"><span>${t('code')}</span><span>${t('description')}</span><span>${t('qty')}</span><span>${t('unit_price')}</span><span>${t('discount')} %</span><span></span></div>`:''}
      ${accRows}
      <button class="btn ghost sm" data-accadd="${si}" style="margin-top:8px">+ ${t('add_free_accessory')}</button>
    </div>`;
  }).join('');
  v.innerHTML=`
  <div class="card"><h2>${t('step_options')}</h2><p class="hint">${t('hint_options')}</p>${solHtml}</div>
  <div class="card"><h2>${t('commercial_terms')}</h2>
    <div class="grid g3">
      <label class="fld">${t('discount')} % (1°+2°+3°)
        <div style="display:flex;gap:6px;align-items:center">
          <input type="number" id="o_disc" value="${S.discount}" style="flex:1">
          <span style="color:#8592a8">+</span>
          <input type="number" id="o_disc2" value="${S.discount2||''}" placeholder="0" style="flex:1">
          <span style="color:#8592a8">+</span>
          <input type="number" id="o_disc3" value="${S.discount3||''}" placeholder="0" style="flex:1">
        </div>
      </label>
      <label class="fld">${t('sc_validity')}<input id="o_val" value="${esc(S.validity)}"></label>
      <label class="fld">${t('sc_lead')}<input id="o_lead" value="${esc(S.lead)}"></label>
      <label class="fld">${t('sc_delivery')}<input id="o_del" value="${esc(S.delivery)}" placeholder="${esc(t('def_delivery'))}"></label>
      <label class="fld">${t('sc_packaging')}<input id="o_pack" value="${esc(S.packaging)}" placeholder="${esc(t('def_packaging'))}"></label>
      <label class="fld">${t('sc_warranty')}<input id="o_war" value="${esc(S.warranty)}"></label>
      <label class="fld">${t('sc_payment')}<input id="o_pay" value="${esc(S.payment)}" placeholder="${esc(t('def_payment'))}"></label>
    </div>
    <label class="fld" style="margin-top:14px">${t('exclusions')}
      <textarea id="o_excl" placeholder="${esc(t('def_exclusions'))}">${esc(S.exclusions)}</textarea></label>
    <label class="fld" style="margin-top:14px">${t('notes')}<textarea id="o_notes">${esc(S.notes)}</textarea></label>
  </div>${selectedDrawer()}`;
  wireDrawer();
  $('#o_disc').oninput=e=>{S.discount=Math.max(0,Math.min(100,+e.target.value||0));};
  $('#o_disc2').oninput=e=>{S.discount2=Math.max(0,Math.min(100,+e.target.value||0));};
  $('#o_disc3').oninput=e=>{S.discount3=Math.max(0,Math.min(100,+e.target.value||0));};
  const bind=(id,k)=>{$('#'+id).oninput=e=>S[k]=e.target.value;};
  bind('o_val','validity');bind('o_lead','lead');bind('o_del','delivery');bind('o_pack','packaging');
  bind('o_war','warranty');bind('o_pay','payment');bind('o_excl','exclusions');bind('o_notes','notes');
  wireMove(v);
  v.querySelectorAll('[data-sameorder]').forEach(inp=>inp.onchange=e=>{S.solutions[+inp.dataset.sameorder].sameOrder=e.target.checked;stepOptions();});
  v.querySelectorAll('[data-acc]').forEach(inp=>inp.oninput=e=>{
    const[si,ai,f]=inp.dataset.acc.split('-');S.solutions[si].accessories[ai][f]=(f==='qty'||f==='price')?+e.target.value:(f==='disc'?(e.target.value.trim()===''?null:e.target.value.trim()):e.target.value);});
  v.querySelectorAll('[data-sol]').forEach(inp=>inp.oninput=e=>{
    const p=inp.dataset.sol.split('-');const si=+p[0];const f=p[1];const s=S.solutions[si];
    if(f==='name')s.name=e.target.value;else if(f==='code')s.code=e.target.value;
    else if(f==='unit')s.unit=+e.target.value||0;else if(f==='atex')s.atex=e.target.checked;
    else if(f==='desc')s.desc=e.target.value;
    else if(f==='disc')s.disc=(e.target.value.trim()===''?null:e.target.value.trim());});
  v.querySelectorAll('[data-solspec]').forEach(inp=>inp.oninput=e=>{
    const p=inp.dataset.solspec.split('-');S.solutions[+p[0]].specs[p[1]]=e.target.value;});
  v.querySelectorAll('[data-accadd]').forEach(b=>b.onclick=()=>{S.solutions[+b.dataset.accadd].accessories.push({code:'',desc:'',qty:1,price:0,img:''});stepOptions();});
  v.querySelectorAll('[data-accdel]').forEach(b=>b.onclick=()=>{const[si,ai]=b.dataset.accdel.split('-');S.solutions[si].accessories.splice(ai,1);stepOptions();});
  function addAcc(si,acc){
    const price=acc.price;
    const item={code:acc.code,desc:acc.desc||'',qty:1,price:price||0,img:''};
    S.solutions[si].accessories.push(item);
    const _u=imgUrlForCode(acc.code);if(_u)item.img=_u;
    stepOptions();
  }
  // optionals & spares chips (from the price lists)
  v.querySelectorAll('[data-addopt]').forEach(b=>b.onclick=()=>{
    const[si,code]=b.dataset.addopt.split('|');const o=machineOptionals(S.solutions[si].code).find(x=>x.code===code);if(o)addItem(+si,o);});
  v.querySelectorAll('[data-addspare]').forEach(b=>b.onclick=()=>{
    const[si,code]=b.dataset.addspare.split('|');const o=machineSpares(S.solutions[si].code).find(x=>x.code===code);if(o)addItem(+si,o);});
  v.querySelectorAll('[data-addallopt]').forEach(b=>b.onclick=()=>{
    const si=+b.dataset.addallopt;machineOptionals(S.solutions[si].code).forEach(o=>addItem(si,o));});
  // accessory free-text picker (full catalog) as extra fallback
  S.solutions.forEach((s,si)=>{
    const inp=$('#accpick-'+si),sg=$('#accsugg-'+si);if(!inp)return;
    function show(){
      const q=inp.value.trim().toLowerCase();
      let list=DATA.accessories;
      if(q)list=list.filter(a=>(a.code+' '+a.desc).toLowerCase().includes(q));
      list=list.slice(0,60);
      if(!list.length){sg.style.display='none';return;}
      sg.innerHTML=list.map(a=>`<div data-code="${esc(a.code)}" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid #f0f2f5;font-size:12.5px;display:flex;justify-content:space-between;gap:10px">
        <span><b>${esc(a.code)}</b> · ${esc(a.desc)}</span><span style="color:#2b2b2b;white-space:nowrap">${money(a.price)}</span></div>`).join('');
      sg.style.display='block';
      sg.querySelectorAll('[data-code]').forEach(d=>d.onmousedown=ev=>{ev.preventDefault();
        const acc=DATA.accessories.find(a=>a.code===d.dataset.code);if(acc)addAcc(si,acc);});
    }
    inp.oninput=show;inp.onfocus=show;
    inp.onblur=()=>setTimeout(()=>{if(sg)sg.style.display='none';},150);
  });
  v.querySelectorAll('[data-imgadd]').forEach(inp=>inp.onchange=e=>{
    const si=+inp.dataset.imgadd;const files=[...e.target.files];if(!files.length)return;
    let pending=files.length;const urls=[];
    files.forEach((file,idx)=>{const r=new FileReader();
      r.onload=ev=>{urls[idx]=ev.target.result;if(--pending===0){addSolImages(si,urls);stepOptions();}};
      r.onerror=()=>{if(--pending===0){addSolImages(si,urls);stepOptions();}};
      r.readAsDataURL(file);});});
  v.querySelectorAll('[data-imgdel]').forEach(b=>b.onclick=()=>{const[si,ii]=b.dataset.imgdel.split('-').map(Number);
    const s=S.solutions[si];ensureImgs(s);s.imgs.splice(ii,1);s.img=s.imgs[0]||'';stepOptions();});
  v.querySelectorAll('[data-accimgadd]').forEach(inp=>inp.onchange=e=>{
    const[si,ai]=inp.dataset.accimgadd.split('-').map(Number);const file=e.target.files[0];if(!file)return;
    const r=new FileReader();r.onload=ev=>{S.solutions[si].accessories[ai].img=ev.target.result;stepOptions();};r.readAsDataURL(file);});
  v.querySelectorAll('[data-accimgdel]').forEach(b=>b.onclick=e=>{e.stopPropagation();e.preventDefault();
    const[si,ai]=b.dataset.accimgdel.split('-').map(Number);S.solutions[si].accessories[ai].img='';stepOptions();});
  v.querySelectorAll('[data-imgmain]').forEach(b=>b.onclick=()=>{const[si,ii]=b.dataset.imgmain.split('-').map(Number);
    const s=S.solutions[si];ensureImgs(s);const[m]=s.imgs.splice(ii,1);s.imgs.unshift(m);s.img=s.imgs[0]||'';stepOptions();});
}

/* ============== STEP 5: QUOTE / PREVIEW ============== */
// cascading discount levels (e.g. 40+5+3): each level applies to what remains after the previous one
