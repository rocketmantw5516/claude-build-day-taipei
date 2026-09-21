import sys
R='/Users/frankchen/claude_taipei/'
src=open(R+'engine.html').read()
ANCH="/* ==== CONTENT MODULES"
a=src.index("let actx=null,nGain=null"); b=src.index("/* ---- 5 Canvas plumbing")
OLDAUDIO=src[a:b]
NEWAUDIO='''let muted=true,rvWas=false;
function audioUpdate(){
  if(muted||reportShown||S.frozen){audioSet({pc01:0,mdot01:0,chug01:0});return;}
  const pcb=(S.Pc-PARAMS.Pa)/1e5;
  if(S.lit)audioSet({pc01:clamp(pcb/(1.3*eng.designPc_bar),0,1),mdot01:clamp((S.oxD+S.qFuel)/0.2,0,1),chug01:clamp(S.chugAmp/0.3,0,1)});
  else audioSet({pc01:clamp(S.qInj*0.6+S.qVent*0.4+S.qRv3*0.3,0,0.15),mdot01:0,chug01:0});
  const rv=S.rv3Lift>0.05||S.rv1Lift>0.05;if(rv&&!rvWas)audioOneShot('relief');rvWas=rv;
}

'''
EXP=[
("E1 paste fx.js (KIT INSERT: put the FULL contents of assist/fx.js, unmodified, immediately BEFORE this anchor line; the anchor itself stays)",ANCH,("KIT","fx.js")),
("E2 effect state objects","sparkT:0};\n","sparkT:0};\nconst FXE=fxExplosionCreate(),FXM=fxMisfireCreate();\n"),
("E3 start explosion in startEnding() (kit draws its own flash, shock ring, scorch)","if(EXPLOSIVE[code]){anim.flash=1;anim.shock=0.001;anim.shake=14;anim.scorch=1;","if(EXPLOSIVE[code]){anim.shake=14;FXE.groundY=AX+150;FXE.scale=1;fxExplosionStart(FXE,x,y);"),
("E4 start misfire on NO_LIGHT","4+Math.random()*5);}\n  else if(code===\"CHUG\")","4+Math.random()*5);fxMisfireStart(FXM,exitX(),AX);}\n  else if(code===\"CHUG\")"),
("E5 draw both in drawStand() (inside toV, virtual units, real dt)","  drawParticles(c);\n  if(anim.shock>0)","  drawParticles(c);\n  fxExplosionDraw(c,FXE,dt);toV(c);fxMisfireDraw(c,FXM,dt);\n  if(anim.shock>0)"),
("E6 clear in reset()","anim.scorch=0;\n","anim.scorch=0;FXE.active=false;FXE.done=false;FXM.active=false;FXM.done=false;\n"),
]
HAZE=[("H1 OPTIONAL heat haze over the plume (needs E1; skip freely)","  drawPlume(c,tNow);drawEngine(c,tNow);\n","  drawPlume(c,tNow);drawEngine(c,tNow);\n  if(S.lit)drawHeatHaze(c,{x:exitX(),y:AX-150,w:Math.min(330,VW-exitX()),h:130,intensity01:clamp(NOZ.F/400,0,1),t:tNow});\n")]
AUD=[
("A1 paste audio.js (KIT INSERT: put the FULL contents of assist/audio.js, unmodified, immediately BEFORE this anchor line; the anchor itself stays)",ANCH,("KIT","audio.js")),
("A2 replace the old boot-local audio block (old audioInit shadowed the kit's; it must go)",OLDAUDIO,NEWAUDIO),
("A3 SOUND button handler",'B.snd.onclick=()=>{muted=!muted;if(!muted){audioInit();if(actx&&actx.state==="suspended")actx.resume();}','B.snd.onclick=()=>{muted=!muted;if(!muted)audioInit();audioMute(muted);'),
("A4 ending one-shot in startEnding()","const code=S.ending.code;endT=0;reportShown=false;","const code=S.ending.code;endT=0;reportShown=false;\n  audioOneShot(EXPLOSIVE[code]?'explosion':code===\"NO_LIGHT\"?'misfire':code===\"CLEAN_RUN\"?'valve':'klaxon');"),
("A5 valve click HV3","HV3:()=>{if(!S.frozen)C.hv3=!C.hv3;}","HV3:()=>{if(!S.frozen){C.hv3=!C.hv3;audioOneShot('valve');}}"),
("A6 valve click MV1","MV1:()=>{if(live())setMv(!C.mvCmd);}","MV1:()=>{if(live()){setMv(!C.mvCmd);audioOneShot('valve');}}"),
("A7 valve click PV3","PV3:()=>{if(live())C.purge=!C.purge;}","PV3:()=>{if(live()){C.purge=!C.purge;audioOneShot('valve');}}"),
("A8 valve click PV1","PV1:()=>{if(live())C.vent=!C.vent;}","PV1:()=>{if(live()){C.vent=!C.vent;audioOneShot('valve');}}"),
("A9 igniter one-shot","S.ignT=PARAMS.ignDur;S.ignUsed=true;}","audioOneShot('igniter');S.ignT=PARAMS.ignDur;S.ignUsed=true;}"),
("A10 abort klaxon","if(S.frozen)return;C.mvCmd=false;C.vent=true;C.purge=true;S.ignT=0;C.aborted=true;","if(S.frozen)return;audioOneShot('klaxon');C.mvCmd=false;C.vent=true;C.purge=true;S.ignT=0;C.aborted=true;"),
]
def apply(pairs,out):
    s=src
    for h,o,n in pairs:
        assert src.count(o)==1,(h,src.count(o))
        assert s.count(o)==1,(h,'after earlier edits',s.count(o))
        if isinstance(n,tuple): n=open(R+'assist/'+n[1]).read()+"\n"+o
        s=s.replace(o,n)
    open(R+out,'w').write(s)
def md(pairs):
    t=''
    for h,o,n in pairs:
        if isinstance(n,tuple): n="<FULL CONTENTS OF assist/%s>\n%s"%(n[1],o)
        t+="## %s\n\nOLD:\n```\n%s\n```\nNEW:\n```\n%s\n```\n\n"%(h,o.rstrip('\n'),n.rstrip('\n'))
    return t
apply(EXP+HAZE,'assist/trial/engine-explosion.html')
apply(AUD,'assist/trial/engine-audio.html')
apply(EXP+HAZE+AUD,'assist/trial/engine-both.html')
apply(AUD+EXP+HAZE,'assist/trial/engine-both-rev.html')
open(R+'assist/trial/_exp.md','w').write(md(EXP)+"# OPTIONAL LAST PAIR — heat haze (independent of E2-E6, needs E1)\n\n"+md(HAZE))
open(R+'assist/trial/_aud.md','w').write(md(AUD))
print('ok')
