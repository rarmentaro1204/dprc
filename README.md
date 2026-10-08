# dprc — Depureco: catalogo, confronto e Generatore Offerte

Tre cose in una repo:

1. **Generatore Offerte Depureco** (`index.html` + `css/` + `js/`): configuratore a 5 passi (Cliente → Applicazione → Prodotto → Opzioni → Offerta) con export PDF A4, multilingua (IT/EN/ES/FR/DE), listino prezzi unico, registro offerte. È la ricostruzione, col brand Depureco, del *Generatore Offerte DUPUY 2026*.
2. **Scraper del catalogo** (`scraper/scrape_depureco.py`): estrae i modelli da www.depureco.com in Excel, con la stessa struttura del listino Dupuy.
3. **Confronto Dupuy vs Depureco** (`scraper/confronta_dupuy_depureco.py`, richiede il listino Dupuy in locale; l'output non è versionato): per ogni modello Dupuy trova il Depureco più vicino per potenza, portata, depressione, capacità.

## Pubblicazione (GitHub → Netlify)
Netlify pubblica solo la cartella `dist/` (`netlify.toml`), cioè il file unico con le foto. Dopo ogni modifica: `python3 tools/build_single_html.py`, poi commit e push (incluso `dist/index.html`). Nessun comando di build su Netlify. Le pagine hanno `noindex`: strumento interno, con prezzi e listino.

## Avvio rapido
```bash
python3 -m http.server 8765      # dalla radice della repo
# apri http://localhost:8765/index.html
```
Serve un server locale (o GitHub Pages): i file JS sono separati. Il catalogo (328 modelli) è già incorporato.

## Struttura
```
index.html               entry point (carica CSS e script nell'ordine corretto)
css/brand.css            design token Depureco (colori, font) — qui si cambia il brand
css/app.css              layout e componenti
js/config/brand.js       anagrafica, logo, footer del documento
js/data/i18n.js          traduzioni
js/data/general-terms.js condizioni generali di vendita  ⚠ PLACEHOLDER
js/data/catalogo.js      catalogo macchine (GENERATO da tools/build_catalog_js.py)
js/data/defaults.js      dati di avvio (commerciali, optional, ricambi)
js/app/*.js              logica: core, passi, quote/documento, router, persistenza, cartella+PDF, loader Excel
scraper/                 scraper catalogo + confronto Dupuy/Depureco
scraper/categorie.py     regole di categorizzazione (UNA categoria per tipo di macchina + Protezione ATEX/ACD/Standard)
tools/build_catalog_js.py  Excel → js/data/catalogo.js
tools/build_price_matrix.py  genera la matrice prezzi da compilare
tools/report_categorie.py    report di revisione categorie
tools/build_single_html.py   genera dist/index.html: file unico CON immagini incorporate (~9 MB)
dist/index.html          l'unico file pubblicato da Netlify (vedi netlify.toml)
images/                  immagini prodotto <Codice>.png (generate dallo scraper)
data/                    catalogo Excel (il confronto *_vs_dupuy.xlsx resta solo locale: contiene prezzi interni Dupuy)
brand/                   guidelines e logo
.claude/agents/depureco-scraper.md   agent Claude Code per rilanciare lo scraping
```

## Cose da completare (non reperibili dal sito)
- **Prezzi** (listino unico, niente L0/LE): Depureco non li pubblica. Compilare **solo la colonna Prezzo** di `data/Matrice_Prezzi_Depureco.xlsx` (tutte le altre celle sono bloccate) e caricarla nel generatore con **Carica listino**: i prezzi si abbinano per Codice al catalogo incorporato. Per renderli permanenti: `python3 tools/build_catalog_js.py <file con colonna Prezzo>`. Finché vuoti: "Prezzo da definire".
- **Accessori** (foglio *Accessori*) e **commerciali** (foglio *Commerciali*): oggi c'è solo il contatto generico pubblico dell'azienda.
- **Condizioni generali di vendita**: `js/data/general-terms.js` contiene un segnaposto. Inserire il testo legale ufficiale Depureco; non è stato copiato quello Dupuy.
- **Immagini prodotto**: già scaricate in `images/` (una per modello, nome = Codice, es. `AC6512DZ2021.png`, 500 px) e richiamate in automatico quando si sceglie la macchina. Se colleghi una cartella con `Collega cartella`, le tue immagini hanno la precedenza.

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
