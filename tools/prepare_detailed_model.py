"""Convert Jayrenn Reeve's CC0 812 into a self-contained web asset.
Run Blender with --disable-autoexec. Source artwork is never overwritten.
"""
import bpy, bmesh, json, math
from pathlib import Path
from mathutils import Matrix, Vector
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/source/ferrari-812-cc0.blend'),load_ui=False,use_scripts=False)
source_objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and not o.hide_render]
source_materials={m.name:m for m in bpy.data.materials}
# Published length; orient the original -Y nose to -X in the web viewer.
SCALE=4.657/3.1138
ROT=Matrix(((0,1,0,0),(-1,0,0,0),(0,0,1,0),(0,0,0,1)))
NORM=Matrix.Diagonal((SCALE,SCALE,1.276/.8652,1))@ROT
NORM.translation=Vector((.0409*SCALE,0,.0002*(1.276/.8652)))
materials={};generated=[];groups={}
def material(slot,source=None):
    key=slot if slot not in ('badge','texture') else f'{slot}:{source.name}'
    if key in materials:return materials[key]
    m=bpy.data.materials.new(slot if slot not in ('badge','texture') else key)
    m.use_nodes=True;m.node_tree.nodes.clear();nodes=m.node_tree.nodes
    output=nodes.new('ShaderNodeOutputMaterial');p=nodes.new('ShaderNodeBsdfPrincipled');m.node_tree.links.new(p.outputs['BSDF'],output.inputs['Surface'])
    values={
      'paint':((.64,.006,.010,1),.35,.19), 'rim':((.034,.038,.042,1),.9,.22),
      'rubber':((.009,.011,.012,1),0,.9),'caliper':((.92,.55,.015,1),.35,.3),
      'brake':((.25,.27,.27,1),.72,.47),'chrome':((.68,.73,.75,1),1,.16),
      'black':((.010,.014,.014,1),.25,.42),'carbon':((.025,.03,.03,1),.5,.27),
      'dash':((.012,.015,.016,1),.05,.83),'seat':((.19,.015,.012,1),0,.77),
      'glass':((.025,.042,.047,.64),.1,.045),'lampglass':((.05,.08,.09,.18),.1,.07),
      'headlight':((.73,.83,.88,1),.4,.16),'taillight':((.35,.001,.003,1),.15,.15),
      'badge':((1,1,1,1),.15,.35),'texture':((1,1,1,1),.1,.6)}
    color,metal,rough=values[slot];p.inputs['Base Color'].default_value=color;p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    if slot=='paint':p.inputs['Coat Weight'].default_value=1;p.inputs['Coat Roughness'].default_value=.08
    if slot in ('glass','lampglass'):
        p.inputs['Alpha'].default_value=color[3];m.surface_render_method='DITHERED'
    if slot=='taillight':p.inputs['Emission Color'].default_value=(.42,.001,.003,1);p.inputs['Emission Strength'].default_value=.25
    if slot=='headlight':p.inputs['Emission Color'].default_value=(.7,.85,1,1);p.inputs['Emission Strength'].default_value=.2
    if slot=='badge' and source and source.use_nodes:
        image=next((n.image for n in source.node_tree.nodes if n.type=='TEX_IMAGE' and n.image),None)
        if image:
            if max(image.size)>1024:image.scale(1024,1024)
            tex=nodes.new('ShaderNodeTexImage');tex.image=image;m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);m.node_tree.links.new(tex.outputs['Alpha'],p.inputs['Alpha']);m.surface_render_method='DITHERED'
    materials[key]=m;return m

