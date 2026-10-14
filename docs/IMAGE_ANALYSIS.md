# การวิเคราะห์ภาพอ้างอิง

แหล่งหลักคือภาพที่ผู้ใช้แนบ: composition แบบ blueprint/showcase ประกอบด้วย top, side, front, rear และ front-three-quarter views รวมถึง component tiles ภาพมีลักษณะ CGI/illustration จึงไม่ถือเป็น orthographic calibration หรือข้อมูล CAD

## สิ่งที่มองเห็นจากภาพ

| รายการ | Observation และแนวทางสร้างโมเดล |
| --- | --- |
| รุ่นและ silhouette | Ferrari 812 Superfast แบบ GT coupe; nose ยาว, cabin ถอยไปทางหลัง, rear deck สั้น |
| มุมกล้อง | มุมบน, ด้านข้าง, หน้า, หลัง และ three-quarter; แต่ละมุมมี perspective/สเกลต่างกัน |
| สัดส่วน | front-mid-engine layout, wheelbase ยาวกว่าระยะ overhang มาก, roof ต่ำและ cabin compact |
| ไฟหน้า | housing เรียวยาวขึ้นไปบน fender มี projector และ LED elements; ใช้ curved surface, projector sphere และ LED tubes |
| ไฟท้าย | ไฟวงกลมสองดวงต่อข้าง; ใช้ torus และ inner lens แยก emissive material |
| ฝากระโปรง | hood ยาว มีเส้นยกและ vent/recess คู่; สร้าง custom sampled surface แยกจาก fenders |
| กันชนหน้า | grille กว้าง, side intakes และ lower carbon splitter; geometry แยกสามส่วน |
| กันชนหลัง | bumper สั้น, quad exhaust และ diffuser strakes; independent meshes |
| ล้อและยาง | dark split-spoke alloys, low-profile tires, perforated brake discs และ yellow calipers |
| สี | saturated red gloss paint; panel presets ใช้ชื่อ Rosso Corsa เป็นคำอธิบายสี ไม่ใช่การเทียบสีจาก calibrated sample |
| กระจก | dark tinted windshield, side glass และ sloping rear window; transparent clearcoat material แยกจาก roof |
| Aerodynamics | swept side channel, rear haunch bypass-like opening, side skirts และ integrated rear lip |
| Components | ภาพแสดง engine, bumper, hood, headlights, mirrors, doors, wheel, brakes, exhaust, diffuser, steering, dashboard, seat และ suspension |

## ข้อมูลที่ตรวจสอบได้

ตรวจจาก [Ferrari official launch specification](https://www.ferrari.com/en-US/corporate/articles/the-ferrari-812-superfast-the-new-extreme-performance-v12-berlinetta) เมื่อ 14 ตุลาคม 2026:

- 65° V12, 6,496 cc; 800 cv ที่ 8,500 rpm; 718 Nm ที่ 7,000 rpm
- ความยาว 4,657 mm, ความกว้าง 1,971 mm, ความสูง 1,276 mm
- 0–100 km/h 2.9 s; top speed มากกว่า 340 km/h
- Front-mid-engine berlinetta พร้อม aerodynamic features ที่ nose/underbody และ rear flank

Wheelbase 2,720 mm ถูกใช้จาก annotation ในภาพอ้างอิง มีระยะ axle ใน source 2.720 m โดยไม่ได้อ้างว่าการอ่าน annotation เป็นการวัดจากภาพ

## สิ่งที่ประมาณ

Surface cross sections, panel seams, glass curvature, mirror geometry, spoke topology, door hinge positions, hood opening, exhaust routing, dashboard layout, seat construction, engine internals, suspension springs และ hidden chassis ถูกสร้างโดยประมาณ ภาพไม่ยืนยันด้านใต้ตัวรถหรือความสัมพันธ์เชิงวิศวกรรมของชิ้นส่วน

Body shell ใช้ length stations และ symmetric left/right surfaces; wheel arch cutouts เป็น geometry openings จริง รายละเอียดหลายส่วนทำให้ตีความลักษณะรถได้ แต่ไม่ใช่ reconstruction ที่ยืนยันความแม่นยำทางวิศวกรรม

Bounding box ของ GLB รวม aero และ mirrors จะต่างจาก published body dimensions; ดู `model-inspection.json` สำหรับค่าที่ตรวจจริง Height ของ roof อยู่ใกล้ 1.276 m และ axle separation 2.720 m
