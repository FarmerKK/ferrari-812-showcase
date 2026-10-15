import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import optimer from 'three/examples/fonts/optimer_regular.typeface.json';
import helvetiker from 'three/examples/fonts/helvetiker_bold.typeface.json';
const V=(x,y,z)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const mesh=(g,geo,mat,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;};
const box=(g,m,x,y,z,w,h,d,r=.006)=>mesh(g,new RoundedBoxGeometry(w,h,d,5,Math.min(r,w/2,h/2,d/2)),m,x,y,z);
function texture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
function face(g,t,x,y,z,w,h,glow=.12){const o=mesh(g,new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:'#ffffff',emissiveIntensity:glow,roughness:.58,transparent:true}),x,y,z);o.rotation.y=Math.PI/2;return o;}
function disc(g,m,x,y,z,r){const o=mesh(g,new THREE.CircleGeometry(r,96),m,x,y,z);o.rotation.y=Math.PI/2;return o;}
function ring(g,m,x,y,z,r,t=.001){const o=mesh(g,new THREE.TorusGeometry(r,t,12,96),m,x,y,z);o.rotation.y=Math.PI/2;return o;}
function tube(g,m,points,r=.001,closed=false){return mesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,closed,'centripetal'),Math.max(64,points.length*4),r,10,closed),m);}
function hexCell(g,m,x,y,z,r){const path=new THREE.CurvePath();const points=Array.from({length:7},(_,i)=>V(x,y+Math.sin(i/6*TAU)*r,z+Math.cos(i/6*TAU)*r));for(let i=0;i<6;i++)path.add(new THREE.LineCurve3(points[i],points[i+1]));return mesh(g,new THREE.TubeGeometry(path,12,.00025,4,true),m);}
function patch(g,m,rows,cols,fn){const p=[],uv=[],idx=[];for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){p.push(...fn(i/rows,j/cols).toArray());uv.push(i/rows,j/cols);}for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;idx.push(a,b,a+1,b,b+1,a+1);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();return mesh(g,geo,m);}
function polygon(g,m,points,x,depth=.004,bevel=.0015){const s=new THREE.Shape();points.forEach(([u,v],i)=>i?s.lineTo(u,v):s.moveTo(u,v));s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:32});const o=mesh(g,geo,m,x);o.rotation.y=Math.PI/2;return o;}
function softPolygon(g,m,points,x,depth=.004,bevel=.0015){const c=contour(points);return polygon(g,m,Array.from({length:96},(_,i)=>{const p=c.getPoint(i/96);return [p.x,p.y];}),x,depth,bevel);}
function contour(points){return new THREE.CatmullRomCurve3(points.map(([u,v])=>V(u,v,0)),true,'centripetal');}
function shell(g,m,outline,sections){const curve=contour(outline),sectionCurve=new THREE.CatmullRomCurve3(sections.map(([x,w,h])=>V(x,w,h)),false,'centripetal');return patch(g,m,64,128,(t,v)=>{const s=sectionCurve.getPoint(t),p=curve.getPoint(v);return V(s.x,p.y*s.z,-p.x*s.y);});}
function lathe(g,m,profile,x=0,y=0,z=0){const o=mesh(g,new THREE.LatheGeometry(profile.map(([r,d])=>new THREE.Vector2(r,d)),96),m,x,y,z);o.rotation.z=-Math.PI/2;return o;}
function stitched(g,m,points){const c=new THREE.CatmullRomCurve3(points,false,'centripetal'),n=Math.ceil(c.getLength()/.0034);for(let i=0;i<n;i++){const a=c.getPoint(i/n),b=c.getPoint(Math.min(1,(i+.5)/n)),d=b.clone().sub(a);const o=mesh(g,new THREE.CylinderGeometry(.00024,.00024,d.length(),4),m);o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());o.position.copy(a.add(b).multiplyScalar(.5));}}
function paddedFace(g,m,outline,x,depth){const c=contour(outline);return patch(g,m,40,128,(t,v)=>{const p=c.getPoint(1-v),r=Math.sin(t*Math.PI/2);return V(x+depth*Math.cos(t*Math.PI/2),p.y*r,-p.x*r);});}
function legend(text,color='#d2d6dc',bg=null){return texture(512,128,(c,w,h)=>{if(bg){c.fillStyle=bg;c.fillRect(0,0,w,h);}c.fillStyle=color;c.font='500 64px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2,w*.94);});}
function closedSweep(g,m,sample,rows=96,slices=64){
  const body=patch(g,m,rows,slices,sample);
  // Return surfaces at both ends prevent the sheet-like open edges seen in close-ups.
  for(const t of [0,1]){const points=Array.from({length:slices},(_,i)=>sample(t,i/slices)),center=points.reduce((a,p)=>a.add(p),V(0,0,0)).multiplyScalar(1/slices),positions=[],uv=[];
    const inward=sample(t===0?.001:.999,0).sub(sample(t,0));
    for(let i=0;i<slices;i++){const a=points[i],b=points[(i+1)%slices],cross=a.clone().sub(center).cross(b.clone().sub(center));const tri=cross.dot(inward)<0?[center,a,b]:[center,b,a];for(const p of tri){positions.push(...p.toArray());uv.push(p.x*3,p.y*3);}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();mesh(g,geo,m);
  }return body;
}
function raisedWordmark(g,m,x,y,z){const geo=new TextGeometry('Ferrari',{font:new FontLoader().parse(optimer),size:.0135,depth:.0008,curveSegments:8,bevelEnabled:true,bevelSize:.00012,bevelThickness:.00012,bevelSegments:2});geo.computeBoundingBox();const width=geo.boundingBox.max.x-geo.boundingBox.min.x;const o=mesh(g,geo,m,x,y,z+width/2);o.rotation.y=Math.PI/2;o.userData.cockpitFeature='raised-metal-wordmark';return o;}
const passengerBlend=z=>THREE.MathUtils.smoothstep(-z,.26,.36);
const passengerEdge=z=>.729+.116*Math.exp(-(((z+.645)/.065)**4))+.112*Math.exp(-(((z+.27)/.065)**4));
function passengerBadge(g,m){
  const geos=[new TextGeometry('812',{font:new FontLoader().parse(helvetiker),size:.012,depth:.00075,curveSegments:6,bevelEnabled:true,bevelSize:.00010,bevelThickness:.00010,bevelSegments:2}),new TextGeometry('superfast',{font:new FontLoader().parse(optimer),size:.011,depth:.00075,curveSegments:6,bevelEnabled:true,bevelSize:.00010,bevelThickness:.00010,bevelSegments:2})];
  const widths=geos.map(geo=>{geo.computeBoundingBox();return geo.boundingBox.max.x-geo.boundingBox.min.x;}),total=widths[0]+widths[1]+.003;let offset=0;
  for(const [i,geo]of geos.entries()){const p=geo.attributes.position;for(let j=0;j<p.count;j++){const u=p.getX(j)+offset+p.getY(j)*.22,z=-.486+total/2-u,y=.752+p.getY(j);p.setXYZ(j,upperSurfaceX(y,z)+.0008+p.getZ(j),y,z);}geo.computeVertexNormals();mesh(g,geo,m).userData.cockpitFeature='passenger-812-metal-badge';offset+=widths[i]+.003;}
}

export function prepareCockpitMaterials(m){
  const perf=texture(512,512,c=>{c.fillStyle='#e4e4e4';c.fillRect(0,0,512,512);for(let y=0;y<9;y++)for(let x=0;x<9;x++){const px=x*64+(y%2?32:0),py=y*64;const grad=c.createRadialGradient(px-2,py-2,1,px,py,8);grad.addColorStop(0,'#151515');grad.addColorStop(.55,'#555');grad.addColorStop(1,'#e4e4e4');c.fillStyle=grad;c.beginPath();c.arc(px,py,8,0,TAU);c.fill();}});perf.wrapS=perf.wrapT=THREE.RepeatWrapping;perf.repeat.set(40,4);
  perf.repeat.set(12,6);m.perforated=m.seat.clone();m.perforated.map=perf;m.perforated.bumpMap=perf;m.perforated.bumpScale=.00035;m.perforated.normalMap=null;m.perforated.roughnessMap=null;m.perforated.roughness=.62;m.hoodLeather=m.perforated.clone();m.hoodLeather.map=perf.clone();m.hoodLeather.map.repeat.set(10,34);m.hoodLeather.bumpMap=m.hoodLeather.map;m.hoodLeather.bumpScale=.00016;m.hoodLeather.color.set('#17191c');m.hoodLeather.roughness=.56;
  const weave=texture(512,512,c=>{for(let y=0;y<32;y++)for(let x=0;x<32;x++){const vertical=(x-y+64)%4<2;const grd=c.createLinearGradient(x*16,y*16,x*16+(vertical?16:0),y*16+(vertical?0:16));grd.addColorStop(0,'#353a40');grd.addColorStop(.45,'#92989e');grd.addColorStop(1,'#30353a');c.fillStyle=grd;c.fillRect(x*16,y*16,16,16);c.strokeStyle='#ffffff0b';for(let k=2;k<16;k+=3){c.beginPath();c.moveTo(x*16+(vertical?k:0),y*16+(vertical?0:k));c.lineTo(x*16+(vertical?k:16),y*16+(vertical?16:k));c.stroke();}}});weave.wrapS=weave.wrapT=THREE.RepeatWrapping;weave.repeat.set(3,3);m.cabinCarbon.map=weave;m.cabinCarbon.color.set('#a3a9af');m.cabinCarbon.roughness=.31;m.cabinCarbon.clearcoat=.8;m.cabinCarbon.clearcoatRoughness=.15;
  weave.repeat.set(10,10);m.cabinCarbon.color.set('#62686e');
  m.satin=new THREE.MeshPhysicalMaterial({color:'#8b9298',metalness:.88,roughness:.29,clearcoat:.12});m.darkMetal=new THREE.MeshStandardMaterial({color:'#363c44',metalness:.6,roughness:.34});m.gaugeGlass=new THREE.MeshPhysicalMaterial({color:'#b5c6d8',transparent:true,opacity:.075,roughness:.1,metalness:.15,depthWrite:false});
  m.columnRubber=m.cabinRubber.clone();m.columnRubber.roughness=.55;m.columnRubber.name='Steering column shroud';
  m.lowerDash=m.seat.clone();m.lowerDash.name='Lower dashboard leather';m.lowerDash.color.set('#835b40');m.lowerDash.roughness=.66;m.lowerDash.normalScale.set(.10,.10);
  m.gloveAccent=m.lowerDash.clone();m.gloveAccent.color.set('#281e1b');
  m.ventMetal=new THREE.MeshPhysicalMaterial({name:'Anodized vent housing',color:'#454b52',metalness:.83,roughness:.29,clearcoat:.18});
  m.fasciaGlass=new THREE.MeshPhysicalMaterial({color:'#05090c',roughness:.27,metalness:.12,clearcoat:.6,clearcoatRoughness:.22});
  m.wheelCarbon=m.cabinCarbon.clone();m.wheelCarbon.map=m.cabinCarbon.map.clone();m.wheelCarbon.map.repeat.set(28,28);m.wheelCarbon.color.set('#34393e');m.wheelCarbon.roughness=.36;m.wheelCarbon.clearcoat=.55;
}

const centers=[.645,.075,-.27,-.645];
const frontX=z=>z<-.25?THREE.MathUtils.lerp(-.154,-.180,THREE.MathUtils.smoothstep(-z,.25,.32)):-.154-.17*(Math.abs(z)/.77)**4;
const lowerProfile=z=>{const x=frontX(z);return contour([[x-.14,.660],[x+.008,.665],[x+.015,.654],[x+.025,.609],[x-.003,.525],[x-.020,.507],[x-.055,.491],[x-.18,.498],[x-.18,.637]]);};
const brow=z=>.821+.018*passengerBlend(z)+centers.reduce((n,c)=>n+(.036-.018*passengerBlend(z))*Math.exp(-(((z-c)/.082)**2)),0);

function upperProfile(z){
  const x=frontX(z),y=brow(z),blend=passengerBlend(z),bottom=THREE.MathUtils.lerp(y-.025,passengerEdge(z),blend),faceX=x+THREE.MathUtils.lerp(-.027,.014,blend),h=y-bottom;
  return contour([[-.76,.815],[-.55,.830],[x-.093,y+.004],[x-.045,y+.001],[faceX+.014*blend,bottom+h*.64],[faceX+.004*blend,bottom+.006],[faceX-.006,bottom],[x-.060,bottom-.005],[x-.13,bottom+.015],[-.56,.787],[-.76,.785]]);
}
const badgeSurfaceCache=new Map();
function upperSurfaceX(y,z){
  const key=Math.round(y*2000)+':'+Math.round(z*2000);if(badgeSurfaceCache.has(key))return badgeSurfaceCache.get(key);
  const points=upperProfile(z).getPoints(192);let x=-Infinity;
  for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];if((a.y<=y&&b.y>=y)||(b.y<=y&&a.y>=y)){const f=(y-a.y)/(b.y-a.y||1);x=Math.max(x,THREE.MathUtils.lerp(a.x,b.x,f));}}
  badgeSurfaceCache.set(key,x);return x;
}

export function referenceDashboard(g,{m,trimMeshes}){
  // Broad passenger airbag pad: its lower perimeter arches around the vent apertures.
  const upper=closedSweep(g,m.dash,(t,v)=>{
    const z=-.716+t*1.491,p=upperProfile(z).getPoint(v);return V(p.x,p.y,z);
  },192,64);upper.userData.cockpitFeature='closed-padded-dashboard';
  // Lower glovebox roll sits below the black fascia band, with room for the display.
  closedSweep(g,m.lowerDash,(t,v)=>{
    const z=-.710+t*.912,p=lowerProfile(z).getPoint(v);return V(p.x,p.y,z);
  },128,64).userData.cockpitFeature='sculpted-lower-fascia';
  // Continuous polished band connects the center service panel and passenger display.
  closedSweep(g,m.fasciaGlass,(t,v)=>{
    const z=-.708+t*.903,x=frontX(z);const p=contour([[x-.040,.720],[x+.008,.721],[x+.013,.708],[x+.012,.677],[x-.003,.671],[x-.055,.682]]).getPoint(v);return V(p.x,p.y,z);
  },128,40).userData.cockpitFeature='continuous-passenger-fascia';
  // Panel splits follow the curved glovebox face instead of a box laid over it.
  for(const z of [-.716,-.328]){const line=[];for(let i=0;i<=40;i++){const t=i/40,p=lowerProfile(z).getPoint((2+t*3)/9);line.push(V(p.x+.0007,p.y,z));}tube(g,m.cabinRubber,line,.00105);}
  const gloveSeam=[];for(let i=0;i<=64;i++){const z=-.710+i/64*.377;const p=lowerProfile(z).getPoint(5/9);gloveSeam.push(V(p.x+.0007,p.y,z));}tube(g,m.cabinRubber,gloveSeam,.0009);
  const strap=patch(g,m.gloveAccent,36,8,(t,v)=>{const z=-.515+(.5-v)*.012,p=lowerProfile(z).getPoint((2+t*3)/9);return V(p.x+.0005,p.y,z);});strap.userData.cockpitFeature='glovebox-leather-divider';
  for(const z of [-.521,-.509]){const line=[];for(let i=0;i<=40;i++){const t=i/40,p=lowerProfile(z).getPoint((2+t*3)/9);line.push(V(p.x+.0008,p.y,z));}stitched(g,m.stitch,line);}
  passengerBadge(g,m.satin);
  // A closed formed carrier ties the two central vent barrels together.
  const carrier=closedSweep(g,m.ventMetal,(t,v)=>{
    const z=-.338+t*.480,x=frontX(z),end=Math.sin(Math.PI*t)**.25,outer=Math.max(0,-.27-z,z-.075),base=outer>0?.766-Math.sqrt(Math.max(.0001,.071**2-outer**2)):.695;
    const p=contour([[x-.083,.725],[x-.040,.733],[x+.002,.728],[x+.015,.716],[x+.009,.700],[x-.072,.699],[x-.089,.707]]).getPoint(v);
    return V((x-.043)+(p.x-(x-.043))*(.13+.87*end),p.y+(base-.699),z);
  },112,40);carrier.userData.cockpitFeature='formed-vent-gallery';
  for(const z of [-.27,.075]){
    const collar=lathe(g,m.ventMetal,[[.070,-.052],[.071,-.038],[.067,-.019],[.061,.003],[.057,.003],[.059,-.022],[.064,-.048]],frontX(z)-.027,.766,z);collar.userData.cockpitFeature='integrated-vent-cradle';
  }
  // Curved dark gallery backing supports the mesh rather than leaving it floating.
  closedSweep(g,m.cabinRubber,(t,v)=>{
    const z=-.348+t*.520,x=frontX(z),top=brow(z)-.034;
    const p=contour([[x-.095,top],[x-.064,top],[x-.058,.709],[x-.102,.701]]).getPoint(v);return V(p.x,p.y,z);
  },128,32);
  const redEdge=[];for(let i=0;i<=96;i++){const z=-.328+i/96*.460,outer=Math.max(0,-.27-z,z-.075),base=outer>0?.766-Math.sqrt(Math.max(.0001,.071**2-outer**2)):.695;redEdge.push(V(frontX(z)+.005,.701+(base-.699),z));}tube(g,m.cabinRed,redEdge,.0016);
  const seam=[];for(let i=0;i<=192;i++){const z=-.700+i/192*1.45,b=passengerBlend(z);seam.push(V(frontX(z)+THREE.MathUtils.lerp(-.024,.020,b),THREE.MathUtils.lerp(brow(z)-.018,passengerEdge(z)+.005,b),z));}stitched(g,m.stitch,seam);
  // The column socket grows out of the padded knee bolster below the gauges.
  closedSweep(g,m.dash,(t,v)=>{
    const z=.221+t*.410,edge=Math.sin(t*Math.PI)**.5;
    const p=contour([[-.355,.760],[-.165,.765],[-.087-.025*(1-edge),.736],[-.076-.025*(1-edge),.680],[-.119,.578],[-.291,.552],[-.370,.624]]).getPoint(v);return V(p.x,p.y,z);
  },80,64).userData.cockpitFeature='integrated-column-socket';
  box(g,m.cabinRubber,-.214,.765,-.100,.018,.039,.195,.006);
  for(let row=0;row<4;row++)for(let col=0;col<28;col++){const z=-.189+col*.006+(row%2?.003:0),y=.754+row*.00693;hexCell(g,m.darkMetal,-.203,y,z,.004);}
  raisedWordmark(g,m.satin,-.140,.727,-.098);
}

export function referenceVents(g,{m}){
  centers.forEach(z=>{const pack=new THREE.Group();pack.position.set(frontX(z)-.005,.766+(Math.abs(z)>.5?.017:0),z);pack.rotation.y=Math.sign(z)*(Math.abs(z)>.5?.21:.025);g.add(pack);
    const outline=contour([[-.081,.032],[-.051,.067],[.023,.076],[.067,.040],[.079,-.016],[.043,-.065],[-.045,-.068],[-.084,-.021]]),shape=new THREE.Shape();
    for(let i=0;i<96;i++){const p=outline.getPoint(i/96);if(i)shape.lineTo(p.x,p.y);else shape.moveTo(p.x,p.y);}shape.closePath();const aperture=new THREE.Path();aperture.absarc(0,0,.055,0,TAU,true);shape.holes.push(aperture);
    const pod=mesh(pack,new THREE.ExtrudeGeometry(shape,{depth:.010,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:3,curveSegments:64}),m.ventMetal,-.036);pod.rotation.y=Math.PI/2;pod.userData.cockpitFeature='open-vent-side-pod';
    // Bell-shaped aluminium nozzle with a thick rolled mouth and an open throat.
    lathe(pack,m.ventMetal,[[.067,-.085],[.065,-.062],[.058,-.031],[.053,.003],[.0535,.011],[.051,.015],[.0475,.014],[.046,.006],[.046,-.035],[.051,-.068]]);
    ring(pack,m.cabinRubber,.002,0,0,.0545,.0026);ring(pack,m.cabinRed,.014,0,0,.0517,.0013);ring(pack,m.satin,.017,0,0,.0484,.0011);
    disc(pack,m.cabinRubber,-.059,0,0,.048);
    for(let i=-3;i<=3;i++){const y=i*.0112,len=2*Math.sqrt(.0445**2-y*y);const blade=box(pack,m.ventSlat,-.025,y,0,.008,.0016,len,.0006);blade.rotation.z=-.19;}
    for(const a of [0,TAU/3,TAU*2/3]){const arm=box(pack,m.ventSlat,-.015,Math.cos(a)*.022,Math.sin(a)*.022,.004,.044,.0018,.0006);arm.rotation.x=-a;}
    ring(pack,m.darkMetal,-.010,0,0,.009,.0015);disc(pack,m.darkMetal,-.008,0,0,.0064);disc(pack,m.cabinRubber,-.007,0,0,.0043);
    for(const s of [-1,1])box(pack,m.satin,-.014,s*.056,0,.016,.004,.007,.001);
  });
}

function tachTexture(){return texture(1024,1024,(c)=>{
  c.fillStyle='#e9bc32';c.fillRect(0,0,1024,1024);const grad=c.createRadialGradient(440,380,30,512,512,500);grad.addColorStop(0,'#f7d55c');grad.addColorStop(1,'#d6a51e');c.fillStyle=grad;c.fillRect(0,0,1024,1024);c.save();c.translate(512,512);
  for(let i=0;i<=100;i++){const a=(135+i*2.7)*Math.PI/180,r=i%10?440:407;c.strokeStyle=i>=85?'#ad1b19':'#24241e';c.lineWidth=i%10?2:7;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*467,Math.sin(a)*467);c.stroke();}
  for(let i=0;i<=10;i++){const a=(135+i*27)*Math.PI/180;c.fillStyle=i>=9?'#b3211c':'#202219';c.font='500 58px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(String(i),Math.cos(a)*342,Math.sin(a)*342);}
  c.fillStyle='#383426';c.font='italic 35px Georgia';c.fillText('Ferrari',0,-138);c.font='20px Arial';c.fillText('RPM x 1000',0,193);c.fillStyle='#282c26';c.fillRect(-86,225,172,103);c.fillStyle='#f6d64f';c.font='75px Arial';c.fillText('N',0,278);c.restore();
});}
function driverScreen(kind,horse){return texture(768,768,(c,w,h)=>{
  c.fillStyle='#040708';c.fillRect(0,0,w,h);c.strokeStyle='#28323c';c.lineWidth=2;c.strokeRect(9,9,w-18,h-18);
  if(kind==='right'){c.drawImage(horse.image,w*.29,h*.20,w*.42,h*.44);c.fillStyle='#ccd1d8';c.font='italic 36px Arial';c.textAlign='center';c.fillText('812 SUPERFAST',w*.5,h*.80);}
  else{c.fillStyle='#939ba3';c.font='24px Arial';c.fillText('VEHICLE',45,67);for(const [i,t]of ['OIL    90 °C','WATER  80 °C','OIL    5.0 bar'].entries()){const y=194+i*140;c.fillStyle='#cdd3d9';c.font='31px Arial';c.fillText(t,43,y);c.fillStyle='#32434d';c.fillRect(45,y+29,560,9);c.fillStyle='#acc6bf';c.fillRect(45,y+29,360-i*65,9);}c.fillStyle='#e0e4de';c.font='48px Arial';c.fillText('0',46,695);c.font='22px Arial';c.fillText('km/h',95,695);}
});}
const clusterOutline=[[-.197,-.071],[-.191,.039],[-.142,.069],[-.093,.069],[-.057,.092],[0,.105],[.057,.092],[.093,.069],[.142,.069],[.191,.039],[.197,-.071],[.12,-.084],[0,-.086],[-.12,-.084]];
export function referenceCluster(g,{m,horseWhite}){
  const pack=new THREE.Group();pack.position.set(-.124,.826,.426);pack.rotation.z=.14;g.add(pack);
  const hood=shell(pack,m.hoodLeather,clusterOutline.map(([u,v])=>[u*.97,v]),[[-.257,.71,.28],[-.204,.94,.67],[-.105,1.025,.99],[-.018,1.02,1.03],[.006,1,1],[-.002,.955,.935],[-.028,.94,.89]]);hood.userData.cockpitFeature='recessed-instrument-hood';
  const back=softPolygon(pack,m.dash,clusterOutline.map(([u,v])=>[u*.71*.97,v*.28]),-.260,.004,.0015);back.userData.cockpitFeature='enclosed-instrument-back';
  polygon(pack,m.cabinRubber,clusterOutline.map(([u,v])=>[u*.94,v*.89]),-.034,.002,.001);
  const rim=contour(clusterOutline),edge=[];for(let i=0;i<130;i++){const p=rim.getPoint(i/130);edge.push(V(-.001,p.y*.94,-p.x*.955));}tube(pack,m.cabinRed,edge,.0008,true);
  lathe(pack,m.darkMetal,[[.068,-.027],[.069,-.011],[.066,-.003],[.062,-.003],[.061,-.011],[.061,-.027]],0,.006,0);ring(pack,m.satin,-.004,.006,0,.064,.00085);
  const t=tachTexture(),dial=disc(pack,new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:'#fff',emissiveIntensity:.16,roughness:.57}),-.015,.006,0,.0613);dial.userData.cockpitFeature='analog-tachometer-face';
  // Raised needle and its hub occupy their own depth above the printed scale.
  const pointer=new THREE.Group();pointer.position.y=.006;pointer.rotation.x=116*Math.PI/180;pack.add(pointer);const needle=polygon(pointer,m.cabinRed,[[-.0007,-.006],[-.0007,.048],[0,.052],[.0007,.048],[.0007,-.006]],-.009,.001,0);needle.userData.cockpitFeature='raised-analog-needle';disc(pack,m.darkMetal,-.006,.006,0,.0042);disc(pack,m.gaugeGlass,-.002,.006,0,.061);
  for(const [s,kind]of [[-1,'left'],[1,'right']]){const z=-s*.128;const lcd=driverScreen(kind,horseWhite);const o=face(pack,lcd,-.025,-.005,z,.098,.110,.20);o.userData.cockpitFeature='inset-driver-lcd';
    const p=[[-.051,-.058],[-.050,.040],[-.029,.055],[.042,.049],[.051,.033],[.051,-.058]];const c=p.map(([u,v])=>V(-.022,v-.005,z-u));tube(pack,m.darkMetal,c,.0015,true);
  }
}

