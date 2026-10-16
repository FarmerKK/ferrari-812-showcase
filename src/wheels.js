import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU=Math.PI*2;
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const smooth=t=>t*t*(3-2*t);
const polar=(r,a,z)=>V(Math.sin(a)*r,Math.cos(a)*r,z);

function add(g,geometry,material,feature){
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;
  mesh.userData.wheelFeature=feature;g.add(mesh);return mesh;
}
function lathe(profile){
  const geometry=new THREE.LatheGeometry(profile.map(([r,z])=>new THREE.Vector2(r,z)),128);
  geometry.rotateX(Math.PI/2);
  const p=geometry.attributes.position,index=geometry.index;let volume=0;
  const a=V(),b=V(),c=V();for(let i=0;i<index.count;i+=3){a.fromBufferAttribute(p,index.getX(i));b.fromBufferAttribute(p,index.getX(i+1));c.fromBufferAttribute(p,index.getX(i+2));volume+=a.dot(b.cross(c));}
  if(volume<0){for(let i=0;i<index.count;i+=3){const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);}geometry.computeVertexNormals();}
  return geometry;
}
function ring(g,m,r,t,z,feature){
  const mesh=add(g,new THREE.TorusGeometry(r,t,10,128),m,feature);mesh.position.z=z;return mesh;
}
function extruded(shape,depth,bevel){
  return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:48,steps:1});
}

