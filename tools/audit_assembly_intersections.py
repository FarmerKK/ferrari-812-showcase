"""Surface-intersection audit of assembled semantic groups, without executing asset scripts."""
import bpy, sys, json
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from mathutils.geometry import intersect_ray_tri
from itertools import combinations

model, output = map(Path, sys.argv[sys.argv.index('--')+1:][:2])
options=sys.argv[sys.argv.index('--')+1:]
pose=options[2] if len(options)>2 else 'neutral'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(model.resolve()))
roots=[o for o in bpy.context.scene.objects if o.type=='EMPTY' and o.get('partId') and o.get('originalPosition') is not None]
def has_root_parent(o):
    p=o.parent
    while p:
        if p in roots: return True
        p=p.parent
    return False
roots=[o for o in roots if not has_root_parent(o)]
groups={}
by_id={o['partId']:o for o in roots}
moving=set()
def motion(root):
    part=root['partId'];angle=0;axis='Z';pivot=root.matrix_world.translation.copy()
    if pose in ['steer-negative','steer-positive'] and part in {f'{s}-front-{p}' for s in ['left','right'] for p in ['wheel','tire','disc','caliper']}:
        angle=-.45 if pose=='steer-negative' else .45
    if pose=='panels-open':
        for side,sign in [('left',1),('right',-1)]:
            if part in [f'{side}-{p}' for p in ['door','side-window','mirror','door-panel']]:
                angle=-sign*.78;pivot=by_id[f'{side}-door'].matrix_world.translation.copy()
        if part=='hood':angle=.88;axis='Y'
    if not angle:return Matrix.Identity(4)
    moving.add(part)
    return Matrix.Translation(pivot)@Matrix.Rotation(angle,4,axis)@Matrix.Translation(-pivot)
def mesh_motion(o,root):
    if pose not in ['steer-negative','steer-positive']:return Matrix.Identity(4)
    convert=lambda p:Vector((p[0],-p[2],p[1]))
    angle=-.45 if pose=='steer-negative' else .45
    if o.get('steerWithWheel') is not None:
        pivot=convert(o['steeringWheelCenter']);moving.add(root['partId'])
        return Matrix.Translation(pivot)@Matrix.Rotation(angle,4,'Z')@Matrix.Translation(-pivot)
    if o.get('steeringSide') is None:return Matrix.Identity(4)
    a=convert(o['steeringInboard']);b=convert(o['steeringOutboard']);pivot=convert(o['steeringWheelCenter'])
    after=pivot+Matrix.Rotation(angle,3,'Z')@(b-pivot)
    before_axis=b-a;after_axis=after-a
    q1=Vector((0,0,1)).rotation_difference(before_axis);q2=Vector((0,0,1)).rotation_difference(after_axis)
    moving.add(root['partId'])
    return Matrix.Translation((a+after)/2)@q2.to_matrix().to_4x4()@Matrix.Diagonal(Vector((1,1,after_axis.length/before_axis.length,1)))@q1.inverted().to_matrix().to_4x4()@Matrix.Translation(-(a+b)/2)
for root in roots:
    verts, faces=[], []
    transform=motion(root)
    for o in root.children_recursive:
        if o.type!='MESH': continue
        mesh=o.data; mesh.calc_loop_triangles(); base=len(verts)
        local_motion=mesh_motion(o,root)
        verts.extend(transform@local_motion@o.matrix_world@v.co for v in mesh.vertices)
        faces.extend(tuple(base+i for i in t.vertices) for t in mesh.loop_triangles)
    if not faces: continue
    low=Vector(tuple(min(v[i] for v in verts) for i in range(3)))
    high=Vector(tuple(max(v[i] for v in verts) for i in range(3)))
    groups[root['partId']]={'tree':BVHTree.FromPolygons(verts,faces,all_triangles=True,epsilon=0.0),'min':low,'max':high,'triangles':len(faces),'verts':verts,'faces':faces,'new':bool(root.get('mechanicalRevision'))}
