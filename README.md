# 812 Superfast · Interactive Atelier

เว็บไซต์ Three.js ที่หมุน/ซูมรถจริงใน 3D, ปรับสีและวัสดุ, เลือกและถอดประกอบ 57 กลุ่มชิ้นส่วน และเปลี่ยนฉากสนามแข่งได้

**โมเดลเป็น procedural approximation จากภาพอ้างอิง ไม่ใช่ CAD หรือโมเดล Ferrari อย่างเป็นทางการ และยังไม่ถึงระดับ photorealistic automotive CGI**

## เปิดใช้งาน

ต้องมี Node.js 20.19+ หรือ 22.12+ และ npm

```powershell
cd D:\Project\GPT\ferrari-812-showcase
npm install
npm run dev
```

เปิด URL ที่ Vite แสดง เช่น `http://127.0.0.1:5173/`

```powershell
npm run build
npm run preview
```

ไฟล์ deploy อยู่ใน `dist/` และโฮสต์บน static hosting ได้โดยไม่ต้องมี backend หรือ API key หน้าเริ่มต้นสร้างโมเดลจาก source โดยตรง ไม่ดาวน์โหลด GLB 13 MB ระหว่างโหลดครั้งแรก

## วิธีสำรวจ

- ลากเมาส์/นิ้วเพื่อ orbit, scroll หรือ pinch เพื่อ zoom; กล้องมี damping
- คลิกตัวรถเพื่อเลือกและ highlight ชิ้นส่วน หรือค้นจาก Parts explorer
- Detach / Reassemble ใช้ตำแหน่งเดิมที่บันทึกไว้; Exploded view / Assemble ใช้ครบ 57 กลุ่ม
- แผง Paint, Wheels, Brakes, Exterior, Interior, Lights เปลี่ยนวัสดุหรือ geometry ของรถจริง
- Camera มี orbit, front, rear, left, right, top, interior, wheel, engine และ cinematic
- Mechanics เปิดประตูพร้อมกระจกและกระจกข้าง, เปิดฝากระโปรง, หมุนล้อ และปรับพวงมาลัย
- Environment เลือก Daylight, Golden hour, Night racing หรือ Cinematic studio
- Save configuration / Load saved / Reset เก็บ preset บน browser เดิมด้วย LocalStorage
- Capture PNG บันทึก canvas render; About this reconstruction → Export model ส่งออก GLB ของ configuration ปัจจุบันในสภาพประกอบแล้ว
- เมื่อ viewport ได้ keyboard focus: ลูกศรซ้าย/ขวาหมุน, ลูกศรขึ้น/ลงหรือ +/- ซูม, R reset camera, E explode, A assemble

## ไฟล์สำคัญ

| ไฟล์ | หน้าที่ |
| --- | --- |
| `src/car.js` | Procedural surfaces, wheel arches, 57 part groups, PBR materials และ configurator binding |
| `src/environment.js` | สนาม 3D, pit buildings, grandstands, barriers, sky, PMREM environment และแสง |
| `src/main.js` | Interaction, raycasting, GSAP animation, cameras, presets, export/import, render loop |
| `src/style.css` | Responsive luxury configurator UI |
| `public/models/812-procedural-reconstruction.glb` | โมเดล assembled ที่ส่งออกจริงจากเว็บ |
| `docs/IMAGE_ANALYSIS.md` | วิเคราะห์ภาพ, ข้อมูลที่ยืนยันได้ และสิ่งที่ประมาณ |
| `docs/MODEL_PIPELINE.md` | เหตุผลเลือก procedural และวิธีเปลี่ยนโมเดล |
| `docs/TEST_RESULTS.md` | ผลทดสอบและข้อจำกัด |
| `docs/model-inspection.json` | ผลตรวจ GLB ด้วย Blender 4.5.3 |
| `qa/acceptance.cjs` | Browser acceptance checks สำหรับ Playwright CLI |
| `tools/inspect_model.py` | Script ตรวจโมเดลผ่าน Blender background |