// Swept, closed forged sections. The crown, beveled shoulders and rear web
// occupy separate depths; the spokes curve from the inset hub to the rim lip.
function spokeGeometry(angle,branch,rear,star=false){
  const positions=[],indices=[],uv=[],rings=28;
  const section=[[-.50,-.20],[-.46,-.055],[-.34,.02],[0,.065],[.34,.02],[.46,-.055],[.50,-.20],[.45,-.78],[.30,-1],[-.30,-1],[-.45,-.78]];
  const hub=rear?.079:.097,outer=rear?.151:.144;
  for(let i=0;i<=rings;i++){
    const t=i/rings,r=THREE.MathUtils.lerp(.048,.257,t);
    const a=angle+(star?.040*Math.sin(t*Math.PI):branch*(.035+.095*smooth(t)))+.025*t*t;
    const width=star?THREE.MathUtils.lerp(.047,.025,t)+.004*Math.sin(t*Math.PI):THREE.MathUtils.lerp(.021,.0135,t)+.0028*Math.sin(t*Math.PI);
    const front=hub+(outer-hub)*smooth(t),thickness=THREE.MathUtils.lerp(.030,.019,t);
    for(let j=0;j<section.length;j++){
      const [w,d]=section[j],p=polar(r,a,front+d*thickness);
      p.x+=Math.cos(a)*w*width;p.y-=Math.sin(a)*w*width;
      positions.push(p.x,p.y,p.z);uv.push(j/section.length,t);
    }
  }
  const count=section.length;
  for(let i=0;i<rings;i++)for(let j=0;j<count;j++){
    const a=i*count+j,b=i*count+(j+1)%count,c=a+count,d=b+count;
    indices.push(a,b,c,b,d,c);
  }
  for(let j=1;j<count-1;j++){indices.push(0,j+1,j);const end=rings*count;indices.push(end,end+j,end+j+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}

function hubGeometry(front){
  const shape=new THREE.Shape();shape.absarc(0,0,.063,0,TAU,false);
  const center=new THREE.Path();center.absarc(0,0,.0228,0,TAU,true);shape.holes.push(center);
  for(let i=0;i<5;i++){
    const a=(i+.5)*TAU/5,p=polar(.046,a,0),hole=new THREE.Path();
    hole.absarc(p.x,p.y,.0091,0,TAU,true);shape.holes.push(hole);
  }
  const geometry=extruded(shape,.018,.0014);geometry.translate(0,0,front-.020);return geometry;
}
function boltGeometry(){
  const shape=new THREE.Shape();for(let j=0;j<6;j++){const a=j*TAU/6,p=polar(.0063,a,0);if(j)shape.lineTo(p.x,p.y);else shape.moveTo(p.x,p.y);}shape.closePath();
  return extruded(shape,.0065,.00055);
}
async function centerCapTexture(){
  const image=(await new THREE.TextureLoader().loadAsync('/textures/source-ferrari-badge.png')).image;
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
  ctx.drawImage(image,99,74,137,174,44,18,168,215);const pixels=ctx.getImageData(0,0,256,256);
  for(let i=0;i<pixels.data.length;i+=4){const dark=pixels.data[i]+pixels.data[i+1]+pixels.data[i+2]<220&&pixels.data[i+3]>0;pixels.data[i]=dark?18:239;pixels.data[i+1]=dark?20:193;pixels.data[i+2]=dark?19:35;pixels.data[i+3]=255;}
  ctx.putImageData(pixels,0,0);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map;
}

export async function buildDetailedWheels(car){
  const m=car.materials;
  m.rim=new THREE.MeshPhysicalMaterial({name:'Forged alloy finish',color:m.rim.color,metalness:.94,roughness:.22,clearcoat:.22,clearcoatRoughness:.28});
  m.wheelBarrel=new THREE.MeshStandardMaterial({name:'Inner alloy barrel',color:'#343a40',metalness:.86,roughness:.38});
  m.wheelHardware=new THREE.MeshStandardMaterial({name:'Machined wheel hardware',color:'#a2a8ae',metalness:.94,roughness:.25});
  m.wheelSeal=new THREE.MeshStandardMaterial({name:'Wheel valve rubber',color:'#121619',roughness:.79});
  m.wheelCap=new THREE.MeshPhysicalMaterial({name:'Enamel center cap',map:await centerCapTexture(),metalness:.15,roughness:.28,clearcoat:.75,clearcoatRoughness:.16});
  for(const [id,g]of car.parts){
    if(!/^(left|right)-(front|rear)-wheel$/.test(id))continue;
    const rear=id.includes('-rear-'),side=id.startsWith('left-')?1:-1,front=rear?.158:.151,back=rear?-.153:-.132,hub=rear?.079:.097;
    const old=new Set();g.traverse(o=>{if(o.geometry)old.add(o.geometry);});g.clear();old.forEach(x=>x.dispose());
    const assembly=new THREE.Group();assembly.name='forged-wheel-assembly';assembly.scale.z=side;g.add(assembly);
    // Rolled flanges, bead seats, safety humps and the drop centre are a single
    // hollow rotational section, rather than overlapping decorative hoops.
    const barrel=[
      [.249,front-.012],[.251,front-.004],[.258,front+.001],[.263,front],[.266,front-.004],
      [.266,front-.011],[.261,front-.017],[.257,front-.023],[.256,front-.036],
      [.253,front-.042],[.248,front-.048],[.246,.040],[.238,.009],[.238,-.024],
      [.247,-.041],[.251,back+.034],[.255,back+.025],[.257,back+.014],
      [.263,back+.010],[.265,back+.004],[.263,back],[.254,back-.001],
      [.250,back+.005],[.249,back+.026],[.244,-.045],[.234,-.028],
      [.234,.012],[.242,.044],[.245,front-.047],[.247,front-.030],[.249,front-.012]
    ];
    const barrelGeometry=lathe(barrel),segments=barrel.length-1;
    // Coat the flange on the same solid; a second coincident lip would flicker.
    const coating=[[],[]],index=barrelGeometry.index;
    for(let i=0;i<128;i++)for(let j=0;j<segments;j++){const bucket=coating[j<10||j>=27?1:0],start=(i*segments+j)*6;for(let k=0;k<6;k++)bucket.push(index.getX(start+k));}
    barrelGeometry.setIndex([...coating[0],...coating[1]]);barrelGeometry.addGroup(0,coating[0].length,0);barrelGeometry.addGroup(coating[0].length,coating[1].length,1);
    const barrelMesh=add(assembly,barrelGeometry,[m.wheelBarrel,m.rim],'formed-hollow-barrel');barrelMesh.userData.wheelFeatures=['formed-hollow-barrel','rolled-rim-flange'];
    ring(assembly,m.wheelHardware,.2625,.00065,front+.0001,'machined-lip-edge');
    for(const style of ['split-spoke','forged-star']){
      const group=new THREE.Group();group.name=style;assembly.add(group);group.visible=style==='split-spoke';const geos=[];
      for(let i=0;i<5;i++)for(const branch of style==='split-spoke'?[-1,1]:[0])geos.push(spokeGeometry(i*TAU/5,branch,rear,style==='forged-star'));
      const merged=mergeGeometries(geos);geos.forEach(x=>x.dispose());add(group,merged,m.rim,style==='split-spoke'?'concave-split-spokes':'concave-star-spokes');
    }
    add(assembly,hubGeometry(hub),m.rim,'five-recess-hub');
    // Enclose the mounting bell behind the hub, returning into the retained
    // brake annulus so there is no open tunnel to the suspension through it.
    add(assembly,lathe([[.024,hub-.018],[.059,hub-.018],[.064,hub-.028],[.067,-.038],[.103,-.060],[.112,-.067],[.112,-.083],[.101,-.083],[.060,-.050],[.053,hub-.028],[.024,hub-.028],[.024,hub-.018]]),m.wheelBarrel,'closed-wheel-mount');
    const seats=[],bolts=[];
    for(let i=0;i<5;i++){
      const p=polar(.046,(i+.5)*TAU/5,0);
      const seat=lathe([[.0092,hub-.0005],[.0088,hub-.002],[.0065,hub-.007],[.0064,hub-.012],[.0088,hub-.012],[.0092,hub-.0005]]);seat.translate(p.x,p.y,0);seats.push(seat);
      const bolt=boltGeometry();bolt.translate(p.x,p.y,hub-.009);bolts.push(bolt);
    }
    add(assembly,mergeGeometries(seats),m.wheelBarrel,'countersunk-bolt-seats');seats.forEach(x=>x.dispose());
    add(assembly,mergeGeometries(bolts),m.wheelHardware,'five-hex-lug-bolts');bolts.forEach(x=>x.dispose());
    ring(assembly,m.wheelSeal,.0221,.0014,hub+.001,'center-cap-seal');
    ring(assembly,m.wheelHardware,.0218,.0007,hub+.002,'center-cap-bezel');
    add(assembly,lathe([[0,hub+.003],[.019,hub+.003],[.021,hub+.002],[.021,hub-.004],[0,hub-.004]]),m.wheelHardware,'center-cap-body');
    const cap=add(assembly,new THREE.CircleGeometry(.0208,64),m.wheelCap,'horse-enamel-cap');cap.position.z=hub+.0033;
    const valve=polar(.246,.59,front-.009);
    const stem=add(assembly,new THREE.CylinderGeometry(.0024,.0031,.012,16),m.wheelSeal,'tire-valve-stem');stem.rotation.x=Math.PI/2;stem.position.copy(valve);
    const valveCap=add(assembly,new THREE.CylinderGeometry(.0031,.0031,.004,12),m.wheelHardware,'valve-dust-cap');valveCap.rotation.x=Math.PI/2;valveCap.position.copy(valve).z+=.007;
    g.userData.description='Sculpted 20-inch alloy: concave forged spokes, closed beveled sections, formed hollow barrel, five recessed lug bolts, enamel horse cap and tire valve.';
    g.userData.wheelDetailVersion='812-forged-wheels-v1';g.userData.spokeDishMeters=rear?.072:.047;
    g.traverse(o=>{if(o.isMesh)o.userData.partId=id;});
  }
  car.wheelDetails={version:'812-forged-wheels-v1',rimDiameterMeters:.532,frontDishMeters:.047,rearDishMeters:.072};
}
