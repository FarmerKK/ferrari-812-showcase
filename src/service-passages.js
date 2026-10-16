import * as THREE from 'three';

// Open reconstructed service inlets through the retained exhaust-bay covers.
// Convex-prism subtraction clips the actual triangles, preserving their UVs and
// material groups. Cutters are confined to the concealed front of the covers.
export function openExhaustServicePassages(car){
 const part=car.parts.get('rear-diffuser'),meshes=[],old=new Set();car.root.updateMatrixWorld(true);part.traverse(o=>{if(o.isMesh)meshes.push(o);});
 const cutters=[];
 for(const sign of [-1,1]){
  const points=[[1.70,.165,sign*.71],[1.77,.165,sign*.71],[1.83,.36,sign*.71],[1.94,.36,sign*.70]].map(p=>new THREE.Vector3(...p));
  for(let i=0;i<points.length-1;i++){
   const a=points[i],b=points[i+1],axis=b.clone().sub(a).normalize(),u=axis.clone().cross(Math.abs(axis.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0)).normalize(),v=axis.clone().cross(u),r=.040;
   const planes=[p=>axis.dot(p.clone().sub(a))+.045,p=>axis.dot(b.clone().sub(p))+.045];
   for(let j=0;j<20;j++){const t=j*Math.PI*2/20,n=u.clone().multiplyScalar(Math.cos(t)).addScaledVector(v,Math.sin(t));planes.push(p=>r-n.dot(p.clone().sub(a)));}
   cutters.push({planes,box:new THREE.Box3().setFromPoints([a,b]).expandByScalar(.085)});
  }
 }
 const clip=(poly,distance,inside)=>{const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=distance(a.world),db=distance(b.world),ain=inside?da>=0:da<=0,bin=inside?db>=0:db<=0;if(ain)out.push(a);if(ain!==bin){const t=da/(da-db);out.push({world:a.world.clone().lerp(b.world,t),attrs:Object.fromEntries(Object.entries(a.attrs).map(([key,data])=>[key,data.map((n,j)=>THREE.MathUtils.lerp(n,b.attrs[key][j],t))]))});}}return out;};
 let input=0,output=0;
 for(const mesh of meshes){
  const source=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone(),attrs=Object.entries(source.attributes),buckets=new Map();
  for(let i=0;i<source.attributes.position.count;i+=3){input++;const group=source.groups.find(g=>i>=g.start&&i<g.start+g.count),slot=group?.materialIndex||0;if(!buckets.has(slot))buckets.set(slot,Object.fromEntries(attrs.map(([key])=>[key,[]])));const bucket=buckets.get(slot);
   let polygons=[[0,1,2].map(j=>({world:new THREE.Vector3().fromBufferAttribute(source.attributes.position,i+j).applyMatrix4(mesh.matrixWorld),attrs:Object.fromEntries(attrs.map(([key,a])=>[key,Array.from(a.array.slice((i+j)*a.itemSize,(i+j+1)*a.itemSize))]))}))];
   for(const cutter of cutters){const remaining=[];for(const polygon of polygons){if(!cutter.box.intersectsBox(new THREE.Box3().setFromPoints(polygon.map(v=>v.world)))){remaining.push(polygon);continue;}let inside=polygon;for(const plane of cutter.planes){if(inside.length<3)break;const outside=clip(inside,plane,false);if(outside.length>=3)remaining.push(outside);inside=clip(inside,plane,true);}}polygons=remaining;}
   for(const polygon of polygons)for(let j=1;j<polygon.length-1;j++){output++;for(const vertex of [polygon[0],polygon[j],polygon[j+1]])for(const [key,data]of Object.entries(vertex.attrs))bucket[key].push(...data);}
  }
  const geometry=new THREE.BufferGeometry(),arrays=Object.fromEntries(attrs.map(([key])=>[key,[]]));let start=0;
  for(const [slot,bucket]of buckets){const count=bucket.position.length/3;geometry.addGroup(start,count,slot);start+=count;for(const [key,data]of Object.entries(bucket))arrays[key].push(...data);}
  for(const [key,data]of Object.entries(arrays))geometry.setAttribute(key,new THREE.Float32BufferAttribute(data,source.attributes[key].itemSize));geometry.normalizeNormals();old.add(mesh.geometry);mesh.geometry=geometry;source.dispose();
 }
 const retained=new Set();car.root.traverse(o=>{if(o.geometry)retained.add(o.geometry);});for(const geometry of old)if(!retained.has(geometry))geometry.dispose();
 part.userData.servicePassages={radius:.040,inputTriangles:input,outputTriangles:output,basis:'Reconstructed pipe-clearance inlets in the concealed front exhaust covers; exterior diffuser fins retained.'};
}
