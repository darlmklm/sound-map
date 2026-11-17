const MODES = [
  {id:"roof", label:"01 ROOF PULSE"},
  {id:"brick", label:"02 BRICK SHIFT"},
  {id:"fold", label:"03 FACADE FOLD"},
  {id:"pixel", label:"04 PIXEL SCAN"},
  {id:"water", label:"05 水 FLOW"}
];

const METRICS = [
  ["volume","VOLUME / SCALE"],
  ["bass","LOW FREQ. / WEIGHT"],
  ["high","HIGH FREQ. / SHARPNESS"],
  ["events","EVENTS / DENSITY"],
  ["regularity","REGULARITY / REPEAT"]
];

const LOCATIONS = [
  {
    number:"01",name:"BRICK CORNER",category:"BRICK TEXTURE",mode:"roof",
    image:"assets/locations/01-brick-corner.webp",motif:"assets/motifs/01-roof-system.webp",
    description:"벽돌이 모서리에서 한 칸씩 어긋나는 구조를 소리의 높낮이에 따라 팽창하는 지붕 파동으로 변환합니다.",
    style:{left:7,top:56,z:5,rotate:-4},metrics:{volume:58,bass:71,high:42,events:48,regularity:84}
  },
  {
    number:"02",name:"MUSINSA STREET",category:"COMMERCIAL STREET",mode:"brick",
    image:"assets/locations/02-musinsa-street.webp",motif:"assets/motifs/02-folded-facade.webp",
    description:"상점의 음악과 대화, 차량 소음이 겹치는 밀도를 벽돌 행의 어긋남과 반복으로 시각화합니다.",
    style:{left:28,top:25,z:28,rotate:3},metrics:{volume:78,bass:55,high:73,events:88,regularity:47}
  },
  {
    number:"03",name:"RED BRICK HOUSE",category:"INDUSTRIAL HERITAGE",mode:"fold",
    image:"assets/locations/03-red-brick-building.webp",motif:"assets/motifs/03-pixel-roof.webp",
    description:"연속된 박공지붕과 깊은 벽면을 접히고 펼쳐지는 파사드로 재구성합니다. 포인터 방향이 면의 깊이를 바꿉니다.",
    style:{left:45,top:52,z:52,rotate:-1},metrics:{volume:66,bass:82,high:51,events:61,regularity:91}
  },
  {
    number:"04",name:"CENTERPOINT",category:"CONSTRUCTION SOUND",mode:"pixel",
    image:"assets/locations/04-centerpoint.webp",motif:"assets/motifs/04-triangle-pattern.webp",
    description:"공사장의 충격음과 고주파음을 작은 벽돌 픽셀과 순간적인 수직 신호로 기록합니다.",
    style:{left:66,top:15,z:18,rotate:5},metrics:{volume:91,bass:76,high:88,events:79,regularity:39}
  },
  {
    number:"05",name:"ROSI STREET",category:"NEW RETAIL",mode:"water",
    image:"assets/locations/05-rosi-street.webp",motif:"assets/motifs/05-water-glyph.webp",
    description:"성수의 한자 ‘물 수(水)’가 소리의 파장을 따라 흐르며 지붕의 삼각형 실루엣을 반복해서 만듭니다.",
    style:{left:78,top:59,z:42,rotate:-3},metrics:{volume:44,bass:36,high:67,events:52,regularity:73}
  }
];

let selectedIndex=0;
let activeMode="roof";
let currentValues={...LOCATIONS[0].metrics};
let canvasPointer={x:.5,y:.5};
let clickImpact=0;
let audioContext=null;
let analyser=null;
let synthNodes=[];
let uploadedSource=null;
let uploadedUrl=null;
let playing=false;
let startTime=0;
let elapsedPaused=0;

const map=document.getElementById("spatialMap");
const layer=document.getElementById("locationLayer");
const experiment=document.getElementById("experiment");
const canvas=document.getElementById("soundCanvas");
const uploadedAudio=document.getElementById("uploadedAudio");

