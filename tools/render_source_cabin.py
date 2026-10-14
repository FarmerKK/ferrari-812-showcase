import bpy
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'public/models/812-superfast-detailed.glb'))
scene=bpy.context.scene
for o in list(scene.objects):
    if o.type=='MESH' and o.get('partId') not in ('driver-seat','passenger-seat'):
        o.hide_render=True
leather=bpy.data.materials.new('Inspection leather');leather.use_nodes=True
p=leather.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.035,.04,.045,1);p.inputs['Roughness'].default_value=.43
for o in scene.objects:
    if o.type=='MESH' and not o.hide_render:o.data.materials.clear();o.data.materials.append(leather)
scene.world=bpy.data.worlds.new('Neutral world');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.15,.15,.15,1)
for pos,power,size in [((-1.0,-1.8,2.5),450,2),((0,1.5,2),300,1.6),((1.7,-.5,2.5),400,1.2)]:
    data=bpy.data.lights.new('softbox','AREA');data.energy=power;data.shape='DISK';data.size=size;o=bpy.data.objects.new('softbox',data);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((.3,0,.7))-o.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('Camera');camera=bpy.data.objects.new('Camera',data);scene.collection.objects.link(camera);camera.location=(-1.2,-1.6,1.6);camera.rotation_euler=(Vector((.3,0,.67))-camera.location).to_track_quat('-Z','Y').to_euler();data.lens=46;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1000;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(root/'output/source-seat-inspection.png')
bpy.ops.render.render(write_still=True)
