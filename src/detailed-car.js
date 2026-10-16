import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { createCar } from './car.js';
import { buildDetailedInterior } from './interior.js';
import { buildDetailedWheels } from './wheels.js';

const labels={
  'main-body':['Body shell','Body','Artist-authored continuous roof, rear quarters and body shell. Kept intact to preserve its surface continuity.'],
  'hood':['Sculpted hood','Front','Artist-authored long bonnet with sculpted ridges and recessed vents.'],
  'front-bumper':['Front bumper','Front','Sculpted 812 nose and intake surrounds from the CC0 model.'],
  'front-grille':['Front grille','Front','Detailed central radiator grille and intake elements.'],
  'front-splitter':['Front splitter','Exterior','Separate lower nose aero element.'],
  'rear-bumper':['Rear bumper','Rear','Rear fascia and plate details from the source model.'],
  'rear-diffuser':['Rear diffuser','Exterior','Rear carbon fascia and aerodynamic trim.'],
  'taillights':['Quad taillights','Rear','Four circular lamp assemblies with glass and emissive elements.'],
  'exhaust':['Quad exhaust system','Rear','Four artist-modeled exhaust outlets.'],
  'windscreen':['Windscreen and wipers','Body','Raked front glazing, seals and detailed windscreen wipers.'],
  'rear-window':['Rear window','Body','Rear glazing with its source trim.'],
  'rear-deck':['Rear deck','Rear','Sculpted rear hatch panel and trim.'],
  'dashboard':['Dashboard','Interior','Source cockpit geometry with configurable upholstery.'],
  'steering-wheel':['Steering wheel','Interior','Source wheel and column; rotation is illustrative.'],
  'center-console':['Center console','Interior','Source console and controls.'],
  'interior-trim':['Interior trim','Interior','Interior surfaces from the source asset.'],
  'chassis':['Underbody','Mechanical','Artist-authored inner floor and lower body structure.'],
  'driver-seat':['Driver seat','Interior','Artist-modeled sport seat with configurable leather or suede finish.'],
  'passenger-seat':['Passenger seat','Interior','Artist-modeled sport seat with configurable leather or suede finish.']
};
function describe(id){
  if(labels[id])return labels[id];
  const side=id.startsWith('left-')?'Left':'Right';
  const rest=id.replace(/^(left|right)-/,'');
  const types={'door':['door','Body'],'mirror':['mirror','Body'],'headlight':['headlight','Front'],'front-fender':['front fender','Body'],'side-window':['side window','Body'],'quarter-window':['quarter window','Body']};
  if(types[rest])return [`${side} ${types[rest][0]}`,types[rest][1],'Artist-authored separated geometry from the CC0 812 model.'];
  const suffix=id.split('-').at(-1),axle=id.includes('-front-')?'front':'rear';
  const kind={wheel:'wheel',tire:'tire',disc:'brake disc',caliper:'brake caliper'}[suffix]||suffix;
  return [`${side} ${axle} ${kind}`,['disc','caliper'].includes(suffix)?'Brakes':'Wheels','Source geometry with a shared axle pivot.'];
}
export async function loadDetailedCar(onProgress=()=>{}){
  const draco=new DRACOLoader();draco.setDecoderPath('/draco/');
  const loader=new GLTFLoader();loader.setDRACOLoader(draco);
  const gltf=await loader.loadAsync('/models/812-superfast-detailed.glb',event=>onProgress(event.loaded,event.total));draco.dispose();
  const base=createCar(),root=gltf.scene,parts=new Map(),m=base.materials;
  m.glass.color.set('#17272b');m.glass.opacity=.84;m.glass.metalness=.05;
  m.headlight.color.set('#9bafb9');m.headlight.roughness=.19;
  m.taillight.emissive.set('#c00008');
  root.name='812 Superfast · Jayrenn Reeve · CC0';root.updateMatrixWorld(true);
  const nodes=[];root.traverse(o=>{
    if(o.isMesh||!o.userData.partId)return;
    let parent=o.parent;while(parent&&parent!==root){if(parent.userData.partId)return;parent=parent.parent;}
    nodes.push(o);
  });
  for(const g of nodes){
    const id=g.userData.partId,[name,category,description]=describe(id);
    const box=new THREE.Box3().setFromObject(g),center=box.getCenter(new THREE.Vector3());
    let offset=new THREE.Vector3(center.x*.5,.35,center.z*1.2);
    if(id==='hood')offset.set(-.4,1.2,0);
    if(id==='main-body')offset.set(0,.55,0);
    if(id.includes('window')||id==='windscreen')offset.y=.8;
    if(id.includes('wheel')||id.includes('tire')||id.includes('disc')||id.includes('caliper'))offset.set(0,.06,Math.sign(center.z)*1.3);
    if(id.startsWith('front-'))offset.x=-1.1;
    if(id.startsWith('rear-')||['taillights','exhaust'].includes(id))offset.x=1.1;
    g.userData={...g.userData,partId:id,name,category,description,originalPosition:g.position.clone(),originalQuaternion:g.quaternion.clone(),originalScale:g.scale.clone(),originalParent:g.parent.uuid,explodeOffset:offset,detached:false};
    g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.partId=id;const materials=Array.isArray(o.material)?o.material:[o.material];const replaced=materials.map(mat=>{const slot=mat.name.replace(/\.\d+$/,'');if(m[slot])return m[slot];return mat;});o.material=Array.isArray(o.material)?replaced:replaced[0];}});
    parts.set(id,g);
  }
  // Supporting internal mechanics were absent from the authored asset.
  // Reuse only those illustrative assemblies, with no duplicate exterior shell.
  for(const [id,g] of [...base.parts])if(id==='engine'||id==='engine-covers'||id.endsWith('-suspension')){base.root.remove(g);root.add(g);parts.set(id,g);base.parts.delete(id);g.userData.originalParent=root.uuid;}
  const wheels=[],steerable=[];
  for(const [id,g] of parts){
    if(/^(left|right)-(front|rear)-(wheel|tire|disc|caliper)$/.test(id)){g.userData.axle=id.includes('-front-')?'front':'rear';g.userData.side=id.startsWith('left-')?1:-1;steerable.push(g);}
    if(/^(left|right)-(front|rear)-(wheel|tire)$/.test(id))wheels.push(g);
    if(/^(left|right)-(front|rear)-tire$/.test(id)){
      for(const child of g.children)child.visible=false;
      const tire=base.parts.get(id).clone(true);tire.position.set(0,0,0);tire.quaternion.identity();tire.scale.setScalar(id.includes('-rear-')?1.075:1.042);tire.traverse(o=>{if(o.isMesh)o.userData.partId=id;});g.add(tire);
    }
  }
  const keepGeometry=new Set();root.traverse(o=>{if(o.geometry)keepGeometry.add(o.geometry);});base.root.traverse(o=>{if(o.geometry&&!keepGeometry.has(o.geometry))o.geometry.dispose();});
  root.updateMatrixWorld(true);
  const car={root,parts,materials:m,wheels,steerable,steering:[parts.get('steering-wheel')].filter(Boolean),source:'licensed-cc0',author:'Jayrenn Reeve',assetUrl:'https://www.blenderkit.com/asset-gallery-detail/22191abd-fa78-43e9-81fe-6cded0d53483/',dimensions:{length:4.657}};
  await buildDetailedInterior(car);
  await buildDetailedWheels(car);
  return car;
}
