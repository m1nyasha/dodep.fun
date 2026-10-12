(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = s => document.querySelector(s);
  const rubles = n => new Intl.NumberFormat('ru-RU').format(Math.round(n));
  let audio;
  function chime(notes, type='sine') {
    if(reduce || !q('#sound-btn')?.title.includes('включён'))return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      const start=audio.currentTime;
      notes.forEach(([pitch,delay,duration],i)=>{
        const osc=audio.createOscillator(),gain=audio.createGain();
        osc.type=type;osc.frequency.setValueAtTime(pitch,start+delay);
        gain.gain.setValueAtTime(.0001,start+delay);
        gain.gain.exponentialRampToValueAtTime(i===0?.045:.029,start+delay+.015);
        gain.gain.exponentialRampToValueAtTime(.0001,start+delay+duration);
        osc.connect(gain).connect(audio.destination);osc.start(start+delay);osc.stop(start+delay+duration+.02);
      });
    }catch{}
  }
  function stageFlash(stage){if(reduce)return;const flash=document.createElement('div');flash.className='table-flash';stage.append(flash);setTimeout(()=>flash.remove(),550)}
  function spark(x,y,count=8,large=false){if(reduce)return;for(let i=0;i<count;i++){const p=document.createElement('span');p.className=large?'coin-spark':'tile-pop';p.textContent=large?'◆':'';p.style.left=`${x}px`;p.style.top=`${y}px`;p.style.position='fixed';const a=(i/count)*Math.PI*2+(Math.random()-.5)*.3,r=(large?95:42)+Math.random()*(large?80:45);p.style.setProperty('--tx',`${Math.cos(a)*r}px`);p.style.setProperty('--ty',`${Math.sin(a)*r-(large?50:0)}px`);document.body.append(p);setTimeout(()=>p.remove(),large?760:620)}}
  function floatText(text,x,y){if(reduce)return;const el=document.createElement('div');el.className='float-win';el.textContent=text;el.style.left=`${x}px`;el.style.top=`${y}px`;document.body.append(el);setTimeout(()=>el.remove(),950)}
  function pulse(el){if(!el)return;el.classList.remove('number-pop');void el.offsetWidth;el.classList.add('number-pop');setTimeout(()=>el.classList.remove('number-pop'),460)}
  function animateWallet(){const el=q('#nav-balance');if(!el||reduce)return;let target=Number(el.textContent.replace(/\D/g,'')),last=target,rendering=false,tick=0;const observer=new MutationObserver(()=>{if(rendering)return;const next=Number(el.textContent.replace(/\D/g,''));if(next===target)return;cancelAnimationFrame(tick);const from=last,to=next,start=performance.now();target=to;rendering=true;pulse(el.closest('.wallet'));const step=t=>{const p=Math.min(1,(t-start)/520),ease=1-Math.pow(1-p,3);el.textContent=rubles(from+(to-from)*ease);if(p<1)tick=requestAnimationFrame(step);else{el.textContent=rubles(to);last=to;queueMicrotask(()=>rendering=false)}};tick=requestAnimationFrame(step)});observer.observe(el,{childList:true,characterData:true,subtree:true})}
  function enhanceGame(){const board=q('#board'),stage=q('.game-stage'),cash=q('#cashout-btn');if(!board||!stage)return;
    let revealing=false;
    document.addEventListener('click',event=>{const tile=event.target.closest('.tile');if(!tile||!board.contains(tile)||tile.disabled)return;event.preventDefault();event.stopImmediatePropagation();if(revealing)return;revealing=true;tile.classList.add('revealing');setTimeout(()=>{tile.classList.remove('revealing');tile.onclick?.();revealing=false},reduce?0:270)},true);
    q('#start-btn')?.addEventListener('click',()=>{queueMicrotask(()=>{if(board.querySelector('.tile:not(:disabled)')){stage.classList.remove('is-loss','is-win');stage.classList.add('is-live');stageFlash(stage);chime([[330,0,.09],[440,.08,.12],[660,.17,.2]])}})});
    cash?.addEventListener('click',()=>{const button=cash.getBoundingClientRect();spark(button.left+button.width/2,button.top+button.height/2,13,true);stage.classList.remove('is-live','is-loss');stage.classList.add('is-win');stageFlash(stage);chime([[523,0,.25],[659,.1,.25],[784,.2,.32],[1047,.32,.4]])});
    const observer=new MutationObserver(records=>{for(const rec of records){const tile=rec.target;if(!(tile instanceof Element)||!tile.classList.contains('tile')||tile.dataset.fx)return;if(tile.classList.contains('safe')){tile.dataset.fx='1';const rect=tile.getBoundingClientRect();spark(rect.left+rect.width/2,rect.top+rect.height/2,8);floatText(q('#multiplier-value')?.textContent||'',rect.left+rect.width/2-24,rect.top-8);pulse(q('#multiplier-value'));pulse(q('#cashout-value'));cash?.classList.add('ready');chime([[740,0,.18],[988,.08,.24]]);}else if(tile.classList.contains('mine')){tile.dataset.fx='1';const rect=tile.getBoundingClientRect();spark(rect.left+rect.width/2,rect.top+rect.height/2,13);stage.classList.remove('is-live','is-win');stage.classList.add('is-loss');stageFlash(stage);chime([[145,0,.24],[92,.06,.38]],'triangle');setTimeout(()=>stage.classList.remove('is-loss'),500);cash?.classList.remove('ready')}}});observer.observe(board,{subtree:true,attributes:true,attributeFilter:['class']});
    animateWallet();
  }
  function enhanceAuth(){const pass=q('input[name="password"]');if(!pass||!q('body[data-page="auth"]'))return;const parent=pass.closest('.field');const meter=document.createElement('div');meter.className='strength-track';meter.innerHTML='<span class="strength-fill"></span>';parent.append(meter);const update=()=>{const v=pass.value;let score=0;if(v.length>=8)score++;if(v.length>=12)score++;if(/[A-ZА-ЯЁ]/.test(v)&&/[a-zа-яё]/.test(v))score++;if(/\d/.test(v)&&/[^\p{L}\p{N}]/u.test(v))score++;meter.style.setProperty('--strength',`${score*25}%`);meter.dataset.score=String(score)};pass.addEventListener('input',update);update()}
  if(document.body.dataset.page==='game')enhanceGame();
  if(document.body.dataset.page==='auth')enhanceAuth();
})();
