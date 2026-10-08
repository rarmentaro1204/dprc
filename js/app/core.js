/* Generatore Offerte Depureco — modulo "core" */
let LANG='it';   // listino prezzi unico (Depureco non ha L0/LE)
function t(k){return (I18N[LANG]&&I18N[LANG][k])||(I18N.en[k])||k;}

/* ============== STATE ============== */
let DATA = JSON.parse(JSON.stringify(EMBEDDED));
let loadedFromFile=false, loadedFileName='';
const yr=new Date().getFullYear();
let step=0;
const S={
  rep:DATA.reps[0]||{name:'',email:'',phone:''},
  offerNum:BRAND.offerPrefix+String(yr).slice(2)+'-001',
  date:new Date().toLocaleDateString('it-IT'),
  client:'', contact:'', role:'', phone:'', email:'', subject:t('def_subject'),
  isRevisionOffer:false,
  intro:'',
  app:{duty:'',risk:'',zone:'',install:'',airflow:'',waterlift:'',points:'',temp:'',humidity:'',emission:'',dust:''},
  solutions:[], // {code,name,desc,atex,unit,qty,img,specs:{}, accessories:[{code,desc,qty,price}]}
  discount:40, discount2:0, discount3:0,
  validity:'60', lead:'4', delivery:'', packaging:'', warranty:'24', payment:'',
  exclusions:'', notes:''
};
const STEPS=['customer','application','product','options','quote'];

/* ============== EXTERNAL RESOURCES (images, clients, registry) ============== */
let IMGMAP={};        // normalizedCode -> File (loaded eagerly at folder-link time)
let IMGCACHE={};      // normalizedCode -> object URL (lazy, fast)
let CLIENTS=(EMBEDDED_CLIENTS||[]).slice();   // auto-loaded from embedded list (zero-click)
let REGISTRY={rows:[], fileHandle:null, fileName:''};
let CLIENTS_FILE={handle:null, name:''};   // writable handle to the source contacts file (when folder linked)
// Immagine predefinita del modello, scaricata dallo scraper come images/<Codice>.png (colonna Immagine_File).
// Nel file HTML "con immagini" le stesse immagini sono incorporate (IMAGES_EMBED).
function catalogImageUrl(k){
  const m=(DATA&&DATA.machines||[]).find(x=>imgKey(x.code)===k);
  if(!m||!m.imageFile)return '';
  if(typeof IMAGES_EMBED!=='undefined'&&IMAGES_ALIAS[m.imageFile]&&IMAGES_EMBED[IMAGES_ALIAS[m.imageFile]])return IMAGES_EMBED[IMAGES_ALIAS[m.imageFile]];
  return IMAGES_BASE+encodeURIComponent(m.imageFile);
}
function imgKey(code){return String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
function imgUrlForCode(code){
  const k=imgKey(code);
  if(IMGCACHE[k])return IMGCACHE[k];
  const f=IMGMAP[k];
  if(!f)return catalogImageUrl(k);   // nessuna cartella collegata: immagine del catalogo (cartella images/ o incorporata)
  const url=URL.createObjectURL(f);   // instant, no base64 decode
  IMGCACHE[k]=url;return url;
}
// per-solution image gallery: keep s.imgs[] and mirror the primary into s.img (used by document/word/drawer)
function ensureImgs(s){ if(!Array.isArray(s.imgs)) s.imgs = s.img ? [s.img] : []; s.img = s.imgs[0]||''; return s.imgs; }
function addSolImages(si, urls){ const s=S.solutions[si]; ensureImgs(s); urls.forEach(u=>{if(u)s.imgs.push(u);}); s.img=s.imgs[0]||''; }
// optionals & spare parts read from the price lists, specific to each model
function machineOptionals(code){return MACHINE_OPTIONALS[code]||[];}
function machineSpares(code){return MACHINE_SPARES[code]||[];}
function liteP(o){return o.price??o.l0??o.le;}
function addItem(si,o){
  if(S.solutions[si].accessories.find(x=>x.code===o.code))return;
  const item={code:o.code,desc:o.desc||'',qty:1,price:liteP(o)||0,img:''};
  S.solutions[si].accessories.push(item);
  const u=imgUrlForCode(o.code);if(u)item.img=u;
  stepOptions();
}
function nextProgressivo(){
  let max=0;REGISTRY.rows.forEach(r=>{const p=parseInt(r.prog||r.Progressivo||0,10);if(p>max)max=p;});
  return max+1;
}
function applyNextOfferNumber(){
  // never clobber a recalled offer's "<original>_REVn" number with a fresh progressive one —
  // this refresh runs automatically (e.g. every time the Offer step renders) so without this
  // guard a revision number gets silently overwritten before the user even hits Save
  if(S.isRevisionOffer||/_REV\d+$/i.test(String(S.offerNum||'')))return;
  const n=nextProgressivo();
  S.offerNum=BRAND.offerPrefix+String(yr).slice(2)+'-'+String(n).padStart(3,'0');
}

/* ============== HELPERS ============== */
const $=s=>document.querySelector(s);
const ce=(t,c)=>{const e=document.createElement(t);if(c)e.className=c;return e;};
function money(n){n=Number(n)||0;const neg=n<0;n=Math.abs(n);const p=n.toFixed(2).split('.');const int=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.');return (neg?'-':'')+int+','+p[1]+' €';}
function priceOf(m){return Number(m.price)||0;}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

const SPEC_FIELDS=[['power','power'],['voltage','voltage'],['vacuum','vacuum'],['airflow','airflow'],
  ['noise','noise'],['filter_type','filter_type'],['filter_surface','filter_surface'],
  ['capacity','capacity'],['suction','suction'],['dimensions','dimensions'],['weight','weight']];
// default units auto-appended for CUSTOM machines when the user types only a number
const SPEC_UNITS={power:'kW',voltage:'V',vacuum:'mbar',airflow:'m³/h',noise:'dB(A)',filter_surface:'cm²',capacity:'lt',suction:'mm',dimensions:'cm',weight:'kg'};
function withUnit(k,v,custom){v=String(v==null?'':v).trim();if(!v)return v;if(!custom||!SPEC_UNITS[k])return v;const chk=k==='dimensions'?v.replace(/[xh]/gi,''):v;return /[a-zA-Z]/.test(chk)?v:v+' '+SPEC_UNITS[k];}
function unitFor(k,v,custom){v=String(v==null?'':v).trim();if(!v||!custom||!SPEC_UNITS[k])return '';const chk=k==='dimensions'?v.replace(/[xh]/gi,''):v;return /[a-zA-Z]/.test(chk)?'':SPEC_UNITS[k];}
