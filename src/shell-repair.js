import * as THREE from 'three';

// The source objects named "door" also contain rear-quarter returns and broad
// construction faces reaching the centre line. Keep the exterior door skin,
// fix the rear skin to the body, and let the authored cabin floor replace the
// inward construction sheets. Clip triangles rather than dropping edge faces.
export function repairImportedDoorShells(car){
 const fixed=new THREE.Group();fixed.name='body-return-panels';car.root.add(fixed);car.root.updateMatrixWorld(true);const rootInverse=car.root.matrixWorld.clone().invert(),stats=[];
 const clip=(poly,distance)=>{const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=distance(a.world),db=distance(b.world),ain=da>=0,bin=db>=0;if(ain)out.push(a);if(ain!==bin){const t=da/(da-db),attrs={};for(const [key,v]of Object.entries(a.attrs))attrs[key]=v.map((n,j)=>THREE.MathUtils.lerp(n,b.attrs[key][j],t));out.push({world:a.world.clone().lerp(b.world,t),attrs});}}return out;};
 const make=(poly,bucket)=>{for(let i=1;i<poly.length-1;i++)for(const v of [poly[0],poly[i],poly[i+1]])for(const [key,data]of Object.entries(v.attrs))bucket[key].push(...data);};
 for(const side of ['left','right']){
  const g=car.parts.get(side+'-door'),sign=side==='left'?1:-1,objects=[];g.traverse(o=>{if(o.isMesh)objects.push(o);});let input=0,doorCount=0,fixedCount=0;
  for(const o of objects){const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone(),attrs=Object.entries(geo.attributes).filter(([key])=>['position','normal','uv'].includes(key)),buckets=new Map();
   const get=(material,fixed)=>{const key=(Array.isArray(o.material)?o.material.indexOf(material):0)+':'+fixed;if(!buckets.has(key))buckets.set(key,{material,fixed,attrs:Object.fromEntries(attrs.map(([key])=>[key,[]]))});return buckets.get(key).attrs;};
   for(let i=0;i<geo.attributes.position.count;i+=3){input++;const group=geo.groups.find(x=>i>=x.start&&i<x.start+x.count),material=Array.isArray(o.material)?o.material[group?.materialIndex||0]:o.material;
    const points=[0,1,2].map(j=>({attrs:Object.fromEntries(attrs.map(([key,a])=>[key,Array.from(a.array.slice((i+j)*a.itemSize,(i+j+1)*a.itemSize))])),world:new THREE.Vector3().fromBufferAttribute(geo.attributes.position,i+j).applyMatrix4(o.matrixWorld)}));
    const exterior=clip(points,p=>sign*p.z-.63),door=clip(clip(exterior,p=>.90-p.x),p=>sign*p.z-.75),rear=clip(exterior,p=>p.x-.90);
    if(door.length>=3){doorCount+=door.length-2;make(door,get(material,false));}if(rear.length>=3){fixedCount+=rear.length-2;make(rear,get(material,true));}
   }
   for(const b of buckets.values()){if(!b.attrs.position.length)continue;const geometry=new THREE.BufferGeometry();for(const [key,array]of Object.entries(b.attrs))geometry.setAttribute(key,new THREE.Float32BufferAttribute(array,geo.attributes[key].itemSize));
    const mesh=new THREE.Mesh(geometry,b.material);mesh.castShadow=mesh.receiveShadow=true;
    if(b.fixed){geometry.applyMatrix4(rootInverse.clone().multiply(o.matrixWorld));mesh.userData.partId='body-return-panels';fixed.add(mesh);}else{mesh.matrix.copy(o.matrix);mesh.matrixAutoUpdate=false;mesh.userData.partId=side+'-door';o.parent.add(mesh);}
   }
   o.removeFromParent();o.geometry.dispose();geo.dispose();
  }
  // The artist object's origin sits deep inside the cabin. Rebase without
  // changing the closed skin, so opening swings about the outer hinge region.
  g.updateMatrix();const oldMatrix=g.matrix.clone();g.position.set(-.88,.622,sign*.86);g.updateMatrix();const compensation=g.matrix.clone().invert().multiply(oldMatrix);for(const child of g.children)child.applyMatrix4(compensation);g.userData.originalPosition=g.position.clone();
  stats.push({id:side+'-door',inputTriangles:input,doorTriangles:doorCount,fixedRearTriangles:fixedCount,hingePoint:g.position.toArray(),hingeBasis:'Reconstructed outer hinge region; not a measured factory hinge axis.'});
 }
 fixed.userData={partId:fixed.name,name:'Fixed rear body returns',category:'Body',description:'Retained exterior rear-side surfaces separated from the source door objects. Inward construction sheets replaced by the fitted cabin floor.',originalPosition:fixed.position.clone(),originalQuaternion:fixed.quaternion.clone(),originalScale:fixed.scale.clone(),originalParent:car.root.uuid,explodeOffset:new THREE.Vector3(.4,.3,0),detached:false,source:'Jayrenn Reeve / CC0 body mesh'};car.parts.set(fixed.name,fixed);car.shellRepair={version:'door-shell-repair-v1',stats};
}
