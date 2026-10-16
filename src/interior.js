import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildSeatPadding, seatFront, cushionTop, embroidery } from './upholstery.js';
import { prepareCockpitMaterials, referenceDashboard, referenceVents, referenceCluster, referenceWheel, referenceConsole, referenceClimate, referencePassenger } from './cockpit-geometry.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const smooth=(a,b,t)=>THREE.MathUtils.lerp(a,b,t*t*(3-2*t));
function grainTexture(){
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),im=ctx.createImageData(256,256);
  let seed=812;for(let i=0;i<im.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const n=105+((seed>>>24)%70);im.data.set([n,n,n,255],i);}ctx.putImageData(im,0,0);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(5,5);return t;
}
function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function textTexture(text,color='#ddd9d1',bg=null){return canvasTexture(Math.max(96,text.length*56),128,(c,w,h)=>{if(bg){c.fillStyle=bg;c.fillRect(0,0,w,h);}c.fillStyle=color;c.font='500 76px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2,w*.92);});}
function dialTexture(){return canvasTexture(1024,1024,(c,w,h)=>{
  c.fillStyle='#111316';c.fillRect(0,0,w,h);const grad=c.createRadialGradient(480,440,20,512,512,455);grad.addColorStop(0,'#ffdc66');grad.addColorStop(1,'#cd9a17');c.fillStyle=grad;c.beginPath();c.arc(512,512,457,0,Math.PI*2);c.fill();
  c.save();c.translate(512,512);for(let i=0;i<=50;i++){const a=(-220+i*5.2)*Math.PI/180;c.save();c.rotate(a);c.strokeStyle=i>=42?'#ba1a23':'#34302a';c.lineWidth=i%5?3:9;c.beginPath();c.moveTo(0,-(i%5?392:368));c.lineTo(0,-417);c.stroke();c.restore();}
  for(let i=0;i<=10;i++){const a=(-220+i*26)*Math.PI/180;c.fillStyle=i>=9?'#ae1921':'#292b28';c.font='52px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(String(i),Math.sin(a)*328,-Math.cos(a)*328);}
  c.fillStyle='#262523';c.font='21px Arial';c.fillText('RPM × 1000',0,215);c.font='italic 34px Georgia';c.fillText('Ferrari',0,-105);c.fillStyle='#12151a';c.fillRect(-100,68,200,100);c.fillStyle='#faf8dc';c.font='66px Arial';c.fillText('N',0,120);
  c.rotate(-2.4);c.fillStyle='#c52320';c.beginPath();c.moveTo(-8,34);c.lineTo(0,-350);c.lineTo(8,34);c.fill();c.restore();c.fillStyle='#26292a';c.beginPath();c.arc(512,512,25,0,Math.PI*2);c.fill();
});}
function displayTexture(kind){return canvasTexture(1024,512,(c,w,h)=>{
  c.fillStyle='#060b12';c.fillRect(0,0,w,h);c.strokeStyle='#ad2036';c.lineWidth=5;c.beginPath();c.moveTo(50,80);c.lineTo(974,80);c.stroke();c.fillStyle='#bec8d1';c.font='25px Arial';c.fillText(kind==='passenger'?'812 SUPERFAST':'VEHICLE STATUS',50,53);
  if(kind==='passenger'){c.fillStyle='#efefe9';c.font='100px Arial';c.fillText('0',75,225);c.font='25px Arial';c.fillText('km/h',150,225);c.font='44px Arial';c.fillText('N',720,220);c.fillStyle='#8c99a7';c.font='23px Arial';c.fillText('V12  /  6.5 L',70,300);c.fillText('MARANELLO',70,370);}
  else{c.fillStyle='#f1eee4';c.font='italic 68px Arial';c.fillText('812',60,220);c.fillStyle='#dc293f';c.font='italic 37px Arial';c.fillText('SUPERFAST',215,220);c.fillStyle='#aebbc6';c.font='24px Arial';c.fillText('ENGINE',65,325);c.fillText('TYRES',65,415);c.fillStyle='#4b9ca1';c.fillRect(380,310,280,9);c.fillRect(380,400,400,9);c.fillStyle='#dee3e5';c.font='23px Arial';c.fillText('READY',780,327);c.fillText('OK',800,417);}
  c.strokeStyle='#333d48';c.lineWidth=2;c.strokeRect(20,15,w-40,h-30);
});}

function add(g,geo,mat,x=0,y=0,z=0){const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
function box(g,mat,x,y,z,w,h,d,r=.02){return add(g,new RoundedBoxGeometry(w,h,d,4,Math.min(r,w/2,h/2,d/2)),mat,x,y,z);}
function tube(g,mat,pts,r=.002,closed=false){return add(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,'centripetal'),Math.max(32,pts.length*10),r,6,closed),mat);}
function stitches(g,mat,pts){
  const curve=new THREE.CatmullRomCurve3(pts,false,'centripetal'),len=curve.getLength(),count=Math.ceil(len/.0035),geos=[];
  for(let i=0;i<count;i++){const a=curve.getPoint(i/count),b=curve.getPoint(Math.min(1,(i+.52)/count)),d=b.clone().sub(a);if(d.length()<1e-5)continue;const geo=new THREE.CylinderGeometry(.00028,.00028,d.length(),5,1);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,1,0),d.normalize()));geo.translate(...a.clone().add(b).multiplyScalar(.5).toArray());geos.push(geo);}
  if(geos.length){add(g,mergeGeometries(geos),mat);geos.forEach(x=>x.dispose());}
}
function ellipse(g,mat,x,y,z,sx,sy,sz){const o=add(g,new THREE.SphereGeometry(1,32,20),mat,x,y,z);o.scale.set(sx,sy,sz);return o;}
function face(g,tex,x,y,z,w,h,emissive=.25){const mat=new THREE.MeshStandardMaterial({map:tex,emissiveMap:tex,emissive:'#ffffff',emissiveIntensity:emissive,roughness:.34,metalness:.12,transparent:true});const o=add(g,new THREE.PlaneGeometry(w,h),mat,x,y,z);o.rotation.y=Math.PI/2;return o;}
function roundFace(g,mat,x,y,z,r){const o=add(g,new THREE.CircleGeometry(r,64),mat,x,y,z);o.rotation.y=Math.PI/2;return o;}
function ring(g,mat,x,y,z,r,thick){const o=add(g,new THREE.TorusGeometry(r,thick,12,64),mat,x,y,z);o.rotation.y=Math.PI/2;return o;}
function loftSeat(g,mat,sections,z=0){
  const pos=[],uv=[],ind=[],n=40,rows=60;
  function sample(t){const p=t*(sections.length-1),i=Math.min(sections.length-2,Math.floor(p)),f=p-i,a=sections[i],b=sections[i+1],before=sections[Math.max(0,i-1)],after=sections[Math.min(sections.length-1,i+2)];return a.map((v,j)=>{const m0=(b[j]-before[j])*.5,m1=(after[j]-v)*.5,value=(2*f**3-3*f**2+1)*v+(f**3-2*f**2+f)*m0+(-2*f**3+3*f**2)*b[j]+(f**3-f**2)*m1;return j>=2?Math.max(.001,value):value;});}
  for(let i=0;i<=rows;i++){const [y,x,wide,deep]=sample(i/rows);for(let j=0;j<=n;j++){const a=j/n*Math.PI*2,c=Math.cos(a),s=Math.sin(a);pos.push(x+Math.sign(c)*Math.abs(c)**.68*deep,y,z+Math.sign(s)*Math.abs(s)**.68*wide);uv.push(j/n,i/rows);}}
  for(let i=0;i<rows;i++)for(let j=0;j<n;j++){const a=i*(n+1)+j,b=a+n+1;ind.push(a,a+1,b,b,a+1,b+1);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(ind);geo.computeVertexNormals();return add(g,geo,mat);
}
function webbing(g,mat,pts,width=.047){
  const curve=new THREE.CatmullRomCurve3(pts),pos=[],uv=[],indices=[],n=48;
  for(let i=0;i<=n;i++){const p=curve.getPoint(i/n),t=curve.getTangent(i/n),normal=V(-t.y,t.x,0).normalize();
    for(const [edge,depth] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const v=p.clone().addScaledVector(V(0,0,1),edge*width/2).addScaledVector(normal,depth*.001);pos.push(...v.toArray());uv.push(edge>0?1:0,i/n*8);}}
  for(let i=0;i<n;i++)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4;indices.push(a,b,a+4,b,b+4,a+4);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return add(g,geo,mat);
}

export async function buildDetailedInterior(car){
  const {root,parts,materials:m}=car,trimMeshes=[];
  // Fit the illustrative V12 inside the actual authored bonnet bay.
  // Its earlier procedural manifold extended behind the cabin firewall.
  const engineParts=['engine','engine-covers'].map(id=>parts.get(id)).filter(Boolean),engineBox=new THREE.Box3();
  root.updateMatrixWorld(true);engineParts.forEach(p=>engineBox.union(new THREE.Box3().setFromObject(p)));
  const engineCenter=engineBox.getCenter(V(0,0,0)),engineSize=engineBox.getSize(V(0,0,0)),engineFit=V(1.12/engineSize.x,.52/engineSize.y,.91/engineSize.z);
  for(const p of engineParts){p.position.sub(engineCenter).multiply(engineFit).add(V(-1.27,.52,0));p.scale.multiply(engineFit);p.userData.originalPosition=p.position.clone();p.userData.originalScale=p.scale.clone();}
  const grain=grainTexture();
  const [leatherNormal,scannedRoughness]=await Promise.all(['/textures/leather-normal.jpg','/textures/leather-roughness.jpg'].map(url=>new THREE.TextureLoader().loadAsync(url)));
  const rc=document.createElement('canvas');rc.width=rc.height=1024;const rctx=rc.getContext('2d');rctx.drawImage(scannedRoughness.image,0,0,1024,1024);const pixels=rctx.getImageData(0,0,1024,1024);for(let i=0;i<pixels.data.length;i+=4){const rough=150+pixels.data[i]*.34;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=rough;}rctx.putImageData(pixels,0,0);const leatherRoughness=new THREE.CanvasTexture(rc);scannedRoughness.dispose();
  for(const t of [leatherNormal,leatherRoughness]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);t.anisotropy=8;}
  m.seat=new THREE.MeshPhysicalMaterial({color:'#232528',roughness:.84,metalness:0,normalMap:leatherNormal,normalScale:new THREE.Vector2(.15,.15),roughnessMap:leatherRoughness,clearcoat:.04,clearcoatRoughness:.55,sheen:.12,sheenColor:'#72787d',sheenRoughness:.65});
  m.dash=new THREE.MeshPhysicalMaterial({color:'#17191c',roughness:.60,metalness:0,bumpMap:grain,bumpScale:.0012,clearcoat:.05,clearcoatRoughness:.6,sheen:.10,sheenColor:'#4a4f52',sheenRoughness:.8});
  m.dash.normalMap=leatherNormal;m.dash.normalScale.set(.10,.10);m.dash.bumpMap=null;
  m.stitch=new THREE.MeshStandardMaterial({color:'#c82436',roughness:.88});m.belt=new THREE.MeshStandardMaterial({color:'#bf1930',roughness:.9,bumpMap:grain,bumpScale:.001});
  m.cabinCarbon=m.carbon.clone();m.cabinCarbon.map=m.carbon.map.clone();m.cabinCarbon.map.repeat.set(12,12);m.cabinCarbon.color.set('#303438');m.cabinCarbon.roughness=.38;m.cabinCarbon.metalness=.08;m.cabinCarbon.clearcoat=.25;m.cabinCarbon.clearcoatRoughness=.35;
  m.cabinMetal=new THREE.MeshStandardMaterial({color:'#a6abb0',metalness:.92,roughness:.28});m.cabinRubber=new THREE.MeshStandardMaterial({color:'#111317',roughness:.92});m.cabinInsert=new THREE.MeshStandardMaterial({color:'#25282c',roughness:.95,bumpMap:grain,bumpScale:.002});m.cabinRed=new THREE.MeshPhysicalMaterial({color:'#b91830',roughness:.35,clearcoat:.5});
  m.ventSlat=new THREE.MeshStandardMaterial({color:'#25292e',roughness:.48,metalness:.45});
  prepareCockpitMaterials(m);
  const image=(await new THREE.TextureLoader().loadAsync('/textures/source-ferrari-badge.png')).image;
  function horse(color,bg=null){return canvasTexture(256,256,(ctx,w,h)=>{ctx.drawImage(image,99,74,137,174,44,18,168,215);const im=ctx.getImageData(0,0,w,h);const col=new THREE.Color(color).convertLinearToSRGB();for(let i=0;i<im.data.length;i+=4){const keep=im.data[i]+im.data[i+1]+im.data[i+2]<220&&im.data[i+3]>0;if(keep){im.data[i]=Math.round(col.r*255);im.data[i+1]=Math.round(col.g*255);im.data[i+2]=Math.round(col.b*255);}else im.data[i+3]=0;}ctx.clearRect(0,0,w,h);if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);}const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;tmp.getContext('2d').putImageData(im,0,0);ctx.drawImage(tmp,0,0);});}
  const horseGold=horse('#111111','#f3c832'),horseRed=horse('#c92538');
  const reference={m,trimMeshes,horseGold,horseWhite:horse('#f2f3f5')};
  const register=(id,name,description,builder,pivot=V(0,0,0),offset=V(0,.6,0))=>{
    const old=parts.get(id);if(old){old.removeFromParent();const geometries=new Set();old.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());}
    const g=new THREE.Group();g.name=id;root.add(g);builder(g);for(const child of g.children)child.position.sub(pivot);g.position.copy(pivot);
    g.userData={partId:id,name,category:'Interior',description,originalPosition:g.position.clone(),originalQuaternion:g.quaternion.clone(),originalScale:g.scale.clone(),originalParent:root.uuid,explodeOffset:offset,detached:false};g.traverse(o=>{if(o.isMesh)o.userData.partId=id;});parts.set(id,g);return g;
  };
  const carbonBox=(g,...a)=>{const o=box(g,m.cabinCarbon,...a);trimMeshes.push(o);return o;};
  const underbody=register('chassis','Underbody & cabin floor','Illustrative low underbody shell supporting the detailed cockpit without the source placeholder cabin blocks.',g=>{
    const outline=[[-2.16,-.78],[-1.80,-.78],[-1.80,-.54],[-.99,-.54],[-.99,-.78],[.91,-.78],[.91,-.62],[1.75,-.62],[1.75,-.78],[2.16,-.78],[2.16,.78],[1.75,.78],[1.75,.62],[.91,.62],[.91,.78],[-.99,.78],[-.99,.54],[-1.80,.54],[-1.80,.78],[-2.16,.78]],shape=new THREE.Shape(outline.map(p=>new THREE.Vector2(...p)));
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:false});geometry.rotateX(Math.PI/2);geometry.translate(0,.131,0);add(g,geometry,m.cabinRubber);
  },V(0,.177,0),V(0,-.12,0));underbody.userData.category='Mechanical';

  register('dashboard','Sculpted dashboard','Layered leather eyebrows, formed metal vent gallery, hexagonal grille, accent trough and stitched glovebox.',g=>referenceDashboard(g,reference),V(-.36,.76,0),V(-.3,.85,0));
  register('air-vents','Four turbine air vents','Recessed bell-mouth aluminium nozzles with open throats, internal vanes, adjustment tabs and fine red rings.',g=>referenceVents(g,reference),V(-.20,.78,0),V(-.3,.4,0));
  register('instrument-cluster','Yellow tachometer & digital cluster','Contoured recessed instrument binnacle with perforated hood, inset LCDs, yellow tachometer, raised needle and anti-reflective lens.',g=>referenceCluster(g,reference),V(-.25,.837,.426),V(0,.6,.3));
  let steeringRotor;register('steering-wheel','Carbon steering wheel','Contoured perforated grips, curved carbon spokes, supported column, stationary shift paddles, recessed switches and start/manettino controls.',g=>{steeringRotor=referenceWheel(g,reference);},V(.026,.837,.426),V(.25,.55,.4));
  car.steering=[steeringRotor];
  register('center-console','Carbon transmission bridge','Sloping carbon bridge with inset transmission buttons, curved side brackets, open undercut and stitched armrest.',g=>referenceConsole(g,reference),V(.23,.53,0),V(.35,.6,0));
  register('climate-controls','Dual-zone climate controls','Two slim control banks, digital temperature strip, knurled metallic dials and backlit switches.',g=>referenceClimate(g,reference),V(-.12,.63,-.075),V(.1,.4,0));
  register('passenger-display','Passenger information display','Planar passenger RPM, gear and speed display recessed between the broad leather upper panel and stitched glovebox.',g=>referencePassenger(g,reference),V(-.20,.698,-.50),V(0,.4,-.3));

  for(const [side,z] of [['driver',.419],['passenger',-.419]]){
    register(`${side}-seat`,`${side==='driver'?'Driver':'Passenger'} sport seat`,'Sculpted leather sport seat with curved bolsters, suede center inserts, red piping, double stitching, embroidered headrest and seat rails.',g=>{
      box(g,m.cabinRubber,.33,.292,z,.67,.065,.45,.02);for(const dz of [-.17,.17])box(g,m.cabinMetal,.33,.255,z+dz,.68,.025,.024,.007);
      buildSeatPadding(g,m,z);
      for(const s of [-1,1]){
        const back=[],cushion=[];
        for(let i=0;i<=80;i++){back.push(seatFront(.48+i/80*.49,s*.585,z).add(V(-.00045,0,0)));cushion.push(cushionTop(-.05+i/80*.53,s*.595,z).add(V(0,.00045,0)));}
        stitches(g,m.stitch,back);stitches(g,m.stitch,cushion);
        const head=[];for(let i=0;i<=50;i++)head.push(seatFront(.97+i/50*.13,s*.84,z).add(V(-.00045,0,0)));stitches(g,m.stitch,head);
      }
      embroidery(g,horseRed,z);
      box(g,m.cabinMetal,.43,.325,z+.24,.071,.03,.025,.008);
    },V(.32,.61,z),V(.25,.65,z>0?.65:-.65));
  }

  register('interior-trim','Carpeted cabin & sill trim','Deep charcoal carpets, fitted mats, center tunnel, rear bulkhead and polished sill plates.',g=>{
    for(const s of [-1,1]){const outline=[[-.78,.11],[.60,.11],[.78,.24],[.78,.70],[-.78,.70]],shape=new THREE.Shape(outline.map(([x,z])=>new THREE.Vector2(x,z*s))),geo=new THREE.ExtrudeGeometry(shape,{depth:.03,bevelEnabled:false});geo.rotateX(Math.PI/2);geo.translate(0,.24,0);add(g,geo,m.cabinRubber);box(g,m.cabinRubber,.72,.395,s*.4875,.05,.28,.415,.018);box(g,m.cabinRubber,-.655,.30,s*.41,.05,.11,.58,.012);}
    box(g,m.cabinRubber,.83,.775,0,.09,.46,1.39,.025);box(g,m.cabinRubber,-.655,.58,0,.05,.45,1.40,.015);
    // Enclose the luggage bay above the fuel tank and rear cradle. The normal
    // rear-glass view must show its carpeted deck, not exposed suspension.
    box(g,m.cabinInsert,1.42,.865,0,1.12,.020,1.22,.008);
    for(const s of [-1,1])box(g,m.cabinInsert,1.42,.91,s*.615,1.12,.08,.020,.008);
    box(g,m.cabinInsert,1.965,.91,0,.025,.08,1.24,.008);
    const section=new THREE.Shape([[-.11,.225],[-.11,.29],[-.09,.314],[.09,.314],[.11,.29],[.11,.225],[.100,.225],[.100,.286],[.086,.304],[-.086,.304],[-.100,.286],[-.100,.225]].map(p=>new THREE.Vector2(...p))),tunnel=new THREE.ExtrudeGeometry(section,{depth:1.43,bevelEnabled:false});tunnel.rotateY(Math.PI/2);tunnel.translate(-.68,0,0);add(g,tunnel,m.cabinRubber);
    for(const s of [-1,1]){box(g,m.cabinInsert,-.35,.2475,s*.42,.61,.015,.45,.01);box(g,m.cabinMetal,.22,.30,s*.752,.90,.025,.065,.008);const plate=add(g,new THREE.PlaneGeometry(.3,.042),new THREE.MeshStandardMaterial({map:textTexture('Ferrari','#17191b','#bbc0c5')}),.22,.315,s*.752);plate.rotation.x=-Math.PI/2;const corners=[V(-.67,.256,s*.65),V(-.09,.256,s*.65),V(-.08,.256,s*.195),V(-.67,.256,s*.195),V(-.67,.256,s*.65)],edge=[];for(let k=0;k<corners.length-1;k++)for(let i=0;i<16;i++)edge.push(corners[k].clone().lerp(corners[k+1],i/16));edge.push(corners.at(-1));stitches(g,m.stitch,edge);}
  },V(.05,.30,0),V(0,-.22,0));

  register('pedal-box','Perforated aluminium pedals','Three brushed-metal sport pedal faces with recessed perforations and a left footrest.',g=>{
    for(const [z,y,w,h] of [[.36,.365,.07,.125],[.48,.365,.078,.112],[.58,.365,.054,.145],[.66,.365,.071,.17]]){
      const p=new THREE.Group();p.position.set(-.475,y,z);p.rotation.z=-.22;g.add(p);box(p,m.cabinMetal,0,0,0,.018,h,w,.008);
      tube(p,m.cabinRubber,[V(-.013,.012,0),V(-.052,.05,0),V(-.14,.092,0)],.006);
      const geo=new THREE.CircleGeometry(.003,8),holes=new THREE.InstancedMesh(geo,m.cabinRubber,Math.floor(h/.016)*Math.floor(w/.013)),mat=new THREE.Matrix4();let n=0;
      for(let a=-h/2+.013;a<h/2-.004;a+=.016)for(let b=-w/2+.009;b<w/2-.004;b+=.013){mat.makeRotationY(Math.PI/2);mat.setPosition(.01,a,b);if(n<holes.count)holes.setMatrixAt(n++,mat);}holes.count=n;p.add(holes);
    }
  },V(-.48,.37,.49),V(-.3,.2,.4));

  for(const [side,s] of [['left',1],['right',-1]]){
    register(`${side}-door-panel`,`${side==='left'?'Driver':'Passenger'} door panel`,'Sculpted leather door card with red stitching, carbon inlay, brushed-metal handle, window switch and perforated speaker grille.',g=>{
      box(g,m.dash,.27,.595,s*.738,1.12,.34,.058,.065);ellipse(g,m.seat,.25,.79,s*.754,.585,.079,.032);
      const inlay=box(g,m.cabinCarbon,.21,.59,s*.699,.79,.095,.013,.025);trimMeshes.push(inlay);
      // Seam follows the inner padded edge instead of standing above the door.
      const seam=[];for(let i=0;i<=70;i++){const x=-.25+i/70*1.0,u=(x-.25)/.585;seam.push(V(x,.79+.079*Math.sqrt(Math.max(0,1-u*u-.36)),s*(.754-.032*.6)));}stitches(g,m.stitch,seam);
      box(g,m.seat,.25,.576,s*.705,.58,.061,.10,.025);tube(g,m.cabinMetal,[V(.01,.636,s*.711),V(.11,.678,s*.709),V(.28,.671,s*.709),V(.37,.624,s*.709)],.01);
      for(const [x,y] of [[.01,.636],[.37,.624]])box(g,m.cabinRubber,x,y,s*.723,.032,.032,.035,.008);
      box(g,m.cabinRubber,.25,.62,s*.669,.07,.019,.026,.005);
      const speaker=add(g,new THREE.CircleGeometry(.072,48),m.cabinRubber,-.14,.483,s*.702);speaker.rotation.y=s>0?Math.PI:0;
      const dots=new THREE.InstancedMesh(new THREE.CircleGeometry(.0015,5),m.cabinMetal,220),matrix=new THREE.Matrix4();let n=0;for(let x=-.064;x<=.064;x+=.008)for(let y=-.064;y<=.064;y+=.008)if(x*x+y*y<.0040&&n<220){matrix.makeRotationY(s>0?Math.PI:0);matrix.setPosition(-.14+x,.483+y,s*.697);dots.setMatrixAt(n++,matrix);}dots.count=n;g.add(dots);
      stitches(g,m.stitch,[V(-.16,.46,s*.708),V(.2,.45,s*.708),V(.68,.46,s*.708)]);
    },V(-.997,.622,s*.4975),V(0,.1,s*.85));
    register(`${side}-seatbelt`,`${side==='left'?'Driver':'Passenger'} red seatbelt`,'Woven red shoulder belt, metallic guide and buckle with contrasting red release button.',g=>{
      const z=s*.64;webbing(g,m.belt,[V(.86,1.025,z),V(.80,.934,z),V(.72,.64,z),V(.68,.38,z)]);
      box(g,m.cabinMetal,.86,1.025,z,.042,.037,.056,.006);box(g,m.cabinRubber,.38,.41,s*.166,.055,.074,.045,.008);box(g,m.cabinRed,.374,.453,s*.166,.038,.009,.028,.003);
    },V(.55,.74,s*.67),V(.15,.3,s*.5));
  }
  // Batch rigid upholstery/control surfaces by material within each selectable part.
  // Part pivots and instanced perforations remain independent for animation/export.
  root.updateMatrixWorld(true);
  const trimSet=new Set(trimMeshes);trimMeshes.length=0;
  for(const g of parts.values())if(g.userData.category==='Interior'){
    const buckets=new Map(),objects=[];
    g.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.visible){let container=g;for(let p=o.parent;p&&p!==g;p=p.parent)if(p.userData.articulated){container=p;break;}const trim=trimSet.has(o),key=container.uuid+':'+o.material.uuid+':'+trim;const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(container.matrixWorld.clone().invert().multiply(o.matrixWorld));if(!geo.getAttribute('uv'))geo.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count*2),2));if(!buckets.has(key))buckets.set(key,{material:o.material,container,trim,geos:[],features:new Set()});const b=buckets.get(key);b.geos.push(geo);if(o.userData.cockpitFeature)b.features.add(o.userData.cockpitFeature);objects.push(o);}});
    for(const b of buckets.values()){const geometry=mergeGeometries(b.geos);if(!geometry)throw new Error('Interior geometry batching failed');const mesh=add(b.container,geometry,b.material);mesh.userData.partId=g.userData.partId;mesh.userData.cockpitFeatures=[...b.features];if(b.trim)trimMeshes.push(mesh);b.geos.forEach(x=>x.dispose());}
    const oldGeometries=new Set();objects.forEach(o=>{oldGeometries.add(o.geometry);o.removeFromParent();});oldGeometries.forEach(x=>x.dispose());
  }
  root.updateMatrixWorld(true);
  car.interior={trimMeshes,detailVersion:'812-sloping-dashboard-v7',leatherGrain:grain,leatherNormal,leatherRoughness};
  return car;
}

export function configureInterior(car,config){
  if(!car.interior)return;
  const m=car.materials;m.lowerDash.color.set(config.lowerDashColor||'#835b40');m.stitch.color.set(config.stitchColor||'#c82436');m.belt.color.set(config.beltColor||'#bf1930');
  const suede=config.interiorMaterial==='suede';const normal=suede?null:car.interior.leatherNormal,roughness=suede?null:car.interior.leatherRoughness;
  if(m.seat.normalMap!==normal||m.seat.roughnessMap!==roughness){m.seat.normalMap=normal;m.seat.roughnessMap=roughness;m.seat.bumpMap=suede?car.interior.leatherGrain:null;m.seat.bumpScale=.0015;m.seat.clearcoat=suede?0:.07;m.seat.sheen=suede?.45:.12;m.seat.needsUpdate=true;}
  m.cabinInsert.color.copy(m.seat.color).multiplyScalar(1.5);m.cabinInsert.roughness=config.interiorMaterial==='suede'?.99:.85;
  for(const o of car.interior.trimMeshes)o.material=config.carbonTrim?m.cabinCarbon:m.dash;
}
