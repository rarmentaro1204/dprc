/* Generatore Offerte Depureco — modulo "xlsx-loader" */
function norm(s){return String(s==null?'':s).trim();}
function num(v){return parseFloat(String(v).replace(/[^\d.,-]/g,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.'))||0;}
// Read a sheet as objects, auto-detecting the header row (skips title/subtitle rows).
function sheetRows(sheet,markers){
  const aoa=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
  let hi=-1;
  for(let i=0;i<Math.min(aoa.length,15);i++){
    const cells=aoa[i].map(c=>norm(c).toLowerCase());
    if(markers.some(m=>cells.includes(m))){hi=i;break;}
  }
  if(hi<0)hi=0;
  const head=aoa[hi].map(c=>norm(c));
  const out=[];
  for(let i=hi+1;i<aoa.length;i++){
    const row=aoa[i];if(!row.some(c=>norm(c)!==''))continue;
    const o={};head.forEach((h,j)=>{if(h)o[h]=row[j]!=null?row[j]:'';});
    out.push(o);
  }
  return out;
}
function handleXlsx(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const wb=XLSX.read(ev.target.result,{type:'array'});
      const out={machines:[],accessories:[],reps:[]};
      const findSheet=(names)=>{for(const n of wb.SheetNames){if(names.some(x=>n.toLowerCase().includes(x)))return n;}return null;};
      const sM=findSheet(['macchin','machine','máquina','machines']);
      const sA=findSheet(['access','accessor','accesori']);
      const sR=findSheet(['commerc','rep','referent','vendeur','vendedor']);
      if(sM){const rows=sheetRows(wb.Sheets[sM],['codice','code','código']);
        rows.forEach(r=>{
          const code=norm(r.Codice||r.Code||r.code||r.CODICE);if(!code)return;
          const get=(...k)=>{for(const key of k){if(r[key]!=null&&r[key]!=='')return r[key];}return '';};
          out.machines.push({code,
            family:norm(get('Famiglia','Family','family')),
            category:norm(get('Categoria','Category','category'))||'OTHER',
            name:norm(get('Nome','Name','name'))||code,
            desc:norm(get('Descrizione_EN','Descrizione','Description','desc')),
            atex:/^(si|sì|yes|x|true|1)$/i.test(norm(get('ATEX','Atex','atex'))),
            price:num(get('Prezzo','Prezzo_EUR','Price','Prezzo_L0','L0')),
            power:norm(get('Potenza','Power','power')),voltage:norm(get('Tensione','Voltage','voltage')),
            vacuum:norm(get('Depressione','Vacuum','vacuum')),airflow:norm(get('Portata_Aria','Airflow','airflow')),
            noise:norm(get('Rumorosita','Rumorosità','Noise','noise')),filter_type:norm(get('Tipo_Filtro','Filter type','filter_type')),
            filter_surface:norm(get('Sup_Filtrante','Filter surface','filter_surface')),capacity:norm(get('Capacita','Capacità','Capacity','capacity')),
            suction:norm(get('Bocca_Aspirazione','Suction','suction')),dimensions:norm(get('Dimensioni','Dimensions','dimensions')),
            weight:norm(get('Peso','Weight','weight')),marking:norm(get('Marcatura_ATEX','ATEX marking','marking')),
            application:norm(get('Applicazione','Application')),url:norm(get('URL','url')),image:norm(get('Immagine_URL','image')),imageFile:norm(get('Immagine_File','imageFile'))});
        });}
      if(sA){const rows=sheetRows(wb.Sheets[sA],['codice','code','código']);
        rows.forEach(r=>{const code=norm(r.Codice||r.Code||r.code);if(!code)return;
          const get=(...k)=>{for(const key of k){if(r[key]!=null&&r[key]!=='')return r[key];}return '';};
          out.accessories.push({code,desc:norm(get('Descrizione','Description','desc')),
            price:num(get('Prezzo','Prezzo_EUR','Price','Prezzo_L0','L0'))});});}
      if(sR){const rows=sheetRows(wb.Sheets[sR],['nome','name','nombre','nom']);
        rows.forEach(r=>{const name=norm(r.Nome||r.Name||r.name);if(!name)return;
          out.reps.push({name,email:norm(r.Email||r.email),phone:norm(r.Telefono||r.Phone||r.phone)});});}
      if(!out.machines.length){flash(t('load_err'));return;}
      if(!out.reps.length)out.reps=EMBEDDED.reps;
      if(!out.accessories.length)out.accessories=EMBEDDED.accessories;
      // fusione col catalogo incorporato: il file può contenere solo codice + prezzo (matrice prezzi);
      // i dati tecnici restano quelli del catalogo, il file vince solo dove ha un valore.
      const base=new Map(EMBEDDED.machines.map(m=>[m.code,m]));
      const merged=new Map();
      out.machines.forEach(m=>{const b=base.get(m.code)||{};const r={...b};
        Object.keys(m).forEach(k=>{if(m[k]!==''&&m[k]!=null&&!(k==='atex'&&!m[k]&&b.atex))r[k]=m[k];});
        if(!m.price&&b.price)r.price=b.price;
        merged.set(m.code,r);});
      base.forEach((b,c)=>{if(!merged.has(c))merged.set(c,b);});   // modelli non presenti nel file: restano (senza prezzo)
      out.machines=[...merged.values()];
      DATA=out;loadedFromFile=true;loadedFileName=file.name;
      S.rep=DATA.reps[0]||S.rep;
      $('#xlsxTxt').textContent='✓ '+file.name;
      curCat=null;search='';
      flash(t('load_ok').replace('%n',DATA.machines.length));
      render();
    }catch(err){console.error(err);flash(t('load_err'));}
  };
  reader.readAsArrayBuffer(file);
}