function makeMap(){
  layer.innerHTML=LOCATIONS.map((location,index)=>{
    const s=location.style;
    return `<button class="location-node" data-index="${index}" style="left:${s.left}%;top:${s.top}%;z-index:${20+Math.round(s.z)};transform:translateZ(${s.z}px) rotate(${s.rotate}deg)">
      <span class="photo-frame">
        <img src="${location.image}" alt="${location.name}">
        <span class="node-number">${location.number}</span>
        <span class="sound-pulse"></span>
      </span>
      <span class="location-tag">${location.name}</span>
      <span class="location-type">${location.category}</span>
    </button>`;
  }).join("");

  layer.querySelectorAll(".location-node").forEach(node=>{
    node.addEventListener("mouseenter",()=>highlightLine(Number(node.dataset.index)));
    node.addEventListener("focus",()=>highlightLine(Number(node.dataset.index)));
    node.addEventListener("mouseleave",()=>highlightLine(-1));
    node.addEventListener("click",()=>openExperiment(Number(node.dataset.index)));
  });

  const points=LOCATIONS.map(l=>[l.style.left/100*1600,l.style.top/100*900]);
  document.getElementById("connectionLines").innerHTML=points.slice(0,-1).map((p,i)=>{
    const q=points[i+1];
    const mid=(p[0]+q[0])/2;
    return `<path data-line="${i}" d="M${p[0]} ${p[1]} C${mid} ${p[1]-100},${mid} ${q[1]+100},${q[0]} ${q[1]}"/>`;
  }).join("");
}

function highlightLine(index){
  document.querySelectorAll(".connection-lines path").forEach((path,i)=>path.classList.toggle("active-line",index===i||index===i+1));
}

map.addEventListener("pointermove",event=>{
  const rect=map.getBoundingClientRect();
  const x=(event.clientX-rect.left)/rect.width-.5;
  const y=(event.clientY-rect.top)/rect.height-.5;
  layer.style.transform=`translate(${x*-22}px,${y*-14}px) rotateX(${y*1.8}deg) rotateY(${x*-2.4}deg)`;
  document.querySelector(".contour-map").style.transform=`translate(${x*8}px,${y*5}px)`;
});
map.addEventListener("pointerleave",()=>{layer.style.transform="";document.querySelector(".contour-map").style.transform="";});

function openExperiment(index){
  selectedIndex=index;
  const location=LOCATIONS[index];
  activeMode=location.mode;
  currentValues={...location.metrics};
  document.getElementById("experimentIndex").textContent=`${location.number} / 05`;
  document.getElementById("experimentCategory").textContent=`${location.category} / ${MODES.find(m=>m.id===activeMode).label.substring(3)}`;
  document.getElementById("experimentTitle").textContent=location.name;
  document.getElementById("experimentDescription").textContent=location.description;
  document.getElementById("locationPreview").src=location.image;
  document.getElementById("motifPreview").src=location.motif;
  makeModeButtons();
  makeMetrics();
  resetAudio();
  experiment.classList.add("open");
  experiment.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  setTimeout(resizeCanvas,620);
}

function closeExperiment(){
  stopAudio();
  experiment.classList.remove("open");
  experiment.setAttribute("aria-hidden","true");
  document.body.style.overflow="";
}

function makeModeButtons(){
  const holder=document.getElementById("modeList");
  holder.innerHTML=MODES.map(mode=>`<button class="mode-button ${mode.id===activeMode?"active":""}" data-mode="${mode.id}">${mode.label}</button>`).join("");
  holder.querySelectorAll("button").forEach(button=>button.addEventListener("click",()=>{
    activeMode=button.dataset.mode;
    holder.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b===button));
    const modeName=MODES.find(m=>m.id===activeMode).label.substring(3);
    document.getElementById("modeCaption").textContent=modeName;
    document.getElementById("experimentCategory").textContent=`${LOCATIONS[selectedIndex].category} / ${modeName}`;
  }));
  document.getElementById("modeCaption").textContent=MODES.find(m=>m.id===activeMode).label.substring(3);
}