def narrow_phase(A,B):
    eps=1e-6
    n=(A[1]-A[0]).cross(A[2]-A[0]); m=(B[1]-B[0]).cross(B[2]-B[0])
    if n.length_squared<1e-20 or m.length_squared<1e-20: return None
    n.normalize();m.normalize()
    d=[n.dot(p-A[0]) for p in B]; e=[m.dot(p-B[0]) for p in A]
    if min(d)>eps or max(d)<-eps or min(e)>eps or max(e)<-eps:return None
    if n.cross(m).length_squared<1e-12:
        if max(abs(x) for x in d)>eps:return None
        drop=max(range(3),key=lambda i:abs(n[i])); axes=[i for i in range(3) if i!=drop]
        a=[(p[axes[0]],p[axes[1]]) for p in A];b=[(p[axes[0]],p[axes[1]]) for p in B]
        for triangle in [a,b]:
            for i in range(3):
                p,q=triangle[i],triangle[(i+1)%3];axis=(q[1]-p[1],p[0]-q[0])
                x=[t[0]*axis[0]+t[1]*axis[1] for t in a];y=[t[0]*axis[0]+t[1]*axis[1] for t in b]
                if max(x)<min(y)-eps or max(y)<min(x)-eps:return None
        return (A[0]+A[1]+A[2]+B[0]+B[1]+B[2])/6
    for triangle,target in [(A,B),(B,A)]:
        for i in range(3):
            start,end=triangle[i],triangle[(i+1)%3];direction=end-start
            if direction.length_squared<1e-20:continue
            point=intersect_ray_tri(*target,direction,start,True)
            if point is not None:
                t=(point-start).dot(direction)/direction.length_squared
                if -eps<=t<=1+eps:return point
    return None
rows=[]
for (a,A),(b,B) in combinations(groups.items(),2):
    if pose!='neutral' and a not in moving and b not in moving:continue
    if any(A['max'][i]<B['min'][i] or B['max'][i]<A['min'][i] for i in range(3)): continue
    candidates=A['tree'].overlap(B['tree']);hits=[];points=[];sample_triangles=[]
    for i,j in candidates:
        triangleA=[A['verts'][v] for v in A['faces'][i]];triangleB=[B['verts'][v] for v in B['faces'][j]]
        point=narrow_phase(triangleA,triangleB)
        if point is not None:
            hits.append((i,j))
            if len(points)<8:points.append([point.x,point.z,-point.y])
            if not sample_triangles:sample_triangles=[[[p.x,p.z,-p.y] for p in tri] for tri in [triangleA,triangleB]]
    if hits:
        lo=[max(A['min'][i],B['min'][i]) for i in range(3)]
        hi=[min(A['max'][i],B['max'][i]) for i in range(3)]
        rows.append({'a':a,'b':b,'trianglePairs':len(hits),'bvhCandidatePairs':len(candidates),'newMechanicalPair':A['new'] or B['new'],'aabbOverlapMeters':[hi[i]-lo[i] for i in range(3)],'samplePointsThreeJsMeters':points,'firstTrianglePairThreeJsMeters':sample_triangles})
rows.sort(key=lambda x:(not x['newMechanicalPair'],-x['trianglePairs']))
report={'pose':pose,'movingParts':sorted(moving),'method':'World-space BVH candidate pairs followed by triangle-plane rejection, segment/triangle intersection and coplanar SAT. Contacts/fastening joints require interpretation. Motion reports sample the UI limit poses, not a continuous sweep. Does not prove absence of fully-contained volumes or collision-free motion.','groups':len(groups),'pairs':rows,'intersectingPairCount':len(rows),'newMechanicalPairCount':sum(x['newMechanicalPair'] for x in rows)}
output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'groups':len(groups),'pairs':len(rows),'newMechanicalPairs':report['newMechanicalPairCount']}))
