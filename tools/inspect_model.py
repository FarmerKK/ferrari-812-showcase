"""Inspect the delivered GLB using Blender in background mode; no GUI needed."""
import bpy, json, sys
from pathlib import Path
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
model_path, report_path = map(Path, args[:2])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(model_path.resolve()))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
all_part_nodes = [o for o in bpy.context.scene.objects if o.type == 'EMPTY' and o.get('partId') and o.get('originalPosition') is not None]
def has_part_ancestor(o):
    parent = o.parent
    while parent:
        if parent in all_part_nodes:
            return True
        parent = parent.parent
    return False
parts = [o for o in all_part_nodes if not has_part_ancestor(o)]
corners = [o.matrix_world @ Vector(v) for o in meshes for v in o.bound_box]
bounds = {'min': [min(p[i] for p in corners) for i in range(3)], 'max': [max(p[i] for p in corners) for i in range(3)]}
report = {
    'file': model_path.name,
    'blender_version': bpy.app.version_string,
    'mesh_objects': len(meshes),
    'component_groups': len(parts),
    'nested_geometry_groups_with_inherited_metadata': len(all_part_nodes) - len(parts),
    'materials': len(bpy.data.materials),
    'images': len(bpy.data.images),
    'missing_images': [img.name for img in bpy.data.images if img.source == 'FILE' and not img.packed_file and not Path(bpy.path.abspath(img.filepath)).exists()],
    'bounds_in_blender_z_up_meters': bounds,
    'parts': [{'id': o.get('partId'), 'name': o.get('name'), 'category': o.get('category')} for o in parts],
    'note': 'Artist-authored CC0 body by Jayrenn Reeve, with reference-style wheels and illustrative procedural internals. Not official Ferrari CAD.'
}
report_path.parent.mkdir(parents=True, exist_ok=True)
report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
print(json.dumps({k: v for k, v in report.items() if k not in ('parts',)}, ensure_ascii=False))
