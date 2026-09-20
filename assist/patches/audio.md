# audio.md — audio.js inline + graft 2 (A1-A10)

QA: applied ALONE to a fresh copy of engine.html (md5 3ed5e1bc…) -> assist/trial/engine-audio.html: `qa.sh --all` = PROBLEMS 0 (load) + PROBLEMS 0 (interact), 61 fps. Sound itself is not audible headless: listen once after applying (SOUND ON, guided run with SPACE).
Anchors verified (each OLD occurs exactly once) against engine.html md5 7dc997e491f32af8779ccc0221321247 (103622 bytes, mtime Sep 20 18:58:30 2026) at 19:01. NOTE: engine.html changed at ~19:00 from md5 3ed5e1bc…; anchors were re-verified on the new file by assist/trial/gen.py (asserts count==1 for every OLD, before and after earlier pairs).
Apply A1 first, then A2 and A3 TOGETHER (between them the page has no audioInit conflict but A3's old handler references actx, which A2 removes — do not stop between A2 and A3). A4-A10 are independent one-liners; any subset is safe. Rollback: `cp engine.html /tmp/engine.pre-audio.html` first.

## A1 paste audio.js (KIT INSERT: put the FULL contents of assist/audio.js, unmodified, immediately BEFORE this anchor line; the anchor itself stays)

OLD:
```
/* ==== CONTENT MODULES
```
NEW:
```
<FULL CONTENTS OF assist/audio.js>
/* ==== CONTENT MODULES
```

## A2 replace the old boot-local audio block (old audioInit shadowed the kit's; it must go)

OLD:
```
let actx=null,nGain=null,lp=null,oGain=null,muted=true;
function audioInit(){
  if(actx)return; const AC=window.AudioContext||window.webkitAudioContext; if(!AC)return;
  actx=new AC(); const buf=actx.createBuffer(1,actx.sampleRate*2,actx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const src=actx.createBufferSource();src.buffer=buf;src.loop=true;
  lp=actx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=300;
  nGain=actx.createGain();nGain.gain.value=0; src.connect(lp);lp.connect(nGain);nGain.connect(actx.destination);src.start();
  const osc=actx.createOscillator();osc.type="sawtooth";osc.frequency.value=46;oGain=actx.createGain();oGain.gain.value=0;
  osc.connect(oGain);oGain.connect(lp);osc.start();
}
function audioUpdate(){
  if(!actx)return; const t=actx.currentTime; let lvl=0,rum=0,fc=300;
  if(!muted&&!reportShown){
    if(S.ending&&EXPLOSIVE[S.ending.code]){lvl=Math.max(0,1-endT/1.6)*0.9;fc=160;}
    else if(!S.frozen){const pc=(S.Pc-PARAMS.Pa)/1e5; if(S.lit){lvl=clamp(0.12+pc/18,0,0.75);rum=clamp(pc/25+S.chugAmp,0,0.6);fc=350+pc*140;} else {lvl=clamp(S.qInj*1.5+S.qVent*0.8+S.qRv3*0.6,0,0.35);fc=2500;}}
  }
  nGain.gain.setTargetAtTime(lvl,t,0.04);oGain.gain.setTargetAtTime(rum,t,0.05);lp.frequency.setTargetAtTime(fc,t,0.05);
}
```
NEW:
```
let muted=true,rvWas=false;
function audioUpdate(){
  if(muted||reportShown||S.frozen){audioSet({pc01:0,mdot01:0,chug01:0});return;}
  const pcb=(S.Pc-PARAMS.Pa)/1e5;
  if(S.lit)audioSet({pc01:clamp(pcb/(1.3*eng.designPc_bar),0,1),mdot01:clamp((S.oxD+S.qFuel)/0.2,0,1),chug01:clamp(S.chugAmp/0.3,0,1)});
  else audioSet({pc01:clamp(S.qInj*0.6+S.qVent*0.4+S.qRv3*0.3,0,0.15),mdot01:0,chug01:0});
  const rv=S.rv3Lift>0.05||S.rv1Lift>0.05;if(rv&&!rvWas)audioOneShot('relief');rvWas=rv;
}
```

## A3 SOUND button handler

OLD:
```
B.snd.onclick=()=>{muted=!muted;if(!muted){audioInit();if(actx&&actx.state==="suspended")actx.resume();}
```
NEW:
```
B.snd.onclick=()=>{muted=!muted;if(!muted)audioInit();audioMute(muted);
```

## A4 ending one-shot in startEnding()

OLD:
```
const code=S.ending.code;endT=0;reportShown=false;
```
NEW:
```
const code=S.ending.code;endT=0;reportShown=false;
  audioOneShot(EXPLOSIVE[code]?'explosion':code==="NO_LIGHT"?'misfire':code==="CLEAN_RUN"?'valve':'klaxon');
```

## A5 valve click HV3

OLD:
```
HV3:()=>{if(!S.frozen)C.hv3=!C.hv3;}
```
NEW:
```
HV3:()=>{if(!S.frozen){C.hv3=!C.hv3;audioOneShot('valve');}}
```

## A6 valve click MV1

OLD:
```
MV1:()=>{if(live())setMv(!C.mvCmd);}
```
NEW:
```
MV1:()=>{if(live()){setMv(!C.mvCmd);audioOneShot('valve');}}
```

## A7 valve click PV3

OLD:
```
PV3:()=>{if(live())C.purge=!C.purge;}
```
NEW:
```
PV3:()=>{if(live()){C.purge=!C.purge;audioOneShot('valve');}}
```

## A8 valve click PV1

OLD:
```
PV1:()=>{if(live())C.vent=!C.vent;}
```
NEW:
```
PV1:()=>{if(live()){C.vent=!C.vent;audioOneShot('valve');}}
```

## A9 igniter one-shot

OLD:
```
S.ignT=PARAMS.ignDur;S.ignUsed=true;}
```
NEW:
```
audioOneShot('igniter');S.ignT=PARAMS.ignDur;S.ignUsed=true;}
```

## A10 abort klaxon

OLD:
```
if(S.frozen)return;C.mvCmd=false;C.vent=true;C.purge=true;S.ignT=0;C.aborted=true;
```
NEW:
```
if(S.frozen)return;audioOneShot('klaxon');C.mvCmd=false;C.vent=true;C.purge=true;S.ignT=0;C.aborted=true;
```

