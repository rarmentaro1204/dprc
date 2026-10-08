/* Generatore Offerte Depureco — modulo "init" */
/* ============== INIT ============== */
$('#brandLogo').innerHTML=logoDark(30);
setupLoader();
if(!S.delivery)S.delivery=t('def_delivery');
if(!S.packaging)S.packaging=t('def_packaging');
if(!S.payment)S.payment=t('def_payment');
$('#langSel').value=LANG;
if(CLIENTS.length&&$('#cliTxt'))$('#cliTxt').textContent='✓ '+CLIENTS.length+' '+t('clients');
render();
restoreFolder();
