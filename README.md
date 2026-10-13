# dprc — Depureco: catalogo, confronto e Generatore Offerte

Tre cose in una repo:

1. **Generatore Offerte Depureco** (`index.html` + `css/` + `js/`): configuratore a 5 passi (Cliente → Applicazione → Prodotto → Opzioni → Offerta) con export PDF A4, multilingua (IT/EN/ES/FR/DE), listino prezzi unico, registro offerte. È la ricostruzione, col brand Depureco, del *Generatore Offerte DUPUY 2026*.
2. **Scraper del catalogo** (`scraper/scrape_depureco.py`): estrae i modelli da www.depureco.com in Excel, con la stessa struttura del listino Dupuy.
3. **Confronto Dupuy vs Depureco** (`scraper/confronta_dupuy_depureco.py`, richiede il listino Dupuy in locale; l'output non è versionato): per ogni modello Dupuy trova il Depureco più vicino per potenza, portata, depressione, capacità.

## File Excel (cartella `excel/`)
| File | Chi lo compila | Pulsante nel configuratore |
|---|---|---|
| `01_Matrice_Prezzi_Depureco.xlsx` | Ufficio commerciale: prezzi macchine, accessori, commerciali | Carica listino |
| `02_Matrice_Optional_Depureco.xlsx` | Prezzi degli optional per macchina | Carica matrice optional |
| `03_Registro_Offerte_DEPURECO_2026.xlsx` | Nessuno: lo scrive il configuratore (cartella collegata) | Registro / Collega cartella |
| `04_Contatti_Clienti_Depureco.xlsx` | Anagrafica clienti | Carica clienti |

Rigenerarli (es. dopo un nuovo scraping): `python3 tools/build_excel_templates.py data/depureco_catalogo_<data>.xlsx`.

## Pubblicazione (GitHub → Netlify)
Netlify pubblica solo la cartella `dist/` (`netlify.toml`), cioè il file unico con le foto. Su Netlify: *Add new site → Import from Git → repo `dprc`, branch `main`*; Build command vuoto, Publish directory `dist` (già nel `netlify.toml`). Dopo ogni modifica: `python3 tools/build_single_html.py`, poi commit e push (incluso `dist/index.html`). Nessun comando di build su Netlify. Le pagine hanno `noindex`: strumento interno, con prezzi e listino.

## Avvio rapido
```bash
python3 -m http.server 8765      # dalla radice della repo
# apri http://localhost:8765/index.html
```
Serve un server locale (o GitHub Pages): i file JS sono separati. Il catalogo (328 modelli) è già incorporato.

## Struttura
```
index.html                 versione di sviluppo (carica css/ e js/)
dist/index.html            ✅ file unico CON foto: è l'unico file pubblicato da Netlify (netlify.toml)
netlify.toml               publish = "dist", nessun build
css/                       brand.css (design token Depureco) · app.css
js/config/brand.js         anagrafica, logo, footer del documento
js/data/                   i18n.js · general-terms.js ⚠ segnaposto · catalogo.js (generato) · defaults.js
js/app/                    core · passi · quote · router · persistence · folder-pdf · xlsx-loader · dashboard
images/                    328 immagini prodotto <Codice>.png (generate dallo scraper)
excel/                     📥 file da compilare / caricare nel configuratore
  01_Matrice_Prezzi_Depureco.xlsx     prezzi macchine (solo colonna Prezzo) + accessori + commerciali
  02_Matrice_Optional_Depureco.xlsx   prezzi optional per macchina
  03_Registro_Offerte_DEPURECO_2026.xlsx  registro offerte vuoto (alimenta la dashboard)
  04_Contatti_Clienti_Depureco.xlsx   clienti per l'autocompletamento
data/                      catalogo sorgente (Excel dello scraper) e report revisione categorie
scraper/                   scrape_depureco.py · categorie.py · confronta_dupuy_depureco.py
tools/                     build_catalog_js · build_price_matrix · build_excel_templates · build_single_html · report_categorie
brand/                     BRAND_GUIDELINES.md · logo
presentazione/             presentazione ai commerciali (PowerPoint)
.claude/agents/            agent Claude Code per rilanciare lo scraping
```

## Cose da completare (non reperibili dal sito)
- **Prezzi** (listino unico, niente L0/LE): Depureco non li pubblica. Compilare **solo la colonna Prezzo** di `excel/01_Matrice_Prezzi_Depureco.xlsx` (tutte le altre celle sono bloccate) e caricarla nel generatore con **Carica listino**: i prezzi si abbinano per Codice al catalogo incorporato. Per renderli permanenti: `python3 tools/build_catalog_js.py <file con colonna Prezzo>`. Finché vuoti: "Prezzo da definire".
- **Accessori** (foglio *Accessori*) e **commerciali** (foglio *Commerciali*): oggi c'è solo il contatto generico pubblico dell'azienda.
- **Condizioni generali di vendita**: `js/data/general-terms.js` contiene un segnaposto. Inserire il testo legale ufficiale Depureco; non è stato copiato quello Dupuy.
- **Immagini prodotto**: già scaricate in `images/` (una per modello, nome = Codice, es. `AC6512DZ2021.png`, 500 px) e richiamate in automatico quando si sceglie la macchina. Se colleghi una cartella con `Collega cartella`, le tue immagini hanno la precedenza.

## Dashboard commerciale
Pulsante **📊 Dashboard** in alto. Per commerciale e per anno: offerte mese per mese e totale anno (numero e valore), esito segnato dal commerciale (Aperta / Vinta / Persa, con le macchine effettivamente vendute e il valore vinto), analisi vinte vs offerte per numero e per valore, statistiche delle macchine offerte e vendute (per modello e per categoria) ed elenco offerte.
- I dati sono nel **registro offerte** (`Registro_Offerte_DEPURECO_2026.xlsx`): fogli *Offerte* (con Stato, Data_Esito, Valore_Vinto) e *Righe* (una riga per macchina offerta). Con la cartella collegata (**Collega cartella**, Chrome/Edge) il registro è su disco/rete e condiviso tra i commerciali; senza, i dati restano nel browser (localStorage) e si esportano con «Esporta registro».
- Il valore delle alternative: ogni offerta conta per il valore della prima soluzione; se più macchine sono alternative, il commerciale segna quella venduta.

## Categorie
Le categorie del sito si sovrappongono (es. «Atex ed ACD» mescola aspiratori, depolveratori e impianti; «Accessori» contiene i pre-separatori). Qui ogni famiglia sta in **una sola categoria per tipo di macchina**, e ATEX/ACD è un filtro separato (colonna `Protezione`), con sottocategoria = serie (PUMA, FOX, TX…). Le regole sono in `scraper/categorie.py`; `data/Revisione_categorie.xlsx` (da `tools/report_categorie.py`) elenca ogni famiglia con categoria del sito vs assegnata. Un prodotto nuovo senza regola finisce in «DA VERIFICARE» e lo scraper lo segnala.

## Aggiornare il catalogo
```bash
python3 scraper/scrape_depureco.py --images images --out data/depureco_catalogo_$(date +%F).xlsx
python3 tools/build_catalog_js.py data/depureco_catalogo_$(date +%F).xlsx
```
Dipendenza: `openpyxl`. Lo scraper usa solo la sitemap pubblica e i dati strutturati delle schede (pausa tra richieste).

## Differenze rispetto al generatore Dupuy
Listino **unico** (nessun selettore L0/LE; colonna `Prezzo`), brand (palette `#AA1917`/`#FFD017`/`#171717`, Lato + Bebas Neue, logo), anagrafica e footer, prefisso offerte `DPC-AA-NNN`, depressione in **mbar** (Dupuy: mm H₂O), marcatura ATEX letta dalla scheda tecnica (Dupuy: tabella interna), nessun kit accessori incluso di serie, campo **Peso**, registro/IndexedDB rinominati `DEPURECO`. Logica, passi e formato di salvataggio offerta sono invariati (il formato `.json` usa ora la chiave `__depurecoOffer`).