function wheelOutline(a){let y=Math.sin(a)*.162;if(y<-.102)y=-.102+(y+.102)*.48;return V(0,y,Math.cos(a)*.158);}
function wheelIcon(kind){return texture(256,256,c=>{c.strokeStyle='#d6dadb';c.fillStyle='#d6dadb';c.lineWidth=12;c.lineCap='round';c.lineJoin='round';if(kind==='right'){c.translate(256,0);c.scale(-1,1);}c.beginPath();if(kind==='left'||kind==='right'){c.moveTo(194,100);c.lineTo(118,100);c.lineTo(118,62);c.lineTo(46,128);c.lineTo(118,194);c.lineTo(118,156);c.lineTo(194,156);c.closePath();}else if(kind==='lamp'){c.moveTo(124,73);c.quadraticCurveTo(205,128,124,183);c.closePath();for(let i=0;i<3;i++){c.moveTo(42,88+i*40);c.lineTo(97,88+i*40);}}else if(kind==='wiper'){c.arc(128,195,112,Math.PI*1.18,Math.PI*1.82);c.moveTo(128,183);c.lineTo(185,91);c.moveTo(139,140);c.lineTo(209,106);}else if(kind==='phone'){c.moveTo(70,55);c.bezierCurveTo(5,123,133,251,201,186);c.lineTo(165,150);c.lineTo(139,165);c.quadraticCurveTo(102,147,91,116);c.lineTo(107,90);c.closePath();}else{c.moveTo(104,179);c.lineTo(104,74);c.lineTo(177,57);c.lineTo(177,162);c.moveTo(177,86);c.lineTo(104,102);c.ellipse(79,184,25,15,-.3,0,TAU);c.moveTo(177,162);c.ellipse(152,167,25,15,-.3,0,TAU);}c.stroke();});}
export function referenceWheel(g,{m,horseGold}){
  m={...m,cabinCarbon:m.wheelCarbon};
  const fixed=new THREE.Group();fixed.position.set(.026,.837,.426);fixed.rotation.z=.16;g.add(fixed);const w=new THREE.Group();w.name='steering-rotor';w.userData.articulated=true;fixed.add(w);
  for(const [start,end,material]of [[-.58,.58,m.perforated],[.58,2.56,m.cabinCarbon],[2.56,3.72,m.perforated],[3.72,5.70,m.cabinCarbon]]){
    patch(w,material,112,28,(t,v)=>{const a=start+(end-start)*t,c=wheelOutline(a),tangent=wheelOutline(a+.001).sub(wheelOutline(a-.001)).normalize(),n=V(0,-tangent.z,tangent.y),b=v*TAU,grip=.019+.003*Math.exp(-((Math.sin(a)/.3)**2));return c.add(V(Math.cos(b)*.018,0,0)).addScaledVector(n,Math.sin(b)*grip);});
  }
  // A short closed fairing connects the rear bearing to the integrated knee socket.
  const shroud=closedSweep(fixed,m.columnRubber,(t,v)=>{
    const x=-.151+t*.128,a=v*TAU,cy=-.104+.093*t,ry=.031-.005*t,rz=.057-.022*t;
    return V(x,cy+Math.sin(a)*ry,Math.cos(a)*rz);
  },64,64);shroud.userData.cockpitFeature='contoured-column-fairing';
  lathe(fixed,m.columnRubber,[[.026,-.053],[.029,-.041],[.030,-.030],[.024,-.021]],0,-.006,0);
  lathe(fixed,m.darkMetal,[[.024,-.030],[.026,-.027],[.026,-.021],[.024,-.019]],0,-.006,0);
  // The carbon switch wings sweep down toward the hub instead of forming a plate.
  for(const s of [-1,1]){
    softPolygon(w,m.cabinCarbon,[[s*.029,.019],[s*.096,.025],[s*.134,.014],[s*.132,-.008],[s*.113,-.019],[s*.105,-.059],[s*.078,-.074],[s*.045,-.050],[s*.026,-.029]],-.006,.010,.002);
    softPolygon(w,m.cabinRubber,[[s*.067,-.009],[s*.116,-.011],[s*.117,-.041],[s*.099,-.052],[s*.068,-.034]],.004,.005,.002);
    // Raised indicator rocker and a separate lower switch bank, as on the reference.
    const rocker=box(w,m.cabinRubber,.011,.024,-s*.112,.009,.017,.022,.003);rocker.rotation.x=s*.16;face(w,wheelIcon(s>0?'right':'left'),.0165,.024,-s*.112,.012,.012,.03);
    for(const [i,label]of (s>0?['wiper','lamp']:['lamp','lamp']).entries()){const y=-.016-i*.016,z=-s*(.109-i*.010);const key=box(w,m.cabinRubber,.010,y,z,.007,.013,.021,.002);key.rotation.x=s*.20;face(w,wheelIcon(label),.0145,y,z,.009,.009,.02);}
    const paddle=softPolygon(fixed,m.satin,[[s*.116,-.061],[s*.132,-.051],[s*.140,.077],[s*.134,.101],[s*.124,.096],[s*.117,.065]],-.047,.003,.001);const p=paddle.geometry.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),u=p.getX(i);p.setZ(i,p.getZ(i)+.012*((y+.06)/.16)**2+.007*Math.abs(u)/.14);}paddle.geometry.computeVertexNormals();paddle.userData.cockpitFeature='column-mounted-paddle';
    box(fixed,m.darkMetal,-.056,-.020,-s*.099,.018,.012,.041,.003);face(fixed,legend(s>0?'+':'−'),-.027,.068,-s*.129,.009,.011,.02);
    const seam=[];for(let i=0;i<=70;i++){const a=(s>0?-.53:Math.PI-.53)+i/70*1.06,p=wheelOutline(a),n=V(0,Math.sin(a),Math.cos(a));p.addScaledVector(n,-.017);p.x=.012;seam.push(p);}stitched(w,m.stitch,seam);
    const thumb=mesh(w,new THREE.SphereGeometry(1,32,24),m.perforated,-.003,.049,s*.139);thumb.scale.set(.017,.025,.011);thumb.rotation.x=s*.28;
  }
  // One flared central spoke joins the sculpted carbon lower rim.
  softPolygon(w,m.cabinCarbon,[[-.019,-.047],[.019,-.047],[.018,-.080],[.026,-.110],[.019,-.122],[-.019,-.122],[-.026,-.110],[-.018,-.080]],-.003,.010,.0018);
  const lowerEdge=[];for(let i=0;i<=70;i++){const a=3.89+i/70*1.64,p=wheelOutline(a),n=V(0,Math.sin(a),Math.cos(a));p.addScaledVector(n,-.014);p.x=.015;lowerEdge.push(p);}tube(w,m.satin,lowerEdge,.0012);
  const airbag=[[-.065,.026],[-.049,.041],[0,.045],[.049,.041],[.065,.026],[.062,-.010],[.040,-.036],[0,-.042],[-.040,-.036],[-.062,-.010]];shell(w,m.cabinRubber,airbag,[[-.038,.48,.52],[-.030,.83,.85],[-.010,1,1],[.010,1,1]]);softPolygon(w,m.cabinRubber,airbag.map(([u,v])=>[u*.48,v*.52]),-.040,.003,.001);paddedFace(w,m.seat,airbag,.010,.023);
  ring(w,m.cabinRubber,.034,-.001,0,.023,.0025);ring(w,m.satin,.036,-.001,0,.0205,.0009);disc(w,new THREE.MeshStandardMaterial({map:horseGold,roughness:.42}),.037,-.001,0,.0194);
  ring(w,m.darkMetal,.016,-.060,.077,.0118,.0012);disc(w,m.cabinRed,.018,-.060,.077,.0102);
  const start=texture(256,256,(c)=>{c.fillStyle='#fff';c.textAlign='center';c.font='38px Arial';c.fillText('ENGINE',128,91);c.fillText('START',128,137);c.fillText('STOP',128,183);});face(w,start,.019,-.060,.077,.017,.017,.02);
  ring(w,m.darkMetal,.016,-.054,-.080,.017,.0012);disc(w,m.cabinRubber,.018,-.054,-.080,.014);const lever=box(w,m.cabinRed,.023,-.054,-.080,.009,.018,.005,.002);lever.rotation.x=1.02;
  const modes=texture(512,512,c=>{c.fillStyle='#ccd0d1';c.font='25px Arial';c.textAlign='center';c.textBaseline='middle';for(const [i,label]of ['WET','SPORT','RACE','CT','ESC'].entries()){const a=(148+i*35)*Math.PI/180;c.save();c.translate(256+Math.cos(a)*197,256+Math.sin(a)*197);c.rotate(a+Math.PI/2);c.fillText(label,0,0);c.restore();}c.strokeStyle='#c5c9cc';c.lineWidth=5;for(let i=0;i<17;i++){const a=(142+i*9)*Math.PI/180;c.beginPath();c.moveTo(256+Math.cos(a)*159,256+Math.sin(a)*159);c.lineTo(256+Math.cos(a)*176,256+Math.sin(a)*176);c.stroke();}});face(w,modes,.020,-.054,-.080,.044,.044,.02);
  disc(w,m.darkMetal,.018,-.034,.092,.008);ring(w,m.satin,.019,-.034,.092,.0065,.0006);face(w,legend('I'),.020,-.034,.092,.006,.006,.02);
  for(const [z,label]of [[-.012,'phone'],[.012,'music']]){box(w,m.cabinRubber,.016,-.061,z,.007,.009,.023,.002);face(w,wheelIcon(label),.020,-.061,z,.007,.007,.01);}
  const top=[];for(let i=0;i<=40;i++){const a=.98+i/40*1.18;top.push(wheelOutline(a).add(V(.019,0,0)));}tube(w,m.cabinRubber,top,.004);
  const led=new THREE.MeshStandardMaterial({color:'#727b7e',roughness:.3});for(let i=0;i<11;i++){const z=(i-5)*.007;box(w,led,.023,.159-.002*(Math.abs(i-5)/5)**2,z,.0015,.0017,.0047,.0005);}
  return w;
}

