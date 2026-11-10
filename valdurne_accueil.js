(function(){
  'use strict';
  var shownFor='',dialog=null,frame=null,previousFocus=null;
  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch(e){return fallback;}}
  function close(){if(dialog&&dialog.open)dialog.close();}
  function target(player){
    var state=read('pvs_hof_v2',{}),p=state.players&&state.players[player];
    var rank=p&&p.rankData&&Number.isInteger(p.rankData.i)?Math.min(3,Math.max(0,p.rankData.i)):0;
    return p&&p.filageDone&&p.filageDone[rank+'_1']?'filage.html':'seuil.html';
  }
  function ensure(){
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.id='valdurneWelcome';dialog.setAttribute('aria-label','Le Seuil de Valdurne, accueil et quete guidee');
    dialog.innerHTML='<div class="valdurne-welcome-bar"><span>Le Seuil de Valdurne</span><button type="button" id="valdurneWelcomeClose" title="Explorer librement le portail" aria-label="Fermer et explorer librement">&#215;</button></div><iframe title="Kern et le parcours guide de Valdurne" referrerpolicy="same-origin"></iframe>';
    document.body.appendChild(dialog);frame=dialog.querySelector('iframe');
    document.getElementById('valdurneWelcomeClose').onclick=close;
    dialog.addEventListener('close',function(){if(dialog.open)return;frame.src='about:blank';if(previousFocus&&previousFocus.isConnected)previousFocus.focus();if(typeof processRewardQueue==='function')processRewardQueue();});
    dialog.addEventListener('click',function(e){if(e.target===dialog){var r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  }
  function maybeOpen(){
    var player=typeof cur==='string'?cur.trim().toUpperCase():'';
    if(!player||typeof isVisitor!=='undefined'&&isVisitor||typeof adminOn!=='undefined'&&adminOn)return false;
    if(sessionStorage.getItem('pvs_session_auth_v1')!=='1')return false;
    var role=localStorage.getItem('pvs_role');if(role==='prof'||role==='admin')return false;
    if(shownFor===player)return true;
    ensure();shownFor=player;previousFocus=document.activeElement;
    var url=new URL(target(player),location.href);url.searchParams.set('accueil','1');url.searchParams.set('player',player);
    frame.src=url.href;dialog.showModal();document.getElementById('valdurneWelcomeClose').focus();return true;
  }
  function blocksRewards(){var player=typeof cur==='string'?cur.trim().toUpperCase():'';var role=localStorage.getItem('pvs_role');return !!player&&sessionStorage.getItem('pvs_session_auth_v1')==='1'&&!(typeof isVisitor!=='undefined'&&isVisitor)&&!(typeof adminOn!=='undefined'&&adminOn)&&role!=='prof'&&role!=='admin'&&(shownFor!==player||!!(dialog&&dialog.open));}
  window.PVSValdurneWelcome={maybeOpen:maybeOpen,close:close,target:target,blocksRewards:blocksRewards};
  window.addEventListener('message',function(e){if(e.origin===location.origin&&frame&&e.source===frame.contentWindow&&e.data&&e.data.type==='VALDURNE_CLOSE')close();});
  window.addEventListener('storage',function(e){if(e.key==='pvs_current_player'&&e.newValue!==shownFor){shownFor='';close();}});
  document.addEventListener('click',function(e){if(e.target.closest('[onclick*="logoutPlayer"]')){shownFor='';close();}},true);
})();