## เพิ่มโมเดลคุณภาพสูง

About this reconstruction → Import GLB รองรับไฟล์ self-contained GLB ไม่เกิน 100 MB และ Draco decoder แบบ lazy-loaded ใช้ไฟล์ที่มีสิทธิ์ใช้งานเท่านั้น

Importer อ่าน `userData.partId` หรือ semantic mesh names เช่น `hood`, `left_door`, `right_door`, `front_bumper`, `roof`, `engine`, `dashboard`, `steering_wheel` โดยไม่ตัด mesh แบบสุ่ม วัตถุที่ไม่มีขอบเขตชัดเจนจะเก็บไว้ intact การปรับแต่งและกลไกของ GLB ภายนอกขึ้นกับโครงสร้างและวัสดุของไฟล์ ต้องมีการ mapping เพิ่มสำหรับงาน production ไม่ใช่ auto-segmentation ที่รับประกันความแม่นยำ

โมเดลเดิมกลับมาเมื่อ reload หน้าเว็บ Credentials สำหรับ image-to-3D ควรอยู่ใน server environment เท่านั้น; `.env.example` แสดงชื่อที่ใช้ได้โดยไม่มี secret ไม่มีคีย์หรือบริการที่มีค่าใช้จ่ายถูกใช้ในงานนี้

## Performance และ rendering

ACES tone mapping, clearcoat/iridescence, procedural carbon texture, PMREM reflections, soft shadow maps, subtle bloom, contact-occlusion texture, MSAA และ adaptive DPR สนามใช้ instancing สำหรับที่นั่ง, kerbs, shutters และ barriers; ลายยางและรูจานเบรกใช้ instancing เช่นกัน Exporter/GLTFLoader/Draco โหลดเมื่อใช้งาน

Adaptive quality ลด DPR และข้าม bloom เมื่อ FPS ต่ำ ภาพและ performance ขึ้นกับ GPU/browser; 60 FPS เป็นเป้าหมาย ไม่ใช่การรับประกันทุกอุปกรณ์ ไม่มี external HDRI, SSAO/GTAO, KTX2 หรือ texture compression pipeline ในต้นแบบนี้

## ทดสอบซ้ำ

เปิด production preview ก่อน แล้วใช้ Playwright CLI:

```powershell
npx --yes --package @playwright/cli playwright-cli -s=atelier open http://127.0.0.1:4173 --headed
npx --yes --package @playwright/cli playwright-cli -s=atelier run-code --filename qa/acceptance.cjs
```

Script ใช้หน้าปัจจุบันและสร้างภาพ/ไฟล์ใน `output/playwright/` ตรวจสี วัสดุ กล้อง transform restoration, animation, save/load, PNG/GLB และ mobile layout โดยไม่มี test framework เพิ่ม

## ข้อจำกัดหลัก

- รูปทรงภายนอกและอุปกรณ์ภายในเป็นการประมาณจากภาพ; ไม่มีการวัด hidden geometry, suspension kinematics หรือ engineering interfaces
- ตัวถังมีลักษณะ procedural อยู่ และไม่เท่ากับ licensed high-detail 812 GLB
- Aero packages และเครื่องยนต์ภายในเป็น visualization; ไม่ได้จำลอง CFD หรือกลไกรถจริง
- สนามแข่งเป็นสนามสมมุติ ไม่ใช่สนามจริงที่ scan มา
- Mobile ตรวจใน desktop Chromium viewport และ pointer emulation; ยังไม่ทดสอบบน physical phone
- Importer ไม่รับประกันการปรับแต่งทุกส่วนสำหรับ GLB ที่ไม่รู้จัก

ข้อมูลรถ: [Ferrari official launch specification](https://www.ferrari.com/en-US/corporate/articles/the-ferrari-812-superfast-the-new-extreme-performance-v12-berlinetta). การใช้งานนี้เป็น independent reference-inspired showcase.