const bridgeY=x=>.583-.17*(x+.13)+.015*Math.sin((x+.13)/.63*Math.PI);
export function referenceConsole(g,{m,trimMeshes}){
  box(g,m.dash,.28,.365,0,.94,.095,.22,.043);
  const bridge=patch(g,m.cabinCarbon,96,40,(t,v)=>{const x=-.15+t*.66,a=v*TAU,c=Math.cos(a),s=Math.sin(a),w=.070+.013*Math.sin(t*Math.PI);return V(x,bridgeY(x)+Math.sign(s)*Math.abs(s)**.6*.011,Math.sign(c)*Math.abs(c)**.6*w);});trimMeshes.push(bridge);bridge.userData.cockpitFeature='sloped-transmission-bridge';
  // Curved paired brackets turn back into the tunnel, as in the side reference.
  // Their center stays open; there are no table-like vertical wall supports.
  for(const s of [-1,1]){
    const brace=softPolygon(g,m.cabinCarbon,[[-.16,.573],[-.22,.546],[-.21,.486],[-.10,.421],[.05,.409],[.08,.427],[-.08,.445],[-.162,.494],[-.174,.541],[-.12,.570]],0,.010,.002);brace.rotation.y=0;brace.position.z=s*.065-.005;brace.userData.cockpitFeature='curved-transmission-support';trimMeshes.push(brace);
    const rear=softPolygon(g,m.dash,[[.44,.464],[.50,.49],[.60,.48],[.67,.43],[.54,.407],[.46,.419]],0,.012,.003);rear.rotation.y=0;rear.position.z=s*.077-.006;
    const sweep=[];for(let i=0;i<=60;i++){const x=-.07+i/60*.73;sweep.push(V(x,.416+.027*THREE.MathUtils.smoothstep(x,.1,.65),s*.108));}tube(g,m.cabinRed,sweep,.0015);
  }
  for(const [i,label]of ['R','AUTO','LAUNCH'].entries()){
    const x=-.09+i*.105,b=new THREE.Group();b.position.set(x,bridgeY(x)+.012,0);b.rotation.z=-.24;g.add(b);
    mesh(b,new THREE.CylinderGeometry(.024,.025,.007,64),m.satin,0,.002,0);mesh(b,new THREE.CylinderGeometry(.0205,.021,.004,64),m.cabinRubber,0,.007,0);
    const txt=mesh(b,new THREE.PlaneGeometry(label==='R'?.012:.032,.009),new THREE.MeshStandardMaterial({map:legend(label),transparent:true,roughness:.6}),0,.0095,0);txt.rotation.set(-Math.PI/2,0,Math.PI/2);
  }
  const hazard=box(g,m.cabinRed,.255,bridgeY(.255)+.014,0,.035,.009,.027,.003);hazard.rotation.z=-.24;const txt=mesh(g,new THREE.PlaneGeometry(.022,.018),new THREE.MeshStandardMaterial({map:legend('△'),transparent:true}),.255,bridgeY(.255)+.02,0);txt.rotation.set(-Math.PI/2,0,Math.PI/2);
  box(g,m.satin,.398,bridgeY(.398)+.015,0,.102,.012,.119,.008);box(g,m.cabinRubber,.398,bridgeY(.398)+.023,0,.070,.005,.091,.004);
  for(const z of [-.053,.053])box(g,m.cabinRubber,.328,bridgeY(.328)+.018,z,.027,.008,.019,.003);
  box(g,m.seat,.64,.515,0,.28,.117,.20,.038);for(const s of [-1,1]){const seam=[];for(let i=0;i<=50;i++){const x=-.08+i/50*.72;seam.push(V(x,.414,s*.106));}stitched(g,m.stitch,seam);stitched(g,m.stitch,[V(.54,.570,s*.064),V(.64,.574,s*.068),V(.74,.564,s*.064)]);}
}

