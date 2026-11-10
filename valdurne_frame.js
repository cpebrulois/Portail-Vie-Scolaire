(function(){
  if(window.parent===window||new URLSearchParams(location.search).get('accueil')!=='1')return;
  window.valdurneCloseWelcome=function(){window.parent.postMessage({type:'VALDURNE_CLOSE'},location.origin);};
  document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(!a)return;var u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname.endsWith('/index.html')){e.preventDefault();window.valdurneCloseWelcome();}},true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();window.valdurneCloseWelcome();}});
})();
