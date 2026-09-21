## E1 paste fx.js (KIT INSERT: put the FULL contents of assist/fx.js, unmodified, immediately BEFORE this anchor line; the anchor itself stays)

OLD:
```
/* ==== CONTENT MODULES
```
NEW:
```
<FULL CONTENTS OF assist/fx.js>
/* ==== CONTENT MODULES
```

## E2 effect state objects

OLD:
```
sparkT:0};
```
NEW:
```
sparkT:0};
const FXE=fxExplosionCreate(),FXM=fxMisfireCreate();
```

## E3 start explosion in startEnding() (kit draws its own flash, shock ring, scorch)

OLD:
```
if(EXPLOSIVE[code]){anim.flash=1;anim.shock=0.001;anim.shake=14;anim.scorch=1;
```
NEW:
```
if(EXPLOSIVE[code]){anim.shake=14;FXE.groundY=AX+150;FXE.scale=1;fxExplosionStart(FXE,x,y);
```

## E4 start misfire on NO_LIGHT

OLD:
```
4+Math.random()*5);}
  else if(code==="CHUG")
```
NEW:
```
4+Math.random()*5);fxMisfireStart(FXM,exitX(),AX);}
  else if(code==="CHUG")
```

## E5 draw both in drawStand() (inside toV, virtual units, real dt)

OLD:
```
  drawParticles(c);
  if(anim.shock>0)
```
NEW:
```
  drawParticles(c);
  fxExplosionDraw(c,FXE,dt);toV(c);fxMisfireDraw(c,FXM,dt);
  if(anim.shock>0)
```

## E6 clear in reset()

OLD:
```
anim.scorch=0;
```
NEW:
```
anim.scorch=0;FXE.active=false;FXE.done=false;FXM.active=false;FXM.done=false;
```

# OPTIONAL LAST PAIR — heat haze (independent of E2-E6, needs E1)

## H1 OPTIONAL heat haze over the plume (needs E1; skip freely)

OLD:
```
  drawPlume(c,tNow);drawEngine(c,tNow);
```
NEW:
```
  drawPlume(c,tNow);drawEngine(c,tNow);
  if(S.lit)drawHeatHaze(c,{x:exitX(),y:AX-150,w:Math.min(330,VW-exitX()),h:130,intensity01:clamp(NOZ.F/400,0,1),t:tNow});
```