function knob(g,m,x,y,z,r){
  lathe(g,m.satin,[[r*.91,-.008],[r,-.004],[r,.005],[r*.94,.008],[r*.82,.008],[r*.81,-.003]],x,y,z);
  ring(g,m.darkMetal,x-.007,y,z,r*1.10,.0011);ring(g,m.satin,x+.0075,y,z,r*.89,.00065);disc(g,m.cabinRubber,x+.0085,y,z,r*.81);
  for(let i=0;i<48;i++){const a=i/48*TAU;const mark=box(g,m.darkMetal,x+.0003,y+Math.sin(a)*r,z+Math.cos(a)*r,.006,.00065,.00065,.00015);mark.rotation.x=-a;}
  disc(g,m.cabinRed,x+.009,y+r*.57,z,.0007);
}
function serviceDisplay(){return texture(1280,128,(c,w,h)=>{
  c.fillStyle='#071014';c.fillRect(0,0,w,h);c.textBaseline='middle';c.fillStyle='#c4d9df';c.font='500 62px Arial';c.fillText('21.0°C',65,66);c.font='35px Arial';c.fillText('AUTO',600,66);for(let i=0;i<5;i++){c.fillStyle=i<3?'#abc4ce':'#26383f';c.fillRect(965+i*38,66-i*5,23,20+i*5);}
});}
export function referenceClimate(g,{m}){
  // Compact service strip below the vent gallery, with a separate lower climate bank.
  box(g,m.cabinRubber,-.141,.658,-.075,.025,.032,.342,.011);
  box(g,m.ventMetal,-.126,.658,-.075,.007,.025,.334,.007);
  knob(g,m,-.119,.658,.055,.014);disc(g,m.cabinRubber,-.118,.658,.094,.0045);
  const lens=face(g,serviceDisplay(),-.120,.658,-.096,.216,.021,.12);lens.material.roughness=.22;lens.userData.cockpitFeature='proportional-temperature-display';
  box(g,m.cabinRubber,-.153,.592,-.075,.027,.032,.331,.013);box(g,m.ventMetal,-.137,.592,-.075,.006,.026,.318,.010);
  for(const z of [.069,-.219])knob(g,m,-.130,.592,z,.0125);
  for(let i=0;i<6;i++){const z=.024-i*.039;box(g,m.cabinRubber,-.131,.592,z,.007,.018,.034,.0025);face(g,legend(['AUTO','FRONT','−','AC','+','REAR'][i],i===0?'#e7a55b':'#bdc7cb'),-.1265,.592,z,.024,.006,.07);}
}
function passengerScreenTexture(){return texture(2048,256,(c,w,h)=>{
  c.fillStyle='#03070b';c.fillRect(0,0,w,h);c.textAlign='center';c.textBaseline='middle';
  // The engine is off: neutral, zero road speed and zero RPM agree with the driver dial.
  c.strokeStyle='#4a5968';c.lineWidth=2;c.strokeRect(63,52,1695,34);
  for(let i=0;i<=10;i++){const x=93+i*157;c.fillStyle=i>=9?'#ed5136':'#b4c3d1';c.font='28px Arial';c.fillText(String(i),x,27);c.fillRect(x-1,57,2,17);}
  c.fillStyle='#9a3029';c.fillRect(1510,54,245,29);c.fillStyle='#d17f45';c.fillRect(65,54,12,29);
  c.fillStyle='#d5e2ee';c.font='91px Arial';c.fillText('N',375,155);c.fillText('0',1135,153);c.font='27px Arial';c.fillStyle='#8c9eae';c.fillText('GEAR',375,220);c.fillText('km/h',1135,218);c.fillText('RPM × 1000',1640,217);
  c.fillStyle='#ad6a38';c.fillRect(60,115,3,114);c.fillRect(1876,20,3,214);c.fillStyle='#a9b9c7';c.font='33px Arial';c.fillText('↩',26,152);c.fillText('☼',1950,72);c.fillText('◉',1950,180);c.font='26px Arial';c.fillText('0',1660,155);
});}
function roundedRectangle(w,h,r){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
export function referencePassenger(g,{m}){
  // A planar factory-style screen sits behind a real open bezel, rather than a curved strip.
  const z0=-.665,z1=-.343,center=(z0+z1)/2,shape=roundedRectangle(.318,.0435,.0025);shape.holes.push(roundedRectangle(.310,.038,.0015));
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.002,bevelEnabled:true,bevelSize:.0004,bevelThickness:.0004,bevelSegments:2,curveSegments:12}),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const z=center-p.getX(i),y=.697+p.getY(i),x=-.160+p.getZ(i);p.setXYZ(i,x,y,z);}geo.computeVertexNormals();mesh(g,geo,m.cabinRubber).userData.cockpitFeature='open-passenger-display-bezel';
  const map=passengerScreenTexture(),screenMat=new THREE.MeshPhysicalMaterial({map,emissiveMap:map,emissive:'#ffffff',emissiveIntensity:.24,roughness:.18,metalness:.08,clearcoat:1,clearcoatRoughness:.12});
  const screen=mesh(g,new THREE.PlaneGeometry(.308,.037),screenMat,-.1605,.697,center);screen.rotation.y=Math.PI/2;screen.userData.cockpitFeature='recessed-planar-passenger-screen';
}
