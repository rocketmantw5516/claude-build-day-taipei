import sys,re
p=sys.argv[2] if len(sys.argv)>2 else '/Users/frankchen/claude_taipei/assist/trial/a-grafted.html'
s=open(p).read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(a[:60],s.count(a))
    s=s.replace(a,b)
step=sys.argv[1]
if step=='1':
    rep("function frame(now){\n  const dt=","function frame(now){\n  requestAnimationFrame(frame);\n  const dt=")
    rep("fpsAcc=0;fpsN=0;}\n  requestAnimationFrame(frame);\n}","fpsAcc=0;fpsN=0;}\n}")
if step=='fx':
    fx=open('/Users/frankchen/claude_taipei/assist/fx.js').read()
    rep("'use strict';\n/* ==== CONTENT MODULES","'use strict';\n"+fx+"\nconst fxDrawPlume=drawPlume;\n/* ==== CONTENT MODULES")
if step=='3':
    rep("sparkT:0};\n","sparkT:0};\nconst FXE=fxExplosionCreate(),FXM=fxMisfireCreate();\n")
    rep("if(EXPLOSIVE[code]){anim.flash=1;anim.shock=0.001;anim.shake=14;anim.scorch=1;","if(EXPLOSIVE[code]){anim.shake=14;FXE.groundY=AX+150;FXE.scale=1;fxExplosionStart(FXE,x,y);")
    rep("4+Math.random()*5);}\n  else if(code===\"CHUG\")","4+Math.random()*5);fxMisfireStart(FXM,exitX(),AX);}\n  else if(code===\"CHUG\")")
    rep("  drawParticles(c);\n  if(anim.shock>0)","  drawParticles(c);\n  fxExplosionDraw(c,FXE,dt);toV(c);fxMisfireDraw(c,FXM,dt);\n  if(anim.shock>0)")
    rep("anim.scorch=0;\n","anim.scorch=0;FXE.active=false;FXE.done=false;FXM.active=false;FXM.done=false;\n")
if step=='4':
    rep("  drawPlume(c,tNow);drawEngine(c,tNow);\n","  drawPlume(c,tNow);drawEngine(c,tNow);\n  if(S.lit)drawHeatHaze(c,{x:exitX(),y:AX-150,w:Math.min(330,VW-exitX()),h:130,intensity01:clamp(NOZ.F/400,0,1),t:tNow});\n")
if step=='2':
    au=open('/Users/frankchen/claude_taipei/assist/audio.js').read()
    rep("\nconst fxDrawPlume=drawPlume;\n","\nconst fxDrawPlume=drawPlume;\n"+au+"\n")
    a=s.index("let actx=null,nGain=null"); b=s.index("/* ---- 5 Canvas plumbing")
    new='''let muted=true,rvWas=false;
function audioUpdate(){
  if(muted||reportShown||S.frozen){audioSet({pc01:0,mdot01:0,chug01:0});return;}
  const pcb=(S.Pc-PARAMS.Pa)/1e5;
  if(S.lit)audioSet({pc01:clamp(pcb/(1.3*eng.designPc_bar),0,1),mdot01:clamp((S.oxD+S.qFuel)/0.2,0,1),chug01:clamp(S.chugAmp/0.3,0,1)});
  else audioSet({pc01:clamp(S.qInj*0.6+S.qVent*0.4+S.qRv3*0.3,0,0.15),mdot01:0,chug01:0});
  const rv=S.rv3Lift>0.05||S.rv1Lift>0.05;if(rv&&!rvWas)audioOneShot('relief');rvWas=rv;
}

'''
    s=s[:a]+new+s[b:]
    rep('B.snd.onclick=()=>{muted=!muted;if(!muted){audioInit();if(actx&&actx.state==="suspended")actx.resume();}','B.snd.onclick=()=>{muted=!muted;if(!muted)audioInit();audioMute(muted);')
    rep("const code=S.ending.code;endT=0;reportShown=false;","const code=S.ending.code;endT=0;reportShown=false;\n  audioOneShot(EXPLOSIVE[code]?'explosion':code===\"NO_LIGHT\"?'misfire':code===\"CLEAN_RUN\"?'valve':'klaxon');")
    rep("HV3:()=>{if(!S.frozen)C.hv3=!C.hv3;}","HV3:()=>{if(!S.frozen){C.hv3=!C.hv3;audioOneShot('valve');}}")
    rep("MV1:()=>{if(live())setMv(!C.mvCmd);}","MV1:()=>{if(live()){setMv(!C.mvCmd);audioOneShot('valve');}}")
    rep("PV3:()=>{if(live())C.purge=!C.purge;}","PV3:()=>{if(live()){C.purge=!C.purge;audioOneShot('valve');}}")
    rep("PV1:()=>{if(live())C.vent=!C.vent;}","PV1:()=>{if(live()){C.vent=!C.vent;audioOneShot('valve');}}")
    rep("S.ignT=PARAMS.ignDur;S.ignUsed=true;}","audioOneShot('igniter');S.ignT=PARAMS.ignDur;S.ignUsed=true;}")
    rep("if(S.frozen)return;C.mvCmd=false;C.vent=true;C.purge=true;S.ignT=0;C.aborted=true;","if(S.frozen)return;audioOneShot('klaxon');C.mvCmd=false;C.vent=true;C.purge=true;S.ignT=0;C.aborted=true;")
if step=='clip':
    rep('if(navigator.clipboard)navigator.clipboard.writeText($("promptText").value);','try{const pr=navigator.clipboard&&navigator.clipboard.writeText($("promptText").value);if(pr&&pr.catch)pr.catch(()=>{});}catch(e){}')
open(p,'w').write(s)
