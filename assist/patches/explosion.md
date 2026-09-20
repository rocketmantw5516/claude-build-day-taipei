# explosion.md — fx.js inline + explosion/misfire (E1-E6) + optional haze (H1)

QA: applied ALONE to a fresh copy of engine.html (md5 3ed5e1bc…) -> assist/trial/engine-explosion.html: `qa.sh --all` = PROBLEMS 0 (load) + PROBLEMS 0 (interact), 61 fps. Combined with audio.md (engine-both.html): --all 0 problems on 3ed5e1bc…; load-mode re-run with both patch sets on the newest engine.html (19:01): PROBLEMS 0, 61 fps.
Anchors verified (each OLD occurs exactly once) against engine.html md5 7dc997e491f32af8779ccc0221321247 (103622 bytes, mtime Sep 20 18:58:30 2026) at 19:01. NOTE: engine.html changed at ~19:00 from md5 3ed5e1bc…; anchors were re-verified on the new file by assist/trial/gen.py (asserts count==1 for every OLD, before and after earlier pairs).
Apply pairs in order E1..E6, then H1 if wanted. Independent of audio.md; either file may go first (both kit pastes use the same anchor, which stays unique). OLD/NEW blocks are exact; a trailing newline after each block is not part of the string except where a line break is shown inside the block. Regenerate/verify any time: `python3 assist/trial/gen.py`. Rollback: keep `cp engine.html /tmp/engine.pre-explosion.html`.

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

