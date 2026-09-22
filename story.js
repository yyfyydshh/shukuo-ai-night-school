/* One action, one idea. All scenes run locally without online AI. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const happy=(id,on)=>$(id).dataset.happy=String(on);
  const say=(id,words)=>$(id).textContent=words;
  const preview=(el,fn)=>{el.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')fn();});el.addEventListener('focus',fn);el.addEventListener('click',fn);};
  preview($('#hello'),()=>{happy('#hello-person',true);say('#hello-words','“那就，先试出来。”');});
  $('#hello').addEventListener('pointerleave',()=>{happy('#hello-person',false);say('#hello-words','“这个，我不会。”');});
  $$('[data-keep]').forEach(b=>preview(b,()=>{
    const method=b.dataset.keep==='method';$('#keep-stage').dataset.mode=method?'method':'result';$('.keep-result').hidden=method;$('.keep-method').hidden=!method;
    $$('[data-keep]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    say('#keep-thought',method?'留下方法，下一次就有起点。':'只留下成片，下一次还得重新摸索。');
  }));
  const clarity=$('#clarity-range');
  function paintClarity(value){
    const n=Math.max(0,Math.min(100,value));clarity.value=n;
    $('#clarity-title').style.fontSize=(26+n*.28).toFixed(1)+'px';$('#clarity-card').classList.toggle('clear',n>=55);
    happy('#clarity-person',n>=65);say('#clarity-words',n>=65?'“后排也看清了。”':'“后排能看清吗？”');
  }
  $('#clarity-card').addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=e.currentTarget.getBoundingClientRect();paintClarity(Math.round((e.clientX-r.left)/r.width*100));});
  clarity.addEventListener('input',()=>paintClarity(Number(clarity.value)));paintClarity(0);
  const borrowWords=['先把想法拆成镜头。','再给镜头配上旁白。','接起来，你也能开始做动画。'];
  $$('[data-borrow]').forEach(b=>preview(b,()=>{
    const n=Number(b.dataset.borrow);$$('[data-borrow]').forEach((el,i)=>{el.setAttribute('aria-pressed',String(i<=n));happy('#borrow-person-'+i,i<=n);});
    say('#borrow-output',n===2?'一条动画 ✓':'一条动画？');$('.borrow-route').classList.toggle('complete',n===2);say('#borrow-thought',borrowWords[n]);
  }));
  let safeStep=0;
  const safeLabels=['先留一份，再往前试。','这一版，已经留下了。','这次改坏了，存档还在。','回来了，可以继续试。'];
  const safeQuotes=['“放心试，先存档。”','“有退路，就敢往前。”','“别急，我们能回去。”','“这就是存档的用处。”'];
  const safeActions=['留个存档 →','大胆改一次 →','回到存档 ↶','再试一次 ↺'];
  function paintSafe(peeking=false){
    const broken=safeStep===2&&!peeking,work=$('.saved-work');work.classList.toggle('broken',broken);work.classList.toggle('preview',peeking);
    say('#safe-art',broken?'哎呀，改坏了。':'我的新作品。');say('#safe-label',peeking?'预览存档 · 还没有恢复':safeLabels[safeStep]);happy('#safe-person',!broken);
  }
  function safe(){
    paintSafe();$('#peek-save').hidden=safeStep===0;say('#safe-words',safeQuotes[safeStep]);say('#safe-next',safeActions[safeStep]);
    $$('#safe-steps span').forEach((el,i)=>el.classList.toggle('active',i<=(safeStep===0?0:safeStep-1)));
  }
  $('#safe-next').addEventListener('click',()=>{safeStep=(safeStep+1)%4;safe();});
  preview($('#peek-save'),()=>paintSafe(true));$('#peek-save').addEventListener('pointerleave',()=>paintSafe());$('#peek-save').addEventListener('blur',()=>paintSafe());safe();
  let delivered=false,drag=null,suppress=false;
  const book=$('#method-book'),target=$('#receivers');
  function relay(on){
    delivered=on;$('#team').dataset.shared=String(on);$('.relay-story').classList.toggle('delivered',on);[0,1,2].forEach(i=>happy('#receive-'+i,on));
    say('#relay-words',on?'“这次，我们知道怎么开始了。”':'“我们，从哪里开始？”');
    say('#relay-thought',on?'你的一次成功，成为别人的起点。':'把开始的方法，也交给别人。');
    say('#book-hint',on?'再传一次 ↺':'拖过去 ↗');book.setAttribute('aria-label',on?'重新演示方法交接':'把方法交给同事，可拖动或点选');
  }
  const inside=(x,y)=>{const r=target.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;};
  function stopDrag(){if(!drag)return;drag.ghost?.remove();book.classList.remove('dragging');target.classList.remove('drop-ready');drag=null;}
  book.addEventListener('pointerdown',e=>{if(e.button!==0||drag)return;drag={x:e.clientX,y:e.clientY,id:e.pointerId,moved:false,ghost:null};book.setPointerCapture(e.pointerId);});
  book.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;
    if(!drag.moved){drag.moved=true;drag.ghost=document.createElement('div');drag.ghost.className='book-drag-ghost';drag.ghost.textContent='这次的方法';document.body.append(drag.ghost);book.classList.add('dragging');}
    drag.ghost.style.left=e.clientX+12+'px';drag.ghost.style.top=e.clientY-30+'px';target.classList.toggle('drop-ready',inside(e.clientX,e.clientY));
  });
  book.addEventListener('pointerup',e=>{
    if(!drag)return;const commit=drag.moved&&inside(e.clientX,e.clientY);
    if(drag.moved){suppress=true;setTimeout(()=>suppress=false,120);}stopDrag();if(commit)relay(true);
  });
  book.addEventListener('pointercancel',stopDrag);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){suppress=true;setTimeout(()=>suppress=false,120);stopDrag();}});
  book.addEventListener('click',e=>{if(suppress){e.preventDefault();return;}relay(!delivered);});relay(false);
  const focusCopy={find:'找：从已有方法开始。',borrow:'借：把外部能力接到自己的想法。',adapt:'改：变成适合自己的作品。',keep:'存：给下一次留下起点。'};
  $$('[data-focus]').filter(b=>b.tagName==='BUTTON').forEach(b=>preview(b,()=>{
    const key=b.dataset.focus;$('#focus-stage').dataset.focus=key;
    $$('.focus-panel').forEach(panel=>panel.hidden=panel.id!=='focus-'+key);
    $$('.focus-words button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    say('#focus-status',focusCopy[key]);
  }));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  $$('.story-scene').forEach(scene=>{
    scene.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches||drag)return;scene.querySelectorAll('.cast').forEach(c=>{const r=c.getBoundingClientRect();c.style.setProperty('--lean',Math.max(-3,Math.min(3,(e.clientX-r.left-r.width/2)/130))+'deg');});});
    scene.addEventListener('pointerleave',()=>scene.querySelectorAll('.cast').forEach(c=>c.style.setProperty('--lean','0deg')));
  });
})();