def classify(name,mats,c):
    if name.startswith('brake'):return ('caliper' if 'brake.001' in mats else 'disc'),True
    if name.startswith('rim') or name in ('logo.002','logo.003','logo.004','logo.005'):return 'wheel',True
    if name in ('Plane.012','Plane.013','Plane.014','Plane.015'):return 'tire',True
    if name=='door' or name.startswith('door.'):return 'door',True
    if name=='mirror':return 'mirror',True
    if name.startswith('hedlight'):return 'headlight',True
    if name in ('side','side.005','Plane.003','Plane.021'):return 'front-fender',True
    if name in ('Plane.009','Plane.008'):return 'side-window',True
    if name in ('Plane.010','Plane.018'):return 'quarter-window',True
    if name=='sit':return 'seat',True
    if name in ('Plane.007','Plane.004','Plane.006'):return 'hood',False
    if name in ('Plane','Plane.001','Plane.016','logo'):return 'front-bumper',False
    if name in ('front grill','Plane.005','Plane.011','Plane.002'):return 'front-grille',False
    if name=='Plane.020':return 'front-splitter',False
    if name=='bumper' or name in ('Plane.017','logo.001'):return 'rear-bumper',False
    if name=='bumper.002':return 'rear-bumper',False
    if name in ('back','Cylinder.001','Cylinder.002','Cylinder.003','Cylinder.004','Cylinder.005','Cylinder.006'):return 'taillights',False
    if name=='exhaust':return 'exhaust',False
    if name in ('glass','glass.002'):return 'rear-window',False
    if name in ('body','glass.001'):return 'rear-deck',False
    if name=='dashboard':return 'dashboard',False
    if name=='steer':return 'steering-wheel',False
    if name in ('Cube.001','Cube.002','Cube.003','Cylinder'):return 'center-console',False
    if name in ('side.001','side.004','side.003','Plane.019') or name.startswith('Circle') or name in ('Cube.004','Cube.006','Cube.007','Cube.008','Cube.009','Cube.019','Cube.020','Cube.021','Cylinder.007','Cylinder.008','Cylinder.009','Cylinder.010'):return 'windscreen',False
    if name=='block in':return 'chassis',False
    if name in ('body.003','Cube'):return 'interior-trim',False
    return 'main-body',False

def slot_for(matname,role):
    n=matname.strip().lower()
    if n=='car paint':return 'paint'
    if n in ('lgo','logo.001'):return 'badge'
    if role=='tire':return 'rubber'
    if role=='wheel' and n!='chrome':return 'rim'
    if role=='caliper':return 'caliper' if n=='brake.001' else 'black'
    if role=='disc':return 'brake'
    if role=='seat':return 'seat'
    if role in ('dashboard','center-console','interior-trim','steering-wheel'):return 'chrome' if n in ('chrome','metal') else 'dash'
    if n=='glass.001':return 'glass'
    if n=='glass':return 'lampglass'
    if 'tailight' in n or 'taillight' in n:return 'taillight'
    if n=='chrome' or 'shiny metal' in n:return 'chrome'
    if role=='headlight' and n=='mat mt.002':return 'headlight'
    if role in ('front-splitter','rear-diffuser'):return 'carbon'
    return 'black'

def side_piece(mesh,side):
    bm=bmesh.new();bm.from_mesh(mesh)
    # Only complete faces in an already mirrored, bilaterally separated object.
    # No arbitrary slicing of the contiguous main body.
    bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.calc_center_median().x*side < -1e-6],context='FACES')
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
    out=bpy.data.meshes.new('separated-side');bm.to_mesh(out);bm.free()
    for mat in mesh.materials:out.materials.append(mat)
    return out

for src in source_objects:
    names=[s.material.name if s.material else '' for s in src.material_slots]
    role,pair=classify(src.name,names,src.location)
    for mod in src.modifiers:
        if mod.type=='SUBSURF':
            mod.levels=min(mod.levels,2)
            if role in ('disc','caliper'):mod.levels=0
            mod.render_levels=mod.levels
    bpy.context.view_layer.update()
    deps=bpy.context.evaluated_depsgraph_get();evaluated=src.evaluated_get(deps)
    evaluated_mesh=bpy.data.meshes.new_from_object(evaluated,preserve_all_data_layers=True,depsgraph=deps)
    evaluated_mesh.transform(src.matrix_world)
    # Reduce the dense tire tessellation; preserve the authored body silhouette.
    temp=bpy.data.objects.new('evaluated-source',evaluated_mesh);bpy.context.scene.collection.objects.link(temp)
    if role=='tire':
        mod=temp.modifiers.new('Web tire optimization','DECIMATE');mod.ratio=.28
        bpy.context.view_layer.update();optimized=bpy.data.meshes.new_from_object(temp.evaluated_get(bpy.context.evaluated_depsgraph_get()),preserve_all_data_layers=True,depsgraph=bpy.context.evaluated_depsgraph_get())
        evaluated_mesh=optimized
    bpy.data.objects.remove(temp,do_unlink=True)
    center=sum((v.co for v in evaluated_mesh.vertices),Vector())/max(1,len(evaluated_mesh.vertices))
    is_wheel=role in ('wheel','tire','disc','caliper')
    sides=[1,-1] if pair and not is_wheel else [1 if center.x>=0 else -1]
    for sign in sides if pair else [0]:
        m=side_piece(evaluated_mesh,sign) if pair and not is_wheel else evaluated_mesh.copy()
        if not len(m.polygons):continue
        side='left' if sign>=0 else 'right';axle='front' if center.y<0 else 'rear'
        if is_wheel:pid=f'{side}-{axle}-{role}'
        elif role=='seat':pid='driver-seat' if sign>0 else 'passenger-seat'
        elif pair:pid=f'{side}-{role}'
        else:pid=role
        m.transform(NORM)
        original_slots=list(m.materials);m.materials.clear()
        for original in original_slots:m.materials.append(material(slot_for(original.name,role),original))
        for p in m.polygons:p.use_smooth=True
        o=bpy.data.objects.new(f'{pid}:{src.name}',m);bpy.context.scene.collection.objects.link(o);o['partId']=pid;o['sourceObject']=src.name;generated.append(o)
        if pid not in groups:
            g=bpy.data.objects.new(pid,None);bpy.context.scene.collection.objects.link(g);g['partId']=pid;groups[pid]=g
        o.parent=groups[pid]