function makeMetrics(){
  const holder=document.getElementById("metricList");
  holder.innerHTML=METRICS.map(([key,label])=>`<div class="metric-row">
    <div class="metric-title"><label for="metric-${key}">${label}</label><span id="value-${key}">${currentValues[key]}</span></div>
    <input id="metric-${key}" data-key="${key}" type="range" min="0" max="100" value="${currentValues[key]}">
  </div>`).join("");
  holder.querySelectorAll("input").forEach(input=>input.addEventListener("input",()=>{
    currentValues[input.dataset.key]=Number(input.value);
    document.getElementById(`value-${input.dataset.key}`).textContent=input.value;
  }));
}

function resizeCanvas(){
  const rect=canvas.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.max(1,Math.floor(rect.width*dpr));
  canvas.height=Math.max(1,Math.floor(rect.height*dpr));
  canvas.getContext("2d").setTransform(dpr,0,0,dpr,0,0);
}

function getBands(time){
  let bass=.35+Math.sin(time*1.3)*.12;
  let mid=.4+Math.sin(time*2.1+1)*.14;
  let high=.3+Math.sin(time*4.3+2)*.12;
  if(analyser&&playing){
    const data=new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const average=(from,to)=>{let sum=0;for(let i=from;i<to;i++)sum+=data[i]||0;return sum/Math.max(1,to-from)/255;};
    bass=average(0,10);mid=average(10,38);high=average(38,data.length);
  }
  return {bass:Math.max(.05,bass),mid:Math.max(.05,mid),high:Math.max(.05,high),impact:clickImpact};
}

function clear(ctx,w,h){ctx.clearRect(0,0,w,h);ctx.fillStyle="#b9cff4";ctx.fillRect(0,0,w,h);}

function drawRoof(ctx,w,h,t,b){
  const rows=4+Math.round(currentValues.events/24);
  const cols=5+Math.round(currentValues.regularity/20);
  const gap=8+currentValues.high/14;
  const cellW=(w-90-(cols-1)*gap)/cols;
  const baseH=(h-120)/rows;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const wave=Math.sin(t*2+r*.7+c*.8+canvasPointer.x*3);
      const amp=18+b.bass*70+currentValues.volume*.35+b.impact*55;
      const peak=baseH*.25+amp*(.25+.5*(wave+1)/2);
      const x=45+c*(cellW+gap)+(r%2)*cellW*.12;
      const y=42+r*baseH;
      ctx.beginPath();ctx.moveTo(x,y+peak);ctx.lineTo(x+cellW/2,y);ctx.lineTo(x+cellW,y+peak);ctx.closePath();
      ctx.fillStyle=(c+r)%3===0?"#ff2418":"rgba(255,36,24,.78)";ctx.fill();
      if(currentValues.high>55){ctx.strokeStyle="#ff2418";ctx.lineWidth=1;ctx.stroke();}
    }
  }
}

function drawBrick(ctx,w,h,t,b){
  const rows=7+Math.round(currentValues.events/17);
  const cols=6+Math.round(currentValues.regularity/25);
  const gap=5+currentValues.high/25;
  const bh=(h-100)/rows-gap;
  const bw=(w-70)/cols-gap;
  for(let r=0;r<rows;r++){
    const shift=(r%2)*bw*.52+Math.sin(t*1.4+r*.8)*b.mid*35+(canvasPointer.x-.5)*40;
    for(let c=-1;c<cols+1;c++){
      const x=35+c*(bw+gap)+shift;
      const y=36+r*(bh+gap)+Math.sin(t*2+c)*b.high*4;
      ctx.fillStyle=(r+c)%5===0?"rgba(255,36,24,.42)":"#ff2418";
      ctx.fillRect(x,y,bw*(.78+currentValues.bass/450),bh);
    }
  }
}

function drawFold(ctx,w,h,t,b){
  const cols=6+Math.round(currentValues.regularity/18);
  const rows=4+Math.round(currentValues.events/30);
  const cw=(w-80)/cols;
  const ch=(h-100)/rows;
  const skew=18+(canvasPointer.x-.5)*55+b.bass*35;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if((r+c)%2!==0)continue;
      const x=40+c*cw;
      const y=40+r*ch;
      const breath=Math.sin(t*1.7+c*.9+r)*12*b.mid;
      ctx.beginPath();ctx.moveTo(x+skew/2,y-breath);ctx.lineTo(x+cw,y-12-breath);ctx.lineTo(x+cw-skew/2,y+ch+breath);ctx.lineTo(x,y+ch+12+breath);ctx.closePath();
      ctx.fillStyle=(c%2===0)?"#ff2418":"rgba(255,36,24,.7)";ctx.fill();
    }
  }
}

