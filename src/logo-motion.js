(() => {
  const templates = window.LOGO_REEL_TEMPLATES || [];
  const canvas = document.getElementById('reelCanvas');
  const ctx = canvas.getContext('2d');
  const logoInput = document.getElementById('logoInput');
  const musicInput = document.getElementById('musicInput');
  const previewBtn = document.getElementById('previewBtn');
  const exportBtn = document.getElementById('exportBtn');
  const replayBtn = document.getElementById('replayBtn');
  const muteBtn = document.getElementById('muteBtn');
  const status = document.getElementById('status');
  const templateGrid = document.getElementById('templateGrid');
  const templateShowcase = document.getElementById('templateShowcase');
  const previewLabel = document.getElementById('previewLabel');
  const timeline = document.getElementById('timeline');
  const sceneNumber = document.getElementById('sceneNumber');
  const sceneName = document.getElementById('sceneName');
  const emptyState = document.getElementById('emptyState');
  const logoFileName = document.getElementById('logoFileName');
  const musicFileName = document.getElementById('musicFileName');
  const musicState = document.getElementById('musicState');
  const bpmInput = document.getElementById('bpmInput');
  const brandColor = document.getElementById('brandColor');
  const brandHex = document.getElementById('brandHex');
  const smartContrast = document.getElementById('smartContrast');

  let selected = templates[0];
  let logo = null;
  let logoUrl = '';
  let musicUrl = '';
  let music = null;
  let raf = 0;
  let startedAt = 0;
  let playing = false;
  let muted = false;

  const W = canvas.width, H = canvas.height;
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const ease = t => 1 - Math.pow(1-clamp(t,0,1),3);

  function setColor(v){ if(!/^#[0-9a-f]{6}$/i.test(v)) return; brandColor.value=v; brandHex.value=v.toLowerCase(); drawScene(selected.scenes[0],0); }
  brandColor.addEventListener('input',()=>setColor(brandColor.value));
  brandHex.addEventListener('change',()=>setColor(brandHex.value.trim()));

  function renderTemplateButtons(){
    templateGrid.innerHTML = templates.map((t,i)=>`<button data-id="${t.id}" class="${i===0?'active':''}"><b>${t.icon} ${t.name}</b><small>8 scenes · ${t.duration}s</small></button>`).join('');
    templateShowcase.innerHTML = templates.map(t=>`<article style="--swatch:${t.accent}"><i>${t.icon}</i><h3>${t.name}</h3><p>${t.scenes.map(s=>s.name).slice(0,3).join(' · ')} · +5 more</p><button data-pick="${t.id}">Use template</button></article>`).join('');
  }

  function selectTemplate(id){
    selected = templates.find(t=>t.id===id) || templates[0];
    [...templateGrid.querySelectorAll('button')].forEach(b=>b.classList.toggle('active',b.dataset.id===selected.id));
    previewLabel.textContent = `${selected.name} · 8 scenes`;
    document.getElementById('templateCount').textContent = `${templates.indexOf(selected)+1} / ${templates.length}`;
    buildTimeline();
    stop(); drawScene(selected.scenes[0],0);
    document.getElementById('studio').scrollIntoView({behavior:'smooth',block:'start'});
  }
  templateGrid.addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(b)selectTemplate(b.dataset.id)});
  templateShowcase.addEventListener('click',e=>{const b=e.target.closest('[data-pick]');if(b)selectTemplate(b.dataset.pick)});

  function buildTimeline(){
    timeline.innerHTML = selected.scenes.map((s,i)=>`<button data-scene="${i}" title="${s.name}"></button>`).join('');
  }
  timeline.addEventListener('click',e=>{const b=e.target.closest('[data-scene]');if(!b)return;stop(); const i=Number(b.dataset.scene); drawScene(selected.scenes[i],0); setSceneUi(i);});

  logoInput.addEventListener('change',()=>{
    const file=logoInput.files?.[0]; if(!file) return;
    if(!['image/png','image/svg+xml','image/webp'].includes(file.type)){status.textContent='Choose a PNG, SVG or WebP logo.';return;}
    if(logoUrl)URL.revokeObjectURL(logoUrl); logoUrl=URL.createObjectURL(file);
    logo=new Image(); logo.onload=()=>{emptyState.hidden=true;previewBtn.disabled=false;exportBtn.disabled=false;logoFileName.textContent=file.name;status.textContent='Logo ready. Choose a template and preview.';drawScene(selected.scenes[0],0)}; logo.src=logoUrl;
  });

  musicInput.addEventListener('change',()=>{
    const file=musicInput.files?.[0]; if(!file)return;
    if(musicUrl)URL.revokeObjectURL(musicUrl); musicUrl=URL.createObjectURL(file);
    music=new Audio(musicUrl); music.preload='auto'; musicFileName.textContent=file.name; musicState.textContent='loaded'; status.textContent='Music loaded. Preview will use it.';
  });

  document.getElementById('detectBeatsBtn').addEventListener('click',()=>{ const bpm=clamp(Number(bpmInput.value)||120,60,200); const beat=(60/bpm).toFixed(2); status.textContent=`Beat grid set from ${bpm} BPM · ${beat}s per beat.`; });

  function bgGradient(a,b){ const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,a);g.addColorStop(1,b);ctx.fillStyle=g;ctx.fillRect(0,0,W,H); }
  function rounded(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
  function shadow(){ctx.shadowColor='rgba(0,0,0,.24)';ctx.shadowBlur=26;ctx.shadowOffsetY=16}
  function clearShadow(){ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0}
  function drawMockup(type,t){
    const c=selected.accent, base=brandColor.value;
    if(type==='hero'){bgGradient(base,c+'99');ctx.globalAlpha=.16;for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(W*.5,H*.5,90+i*55,0,Math.PI*2);ctx.strokeStyle='#fff';ctx.stroke()}ctx.globalAlpha=1;return;}
    bgGradient('#ecece8','#cfd3d0');
    ctx.save();ctx.translate(W/2,H/2);ctx.rotate((Math.sin(t*5)*.8)*Math.PI/180);ctx.translate(-W/2,-H/2);
    shadow();
    if(['cap'].includes(type)){ctx.fillStyle='#111318';ctx.beginPath();ctx.ellipse(W*.5,H*.48,175,105,0,Math.PI,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(W*.62,H*.53,120,35,-.16,0,Math.PI*2);ctx.fill();}
    else if(['shirt','hoodie','apron'].includes(type)){ctx.fillStyle=type==='apron'?'#7d5c43':'#17191e';ctx.beginPath();ctx.moveTo(150,250);ctx.lineTo(235,190);ctx.lineTo(305,190);ctx.lineTo(390,250);ctx.lineTo(350,760);ctx.lineTo(190,760);ctx.closePath();ctx.fill();if(type==='hoodie'){ctx.beginPath();ctx.arc(W*.5,220,90,0,Math.PI);ctx.fill()}}
    else if(['bag'].includes(type)){rounded(130,250,280,420,24,'#d6c6aa');ctx.strokeStyle='#8c7355';ctx.lineWidth=8;ctx.beginPath();ctx.arc(270,275,95,Math.PI,0);ctx.stroke();}
    else if(['tag','card','label'].includes(type)){ctx.translate(W*.5,H*.5);ctx.rotate(-.08);ctx.translate(-W*.5,-H*.5);rounded(105,335,330,220,20,type==='card'?'#111318':'#f8f6f0');}
    else if(['store','building'].includes(type)){ctx.fillStyle='#b8bbb7';ctx.fillRect(0,180,W,600);ctx.fillStyle='#303238';ctx.fillRect(55,270,430,100);ctx.fillStyle='#8e9592';ctx.fillRect(80,390,160,280);ctx.fillRect(300,390,160,280);}
    else if(['box','carton','stack'].includes(type)){const fill=type==='carton'?'#b68c5b':'#f4f0e7';rounded(105,310,330,330,16,fill);ctx.fillStyle='rgba(0,0,0,.08)';ctx.fillRect(105,390,330,12);}
    else if(['billboard'].includes(type)){ctx.fillStyle='#31343a';ctx.fillRect(40,250,460,250);ctx.fillStyle='#e8e8e4';ctx.fillRect(58,268,424,214);ctx.fillStyle='#54575e';ctx.fillRect(245,500,50,250);}
    else if(['poster','menu','social'].includes(type)){rounded(105,210,330,520,10,type==='menu'?'#202226':'#fbfaf6');}
    else if(['neon'].includes(type)){ctx.fillStyle='#111318';ctx.fillRect(0,0,W,H);ctx.shadowColor=c;ctx.shadowBlur=35;rounded(85,310,370,250,18,'rgba(255,255,255,.04)',c);clearShadow();}
    else if(['shelter','glass'].includes(type)){ctx.fillStyle='rgba(225,235,238,.58)';ctx.fillRect(75,180,390,610);ctx.strokeStyle='#62686d';ctx.lineWidth=12;ctx.strokeRect(75,180,390,610);}
    else if(['banner'].includes(type)){ctx.fillStyle='#33363b';ctx.fillRect(235,120,20,720);rounded(130,240,280,360,8,'#e9e7df');}
    else if(['bottle'].includes(type)){rounded(175,260,190,430,70,'#ece7dd');rounded(215,205,110,80,18,'#b7b0a6');}
    else if(['pouch'].includes(type)){ctx.fillStyle='#eee8dd';ctx.beginPath();ctx.moveTo(140,260);ctx.lineTo(400,260);ctx.lineTo(370,710);ctx.lineTo(170,710);ctx.closePath();ctx.fill();}
    else if(['shelf'].includes(type)){ctx.fillStyle='#8b8f8b';for(let y=280;y<720;y+=170)ctx.fillRect(45,y,450,18);for(let x=95;x<470;x+=120)rounded(x,330,78,140,18,'#eee8dd');}
    else if(['cup'].includes(type)){ctx.fillStyle='#efe7d7';ctx.beginPath();ctx.moveTo(175,280);ctx.lineTo(365,280);ctx.lineTo(335,680);ctx.lineTo(205,680);ctx.closePath();ctx.fill();ctx.fillStyle='#ddd3c0';ctx.fillRect(165,260,210,35);}
    else if(['coaster'].includes(type)){ctx.fillStyle='#9c7759';ctx.fillRect(0,0,W,H);ctx.beginPath();ctx.arc(W*.5,H*.55,165,0,Math.PI*2);ctx.fillStyle='#efe4d1';ctx.fill();}
    else if(['phone','app'].includes(type)){rounded(155,150,230,660,38,'#101216');rounded(170,180,200,600,26,type==='app'?c:'#f7f7f5');}
    else if(['laptop','desktop','devices'].includes(type)){rounded(70,260,400,280,18,'#26292e');ctx.fillStyle='#f5f5f2';ctx.fillRect(90,285,360,220);ctx.fillStyle='#73777d';ctx.fillRect(230,540,80,130);ctx.fillRect(150,650,240,18);}
    else if(['metal','leather'].includes(type)){ctx.fillStyle=type==='metal'?'#8b8f92':'#3b241b';ctx.fillRect(0,0,W,H);rounded(90,330,360,240,20,type==='metal'?'#b8bbbd':'#4a2e22');}
    clearShadow();ctx.restore();
  }

  function luminance(hex){const n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;return(.299*r+.587*g+.114*b)/255}
  function drawLogo(scene,localT){ if(!logo)return; const p=scene.logo; const enter=ease(Math.min(1,localT*4)); const pulse=1+Math.sin(localT*Math.PI)*.025; const scale=p.s*enter*pulse; const maxW=W*scale; const maxH=H*scale*.5; const fit=Math.min(maxW/logo.naturalWidth,maxH/logo.naturalHeight); const dw=logo.naturalWidth*fit,dh=logo.naturalHeight*fit; ctx.save();ctx.globalAlpha=enter;ctx.translate(W*p.x,H*p.y);ctx.rotate((p.r||0)*Math.PI/180); if(smartContrast.checked && luminance(brandColor.value)<.28){ctx.shadowColor='rgba(255,255,255,.35)';ctx.shadowBlur=12} if(scene.type==='neon'){ctx.shadowColor=selected.accent;ctx.shadowBlur=30} const count=scene.repeat||1; if(count===1)ctx.drawImage(logo,-dw/2,-dh/2,dw,dh); else {for(let i=0;i<count;i++){const off=(i-(count-1)/2)*Math.min(120,dw*.7);ctx.drawImage(logo,-dw/2+off,-dh/2,dw,dh)}} ctx.restore(); }

  function currentScene(time){ let i=selected.scenes.findIndex(s=>time>=s.start&&time<s.end); if(i<0)i=selected.scenes.length-1; return [selected.scenes[i],i]; }
  function setSceneUi(i){sceneNumber.textContent=`Scene ${i+1} / 8`;sceneName.textContent=selected.scenes[i].name;[...timeline.children].forEach((b,n)=>b.classList.toggle('active',n===i))}
  function drawScene(scene,localT){ctx.clearRect(0,0,W,H);drawMockup(scene.type,localT);drawLogo(scene,localT);}

  function frame(now){ if(!playing)return; const elapsed=(now-startedAt)/1000; const t=elapsed%selected.duration; const [scene,i]=currentScene(t); const local=(t-scene.start)/(scene.end-scene.start);drawScene(scene,local);setSceneUi(i);raf=requestAnimationFrame(frame); }
  function play(){ if(!logo)return; stop(false);playing=true;startedAt=performance.now();if(music){music.currentTime=0;music.muted=muted;music.play().catch(()=>{})}raf=requestAnimationFrame(frame);status.textContent=`Previewing ${selected.name}…`; }
  function stop(resetAudio=true){playing=false;cancelAnimationFrame(raf);if(resetAudio&&music){music.pause();music.currentTime=0}}
  previewBtn.addEventListener('click',play);replayBtn.addEventListener('click',play);muteBtn.addEventListener('click',()=>{muted=!muted;muteBtn.textContent=muted?'🔇':'♫';if(music)music.muted=muted});

  async function exportVideo(){
    if(!logo||!window.MediaRecorder){status.textContent='Video export needs a modern Chrome/Edge browser.';return}
    stop();exportBtn.disabled=true;previewBtn.disabled=true;exportBtn.textContent='Rendering…';status.textContent='Rendering 9:16 reel locally…';
    const out=document.createElement('canvas');out.width=1080;out.height=1920;const octx=out.getContext('2d');const vstream=out.captureStream(30);let stream=vstream;let exportAudio=null,audioCtx=null;
    try{
      if(musicUrl){exportAudio=new Audio(musicUrl);exportAudio.loop=false;audioCtx=new AudioContext();const src=audioCtx.createMediaElementSource(exportAudio);const dest=audioCtx.createMediaStreamDestination();src.connect(dest);src.connect(audioCtx.destination);stream=new MediaStream([...vstream.getVideoTracks(),...dest.stream.getAudioTracks()]);}
      const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':'video/webm';const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:10000000});const chunks=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);const done=new Promise(r=>rec.onstop=r);const start=performance.now();rec.start(100);if(exportAudio){exportAudio.currentTime=0;await exportAudio.play().catch(()=>{})}
      await new Promise(resolve=>{function draw(now){const sec=(now-start)/1000;const t=Math.min(selected.duration,sec);const [s,i]=currentScene(Math.min(t,selected.duration-.001));const local=(t-s.start)/(s.end-s.start);drawScene(s,local);octx.drawImage(canvas,0,0,1080,1920);setSceneUi(i);if(sec<selected.duration)requestAnimationFrame(draw);else resolve()}requestAnimationFrame(draw)});
      rec.stop();if(exportAudio)exportAudio.pause();await done;const blob=new Blob(chunks,{type:'video/webm'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`logo-reel-${selected.id}-1080x1920.webm`;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);status.textContent='Export complete. Your branded reel is ready.';
    }catch(err){console.error(err);status.textContent='Export failed. Try Chrome or Edge.'}finally{if(audioCtx)audioCtx.close().catch(()=>{});exportBtn.disabled=false;previewBtn.disabled=false;exportBtn.textContent='Export video';drawScene(selected.scenes[0],0);setSceneUi(0)}
  }
  exportBtn.addEventListener('click',exportVideo);

  renderTemplateButtons();buildTimeline();selectTemplate(templates[0]?.id);setSceneUi(0);setColor('#101216');
})();