# Separate the explicitly assigned lower carbon material from the rear fascia.
# This preserves authored face boundaries; it is not a guessed spatial cut.
for o in list(generated):
    if o.get('sourceObject')!='bumper':continue
    original_data=o.data
    painted={i for i,mat in enumerate(original_data.materials) if mat.name.startswith('paint')}
    for keep_paint in (True,False):
        bm=bmesh.new();bm.from_mesh(original_data)
        bmesh.ops.delete(bm,geom=[f for f in bm.faces if (f.material_index in painted)!=keep_paint],context='FACES')
        bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
        data=bpy.data.meshes.new('rear-fascia-segment');bm.to_mesh(data);bm.free()
        if keep_paint:
            for mat in original_data.materials:data.materials.append(mat)
            o.data=data
        else:
            data.materials.append(material('carbon'))
            for p in data.polygons:p.material_index=0;p.use_smooth=True
            d=bpy.data.objects.new('rear-diffuser:bumper-carbon',data);bpy.context.scene.collection.objects.link(d);d['partId']='rear-diffuser';d['sourceObject']='bumper:carbon-material';generated.append(d)
            if 'rear-diffuser' not in groups:
                g=bpy.data.objects.new('rear-diffuser',None);bpy.context.scene.collection.objects.link(g);g['partId']='rear-diffuser';groups['rear-diffuser']=g
            d.parent=groups['rear-diffuser']

for pid,g in groups.items():
    pts=[v.co for child in g.children for v in child.data.vertices]
    lo=Vector(tuple(min(p[i] for p in pts) for i in range(3)));hi=Vector(tuple(max(p[i] for p in pts) for i in range(3)));pivot=(lo+hi)*.5
    if pid=='hood':pivot=Vector((hi.x,0,pivot.z))
    if pid.endswith('-door'):pivot=Vector((lo.x,pivot.y,pivot.z))
    if pid.endswith(('-wheel','-tire','-disc','-caliper')):
        # All four assemblies use the same wheel-center pivot for steering/spin.
        axle='front' if '-front-' in pid else 'rear';side=1 if pid.startswith('left') else -1
        sy=-.97015 if axle=='front' else .8468;sx=side*.558
        pivot=NORM@Vector((sx,sy,.244 if axle=='front' else .252))
    g.location=pivot
    for child in g.children:child.data.transform(Matrix.Translation(-pivot))
    g['source']='Jayrenn Reeve / BlenderKit / CC0'
    g['continuousBody']=pid=='main-body'

bpy.ops.object.select_all(action='DESELECT')
for o in generated+list(groups.values()):o.select_set(True)
out=ROOT/'public/models/812-superfast-detailed.glb';out.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_apply=False,export_extras=True,export_yup=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_position_quantization=14,export_draco_normal_quantization=10,export_draco_texcoord_quantization=12)
report={'author':'Jayrenn Reeve','license':'CC0','assetBaseId':'22191abd-fa78-43e9-81fe-6cded0d53483','groupCount':len(groups),'groups':{pid:[c['sourceObject'] for c in g.children] for pid,g in groups.items()},'meshObjects':len(generated),'trianglesApprox':sum(len(o.data.loop_triangles) or sum(len(p.vertices)-2 for p in o.data.polygons) for o in generated),'glbBytes':out.stat().st_size,'notes':['Original body kept contiguous. No arbitrary body cuts.','Dense tires decimated; subdivision baked up to level 2.','PBR materials rebuilt for WebGL; original badge textures preserved.']}
(ROOT/'docs/detailed-model-processing.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps(report))
