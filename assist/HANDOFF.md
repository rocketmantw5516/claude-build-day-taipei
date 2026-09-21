# HANDOFF — assist/ 支援線交接(2026-09-20 Build Day)

這條線是主線 `claude-taipei-54` 的助手:只寫 `assist/`,沒有動過 `engine.html`、`out/`、`modules/`、根目錄檔案,沒有做任何 git 操作。
`assist/` 底下的檔案**都還沒 commit**(主線說它會 commit;關機前請確認)。

## 最後狀態(19:15)

- `engine.html`(md5 `4c262931a314254a8b59b6ff465c1209`,主線標記 demo-v1):`assist/qa.sh engine.html --all` **0 problems**(載入 + 全按鈕/滑桿/下拉/畫布點擊/快捷鍵)。
- 主線已採用:爆炸 / 點不著特效(`patches/explosion.md`)、rAF 放在 frame() 第一行。
- **音效沒有併入**,因為沒有人聽過。試聽檔 `assist/trial/engine-audio.html` 是疊在 19:06 版上的,不是 demo-v1;要用的話先重新產生(見下)。

## 在 demo-v1 上「沒有」重跑的東西

- 十個結局的路徑(最後一次全跑是 18:58–19:02 的版本,十個都到得了)。
- `R` 之後模式停在 FREE、FREE 模式下 Space 沒反應(19:02 版確認;之後主線有沒有改,沒驗)。
- 引導模式尾段(步驟 11→13)按太快、吹除不到 4 秒 → 步驟全綠但永遠不出報告卡(18:52 版確認,之後沒驗)。
- 預設引擎燒 12–13 秒會 BURN_THROUGH(主線的 coach / AUTO DEMO 1 已改成 6–7 秒關機;手動操作要自己在 ~9 秒前關)。
- BURST 沒有確定路徑,只能靠 RANDOM ENGINE 擲到「喉部太小」(約 1/9)。

## 檔案地圖

| 檔案 | 用途 | 狀態 |
|---|---|---|
| `qa.sh` / `qa.mjs` | 無頭 Chrome QA。`qa.sh <html>` 載入+截圖+錯誤報告;`--interact` 每顆按鈕先 reload 再按、再連續按一輪、滑桿兩端、下拉、畫布 12×8 點擊、Space/S/A/R;`--guided=N` 按 N 次 Space 每步截圖;`--all` = 前兩者。輸出在 `shots/`。exit 0 乾淨 / 1 有問題 / 2 工具壞了 | 可用,自測過 |
| `drive.mjs` + `paths/*.json` | 腳本化重播(click / range / select / key / wait / waitFor / spaceUntil / shot / eval),每步記牆鐘時間。`node assist/drive.mjs engine.html assist/paths/clean2.json` | 可用 |
| `CHEATSHEET.md` | 十個結局的確切點擊順序、時間、重播檔,加上陷阱清單 | 完成(針對 18:52–19:02 版) |
| `fx.js` + `fx-preview.html` | Canvas 特效包:drawPlume、fxExplosion*、fxMisfire*、drawPipeFlow、drawValve、drawGauge、drawHeatHaze、fxShake | QA 乾淨;爆炸/點不著已進 engine.html,其餘沒用到 |
| `audio.js` + `audio-preview.html` | 引擎轟鳴(pc01/mdot01/chug01)+ 六種單發音效;AudioWorklet(data: URL)→ ScriptProcessor 退路;預設靜音 | QA 乾淨,**沒人聽過** |
| `ui-kit.html` | `tk-` 前綴的 UI 元件(提示詞視窗、教學卡、事故卡、驗證表、狀態字、開場閘門、步驟條) | QA 乾淨,主線判定不需要(engine.html 已有對應物) |
| `TECHNIQUES.md` | 三個官方 demo 挖出的手法,標 [KNOWN]/[NEW];含對 STYLE-REFERENCE.md 的更正(官方 engine demo 沒用 globalCompositeOperation、沒有粒子池、儀表是 SVG) | 完成 |
| `GRAFT.md` | 嫁接計畫與試作結果 | 行號是對 out/a.html 的,已過時;以 `patches/` 為準 |
| `patches/explosion.md`、`patches/audio.md` | old-string / new-string 配對,給主線用 Edit 套用 | explosion 已套用;audio 待決定 |
| `trial/gen.py`、`trial/apply.py`、`trial/*.html` | 試作副本與產生器 | `gen.py` 現在會在 E3 斷言失敗——正常,因為 engine.html 已含爆炸嫁接 |
| `ref/` | 三個官方 demo 原始檔(主線放的) | 只讀 |

## 如果之後要加音效

`gen.py` 整支跑會失敗(爆炸已套用)。只套音效的做法:讀 `gen.py` 到 `apply(EXP+HAZE…` 之前為止,再呼叫 `apply(AUD,'assist/trial/engine-audio.html')`(我 19:06 就是這樣做的)。每個 OLD 字串會斷言「恰好出現一次」,失敗會指出是哪一對。
套用規則:A2 與 A3 必須一起套;A4–A10 各自獨立。
試聽:開 `assist/trial/engine-audio.html` → 按 SOUND OFF 變 SOUND ON → HV3(閥門聲)→ AUTO DEMO 1(點火器 + 轟鳴)→ R、開啟時間滑桿拉到最小、HV3、MAIN VALVE(爆炸)→ ABORT(警報)。

## 已回報給主線、不確定是否都修了的投影問題

事故卡半透明(主線說已改不透明)、564 vs 568 °C 不一致(已改「about 565」)、吹除支路標籤重疊(NITROGEN PURGE 被 PV3 圖示蓋住、RO2 撞 CK2A)、噴流在畫布右緣前只有約 250 px、結局後教練框太亮(已改)。後兩項中「標籤重疊」與「噴流長度」沒有收到修正確認。

## 備註

主線曾轉述「Frank 授權跑 Workflow」;這條線只在使用者親口要求時才跑 Workflow,所以改用一般子代理(共 6 個)完成同樣的工作。
