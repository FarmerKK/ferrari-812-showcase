import bpy, json
from mathutils import Vector
from pathlib import Path
root = Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'public/models/812-superfast-detailed.glb'))
bpy.context.view_layer.update()
items=[]
for o in bpy.context.scene.objects:
    if o.type=='EMPTY' and o.get('partId'):
        cs=[c.matrix_world@Vector(v) for c in o.children_recursive if c.type=='MESH' for v in c.bound_box]
        if not cs: continue
        convert=lambda v:[round(v[0],4),round(v[2],4),round(-v[1],4)]
        pts=[convert(v) for v in cs]
        items.append({'id':o.get('partId'),'pivot':convert(o.matrix_world.translation),'min':[min(p[i] for p in pts) for i in range(3)],'max':[max(p[i] for p in pts) for i in range(3)]})
(root/'output/part-bounds.json').write_text(json.dumps(items,indent=2))
print(json.dumps([p for p in items if p['id'] in ['dashboard','steering-wheel','driver-seat','passenger-seat','center-console','interior-trim','left-door','windscreen','main-body']]))
