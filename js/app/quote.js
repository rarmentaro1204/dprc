/* Generatore Offerte Depureco — modulo "quote" */
function discMultiplier(){return (1-(S.discount||0)/100)*(1-(S.discount2||0)/100)*(1-(S.discount3||0)/100);}
function discLabel(){const parts=[S.discount||0];if(S.discount2)parts.push(S.discount2);if(S.discount3)parts.push(S.discount3);return parts.join('+');}
// Sconto per riga: la macchina e ogni accessorio possono avere uno sconto EXTRA (item.disc, anche a più step "5+3")
// che si applica in cascata sopra lo sconto generale (passo Opzioni, condizioni commerciali).
// Lo sconto di riga è EXTRA: si somma (in cascata) allo sconto generale. Accetta uno o più step: "5" oppure "5+3".
function parseSteps(d){
  if(d==null||d==='')return [];
  return String(d).split(/[+;\/\s]+/).map(x=>parseFloat(String(x).replace(',','.'))).filter(x=>isFinite(x)&&x>0).map(x=>Math.min(100,x));
}
function itemMult(d){return discMultiplier()*parseSteps(d).reduce((m,x)=>m*(1-x/100),1);}
function itemDiscLabel(d){const e=parseSteps(d);return e.length?discLabel()+'+'+e.join('+'):discLabel();}
// Machines: by default each one is an ALTERNATIVE solution (customer picks one). A machine flagged
// sameOrder (S.solutions[i].sameOrder, i>0) belongs to the SAME ORDER as the previous one: they are
// quoted together and their totals add up. Consecutive machines linked this way form one "package".
function lineTotals(){
  const mult=discMultiplier();
  const sols=S.solutions.map(s=>{
    const rows=[];
    const mk=(o,d)=>{o.disc=itemDiscLabel(d);o.total=o.partial*itemMult(d);return o;};
    if(!s.sparesOnly)rows.push(mk({code:s.code,desc:s.tableDesc||s.name,unit:s.unit,qty:s.qty,partial:s.unit*s.qty,img:s.img},s.disc));
    s.accessories.forEach(a=>{
      rows.push(mk({code:a.code||a.desc,desc:a.desc||'',unit:a.price,qty:a.qty,partial:a.price*a.qty,img:a.img},a.disc));});
    const listTot=rows.reduce((x,r)=>x+r.partial,0);
    return {s,rows,listTot,solTot:rows.reduce((x,r)=>x+r.total,0)};
  });
  const packages=[];
  sols.forEach((sd,i)=>{
    if(i>0&&sd.s.sameOrder)packages[packages.length-1].members.push(i);
    else packages.push({members:[i]});
  });
  packages.forEach((p,pi)=>{
    p.listTot=p.members.reduce((x,i)=>x+sols[i].listTot,0);
    p.net=p.members.reduce((x,i)=>x+sols[i].solTot,0);
    p.members.forEach((i,k)=>{sols[i].pkg=pi+1;sols[i].pos=k+1;sols[i].pkgSize=p.members.length;});
  });
  // registry total: with a single package it is the whole offer; with alternatives it is the first one
  const grand=packages.length?packages[0].net:0;
  return {sols,packages,grand,mult};
}
function solLabel(sd){return sd.pkgSize>1?`${t('solution')} ${sd.pkg}${String.fromCharCode(64+sd.pos)}`:`${t('solution')} ${sd.pkg}`;}
// totals block printed under a machine's table: list subtotal, discount, net total
function totalsHtml(sd,pk,showPkg){
  const rows=[];
  const hasDisc=sd.listTot-sd.solTot>0.005;
  const mk=(lbl,val,cls)=>`<div class="totline${cls?' '+cls:''}"><span>${lbl}</span><span>${val}</span></div>`;
  if(hasDisc){rows.push(mk(t('list_total'),money(sd.listTot)));rows.push(mk(t('discount'),'−'+money(sd.listTot-sd.solTot)));}
  rows.push(`<div class="totbar"><span>${t('total_general')}</span><span>${money(sd.solTot)}</span></div>`);
  let h=`<div class="totblock">${rows.join('')}</div>`;
  if(showPkg&&pk.members.length>1)h+=`<div class="totbar pkg"><span>${t('order_total')} ${sd.pkg} (${pk.members.map((_,k)=>sd.pkg+String.fromCharCode(65+k)).join(' + ')})</span><span>${money(pk.net)}</span></div>`;
  return h;
}
function specBullets(s){
  const out=[];
  SPEC_FIELDS.forEach(([k])=>{if(s.specs[k])out.push(`${t('spec_'+k)}: ${esc(s.specs[k])}`);});
  return out;
}
// standard (non-ATEX) PROVAC / WD / W1 / W2 / W3 ranges include the accessory kit
function kitIncludedFor(s){return false;}   // Depureco: nessun kit accessori incluso di serie
// Price tables: when a machine page is taller than an A4 sheet, move the last rows (and the totals
// that follow the table) onto a continuation page, repeating logo, title bar and table header.
function repaginateQuote(){
  const A4H=297*96/25.4;
  const queue=[...document.querySelectorAll('#view .pages > .page')].filter(p=>p.querySelector(':scope > .pad > table.ptable'));
  while(queue.length){
    const p=queue.shift();
    const pad=p.querySelector(':scope > .pad'),foot=pad.querySelector(':scope > .foot'),table=pad.querySelector(':scope > table.ptable');
    if(!foot||!table)continue;
    // content must end where the page's bottom padding starts, so the sheet never grows beyond A4
    const limit=A4H-(parseFloat(getComputedStyle(pad).paddingBottom)||98);
    const bottomOf=()=>{const top=p.getBoundingClientRect().top;let m=0;[...pad.children].forEach(e=>{if(e!==foot)m=Math.max(m,e.getBoundingClientRect().bottom-top);});return m;};
    const rowsOf=()=>[...table.querySelectorAll('tr')].filter(r=>!r.querySelector('th'));
    let cont=null,guard=0;
    while(bottomOf()>limit&&rowsOf().length>1&&guard++<400){
      if(!cont){
        cont=document.createElement('div');cont.className=p.className;
        const cpad=document.createElement('div');cpad.className='pad';
        const logo=pad.querySelector(':scope > .plogo'),bar=pad.querySelector(':scope > .hbar');
        if(logo)cpad.appendChild(logo.cloneNode(true));
        if(bar)cpad.appendChild(bar.cloneNode(true));
        const ct=table.cloneNode(false);const head=table.querySelector('tr');if(head)ct.appendChild(head.cloneNode(true));
        cpad.appendChild(ct);
        // everything after the table (totals, order total) travels with the last rows
        let n=table.nextElementSibling;const tail=[];
        while(n&&n!==foot){tail.push(n);n=n.nextElementSibling;}
        tail.forEach(e=>cpad.appendChild(e));
        cpad.appendChild(foot.cloneNode(true));
        cont.appendChild(cpad);p.after(cont);
      }
      const ct=cont.querySelector('table.ptable');
      const last=rowsOf().pop();
      const firstMoved=ct.querySelectorAll('tr')[1];
      ct.insertBefore(last,firstMoved||null);
    }
    if(cont)queue.unshift(cont);
  }
}
function stepQuote(){
  const v=$('#view');
  // if the registry file is shared, refresh the preview number to the latest free one (avoids showing a number a colleague just used)
  if(REGISTRY.fileHandle&&!stepQuote._refreshing){stepQuote._refreshing=true;
    reloadRegistry().then(ok=>{stepQuote._refreshing=false;if(ok){const b=S.offerNum;applyNextOfferNumber();if(S.offerNum!==b&&step===4)stepQuote();}}).catch(()=>{stepQuote._refreshing=false;});}
  const {sols,packages}=lineTotals();
  // cover: grande simbolo Depureco (picco rosso) in basso a sinistra
  const symbol=COVER_SYMBOL;
  let html=`<div class="page cover">
    ${symbol}
    <div class="clogo">${logoDark(95)}</div>
    <div class="ctitle">Offer N. ${esc(S.offerNum)}<div class="nm">${esc((S.client||'').toUpperCase())}</div></div>
    <div class="contact"><b>${t('contact').toUpperCase()}</b>${esc(S.rep.name)}<br>
      <a>${esc(S.rep.email)}</a><br>${esc(S.rep.phone)}</div>
  </div>`;
  // letter page
  html+=`<div class="page"><div class="pad">
    <div class="plogo">${logoLight(34)}</div>
    <div class="info-grid">
      <div class="info-l">
        ${[[t('l_client'),esc((S.client||'').trim())],
           [t('l_contact'),(S.contact||'').trim()?esc(S.contact.trim())+((S.role||'').trim()?' ('+esc(S.role.trim())+')':''):''],
           [t('l_request'),esc((S.subject||'').trim())],
           [t('l_phone'),esc((S.phone||'').trim())],
           [t('l_email'),esc((S.email||'').trim())]]
          .filter(([,val])=>val).map(([lbl,val])=>`<div class="ir"><b>${lbl}:</b> <span class="v">${val}</span></div>`).join('')}
      </div>
      <div class="info-r">
        <div class="nm">${BRAND.legalName}</div>
        ${[[t('l_writtenby'),esc((S.rep.name||'').trim())],
           [t('l_office'),BRAND.office],
           [t('l_ref'),esc((S.offerNum||'').trim())],
           ['E-mail',esc((S.rep.email||'').trim())]]
          .filter(([,val])=>val).map(([lbl,val])=>`<b>${lbl}:</b> <span class="v">${val}</span>`).join('<br>')}
      </div>
    </div>
    <div class="subj-bar">${t('l_subject')}: ${esc(S.subject||t('def_subject'))}</div>
    <div class="date-bar">${t('l_date')}: ${esc(S.date)}</div>
    <div class="letter-box">${esc(S.intro||t('intro_default')).replace(/\n/g,'<br>')}</div>
    <div class="sign"><div><span>${BRAND.legalName}</span><span>${t('sign_dept')}</span><span>${esc(S.rep.name)}</span></div></div>
    ${footer()}
  </div></div>`;
  // application data page (only the fields that were filled in; whole page omitted when none)
  const appFilled=APP_KEYS.filter(k=>String((S.app&&S.app[k])||'').trim());
  if(appFilled.length){
    html+=`<div class="page"><div class="pad">
      <div class="plogo">${logoLight(30)}</div>
      <div class="hbar"><div class="l">${t('step_application').toUpperCase()}</div><div class="r"></div></div>
      <table class="supply">${appFilled.map(k=>`<tr><td style="width:42%">${t('a_'+k)}</td><td>${esc(String(S.app[k]).trim())}</td></tr>`).join('')}</table>
      ${footer()}
    </div></div>`;
  }
  // solution pages
// Marcatura ATEX: letta dalla scheda tecnica Depureco (colonna Marcatura_ATEX del catalogo); modificabile a mano nel documento.
function atexMarking(code){
  const m=DATA.machines.find(x=>x.code===code);
  return (m&&m.marking)||'';
}
  sols.forEach((sd,i)=>{const {s,rows,solTot}=sd;const pk=packages[sd.pkg-1];const isPkgLast=sd.pos===sd.pkgSize;
    const bullets=specBullets(s);
    const markStr=s.custom?(s.marking||''):(s.atex?atexMarking(s.code):'');
    const atexMarks='';  // EX / IECEx / XR Z22 badges removed for all ATEX machines
    const priceRowsArr=rows.map((r,ri)=>{const im=r.img||imgUrlForCode(r.code);
      const cell=im?`<img src="${im}">`:`<label class="addimg app-noprint" title="${esc(t('add_row_image'))}"><input type="file" accept="image/*" data-addrowimg="${i}|${ri}" hidden>+📷</label>`;
      return `<tr><td class="pimg">${cell}</td><td>${esc(r.code)}</td><td class="pdesc ce" contenteditable="true" data-editdesc="${i}|${ri}">${esc(r.desc||'')}</td><td class="r ce" contenteditable="true" data-editprice="${i}|${ri}">${money(r.unit)}</td>
      <td class="c">${r.qty}</td><td class="r">${money(r.partial)}</td><td class="c">${r.disc}%</td>
      <td class="r">${money(r.total)}</td></tr>`;});
    // split into page-sized chunks so a long accessories/spare-parts list flows onto extra pages
    // instead of being silently clipped by the fixed-height, overflow:hidden .page container
    // all rows go on the first page here: repaginateQuote() then moves rows (and the totals) onto
    // continuation pages according to the REAL rendered height, so long descriptions never overflow
    const ROWS_FIRST_PAGE=9999, ROWS_CONT_PAGE=9999;
    const rowChunks=[];
    { let idx=0;
      rowChunks.push(priceRowsArr.slice(idx,idx+ROWS_FIRST_PAGE));idx+=ROWS_FIRST_PAGE;
      while(idx<priceRowsArr.length){rowChunks.push(priceRowsArr.slice(idx,idx+ROWS_CONT_PAGE));idx+=ROWS_CONT_PAGE;}
    }
    const ptableHead=`<tr><th></th><th>${t('code')}</th><th>${t('description')}</th><th class="r">${t('unit_price')}</th>
      <th class="c">${t('qty')}</th><th class="r">${t('partial')}</th><th class="c">${t('discount')}</th>
      <th class="r">${t('total')}</th></tr>`;
    // build title line like "W2 EX 1/2D Industrial vacuum cleaner : 230V 1,1kW"
    const vpart=s.specs.voltage?withUnit('voltage',String(s.specs.voltage).split(/[-–]/)[0].trim(),s.custom).replace(/\s+/g,''):'';
    const ppart=s.specs.power?withUnit('power',s.specs.power,s.custom).replace(/\s+/g,''):'';
    const volt=[vpart,ppart].filter(Boolean).join(' ');
    const nameSpan=`<span class="ce" contenteditable="true" data-editname="${i}">${esc(s.name)}</span>`;
    const titleLine=`<b>${nameSpan} ${t('vacuum_cleaner')}</b>`;
    const subLine=[s.specs.airflow?t('spec_airflow')+' '+withUnit('airflow',s.specs.airflow,s.custom):'',s.specs.vacuum?t('spec_vacuum')+' '+withUnit('vacuum',s.specs.vacuum,s.custom):''].filter(Boolean).join(' – ');
    html+=`<div class="page"><div class="pad">
      <div class="plogo">${logoLight(30)}</div>
      <div class="hbar"><div class="l">${solLabel(sd).toUpperCase()}${sd.pkgSize>1?' · '+t('same_order').toUpperCase():(packages.length>1?' · '+t('alternative').toUpperCase():'')}</div><div class="r">${esc(s.name)}</div></div>`;
    if(s.sparesOnly){
      html+=`<div style="margin:2mm 0 4mm">
        <div class="prod-ttl"><b><span class="ce" contenteditable="true" data-editname="${i}">${esc(s.name)}</span></b></div>
        ${s.desc||s.tableDesc?`<div class="prod-sub" style="margin-top:2mm">${esc(s.desc||s.tableDesc||'')}</div>`:''}
      </div>`;
    } else {
    html+=`<div class="prod-grid">
        ${s.img?`<div><img class="prod-img" src="${s.img}">${(s.imgs&&s.imgs.length>1)?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;width:185px">${s.imgs.slice(1).map(u=>`<img src="${u}" style="width:88px;height:88px;object-fit:contain;border:1px solid var(--line);background:#fff">`).join('')}</div>`:''}</div>`:`<div class="prod-img empty">${t('no_image')}</div>`}
        <div>
          <div class="atexrow"><div>
            <div class="prod-ttl">${titleLine}</div>
          </div>${atexMarks}</div>
          <ul>${(s.custom?SPEC_FIELDS.map(x=>x[0]):SPEC_FIELDS.filter(([k])=>s.specs[k]!=null&&s.specs[k]!=='').map(x=>x[0]))
              .filter(k=>!(s.hiddenSpecs&&s.hiddenSpecs[k]))
              .map(k=>{const val=s.specs[k]||'';const u=unitFor(k,val,s.custom);const lbl=(s.specLabels&&s.specLabels[k])||t('spec_'+k);
                return `<li><span class="ce" contenteditable="true" data-editlabel="${i}|${k}">${esc(lbl)}</span>: <span class="ce" contenteditable="true" data-editspec="${i}|${k}">${esc(val)}</span>${u?' '+u:''}<span class="specdel app-noprint" data-delspec="${i}|${k}" title="${esc(t('remove_line'))}">×</span></li>`;}).join('')||'<li>—</li>'}
            ${(s.custom||s.atex)?`<li>${t('marking')}: <span class="ce mark" contenteditable="true" data-editmark="${i}">${esc((s.marking!=null&&s.marking!=='')?s.marking:markStr)}</span></li>`:''}
            ${kitIncludedFor(s)?`<li><b>${t('kit_included')}</b></li>`:''}
            ${(s.extraSpecs||[]).map((es,ei)=>`<li><span class="ce" contenteditable="true" data-editextralabel="${i}|${ei}">${esc(es.label||'')}</span>: <span class="ce" contenteditable="true" data-editextratext="${i}|${ei}">${esc(es.text||'')}</span><span class="specdel app-noprint" data-delextra="${i}|${ei}" title="${esc(t('remove_line'))}">×</span></li>`).join('')}</ul>
          <button class="btn ghost app-noprint" style="margin-top:6px;font-size:10.5px;padding:4px 10px" data-addextra="${i}">➕ ${t('add_custom_line')}</button>
        </div>
      </div>`;
    }
    const acc=s.sparesOnly?null:s.accessories.find(a=>a.code==='TA.0230.0000');
    if(acc){html+=`<div class="acc-bar"><div class="l">${t('accessories_suggested')}</div>
      <div class="r"><span class="kit">TA.0230.0000</span> — ${esc(acc.desc||'Antistatic dry accessory kit Ø40')}</div></div>`;}
    html+=`<table class="ptable">${ptableHead}${rowChunks[0].join('')}</table>`;
    if(rowChunks.length===1){
      html+=`${totalsHtml(sd,pk,isPkgLast)}
      ${footer()}
    </div></div>`;
    }else{
      html+=`</div></div>`; // close first page without totals — they land on the last continuation page
      rowChunks.slice(1).forEach((chunk,ci)=>{
        const isLast=ci===rowChunks.length-2;
        html+=`<div class="page"><div class="pad">
          <div class="plogo">${logoLight(30)}</div>
          <div class="hbar"><div class="l">${solLabel(sd).toUpperCase()}</div><div class="r">${esc(s.name)}</div></div>
          <table class="ptable">${ptableHead}${chunk.join('')}</table>
          ${isLast?totalsHtml(sd,pk,isPkgLast):''}
          ${footer()}
        </div></div>`;
      });
    }
  });
  // supply + general conditions page
  const sc=[['sc_validity',(S.validity||'60')+' '+t('days')+'.'],['sc_lead',(S.lead||'4')+' '+t('weeks_from_order')+'.'],
    ['sc_delivery',S.delivery||t('def_delivery')],['sc_packaging',S.packaging||t('def_packaging')],
    ['sc_warranty',(S.warranty||'24')+' '+t('months')],['sc_payment',S.payment||t('def_payment')]];
  const scRows=sc.map(([k,val])=>`<tr><td>${t(k)}</td><td>${esc(val)}</td></tr>`).join('');
  const exclItems=(S.exclusions||t('def_exclusions')).split(/[\n,]+/).map(x=>x.trim()).filter(Boolean);
  html+=`<div class="page"><div class="pad">
    <div class="plogo">${logoLight(30)}</div>
    ${S.notes?`<div class="hbar"><div class="l">${t('notes')}</div><div class="r"></div></div><div class="excl-box" style="padding:12px 14px;line-height:1.7">${esc(S.notes).replace(/\n/g,'<br>')}</div>`:''}
    <div class="hbar"><div class="l">${t('exclusions_supply')}</div><div class="r"></div></div>
    <div class="excl-box"><ul>${exclItems.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="hbar"><div class="l">${t('supply_conditions')}</div><div class="r"></div></div>
    <table class="supply">${scRows}</table>
    ${footer()}
  </div></div>`;
  // general conditions — official full terms (EN/IT/ES/FR), flow across pages
  const GT=GENERAL_TERMS[LANG]||GENERAL_TERMS['en'];
  const gcPara=p=>{
    const t2=p.trim();
    if(/^_{5,}$/.test(t2))return `<div class="gc-sign-line"></div>`;
    if(/^\(\*\)/.test(t2))return `<p class="gc-note">${esc(p)}</p>`;
    if(/^timbro e firma|^stamp and signature|^sello y firma|^cachet et signature/i.test(t2))return `<p class="gc-sign-label">${esc(p)}</p>`;
    return `<p>${esc(p)}</p>`;
  };
  const clausesHtml=GT.clauses.map(c=>`<div class="gc-c">${c.t?`<span class="gc-h">${esc(c.t)}</span>`:''}${c.b.map(gcPara).join('')}</div>`).join('');
  html+=`<div class="page terms"><div class="pad">
    <div class="plogo">${logoLight(30)}</div>
    <div class="hbar"><div class="l">${t('general_conditions')}</div><div class="r"></div></div>
    <div class="gc-title">${esc(GT.title)}</div>
    <div class="gc-terms">${clausesHtml}</div>
    ${footer()}
  </div></div>`;

  v.innerHTML=`
    <div class="card app-noprint">
      <h2>${t('step_quote')}</h2><p class="hint">${t('hint_quote')}</p>
      <div class="doc-tools">
        <button class="btn prim" id="btnPrint">🖨 ${t('print_pdf')}</button>
        <button class="btn prim" id="btnSaveAll" style="background:#1f7a4d">✅ ${t('save_all')}</button>
        <span class="fileinfo">${t('filename')}: <b>${esc(suggestedFilename())}.pdf</b></span>
      </div>
      <div style="background:#fff7e6;border:1px solid #ffe1a8;border-radius:9px;padding:12px 14px;font-size:12.5px;color:#7a5b00;line-height:1.6">
        ${t('save_note')}
      </div>
    </div>
    <div class="pages">${html}</div>`;
  repaginateQuote();
  $('#btnPrint').onclick=()=>{document.title=suggestedFilename();window.print();};
  $('#btnSaveAll').onclick=saveOfferComplete;
  // inline editing directly in the document preview
  v.querySelectorAll('[data-editname]').forEach(el=>el.addEventListener('blur',()=>{S.solutions[+el.dataset.editname].name=el.textContent.trim();stepQuote();}));
  v.querySelectorAll('[data-editspec]').forEach(el=>el.addEventListener('blur',()=>{const[si,k]=el.dataset.editspec.split('|');S.solutions[+si].specs[k]=el.textContent.trim();stepQuote();}));
  v.querySelectorAll('[data-editlabel]').forEach(el=>el.addEventListener('blur',()=>{const[si,k]=el.dataset.editlabel.split('|');const s=S.solutions[+si];s.specLabels=s.specLabels||{};s.specLabels[k]=el.textContent.trim();stepQuote();}));
  v.querySelectorAll('[data-delspec]').forEach(el=>el.onclick=()=>{const[si,k]=el.dataset.delspec.split('|');const s=S.solutions[+si];s.hiddenSpecs=s.hiddenSpecs||{};s.hiddenSpecs[k]=true;s.specs[k]='';stepQuote();});
  v.querySelectorAll('[data-addextra]').forEach(b=>b.onclick=()=>{const si=+b.dataset.addextra;const s=S.solutions[si];s.extraSpecs=s.extraSpecs||[];s.extraSpecs.push({label:'',text:''});stepQuote();});
  v.querySelectorAll('[data-editextralabel]').forEach(el=>el.addEventListener('blur',()=>{const[si,ei]=el.dataset.editextralabel.split('|').map(Number);S.solutions[si].extraSpecs[ei].label=el.textContent.trim();stepQuote();}));
  v.querySelectorAll('[data-editextratext]').forEach(el=>el.addEventListener('blur',()=>{const[si,ei]=el.dataset.editextratext.split('|').map(Number);S.solutions[si].extraSpecs[ei].text=el.textContent.trim();stepQuote();}));
  v.querySelectorAll('[data-delextra]').forEach(el=>el.onclick=()=>{const[si,ei]=el.dataset.delextra.split('|').map(Number);S.solutions[si].extraSpecs.splice(ei,1);stepQuote();});
  v.querySelectorAll('[data-editmark]').forEach(el=>el.addEventListener('blur',()=>{S.solutions[+el.dataset.editmark].marking=el.textContent.trim();stepQuote();}));
  v.querySelectorAll('[data-editdesc]').forEach(el=>el.addEventListener('blur',()=>{const[si,ri]=el.dataset.editdesc.split('|').map(Number);const s=S.solutions[si];if(ri===0)s.tableDesc=el.textContent.trim();else if(s.accessories[ri-1])s.accessories[ri-1].desc=el.textContent.trim();stepQuote();}));
  v.querySelectorAll('[data-editprice]').forEach(el=>el.addEventListener('blur',()=>{
    const[si,ri]=el.dataset.editprice.split('|').map(Number);const s=S.solutions[si];
    const raw=String(el.textContent).replace(/[^0-9,.-]/g,'');
    const n=parseFloat(raw.replace(/\./g,'').replace(',','.'))||0;
    if(ri===0)s.unit=n;else if(s.accessories[ri-1])s.accessories[ri-1].price=n;
    stepQuote();
  }));
  v.querySelectorAll('[data-addrowimg]').forEach(inp=>inp.onchange=e=>{
    const file=e.target.files[0];if(!file)return;
    const[si,ri]=inp.dataset.addrowimg.split('|').map(Number);
    const url=URL.createObjectURL(file);
    const s=S.solutions[si];
    if(ri===0){s.img=url;ensureImgs(s);if(!s.imgs.includes(url))s.imgs.unshift(url);}
    else if(s.accessories[ri-1]){s.accessories[ri-1].img=url;}
    stepQuote();
  });
}
function suggestedFilename(){return (S.offerNum||'OFFER').replace(/[^\w\-]/g,'_')+'_'+(S.client||'CLIENT').replace(/[^\w\-]/g,'_').toUpperCase();}
