/* Dati di avvio. Le macchine arrivano da js/data/catalogo.js (generato da tools/build_catalog_js.py). */
const EMBEDDED = {
  machines: (typeof CATALOGO_DEPURECO!=='undefined') ? CATALOGO_DEPURECO : [],
  accessories: [],
  reps: [{name:"Ufficio Commerciale Depureco",email:"depureco@depureco.com",phone:"+39 011 9859117",role:"Sales"}]
};
const IMAGES_BASE = 'images/';   // cartella immagini del catalogo (<Codice>.png)
const IMAGES_EMBED = {};         // hash -> data URI   (riempito solo dal build "con immagini")
const IMAGES_ALIAS = {};         // nome file -> hash
const MACHINE_OPTIONALS = {};  // codice macchina -> [{code,desc,l0,le}] optional selezionabili (sovrapprezzo)
const MACHINE_SPARES    = {};  // codice macchina -> [{code,desc,l0,le}] ricambi
const EMBEDDED_CLIENTS = [];
