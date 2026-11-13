# fpl-gw — Skill review

## Follow-up fixes — 2026-11-13

ตรวจต่อจาก `530d0f2` และแก้ findings โดยไม่เปลี่ยนสูตร projection:

- `metadata.tags` ใช้ string ตาม Agent Skills spec
- `--minutes` แยกค่าจาก colon ตัวสุดท้าย รองรับ `Name:CLUB:minutes` และปฏิเสธค่าที่ไม่ใช่ตัวเลขหรืออยู่นอก 0–90
- DGW ยังไม่รองรับ แต่ตรวจทุกผู้เล่นใน pool รวม bench/targets ทุก GW ที่ขอก่อนแสดง forecast แล้วหยุดด้วย error ที่อธิบายข้อจำกัด แทนการแสดง 0/partial total หรือ crash ใน simulation
- `news.js` เรียง fixture ที่ไม่มี kickoff ไปท้ายตาราง แสดง `TBC` และแสดงข่าวผู้เล่นต่อได้
- Reports ทั้งสี่แยก `generated` จาก Data sources ราย endpoint: network ใช้ `fetched`; cache แสดงเวลาไฟล์พร้อม `retrieval time unverified` โดยไม่เดาเวลาที่ดึงจริง
- เพิ่ม offline regression tests: suite ผ่าน 20/20 รวม tests เดิม 14 ข้อ; timestamps ฝั่ง network ทดสอบด้วย HTTP stub ไม่ใช่ live API

Findings 1–3 ในรายงานเดิมด้านล่างเป็นประวัติก่อนแก้; DGW model, live API และ calibration ยังไม่ได้รับการยืนยันในรอบนี้

