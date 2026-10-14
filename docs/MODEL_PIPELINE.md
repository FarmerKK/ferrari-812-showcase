# Model acquisition และ processing

## ขั้นตอนที่ดำเนินการ

1. อ่านภาพหลายมุมและ component tiles เป็น reference หลัก
2. ตรวจชื่อ environment variables สำหรับ Meshy, Tripo และ providers ที่เกี่ยวข้องโดยไม่พิมพ์ค่า secret: ไม่พบ credential ที่พร้อมใช้
3. ค้น plugin สำหรับ Meshy/Tripo/image-to-3D: ไม่มีเครื่องมือ 3D reconstruction ที่ยืนยันว่าเรียกได้จากบัญชีนี้ ผลลัพธ์ image/video providers ไม่ได้ยืนยันว่ามี image-to-3D
4. ตรวจโมเดล downloadable ที่มี license แสดงชัดเจน: [812 Super Fast GT3 Concept โดย toddeppe](https://sketchfab.com/3d-models/ferrari-812-super-fast-gt3-8fce17080c2142b5910c09d7e180bd1e) มี CC Attribution แต่เป็น GT3 concept, 2.1M triangles และไม่ตรง reference ของ road-going 812 จึงไม่ได้ดาวน์โหลดหรือรวมเข้าระบบ
5. สร้าง procedural fallback ตามที่ผู้ใช้อนุญาต ด้วย Three.js BufferGeometry, sampled parametric surfaces, rounded boxes, lathe surfaces, tubes และ instancing
6. ลงทะเบียน 57 component groups ก่อน render ทุกกลุ่มเก็บ original position/quaternion/scale, parent UUID และ explode direction จึงไม่ต้องตัดรวม mesh แบบสุ่ม
7. Export assembled GLB จาก browser ด้วย GLTFExporter; import เข้า Blender 4.5.3 LTS แบบ background เพื่อตรวจ hierarchy, materials, packed images และ bounds

ไม่มีการซื้อโมเดล, ใช้ paid generation credit, ฝัง API key หรือดึง restricted/game-ripped asset

## Part map

- Front: two fenders, hood, bumper, grille, splitter, intake group, two headlights
- Body: two doors, two mirrors, two skirts, roof, windscreen, rear glass, two side windows, two rear quarters
- Rear: deck, bumper, quad taillight group, diffuser, exhaust system, aero lip
- Mechanical: chassis, four wheels, four tires, four discs, four calipers, four suspension groups
- Engine: V12 assembly, engine covers
- Interior: dashboard, steering wheel, two seats, center console, interior trim

Left/right doors contain independent panel geometry. During door opening, side-window and mirror groups follow the same hinge transform; during exploded view they move independently. Individual wheels and tires spin. Steering moves the front wheel/rubber groups and steering wheel; it is an illustrative animation, not an articulated physical suspension solver.

## Replacement architecture

`createCar()` returns `{root, parts, materials, wheels, steering, source}`. Interaction uses semantic part IDs instead of mesh indices, so a future high-quality licensed asset can be adapted to the same interface.

GLB import is lazy-loaded and checks size, self-contained format and non-empty bounds. It scales by the longest horizontal axis and grounds the car. Orientation should be prepared with front along -X, up +Y. Semantic names and explicit `partId` are mapped; unknown mesh boundaries are preserved rather than destructively split. Configurator material and mechanical mappings for arbitrary third-party GLBs need an asset-specific adapter.

The supplied GLB includes `EXT_mesh_gpu_instancing` for repeated detail. Blender can expand instances into separate objects, so its mesh-object count differs from the live Three.js draw-object count. Component IDs remain the meaningful unit for disassembly.
