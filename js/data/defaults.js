/* Dati di avvio. Le macchine arrivano da js/data/catalogo.js (generato da tools/build_catalog_js.py). */
const EMBEDDED = {
  machines: (typeof CATALOGO_DEPURECO!=='undefined') ? CATALOGO_DEPURECO : [],
  accessories: [],
  // operatori che possono fare un'offerta (solo nome; email/telefono si possono aggiungere dal foglio Commerciali dell'Excel)
  reps: [
    {"name": "Sabrina Menon", "email": "", "phone": "", "role": ""},
    {"name": "Gianluca Prina", "email": "", "phone": "", "role": ""},
    {"name": "Federico Pistone", "email": "", "phone": "", "role": ""},
    {"name": "Fabio Barberi", "email": "", "phone": "", "role": ""},
    {"name": "Mariacristina Rolle", "email": "", "phone": "", "role": ""},
    {"name": "Marco Devincentis", "email": "", "phone": "", "role": ""},
    {"name": "Fabio Stura", "email": "", "phone": "", "role": ""}
  ]
};
const IMAGES_BASE = 'images/';   // cartella immagini del catalogo (<Codice>.png)
const IMAGES_EMBED = {};         // hash -> data URI   (riempito solo dal build "con immagini")
const IMAGES_ALIAS = {};         // nome file -> hash
const MACHINE_OPTIONALS = {};  // codice macchina -> [{code,desc,l0,le}] optional selezionabili (sovrapprezzo)
const MACHINE_SPARES    = {};  // codice macchina -> [{code,desc,l0,le}] ricambi
const EMBEDDED_CLIENTS = [];
