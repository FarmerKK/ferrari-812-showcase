import bpy, json, sys
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root/'assets/source/ferrari-812-cc0.blend'),load_ui=False,use_scripts=False)
data=[]
for o in bpy.data.objects:
    if o.type!='MESH': continue
    pts=[o.matrix_world@Vector(p) for p in o.bound_box]
    data.append({'name':o.name,'vertices':len(o.data.vertices),'faces':len(o.data.polygons),'materials':[s.material.name if s.material else None for s in o.material_slots],'bounds':[[round(min(p[i] for p in pts),4) for i in range(3)],[round(max(p[i] for p in pts),4) for i in range(3)]],'modifiers':[{'type':m.type,'name':m.name,'level':getattr(m,'levels',None),'render_level':getattr(m,'render_levels',None),'visible':m.show_viewport} for m in o.modifiers]})
(root/'assets/source/inspection.json').write_text(json.dumps(data,indent=2),encoding='utf8')
print(json.dumps(data,ensure_ascii=False))