ตรวจวันที่ **2026-11-08** · baseline [`02b5f91`](https://github.com/encryptedarc/fpl/commit/02b5f91) · ขอบเขต: skill, command, references, templates และ JavaScript ทั้ง 6 ไฟล์

**ผล: ควรแก้ 3 จุดก่อนใช้เป็นตัวช่วยตัดสินใจช่วง deadline หรือ Double Gameweek** โครงสร้าง skill แบ่ง intent กับ references ชัดเจน และให้ vault เป็น source of truth แต่ผลจาก scripts ยังมีกรณีที่หยุดทำงานหรือแสดงความสดของข้อมูลคลาดเคลื่อน

## Findings

### 1. [P1] DGW ทำให้ simulation หยุดทำงาน และตารางแสดงค่าที่ไม่รองรับเป็น 0

ตำแหน่ง: [projection.js:52](plugins/fpl-gw/skills/fpl-gw/scripts/projection.js#L52), [projection.js:92](plugins/fpl-gw/skills/fpl-gw/scripts/projection.js#L92), [projection.js:138](plugins/fpl-gw/skills/fpl-gw/scripts/projection.js#L138)

เมื่อทีมมีมากกว่า 1 fixture ใน GW ฟังก์ชัน `project()` คืนเพียง `{ double: true }` ตารางแสดง `DGW — not modelled` พร้อม xPts 0 แต่ `simulate()` ไม่ตรวจ `double` และอ่าน `r.mins.length` จึงจบด้วย exit code 1 หากมีผู้เล่น DGW ใน XI หรือ bench ส่วน captain comparison ยังเสี่ยงได้ `NaN` เมื่อใช้ `.x` ที่ไม่มีอยู่

**ยืนยันด้วยข้อมูลจำลอง:** ผู้เล่น 1 คน, 2 fixtures ใน GW11, `--xi Tester --sims 2` ได้ `Cannot read properties of undefined (reading 'length')` หลังแสดงแถว DGW

**แนวทางแก้:** ก่อนรองรับ DGW เต็มรูปแบบ ให้หยุดอย่างชัดเจนก่อนแสดง total/simulation และใช้ `N/A` แทน 0 สำหรับค่าที่ไม่รองรับ หากจะรองรับ ให้รวม projection ของแต่ละ fixture และใช้ appearances ทั้ง GW สำหรับ captain/auto-sub

### 2. [P2] Fixture ที่ kickoff time เป็น null ทำให้ข่าวทั้งชุดไม่แสดง

ตำแหน่ง: [news.js:17](plugins/fpl-gw/skills/fpl-gw/scripts/news.js#L17)

การ sort เรียก `a.kickoff_time.localeCompare(...)` โดยตรง เมื่อ fixture ยังไม่กำหนดเวลาและค่าเป็น `null` จะหยุดก่อนแสดง squad status ทำให้คำขอเช็กข่าวไม่ได้ข้อมูลผู้เล่นด้วย แม้ข่าวใน bootstrap จะยังใช้ได้

**ยืนยันด้วยข้อมูลจำลอง:** fixtures 2 รายการ โดยรายการหนึ่งมี `kickoff_time: null` ได้ exit code 1 และ `Cannot read properties of null (reading 'localeCompare')`

**แนวทางแก้:** แยก fixtures ที่ยังไม่มีเวลาไปท้ายตารางและแสดง `TBC`; ไม่ส่ง null เข้า formatter และให้ squad status แสดงต่อได้

### 3. [P2] ข้อมูล cache ถูกอ้างว่า fetched ณ เวลารัน

ตำแหน่ง: [lib/fpl.js:27–32](plugins/fpl-gw/skills/fpl-gw/scripts/lib/fpl.js#L27), [news.js:13](plugins/fpl-gw/skills/fpl-gw/scripts/news.js#L13), [projection.js:127](plugins/fpl-gw/skills/fpl-gw/scripts/projection.js#L127)

`getJSON()` คืน JSON จาก cache โดยไม่แนบเวลาที่ดึงจริง แต่ scripts พิมพ์ `fetched ${F.fmtUTC()}` ซึ่งเป็นเวลารัน bootstrap ใช้ cache ได้ 30 นาที, fixtures/history 60 นาที และ live ระหว่าง GW 10 นาที เมื่อ skill ให้คัดลอก source line ลงโน้ต ข้อมูลเก่าจึงถูกบันทึกเสมือนเพิ่งดึงมา รวมถึงข่าวใกล้ deadline

**ยืนยันด้วยข้อมูลจำลอง:** ตั้ง cache bootstrap ให้มีอายุ 20 นาทีและปิด network; helper คืน cache ได้ ขณะที่ news output ใช้ timestamp ปัจจุบัน

**แนวทางแก้:** เก็บ `fetchedAt` ของแต่ละ endpoint พร้อม payload แล้วส่ง metadata ให้ output แยก `generated at` กับ `data fetched at` และให้คำขอข่าวใกล้ deadline ใช้ refresh ตามความเหมาะสม

## สิ่งที่ควรรักษา

- แยก references ตาม news / transfer / captain / matchup / projection / lock-close ช่วยจำกัด context ของแต่ละงาน
- บังคับอ่าน `CLAUDE.md`, squad และ lessons ก่อนเสนอแผน พร้อมใช้ `unknown` เมื่อไม่มีหลักฐาน
- Lock ต้องมีการยืนยันจากผู้ใช้ และการแก้ closed GW ต้องมีหลักฐานพร้อม correction
- Scripts ใช้ Node built-ins และ starter vault ใช้ season placeholders; การรัน scaffold ซ้ำเก็บไฟล์เดิมไว้

## Verification

ใช้ Node.js **v24.14.1** บน Windows กับ scratch directory นอก vault ของผู้ใช้

| ตรวจ | ผล |
|---|---|
| `node --check` ทั้ง 6 JavaScript files | ผ่าน |
| สร้าง starter vault season 2026-27 | ผ่าน |
| รัน scaffold ซ้ำหลังใส่ squad | ผ่าน — ไม่ทับ squad เดิม |
| DGW simulation reproduction | ยืนยัน failure ตาม finding 1 |
| Null kickoff reproduction | ยืนยัน failure ตาม finding 2 |
| Cache timestamp reproduction | ยืนยัน finding 3 |

เป็นการทดสอบแบบ offline ด้วย fixtures จำลอง ยังไม่ได้ทดสอบ plugin installation ใน Claude Code, live FPL API, scoring rules ของ season จริง, calibration ของโมเดล หรือทุก combination ของ auto-subs/chips ผล syntax check ไม่ได้ยืนยันความถูกต้องของ projection

## เอกสารและโลโก้ในรอบนี้

ปรับ README เป็นคู่มือภาษาไทย: เริ่มจากประโยชน์และ Quick start ตามด้วยตัวอย่างคำถาม, workflow, โครงสร้าง vault, คำสั่งที่รันจาก repo root และข้อจำกัดที่ตรงกับ implementation ไม่แก้ logic ของ skill/scripts

โลโก้อยู่ที่ [assets/fpl-gw-logo.png](assets/fpl-gw-logo.png) สร้างด้วย built-in `image_gen` และตรวจชื่อ `fpl-gw` กับองค์ประกอบภาพแล้ว ไม่มี source vector ในรอบนี้

Prompt ที่ใช้:

```text
Use case: logo-brand. Asset type: finished GitHub README logo for "fpl-gw", a Fantasy Premier League gameweek planning assistant with a Markdown decision journal. Create a sophisticated original football analytics identity: a bold compact geometric mark integrating a football pitch and a branching decision/check motif, paired with precise lowercase wordmark "fpl-gw". Flat vector-like graphic, exceptionally crisp edges, restrained emerald green and deep midnight navy, strong silhouette, generous breathing space, horizontal lockup centered on a clean light ivory background. Only text: "fpl-gw". No Premier League lion, no official club crest, no gradients, no 3D, no mockup, no watermark. Professional editorial sports-tech aesthetic. Landscape 3:2 composition suitable for displaying at 520px width.
```

### โลโก้ที่ผู้ใช้เลือก: ภาพ 6 — Gameweek Cards

ผู้ใช้เลือกแบบการ์ด Gameweek ซ้อนกัน โทนส้ม–กรม ใช้ built-in `image_gen` ลบเลข `06` มุมซ้ายบนโดยคงองค์ประกอบโลโก้เดิม แล้วแทนไฟล์ `assets/fpl-gw-logo.png` ที่ README อ้างถึง Prompt ด้านบนเป็นประวัติของแบบแรก ไม่ใช่แบบที่เลือกสุดท้าย

Final edit prompt:

```text
Edit the provided selected logo, candidate 06. Remove ONLY the small number "06" in the upper-left corner and fill that area seamlessly with the existing warm ivory background. Preserve the entire central logo exactly: two overlapping orange/navy gameweek cards, football pitch lines, orange checkmark, exact lowercase "fpl-gw" wordmark with orange hyphen, all shapes, proportions, positioning, colors, edges and original canvas dimensions. Do not redesign, add text, crop or change anything else. This is the final approved logo for a GitHub README.
```

## อัปเดต: Quick mode + optional workspace

ปรับตามข้อเสนอที่ผู้ใช้อนุมัติ: skill วิเคราะห์จากข้อมูลในแชตได้โดยไม่ต้องมี Obsidian, workspace, CLAUDE.md หรือ Squad.md การบันทึกไฟล์เป็นตัวเลือกใน Workspace mode และไม่อ้างว่าจำข้อมูลข้ามแชตได้เมื่อไม่ได้เก็บเป็นไฟล์

### ไฟล์ที่เปลี่ยนในรอบนี้

| Path | การเปลี่ยน |
|---|---|
| `README.md` | เริ่มต้นด้วย Quick mode; ย้าย initialization และ Obsidian ไปส่วน optional; เพิ่มคำสั่งและ migration note |
| `.claude-plugin/marketplace.json` | คำอธิบายการใช้งานในแชตและ optional Markdown |
| `plugins/fpl-gw/.claude-plugin/plugin.json` | คำอธิบายตรงกับ marketplace |
| `plugins/fpl-gw/commands/init.md` | initialization เป็นตัวเลือกและใช้โฟลเดอร์ธรรมดาได้ |
| `plugins/fpl-gw/skills/fpl-gw/SKILL.md` | สองโหมด, กฎข้อมูลที่ใช้ได้โดยไม่มี workspace, ขอบเขตการบันทึกและ script input precedence |
| `plugins/fpl-gw/skills/fpl-gw/references/{news,transfer,captain,matchup,projection,lock-close}.md` | ส่วนเขียนไฟล์ใช้เฉพาะ Workspace mode; Quick mode ตอบ/ยืนยัน/review ในแชต |
| `plugins/fpl-gw/skills/fpl-gw/scripts/lib/fpl.js` | รองรับชื่อ workspace ใหม่และอ่าน squad แบบ optional |
| `plugins/fpl-gw/skills/fpl-gw/scripts/news.js` | รับ players โดยตรง, แสดง fixtures ได้เมื่อไม่มี squad, เพิ่ม extra targets |
| `plugins/fpl-gw/skills/fpl-gw/scripts/projection.js` | player pool จาก players หรือ XI/bench โดยไม่ต้องมีไฟล์; รองรับ Name:CLUB ในการเลือก C/V และ scenarios |
| `plugins/fpl-gw/skills/fpl-gw/scripts/init-vault.js` | ข้อความ scaffold ใช้ชื่อ workspace; เก็บชื่อ script เดิม |
| `plugins/fpl-gw/skills/fpl-gw/assets/vault-template/{AGENTS,CLAUDE,README}.md` | คำอธิบาย plain Markdown workspace และ optional Obsidian |
| `plugins/fpl-gw/skills/fpl-gw/assets/vault-template/Season {{SEASON}}.md` | ระบุ Dataview เป็น optional; ใช้ Markdown GW log ได้ตามปกติ |
| `tests/quick-mode.test.js` | 12 offline integration tests สำหรับ Quick/workspace/compatibility และการไม่สร้างโน้ต |

### Compatibility

`--workspace` → `--vault` → `FPL_WORKSPACE` → `FPL_VAULT` → cwd เป็นลำดับ path สำหรับอ่าน squad ชื่อเก่ายังใช้ได้ แต่ **news `--players` เปลี่ยนความหมายเป็น explicit player pool** แทนการเพิ่ม targets ให้ squad เดิม สำหรับกรณีเดิมให้ใช้ `--workspace <dir> --extra "Name:CLUB"` การระบุ players หรือ XI ไม่ได้แก้ saved squad

### Verification รอบนี้

- TDD: 7 tests ล้มก่อนแก้ implementation เนื่องจากบังคับ Squad.md, ไม่รู้จัก workspace alias และยังผสมทีมจาก cwd; หลังแก้ `node --test` ผ่าน **12/12**
- JavaScript ทั้ง 6 ไฟล์ผ่าน `node --check`; โปรเจกต์ไม่มี build step แยก
- Skill validator ผ่านด้วย `python -X utf8 .../quick_validate.py` — บน Windows เครื่องนี้ default encoding เป็น cp874 จึงต้องเปิด UTF-8 เมื่อตรวจ skill ที่มีภาษาไทย
- ทดสอบ initializer กับโฟลเดอร์ Markdown ที่ไม่มี `.obsidian` และยืนยันการรันซ้ำไม่ทับ squad
- ตรวจเส้นทาง: ส่ง explicit players, ส่ง XI/bench, ไม่มีข้อมูลทีม, workspace ขาด Squad.md, aliases เดิมและ path precedence
- ตรวจคำแนะนำแบบอ่านตามสถานการณ์: เทียบ 2 คนโดยไม่มีโฟลเดอร์ → ไม่ต้องใช้ทีมเต็ม; ยืนยันแผนใน Quick mode → สรุปในแชต; ขอเก็บข้ามแชต → เลือก destination ก่อน; workspace เดิม → อ่าน local rules และคง workflow เดิม นี่เป็น manual instruction review ไม่ใช่ end-to-end agent evaluation
- ยังไม่ได้ทดสอบ plugin install ใน Claude Code หรือ live API รอบนี้

Findings 1–3 ด้านบนอ้างตำแหน่งจาก baseline ก่อนแก้ Quick mode และ **ยังยืนยันได้ทั้งหมด**: DGW simulation, null kickoff และ cache timestamp ไม่ได้ถูกแก้ในงานนี้ โลโก้ใช้ภาพ 6 ที่ผู้ใช้เลือก การเผยแพร่รอบนี้ไม่รวมการแก้ findings เหล่านี้

## อัปเดต: Portable skill สำหรับหลาย harness

Core skill ไม่ต้องมี Claude Code, plugin system, slash command หรือตัวแปร environment เฉพาะผู้ให้บริการ การติดตั้งหลักใน README เป็นการคัดลอกโฟลเดอร์ skill ทั้งชุดเข้า skills directory ของ harness หรือให้ agent อ่าน SKILL.md พร้อม resources ที่เกี่ยวข้อง ส่วน Claude marketplace/command คงไว้เป็น optional adapter เท่านั้น

- `SKILL.md` ระบุ capabilities ที่ใช้จริง: อ่านไฟล์, เรียก Node.js 18+ และ network สำหรับ data scripts; เขียนไฟล์เฉพาะการเก็บ workspace ส่วน search/browser เป็น optional และต้องแจ้งเมื่อไม่มีเครื่องมือ
- Workspace ใหม่เก็บ protocol เต็มใน `AGENTS.md`; `CLAUDE.md` เป็น compatibility pointer กฎเดิมใน workspace เก่ายังอ่านต่อได้และไม่ถูกเขียนทับ หากมี legacy CLAUDE.md แต่ยังไม่มี AGENTS.md initializer สร้าง pointer กลับไปยังกฎเดิมแทนการแทนที่กฎนั้น
- References ใช้ความสามารถ search/read-page/browser ของ host แทนการระบุชื่อเครื่องมือ, mode หรือ agent เฉพาะ
- Projection ใช้ label `(est.)` แทน attribution ของผู้ให้บริการ
- คงชื่อ path `plugins/fpl-gw/skills/fpl-gw/` ไว้เพื่อรักษา plugin เดิม โฟลเดอร์ชั้นในเป็น portable artifact ที่คัดลอกแยกได้ ไม่ต้องนำ adapter ไปด้วย
- เพิ่ม regression test ที่คัดลอก skill ไป path อื่นที่มีช่องว่าง แล้วรัน news, projection และ initializer โดยไม่มี Claude environment variables รวมถึงการ preserve legacy rules
- ตรวจคำแนะนำแบบ manual สำหรับ Quick mode, workspace ใหม่/เดิม และ host ที่ไม่มี search/browser ไม่อ้างว่าได้รัน end-to-end กับ native harness ทุกตัว

ไฟล์ที่เปลี่ยนรอบนี้: README, marketplace adapter description, init command adapter, SKILL, workspace templates (AGENTS/CLAUDE/README/Lessons), references (news/matchup/transfer/lock-close), scripts (projection/init-vault) และ tests/quick-mode.test.js ไม่รวม social assets ที่ยังเป็นไฟล์งานภาพแยกต่างหาก

## Release v0.2.0

- Plugin และ marketplace manifests ใช้ version 0.2.0 ตรงกัน
- Portable ZIP บรรจุโฟลเดอร์ fpl-gw ทั้งชุด 21 ไฟล์ พร้อม SHA-256 checksum; ไม่รวม Claude plugin adapter หรือ social assets
- Pre-release validation: tests 14/14, syntax 6 scripts, skill validator, documentation links และการแตก ZIP แล้วรัน initializer ผ่าน
- Release notes ระบุข้อจำกัด DGW, null kickoff และ cache timestamp ตามเดิม ไม่มีการอ้าง native integration test ของทุก harness หรือ live API
