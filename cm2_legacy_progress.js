(function(){
  'use strict';
  const read=key=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}catch{return null;}};
  const legacy=read('ave6e_progress')||{};
  const owner=String(legacy.player_id||localStorage.getItem('pvs_current_player')||'local');
  const key=id=>'ave6e_revision_v2:'+owner+':'+id;
  function load(id){return read(key(id));}
  function save(id,state,summary){
    try{
      localStorage.setItem(key(id),JSON.stringify(state));
      const p=read('ave6e_progress')||{};
      if(p.player_id&&p.player_id!==owner)return;
      const summaries=p.hubs_done&&typeof p.hubs_done==='object'&&!Array.isArray(p.hubs_done)?p.hubs_done:{};
      const before=summaries[id]||{};
      summaries[id]={...summary,xp:Math.max(Number(before.xp)||0,summary.xp||0),done:Math.max(Number(before.done)||0,summary.done||0),ts:Date.now()};
      p.hubs_done=summaries;localStorage.setItem('ave6e_progress',JSON.stringify(p));
    }catch{}
  }
  function bind(id,snapshot,summary){
    const persist=()=>save(id,snapshot(),summary());
    document.addEventListener('click',()=>queueMicrotask(persist));
    document.addEventListener('change',()=>queueMicrotask(persist));
    window.addEventListener('pagehide',persist);
  }
  window.LiamRevisionProgress={load,save,bind};
})();
