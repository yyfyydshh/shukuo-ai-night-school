/* Progressive visual detail aligned with the speaker's outline. */
(() => {
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  function sceneTabs(group,panelClass){
    $$(`[data-${group}]`).forEach(button=>{
      const show=()=>{const name=button.dataset[group];if(group==='gitmode' && name!=='video') $('#gitmode-video video').pause();$$(panelClass).forEach(p=>p.hidden=p.id!==group+'-'+name);$$(`[data-${group}]`).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};
      button.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')show();});button.addEventListener('focus',show);button.addEventListener('click',show);
    });
  }
  sceneTabs('growth','.growth-panel');sceneTabs('discover','.discover-panel');sceneTabs('gitmode','.git-demonstration');
  let diff=false;
  $('#diff-change').addEventListener('click',()=>{
    diff=!diff;$('#diff-after').classList.toggle('revised',diff);
    $('#diff-spec').textContent=diff?'40px · 亮色底':'24px · 浅色底';
    $('#diff-summary').textContent=diff?'改了两处：标题变大，底色变亮。':'两个版本，目前相同。';$('#diff-change').textContent=diff?'再看原版 ↶':'让 AI 改一版 ↗';
  });
  let branch=0;
  $('#branch-change').addEventListener('click',()=>{
    branch=(branch+1)%3;$('#branch-experiment').dataset.variant=String(branch);
    $('#branch-spec').textContent=['还没改动','试验 A · 亮色大标题','试验 B · 深色海报'][branch];
    $('#branch-summary').textContent=branch?'试验线变了，主线依然保留原样。':'回到起点，主线始终没有改变。';
  });
})();
