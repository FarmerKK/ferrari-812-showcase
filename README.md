# 812 Superfast · Interactive Atelier

เว็บไซต์ Three.js สำหรับหมุน/ซูม Ferrari 812 ใน 3D ปรับแต่งวัสดุ สำรวจ 62 กลุ่มชิ้นส่วน และเปลี่ยนฉากสนามแข่ง

ตัวถังใช้โมเดลที่สร้างโดย **Jayrenn Reeve** เผยแพร่เป็น **CC0** บน [BlenderKit](https://www.blenderkit.com/asset-gallery-detail/22191abd-fa78-43e9-81fe-6cded0d53483/). ทรงฝากระโปรง ซุ้มล้อ หลังคา และร่องเว้าประตูมาจากโมเดลนี้ ล้อปรับตามภาพอ้างอิง ห้องโดยสารสร้างเพิ่มตามภาพอ้างอิง มีหนังสแกนจาก ambientCG (CC0) รอยเย็บ 3D และมุมภายใน 7 มุม ส่วนเครื่องยนต์และช่วงล่างเพิ่มเติมเป็นภาพจำลอง ไม่มีข้อมูล CAD ของ Ferrari

## เปิดใช้งาน

ต้องมี Node.js 20.19+ หรือ 22.12+ และ npm

```powershell
cd D:\Project\GPT\ferrari-812-showcase
npm install
npm run dev
```

```powershell
npm run build
npm run preview -- --port 5173
```

ไฟล์ static อยู่ใน `dist/`. หน้าเริ่มต้นโหลดโมเดล Draco ประมาณ 3.7 MB พร้อม decoder ภายในเว็บ ไม่ต้องมี backend หรือ API key

## การใช้งาน

- ลากเพื่อ orbit; scroll/pinch เพื่อ zoom; คลิกรถหรือค้นใน Parts explorer เพื่อเลือกชิ้นส่วน
- Detach/Reassemble และ Exploded view/Assemble คืนตำแหน่งและการหมุนเดิมของ 62 กลุ่ม
- Paint, Wheels, Brakes, Exterior, Interior และ Lights เปลี่ยนวัสดุ/geometry จริง
- Mechanics เปิดประตูพร้อมกระจกและกระจกข้าง เปิดฝากระโปรง หมุนล้อ และปรับพวงมาลัย
- กล้องมี 16 มุม รวมภายใน 7 มุม, engine และ cinematic; แสงมี daylight, sunset, night และ studio
- Save/Load/Reset เก็บ configuration ใน LocalStorage; Capture PNG บันทึก render
- Sound → Start engine เปิดเสียงเดินเบา; Rev exhaust เล่นเสียงเร่ง; Stop engine หยุดทั้งสอง มี Volume/Mute และหยุดเมื่อซ่อนแท็บ ใช้เสียงบันทึก Ferrari แบบ CC0 ซึ่งผู้บันทึกไม่ยืนยันรุ่น 812
- About this reconstruction → Export model ส่งออก GLB ของ configuration ปัจจุบันในสภาพประกอบ
- เมื่อ canvas มี keyboard focus: ลูกศรหมุน/ซูม, +/- ซูม, R reset camera, E explode, A assemble

## Source และโมเดล

| ไฟล์ | หน้าที่ |
| --- | --- |
| `src/detailed-car.js` | โหลดตัวถัง CC0, จัด 62 กลุ่ม, ผูกวัสดุและชุดล้อ |
| `src/cockpit-geometry.js` | แผงหน้าปัด มาตรวัด พวงมาลัย และคอนโซลตามภาพถ่ายอ้างอิง |
| `src/wheels.js` | ล้อแม็กก้านโค้งมีหน้าตัด กระทะล้อกลวง เบ้าน็อต และจุ๊บลมยาง |
| `src/car.js` | วัสดุ ล้อ และเครื่องยนต์/ช่วงล่างจำลองที่ใช้ประกอบ |
| `src/main.js` | Interaction, animation, cameras, presets และ export/import |
| `src/environment.js` | สนามสมมุติ แสง PMREM sky และ contact shadows |
| `public/models/812-superfast-detailed.glb` | ตัวถัง CC0 ที่แปลงและบีบอัดสำหรับโหลดหน้าเว็บ |
| `public/models/812-superfast-atelier.glb` | โมเดลประกอบที่ส่งออกจากเว็บ พร้อมล้อและชิ้นส่วนเพิ่มเติม |
| `tools/prepare_detailed_model.py` | แปลงต้นฉบับ Blender เป็น semantic GLB |
| `assets/source/blenderkit-metadata.json` | Metadata ผู้สร้างและสิทธิ์จาก public API |
| `docs/MODEL_PIPELINE.md` | ขั้นตอนประมวลผลและข้อจำกัด |
| `docs/THIRD_PARTY.md` | ที่มาและสิทธิ์ใช้งาน |
| `docs/TEST_RESULTS.md` | ผลทดสอบโมเดลรุ่นปัจจุบัน |

ไฟล์ต้นฉบับ `assets/source/ferrari-812-cc0.blend` อยู่ใน workspace และไม่รวมใน Git; ดาวน์โหลดซ้ำได้จากรายการของผู้สร้าง กระบวนการ Blender เปิดไฟล์ด้วย `use_scripts=False` และ `--disable-autoexec`

## การทดสอบ

งานล้อรุ่น `812-forged-wheels-v1` ตรวจรูปทรงจริงและ interaction 19 รายการบน production preview ดูผลใน `docs/wheel-qa-summary.json`.

เปิด production preview แล้วใช้ Playwright CLI:

```powershell
npx --yes --package @playwright/cli playwright-cli -s=atelier open http://127.0.0.1:5173
npx --yes --package @playwright/cli playwright-cli -s=atelier run-code --filename qa/detailed-acceptance.cjs
```

รุ่น v7 ปรับหนังด้านบนให้ลาดลงแบบตื้น และตรวจ slope/จอ/ระยะพ้น/ผิวปิด 32 รายการ ส่วนรุ่น v6 ตรวจกล้องภายใน 7 มุม สีหนังล่างแบบแยก แผ่นจอผู้โดยสารที่เป็นแนวตรง ระยะพ้นแผงประตู และการทำงานเดิมของ cockpit/เสียง รวม 82 รายการ ส่วน regression ภายนอก 50 รายการผ่านในรุ่น v4 ก่อนหน้า โดยไม่มี JavaScript runtime errors ภาพและไฟล์อยู่ใน `output/playwright/`. ผลทดสอบฟังก์ชันไม่ได้รับรองความเหมือน CAD ต้นฉบับ Scripts `qa/acceptance.cjs` และ `qa/final-smoke.cjs` เป็นการทดสอบรุ่น procedural เก่า ใช้ detailed-acceptance สำหรับรุ่นปัจจุบัน

## ข้อจำกัด

ตัวถังเป็นงานของศิลปิน มีความโค้งและรายละเอียดจริง แต่ไม่มีการรับรองมิติทางวิศวกรรม หลังคาและแก้มหลังต่อเนื่องเก็บเป็นกลุ่มเดียวเพื่อรักษาผิว เครื่องยนต์ ช่วงล่าง และ aero packages เป็น visualization สนามสมมุติ ไม่มี CFD หรือ suspension solver

Rendering ใช้ ACES, clearcoat, PMREM, shadow maps, bloom และ adaptive DPR. ภายในใช้ RectAreaLight, scanned leather normal/roughness maps และ SSAO ในโหมดคุณภาพสูง. Performance ขึ้นกับ GPU/browser; mobile ตรวจใน Chromium viewport 390 × 844 ยังไม่ได้ทดสอบ physical phone

เปิดภายในได้จากปุ่ม Cockpit หรือ URL ?view=interior; มุมฝั่งผู้โดยสารใช้ ?view=passenger; รายละเอียดอยู่ใน docs/COCKPIT.md

เปิดดูงานล้อที่ ?view=wheel; ก้านล้อและดุมมีระยะเว้าต่างกันจริง ลาย split/star ใช้ผิวสามมิติที่ปิดครบ รายละเอียดและผลตรวจอยู่ใน docs/WHEELS.md และ docs/wheel-qa-summary.json

Import GLB เป็นตัวเลือกสำหรับ asset ภายนอกที่มีสิทธิ์ใช้งาน ความสามารถขึ้นกับ semantic groups และ material mapping ของไฟล์ ไม่รับประกัน arbitrary GLB ทุกไฟล์ ไม่มี provider credentials ในเว็บ

ข้อมูลรถ: [Ferrari official launch specification](https://www.ferrari.com/en-US/corporate/articles/the-ferrari-812-superfast-the-new-extreme-performance-v12-berlinetta). เว็บไซต์นี้เป็น independent showcase
