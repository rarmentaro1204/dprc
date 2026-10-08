# Depureco — Brand guidelines (ricostruite dal sito)

> **Nota:** non esiste un manuale ufficiale fornito. Questi valori sono estratti da www.depureco.com
> (tema WordPress `Canva-Depureco-V3`, variabili CSS `--color-dpc-*` e `--*-ff`) il 2026-10-08.
> Se arriva un manuale ufficiale, aggiornare `css/brand.css` e `js/config/brand.js`: sono gli unici due punti dove vive il brand.

## Colori
| Token | Esadecimale | Uso nel generatore |
|---|---|---|
| Rosso Depureco (`--red`) | `#AA1917` | CTA, step attivo, marcature ATEX, simbolo in copertina |
| Rosso 700 | `#660F0E` | Ombra pulsanti, hover scuro |
| Rosso 300 / 100 | `#BB4745` / `#EED1D1` | Evidenziazioni leggere |
| Giallo Depureco (`--yellow`) | `#FFD017` | Accento: indirizzo web nel footer, link in copertina, bordo step attivo |
| Grigio scuro (`--navy`) | `#171717` | Barra superiore, copertina, footer documento |
| Grigio 900 (`--navy2`) | `#292929` | Pulsanti del caricamento file |
| Neutri | `#4A4A4A` `#6E6E6E` `#ECECEC` `#F5F5F5` | Barre intestazione tabelle e sezioni |

Regola: testo su scuro → bianco; rosso mai come testo piccolo su fondo `#171717` (contrasto insufficiente → usare il giallo).

## Tipografia
- **Lato** (300/400/700/900) — testo, tabelle, UI. Fallback: Helvetica Neue, Arial.
- **Bebas Neue** — titoli (sezioni, barre `hbar`, titolo copertina, nome soluzione). Sempre maiuscolo, `letter-spacing:.05em`.
  Il sito usa il font self-hosted `BebasNeue`; qui è caricato da Google Fonts.

## Logo
- File: `brand/depureco-logo.svg` (scaricato dal sito: `/wp-content/uploads/2024/10/Depureco-Logo.svg`).
- Composizione: simbolo a picco rosso + wordmark DEPURECO + "INDUSTRIAL VACUUMS" (grigio `#878787`).
- Su sfondo chiaro: versione originale (`logoLight()`).
- Su sfondo scuro: wordmark bianco, simbolo rosso invariato, tagline grigio chiaro (`logoDark()`).
- Non deformare, non cambiare i colori del simbolo, lasciare spazio libero pari all'altezza del picco.

## Forme
Il sito usa angoli vivi (`--btn-rounded:0`); il generatore mantiene i raggi dell'app originale (8–12px) per usabilità: è una scelta di UI interna, non del documento stampato.

## Anagrafica nei documenti (da `BRAND` in `js/config/brand.js`)
Depureco Industrial Vacuums Srl · Via Venezia, 32 · 10088 Volpiano (TO) · Tel/Fax +39 011 9859117 · depureco@depureco.com · C.F./P.IVA IT02258610357 · www.depureco.com