function drawPixel(ctx,w,h,t,b){
  const size=7+Math.round(currentValues.volume/24);
  const cols=Math.floor((w-80)/size);
  const baseY=h*.58;
  ctx.fillStyle="#ff2418";
  for(let c=0;c<cols;c++){
    const x=40+c*size;
    const phase=c/(cols-1)*Math.PI*8;
    const roof=Math.abs(((c%14)/13)*2-1);
    const y=baseY-roof*75-Math.sin(phase+t*2)*b.mid*22;
    ctx.fillRect(x,y,size-2,size-2);
    if((c+Math.floor(t*8))%Math.max(3,Math.round(11-currentValues.events/14))===0){
      const line=25+b.high*120;
      for(let py=y-line;py<y-12;py+=size*1.6)ctx.fillRect(x,py,size-2,size-2);
    }
    if(c%17===0){for(let py=y+18;py<y+40+b.bass*110;py+=size*1.55)ctx.fillRect(x,py,size-2,size-2);}
  }
  ctx.font=`${12+currentValues.high/8}px Arial`;ctx.fillText("빨간벽돌",20,28);ctx.textAlign="right";ctx.fillText("성수",w-20,28);ctx.textAlign="left";
}

function drawWater(ctx,w,h,t,b){
  const lines=5+Math.round(currentValues.events/25);
  const chars=11+Math.round(currentValues.regularity/12);
  const fontSize=Math.max(17,Math.min(34,w/chars*.48));
  ctx.font=`${fontSize}px serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#ff2418";
  for(let row=0;row<lines;row++){
    for(let i=0;i<chars;i++){
      const x=45+i*(w-90)/(chars-1);
      const wave=Math.sin(i*.82+t*(.8+b.high*2)+row*.75+canvasPointer.x*4);
      const y=65+row*(h-135)/Math.max(1,lines-1)+wave*(20+b.bass*34+b.impact*20);
      ctx.save();ctx.translate(x,y);ctx.rotate(wave*.12*b.mid);ctx.fillText("水",0,0);ctx.restore();
    }
  }
}

function animate(timestamp){
  const rect=canvas.getBoundingClientRect();
  if(rect.width&&rect.height){
    const ctx=canvas.getContext("2d");
    const t=timestamp/1000;
    const bands=getBands(t);
    clear(ctx,rect.width,rect.height);
    if(activeMode==="roof")drawRoof(ctx,rect.width,rect.height,t,bands);
    if(activeMode==="brick")drawBrick(ctx,rect.width,rect.height,t,bands);
    if(activeMode==="fold")drawFold(ctx,rect.width,rect.height,t,bands);
    if(activeMode==="pixel")drawPixel(ctx,rect.width,rect.height,t,bands);
    if(activeMode==="water")drawWater(ctx,rect.width,rect.height,t,bands);
    clickImpact*=.94;
    updateTime();
  }
  requestAnimationFrame(animate);
}

function ensureAudio(){
  if(!audioContext)audioContext=new(window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==="suspended")audioContext.resume();
}

function startSynth(){
  ensureAudio();stopSynth();
  analyser=audioContext.createAnalyser();analyser.fftSize=256;
  const master=audioContext.createGain();master.gain.value=.1;master.connect(analyser);analyser.connect(audioContext.destination);
  const location=LOCATIONS[selectedIndex];
  const osc=audioContext.createOscillator();osc.type=selectedIndex===3?"sawtooth":selectedIndex===4?"sine":"triangle";osc.frequency.value=55+location.metrics.bass*1.2;
  const og=audioContext.createGain();og.gain.value=.17;osc.connect(og).connect(master);osc.start();
  const buffer=audioContext.createBuffer(1,audioContext.sampleRate*2,audioContext.sampleRate);const data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(.1+location.metrics.high/500);
  const noise=audioContext.createBufferSource();noise.buffer=buffer;noise.loop=true;
  const filter=audioContext.createBiquadFilter();filter.type="bandpass";filter.frequency.value=280+location.metrics.high*35;filter.Q.value=1.2;
  noise.connect(filter).connect(master);noise.start();
  const lfo=audioContext.createOscillator();const lg=audioContext.createGain();lfo.frequency.value=.5+location.metrics.regularity/28;lg.gain.value=.08;lfo.connect(lg).connect(og.gain);lfo.start();
  synthNodes=[osc,noise,lfo,master,analyser];
}

function stopSynth(){synthNodes.forEach(node=>{try{if(node.stop)node.stop()}catch(e){}try{node.disconnect()}catch(e){}});synthNodes=[];}
function connectUploaded(){ensureAudio();if(!uploadedSource){uploadedSource=audioContext.createMediaElementSource(uploadedAudio);analyser=audioContext.createAnalyser();analyser.fftSize=256;uploadedSource.connect(analyser);analyser.connect(audioContext.destination);}}

function toggleAudio(){
  if(playing){if(uploadedUrl)uploadedAudio.pause();else stopSynth();elapsedPaused=getElapsed();playing=false;}
  else{if(uploadedUrl){connectUploaded();uploadedAudio.play();}else startSynth();startTime=performance.now()/1000;playing=true;}
  updatePlayButton();
}
function stopAudio(){stopSynth();uploadedAudio.pause();playing=false;elapsedPaused=0;updatePlayButton();}
function resetAudio(){stopAudio();uploadedAudio.currentTime=0;document.getElementById("uploadNote").textContent=uploadedUrl?"선택한 녹음 파일이 연결되어 있습니다.":"현재는 장소별 프로토타입 사운드가 재생됩니다.";}
function updatePlayButton(){document.getElementById("playButton").classList.toggle("playing",playing);document.getElementById("playIcon").textContent=playing?"Ⅱ":"▶";document.getElementById("playLabel").textContent=playing?"PAUSE SOUND":uploadedUrl?"PLAY FIELD RECORDING":"PLAY PROTOTYPE SOUND";}
function getElapsed(){return uploadedUrl?(uploadedAudio.currentTime||0):Math.min(60,elapsedPaused+(playing?performance.now()/1000-startTime:0));}
function formatTime(s){s=Math.max(0,Math.floor(s||0));return`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;}
function updateTime(){const elapsed=getElapsed();const duration=uploadedUrl&&Number.isFinite(uploadedAudio.duration)?uploadedAudio.duration:60;document.getElementById("timeCaption").textContent=`${formatTime(elapsed)} / ${formatTime(duration)}`;if(!uploadedUrl&&elapsed>=60&&playing)stopAudio();}

canvas.addEventListener("pointermove",event=>{const r=canvas.getBoundingClientRect();canvasPointer.x=(event.clientX-r.left)/r.width;canvasPointer.y=(event.clientY-r.top)/r.height;});
canvas.addEventListener("pointerdown",()=>{clickImpact=1;});
document.getElementById("closeButton").addEventListener("click",closeExperiment);
document.getElementById("playButton").addEventListener("click",toggleAudio);
document.getElementById("resetButton").addEventListener("click",()=>{currentValues={...LOCATIONS[selectedIndex].metrics};makeMetrics();});
document.getElementById("audioUpload").addEventListener("change",event=>{const file=event.target.files[0];if(!file)return;stopAudio();if(uploadedUrl)URL.revokeObjectURL(uploadedUrl);uploadedUrl=URL.createObjectURL(file);uploadedAudio.src=uploadedUrl;document.getElementById("uploadNote").textContent=`${file.name} 연결 완료`;updatePlayButton();});
uploadedAudio.addEventListener("ended",()=>{playing=false;updatePlayButton();});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&experiment.classList.contains("open"))closeExperiment();});
window.addEventListener("resize",resizeCanvas);

makeMap();
resizeCanvas();
requestAnimationFrame(animate);
