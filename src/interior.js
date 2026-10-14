import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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
  const curve=new THREE.CatmullRomCurve3(pts,false,'centripetal'),len=curve.getLength(),count=Math.ceil(len/.009),geos=[];
  for(let i=0;i<count;i++){const a=curve.getPoint(i/count),b=curve.getPoint(Math.min(1,(i+.52)/count)),d=b.clone().sub(a);if(d.length()<1e-5)continue;const geo=new THREE.CylinderGeometry(.00075,.00075,d.length(),4,1);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0,1,0),d.normalize()));geo.translate(...a.clone().add(b).multiplyScalar(.5).toArray());geos.push(geo);}
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
  const [leatherNormal,leatherRoughness]=await Promise.all(['/textures/leather-normal.jpg','/textures/leather-roughness.jpg'].map(url=>new THREE.TextureLoader().loadAsync(url)));
  for(const t of [leatherNormal,leatherRoughness]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);t.anisotropy=8;}
  m.seat=new THREE.MeshPhysicalMaterial({color:'#232528',roughness:.84,metalness:0,normalMap:leatherNormal,normalScale:new THREE.Vector2(.38,.38),roughnessMap:leatherRoughness,clearcoat:.07,clearcoatRoughness:.42,sheen:.12,sheenColor:'#72787d',sheenRoughness:.65});
  m.dash=new THREE.MeshPhysicalMaterial({color:'#17191c',roughness:.60,metalness:0,bumpMap:grain,bumpScale:.0012,clearcoat:.05,clearcoatRoughness:.6,sheen:.10,sheenColor:'#4a4f52',sheenRoughness:.8});
  m.dash.normalMap=leatherNormal;m.dash.normalScale.set(.23,.23);m.dash.bumpMap=null;
  m.stitch=new THREE.MeshStandardMaterial({color:'#c82436',roughness:.88});m.belt=new THREE.MeshStandardMaterial({color:'#bf1930',roughness:.9,bumpMap:grain,bumpScale:.001});
  m.cabinCarbon=m.carbon.clone();m.cabinCarbon.map=m.carbon.map.clone();m.cabinCarbon.map.repeat.set(12,12);m.cabinCarbon.color.set('#62656a');m.cabinCarbon.roughness=.28;m.cabinCarbon.metalness=.12;m.cabinCarbon.clearcoat=.62;m.cabinCarbon.clearcoatRoughness=.23;
  m.cabinMetal=new THREE.MeshStandardMaterial({color:'#a6abb0',metalness:.92,roughness:.28});m.cabinRubber=new THREE.MeshStandardMaterial({color:'#111317',roughness:.92});m.cabinInsert=new THREE.MeshStandardMaterial({color:'#25282c',roughness:.95,bumpMap:grain,bumpScale:.002});m.cabinRed=new THREE.MeshPhysicalMaterial({color:'#b91830',roughness:.35,clearcoat:.5});
  m.ventSlat=new THREE.MeshStandardMaterial({color:'#25292e',roughness:.48,metalness:.45});
  const image=(await new THREE.TextureLoader().loadAsync('/textures/source-ferrari-badge.png')).image;
  function horse(color,bg=null){return canvasTexture(256,256,(ctx,w,h)=>{ctx.drawImage(image,99,74,137,174,44,18,168,215);const im=ctx.getImageData(0,0,w,h);const col=new THREE.Color(color).convertLinearToSRGB();for(let i=0;i<im.data.length;i+=4){const keep=im.data[i]+im.data[i+1]+im.data[i+2]<220&&im.data[i+3]>0;if(keep){im.data[i]=Math.round(col.r*255);im.data[i+1]=Math.round(col.g*255);im.data[i+2]=Math.round(col.b*255);}else im.data[i+3]=0;}ctx.clearRect(0,0,w,h);if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);}const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;tmp.getContext('2d').putImageData(im,0,0);ctx.drawImage(tmp,0,0);});}
  const horseGold=horse('#111111','#f3c832'),horseRed=horse('#c92538');
  const register=(id,name,description,builder,pivot=V(0,0,0),offset=V(0,.6,0))=>{
    const old=parts.get(id);if(old){old.removeFromParent();const geometries=new Set();old.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());}
    const g=new THREE.Group();g.name=id;root.add(g);builder(g);for(const child of g.children)child.position.sub(pivot);g.position.copy(pivot);
    g.userData={partId:id,name,category:'Interior',description,originalPosition:g.position.clone(),originalQuaternion:g.quaternion.clone(),originalScale:g.scale.clone(),originalParent:root.uuid,explodeOffset:offset,detached:false};g.traverse(o=>{if(o.isMesh)o.userData.partId=id;});parts.set(id,g);return g;
  };
  const carbonBox=(g,...a)=>{const o=box(g,m.cabinCarbon,...a);trimMeshes.push(o);return o;};
  const underbody=register('chassis','Underbody & cabin floor','Illustrative low underbody shell supporting the detailed cockpit without the source placeholder cabin blocks.',g=>{
    box(g,m.cabinRubber,0,.177,0,4.32,.081,1.63,.035);
  },V(0,.177,0),V(0,-.12,0));underbody.userData.category='Mechanical';

  register('dashboard','Sculpted dashboard','Curved leather dashboard, contrasting hand-stitched seams, carbon fascia and passenger-side model script.',g=>{
    // Continuous padded volumes: nose forward (-X), cockpit faces rear (+X).
    ellipse(g,m.dash,-.49,.79,0,.32,.16,.76);box(g,m.dash,-.29,.69,0,.24,.19,1.51,.075);
    carbonBox(g,-.153,.747,0,.045,.097,1.46,.022);box(g,m.dash,-.25,.58,-.41,.23,.20,.66,.05);
    tube(g,m.stitch,[V(-.31,.911,.75),V(-.25,.924,.48),V(-.33,.944,.3),V(-.34,.932,0),V(-.28,.91,-.45),V(-.31,.875,-.76)],.0017);
    stitches(g,m.stitch,[V(-.293,.914,.73),V(-.24,.931,.49),V(-.318,.95,.29),V(-.32,.938,0),V(-.267,.916,-.45),V(-.30,.882,-.73)]);
    face(g,textTexture('812 SUPERFAST','#dedee1'),-.119,.70,-.53,.26,.043,.05);
    box(g,m.cabinRubber,-.40,.575,.35,.21,.075,.49,.025);
  },V(-.36,.76,0),V(-.3,.85,0));

  register('air-vents','Four turbine air vents','Four deeply recessed circular vents with metallic rings, red rims, internal vanes and rotary hubs.',g=>{
    for(const z of [.73,.14,-.19,-.73]){const y=Math.abs(z)>.5?.79:.807;
      roundFace(g,m.cabinRubber,-.16,y,z,.075);ring(g,m.cabinCarbon,-.143,y,z,.073,.011);ring(g,m.cabinMetal,-.13,y,z,.064,.0035);ring(g,m.cabinRed,-.126,y,z,.068,.004);
      for(let i=-3;i<=3;i++){const dy=i*.015,length=2*Math.sqrt(.056**2-dy**2);box(g,m.ventSlat,-.15,y+dy,z,.024,.003,length,.001);}
      for(let i=0;i<3;i++){const a=i/3*Math.PI*2,o=box(g,m.ventSlat,-.127,y+Math.cos(a)*.031,z+Math.sin(a)*.031,.009,.061,.0025,.001);o.rotation.x=-a;}
      roundFace(g,m.cabinMetal,-.108,y,z,.012);roundFace(g,m.cabinRubber,-.105,y,z,.007);
    }
  },V(-.13,.8,0),V(-.3,.4,0));

  register('instrument-cluster','Yellow tachometer & digital cluster','Yellow central analog tachometer with graduated markings, needle, neutral indicator and two illuminated digital displays.',g=>{
    const hood=new THREE.Shape();hood.moveTo(-.25,-.03);hood.bezierCurveTo(-.252,.11,-.14,.151,0,.151);hood.bezierCurveTo(.14,.151,.252,.11,.25,-.03);hood.lineTo(.229,-.03);hood.bezierCurveTo(.229,.087,.13,.132,0,.132);hood.bezierCurveTo(-.13,.132,-.229,.087,-.229,-.03);hood.closePath();
    const shell=add(g,new THREE.ExtrudeGeometry(hood,{depth:.22,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:3,steps:1,curveSegments:24}),m.dash,-.355,.901,.426);shell.rotation.y=Math.PI/2;
    const backing=new THREE.Shape();backing.moveTo(-.242,-.065);backing.bezierCurveTo(-.247,.10,-.14,.145,0,.145);backing.bezierCurveTo(.14,.145,.247,.10,.242,-.065);backing.closePath();const cap=add(g,new THREE.ExtrudeGeometry(backing,{depth:.02,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:3,curveSegments:24}),m.dash,-.35,.901,.426);cap.rotation.y=Math.PI/2;
    box(g,m.cabinRubber,-.104,.898,.426,.045,.177,.435,.03);
    ring(g,m.cabinMetal,-.064,.905,.426,.090,.004);roundFace(g,new THREE.MeshStandardMaterial({map:dialTexture(),emissiveMap:dialTexture(),emissive:'#ffffff',emissiveIntensity:.38,roughness:.4}),-.06,.905,.426,.086);
    face(g,displayTexture('driver'),-.068,.892,.589,.117,.109,.36);face(g,horse('#e6e9ee','#060b12'),-.066,.892,.262,.121,.115,.4);
    tube(g,m.stitch,[V(-.12,.965,.652),V(-.14,1.037,.536),V(-.155,1.059,.426),V(-.14,1.037,.32),V(-.12,.96,.21)],.0013);
  },V(-.15,.92,.426),V(0,.6,.3));

  const wheel=register('steering-wheel','Carbon steering wheel','Flat-bottom wheel with leather grips, carbon spokes, Ferrari center badge, start button, rotary manettino, shift LEDs and metal paddles.',g=>{
    // Wheel uses a local plane so its controls rotate together about the column.
    const w=new THREE.Group();w.position.set(.078,.84,.426);w.rotation.z=-.13;g.add(w);
    const circle=[];for(let i=0;i<72;i++){const a=i/72*Math.PI*2;circle.push(V(0,Math.max(-.138,Math.sin(a)*.165),Math.cos(a)*.165));}tube(w,m.seat,circle,.018,true);
    const top=[];for(let i=0;i<=24;i++){const a=.31+ i/24*2.52;top.push(V(.002,Math.sin(a)*.165,Math.cos(a)*.165));}tube(w,m.cabinCarbon,top,.019);
    tube(w,m.cabinCarbon,[V(.002,-.075,.145),V(.003,-.138,.095),V(.003,-.143,0),V(.003,-.138,-.095),V(.002,-.075,-.145)],.021);
    for(const s of [-1,1]){const grip=[];for(let i=0;i<20;i++){const a=(-.5+i/19)*.75;grip.push(V(.018,Math.sin(a)*.164,s*Math.cos(a)*.165));}stitches(w,m.stitch,grip);
      const spoke=new THREE.Shape();spoke.moveTo(s*.028,.014);spoke.bezierCurveTo(s*.064,.021,s*.112,.046,s*.14,.025);spoke.lineTo(s*.143,-.027);spoke.bezierCurveTo(s*.108,-.056,s*.071,-.042,s*.031,-.037);spoke.closePath();const arm=add(w,new THREE.ExtrudeGeometry(spoke,{depth:.013,bevelEnabled:true,bevelSize:.004,bevelThickness:.003,bevelSegments:3,curveSegments:20}),m.cabinCarbon,-.007,0,0);arm.rotation.y=Math.PI/2;
      ellipse(w,m.seat,.003,.006,s*.162,.022,.071,.026);box(w,m.cabinRubber,.013,-.005,s*.108,.017,.061,.043,.009);
      for(const y of [-.012,.016]){roundFace(w,m.cabinRubber,.028,y,s*.11,.008);face(w,textTexture(y>0?'+':'−'),.029,y,s*.11,.009,.008,.08);}
      const paddle=box(w,m.cabinMetal,-.051,.012,s*.129,.016,.143,.029,.01);paddle.rotation.x=s*.12;face(w,textTexture(s>0?'−':'+'),-.039,.052,s*.13,.014,.014,.03);
    }
    box(w,m.cabinCarbon,-.01,-.062,0,.037,.117,.052,.018);ellipse(w,m.seat,.017,-.003,0,.026,.061,.066);ring(w,m.cabinMetal,.045,.0,0,.025,.002);
    roundFace(w,new THREE.MeshStandardMaterial({map:horseGold,roughness:.38}),.048,0,0,.024);
    roundFace(w,m.cabinRed,.033,-.065,.09,.014);face(w,textTexture('START','#ffffff'),.034,-.065,.09,.020,.005,.12);
    ring(w,m.cabinMetal,.032,-.052,-.10,.018,.002);roundFace(w,m.cabinRed,.035,-.052,-.10,.013);const manettino=box(w,m.cabinRed,.04,-.044,-.094,.008,.026,.006,.002);manettino.rotation.x=-.5;
    face(w,textTexture('RACE','#e3e4e5'),.027,-.083,-.104,.029,.006,.08);
    for(let i=0;i<9;i++)roundFace(w,new THREE.MeshStandardMaterial({color:i<5?'#86121d':'#142535',emissive:i<5?'#ef1635':'#112639',emissiveIntensity:i<3?1.2:.1}),.024,.162,(i-4)*.009,.0025);
  },V(.078,.84,.426),V(.25,.55,.4));
  car.steering=[wheel];

  register('center-console','Carbon transmission bridge','Sculpted transmission tunnel with three round controls, hazard switch, window toggles, brushed-metal handle and stitched armrest.',g=>{
    box(g,m.dash,.245,.49,0,.93,.19,.22,.06);carbonBox(g,.125,.60,0,.55,.035,.166,.024);
    for(const [i,label] of ['R','AUTO','LAUNCH'].entries()){const x=-.087+i*.102;const o=add(g,new THREE.CylinderGeometry(.028,.028,.009,48),m.cabinMetal,x,.623,0);roundFace(g,m.cabinRubber,0,0,0,.001).visible=false;
      const cap=add(g,new THREE.CircleGeometry(.023,40),m.cabinRubber,x,.629,0);cap.rotation.x=-Math.PI/2;
      const txt=add(g,new THREE.PlaneGeometry(label==='R'?.014:.038,.011),new THREE.MeshStandardMaterial({map:textTexture(label),transparent:true,emissive:'#e0e3e6',emissiveIntensity:.05}),x,.63,0);txt.rotation.set(-Math.PI/2,0,Math.PI/2);
    }
    const hazard=box(g,m.cabinRed,.232,.628,0,.053,.014,.041,.006);const hazardFace=add(g,new THREE.PlaneGeometry(.035,.027),new THREE.MeshStandardMaterial({map:textTexture('△'),transparent:true}),.233,.637,0);hazardFace.rotation.x=-Math.PI/2;
    box(g,m.cabinMetal,.354,.602,0,.10,.022,.145,.012);box(g,m.cabinRubber,.357,.616,0,.069,.018,.115,.009);box(g,m.cabinMetal,.357,.63,0,.048,.013,.101,.008);
    for(const z of [-.075,.075])box(g,m.cabinRubber,.305,.628,z,.038,.018,.018,.004);
    box(g,m.seat,.585,.574,0,.26,.11,.19,.045);
    for(const s of [-1,1]){tube(g,m.stitch,[V(-.18,.579,s*.107),V(.06,.61,s*.112),V(.30,.59,s*.11),V(.69,.54,s*.105)],.0015);stitches(g,m.stitch,[V(.46,.62,s*.079),V(.57,.635,s*.083),V(.70,.62,s*.077)]);}
  },V(.23,.53,0),V(.35,.6,0));

  register('climate-controls','Dual-zone climate controls','Rotary temperature dials, etched control legends, central switches and metallic bezels.',g=>{
    carbonBox(g,-.091,.665,-.025,.035,.071,.285,.015);
    for(const z of [-.145,.095]){ring(g,m.cabinMetal,-.063,.665,z,.026,.004);roundFace(g,m.cabinRubber,-.057,.665,z,.022);face(g,textTexture('20°'),-.055,.664,z,.032,.013,.1);}
    for(let i=0;i<5;i++){box(g,m.cabinRubber,-.058,.663,-.087+i*.033,.008,.025,.026,.003);face(g,textTexture(['−','AC','↑','↓','+'][i]),-.053,.663,-.087+i*.033,.019,.009,.06);}
  },V(-.07,.66,0),V(.1,.4,0));

  register('passenger-display','Passenger information display','Illuminated passenger-side speed/gear display inset into the leather fascia.',g=>{box(g,m.cabinRubber,-.136,.783,-.477,.014,.078,.327,.006);face(g,displayTexture('passenger'),-.126,.783,-.477,.303,.064,.36);},V(-.13,.79,-.48),V(0,.4,-.3));

  for(const [side,z] of [['driver',.419],['passenger',-.419]]){
    register(`${side}-seat`,`${side==='driver'?'Driver':'Passenger'} sport seat`,'Sculpted leather sport seat with curved bolsters, suede center inserts, red piping, double stitching, embroidered headrest and seat rails.',g=>{
      box(g,m.cabinRubber,.33,.292,z,.67,.065,.45,.02);for(const dz of [-.17,.17])box(g,m.cabinMetal,.33,.255,z+dz,.68,.025,.024,.007);
      ellipse(g,m.seat,.22,.407,z,.303,.10,.235);ellipse(g,m.cabinInsert,.15,.442,z,.225,.037,.135);
      for(const s of [-1,1]){ellipse(g,m.seat,.18,.463,z+s*.19,.28,.071,.053);tube(g,m.stitch,[V(-.09,.446,z+s*.15),V(.0,.505,z+s*.17),V(.22,.521,z+s*.178),V(.42,.479,z+s*.16)],.0015);stitches(g,m.stitch,[V(-.09,.446,z+s*.158),V(0,.505,z+s*.18),V(.22,.52,z+s*.188),V(.42,.475,z+s*.17)]);}
      loftSeat(g,m.seat,[[.42,.45,.18,.065],[.58,.49,.225,.073],[.79,.555,.226,.078],[.93,.609,.182,.075],[1.07,.645,.122,.054],[1.13,.653,.09,.026],[1.151,.653,.055,.014],[1.16,.653,.001,.001]],z);
      loftSeat(g,m.cabinInsert,[[.47,.38,.11,.01],[.60,.411,.13,.018],[.80,.469,.125,.021],[.94,.524,.095,.02]],z);
      for(const s of [-1,1])loftSeat(g,m.seat,[[.49,.41,.004,.004],[.61,.45,.047,.045],[.78,.51,.05,.049],[.90,.555,.038,.04],[.98,.591,.004,.004]],z+s*.172);
      for(const s of [-1,1]){const line=[V(.389,.47,z+s*.126),V(.411,.61,z+s*.15),V(.474,.82,z+s*.149),V(.540,.959,z+s*.104),V(.587,1.094,z+s*.095)];tube(g,m.stitch,line,.0018);stitches(g,m.stitch,line.map(p=>p.clone().add(V(-.004,0,s*.008))));}
      tube(g,m.stitch,[V(-.09,.48,z),V(.08,.481,z),V(.27,.483,z),V(.377,.49,z),V(.419,.65,z),V(.485,.85,z),V(.535,.95,z)],.0017);
      face(g,horseRed,.589,1.052,z,.065,.078,.04).rotation.y=-Math.PI/2;
      for(let i=0;i<4;i++)tube(g,m.dash,[V(.14-i*.053,.471,z-.116),V(.14-i*.053,.478,z),V(.14-i*.053,.471,z+.116)],.001);
      box(g,m.cabinMetal,.43,.325,z+.24,.071,.03,.025,.008);
    },V(.32,.61,z),V(.25,.65,z>0?.65:-.65));
  }

  register('interior-trim','Carpeted cabin & sill trim','Deep charcoal carpets, fitted mats, center tunnel, rear bulkhead and polished sill plates.',g=>{
    box(g,m.cabinRubber,.10,.24,0,1.77,.07,1.43,.055);box(g,m.cabinRubber,.83,.63,0,.09,.75,1.39,.05);
    box(g,m.cabinRubber,-.655,.535,0,.05,.54,1.40,.025);
    for(const s of [-1,1]){box(g,m.cabinInsert,-.35,.29,s*.42,.61,.03,.45,.04);box(g,m.cabinMetal,.22,.30,s*.752,.90,.025,.065,.008);const plate=add(g,new THREE.PlaneGeometry(.3,.042),new THREE.MeshStandardMaterial({map:textTexture('Ferrari','#17191b','#bbc0c5')}),.22,.315,s*.752);plate.rotation.x=-Math.PI/2;stitches(g,m.stitch,[V(-.67,.308,s*.65),V(-.09,.308,s*.65),V(-.08,.308,s*.195),V(-.67,.308,s*.195),V(-.67,.308,s*.65)]);}
  },V(.05,.30,0),V(0,-.22,0));

  register('pedal-box','Perforated aluminium pedals','Three brushed-metal sport pedal faces with recessed perforations and a left footrest.',g=>{
    for(const [z,y,w,h] of [[.36,.365,.07,.125],[.48,.365,.078,.112],[.58,.365,.054,.145],[.66,.365,.071,.17]]){
      const p=new THREE.Group();p.position.set(-.475,y,z);p.rotation.z=-.22;g.add(p);box(p,m.cabinMetal,0,0,0,.018,h,w,.008);
      const geo=new THREE.CircleGeometry(.003,8),holes=new THREE.InstancedMesh(geo,m.cabinRubber,Math.floor(h/.016)*Math.floor(w/.013)),mat=new THREE.Matrix4();let n=0;
      for(let a=-h/2+.013;a<h/2-.004;a+=.016)for(let b=-w/2+.009;b<w/2-.004;b+=.013){mat.makeRotationY(Math.PI/2);mat.setPosition(.01,a,b);if(n<holes.count)holes.setMatrixAt(n++,mat);}holes.count=n;p.add(holes);
    }
  },V(-.48,.37,.49),V(-.3,.2,.4));

  for(const [side,s] of [['left',1],['right',-1]]){
    register(`${side}-door-panel`,`${side==='left'?'Driver':'Passenger'} door panel`,'Sculpted leather door card with red stitching, carbon inlay, brushed-metal handle, window switch and perforated speaker grille.',g=>{
      box(g,m.dash,.27,.595,s*.738,1.12,.34,.058,.065);ellipse(g,m.seat,.25,.79,s*.754,.585,.079,.032);
      const inlay=box(g,m.cabinCarbon,.21,.59,s*.699,.79,.095,.013,.025);trimMeshes.push(inlay);
      tube(g,m.stitch,[V(-.25,.805,s*.717),V(.01,.82,s*.719),V(.43,.81,s*.724),V(.81,.758,s*.727)],.0015);stitches(g,m.stitch,[V(-.25,.795,s*.715),V(.01,.811,s*.717),V(.43,.801,s*.722),V(.81,.749,s*.725)]);
      box(g,m.seat,.25,.576,s*.68,.58,.061,.12,.025);tube(g,m.cabinMetal,[V(.01,.636,s*.686),V(.11,.678,s*.684),V(.28,.671,s*.684),V(.37,.624,s*.684)],.01);
      box(g,m.cabinRubber,.25,.62,s*.639,.07,.019,.026,.005);
      const speaker=add(g,new THREE.CircleGeometry(.072,48),m.cabinRubber,-.14,.483,s*.702);speaker.rotation.y=s>0?Math.PI:0;
      const dots=new THREE.InstancedMesh(new THREE.CircleGeometry(.0015,5),m.cabinMetal,220),matrix=new THREE.Matrix4();let n=0;for(let x=-.064;x<=.064;x+=.008)for(let y=-.064;y<=.064;y+=.008)if(x*x+y*y<.0040&&n<220){matrix.makeRotationY(s>0?Math.PI:0);matrix.setPosition(-.14+x,.483+y,s*.697);dots.setMatrixAt(n++,matrix);}dots.count=n;g.add(dots);
      tube(g,m.stitch,[V(-.22,.438,s*.699),V(.2,.421,s*.699),V(.68,.447,s*.699)],.0012);
    },V(-.997,.622,s*.4975),V(0,.1,s*.85));
    register(`${side}-seatbelt`,`${side==='left'?'Driver':'Passenger'} red seatbelt`,'Woven red shoulder belt, metallic guide and buckle with contrasting red release button.',g=>{
      const z=s*.67;webbing(g,m.belt,[V(.76,1.071,z),V(.60,.934,z),V(.38,.64,z),V(.29,.38,z)]);
      box(g,m.cabinMetal,.74,1.067,z,.042,.037,.056,.006);box(g,m.cabinRubber,.38,.41,s*.166,.055,.074,.045,.008);box(g,m.cabinRed,.374,.453,s*.166,.038,.009,.028,.003);
    },V(.55,.74,s*.67),V(.15,.3,s*.5));
  }
  // Batch rigid upholstery/control surfaces by material within each selectable part.
  // Part pivots and instanced perforations remain independent for animation/export.
  root.updateMatrixWorld(true);
  const trimSet=new Set(trimMeshes);trimMeshes.length=0;
  for(const g of parts.values())if(g.userData.category==='Interior'){
    const inverse=g.matrixWorld.clone().invert(),buckets=new Map(),objects=[];
    g.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.visible){const trim=trimSet.has(o),key=o.material.uuid+':'+trim;const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(!geo.getAttribute('uv'))geo.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count*2),2));if(!buckets.has(key))buckets.set(key,{material:o.material,trim,geos:[]});buckets.get(key).geos.push(geo);objects.push(o);}});
    for(const b of buckets.values()){const geometry=mergeGeometries(b.geos);if(!geometry)throw new Error('Interior geometry batching failed');const mesh=add(g,geometry,b.material);mesh.userData.partId=g.userData.partId;if(b.trim)trimMeshes.push(mesh);b.geos.forEach(x=>x.dispose());}
    const oldGeometries=new Set();objects.forEach(o=>{oldGeometries.add(o.geometry);o.removeFromParent();});oldGeometries.forEach(x=>x.dispose());
  }
  root.updateMatrixWorld(true);
  car.interior={trimMeshes,detailVersion:'812-reference-cockpit-v2',leatherGrain:grain,leatherNormal,leatherRoughness};
  return car;
}

export function configureInterior(car,config){
  if(!car.interior)return;
  const m=car.materials;m.stitch.color.set(config.stitchColor||'#c82436');m.belt.color.set(config.beltColor||'#bf1930');
  const suede=config.interiorMaterial==='suede';const normal=suede?null:car.interior.leatherNormal,roughness=suede?null:car.interior.leatherRoughness;
  if(m.seat.normalMap!==normal||m.seat.roughnessMap!==roughness){m.seat.normalMap=normal;m.seat.roughnessMap=roughness;m.seat.bumpMap=suede?car.interior.leatherGrain:null;m.seat.bumpScale=.0015;m.seat.clearcoat=suede?0:.07;m.seat.sheen=suede?.45:.12;m.seat.needsUpdate=true;}
  m.cabinInsert.color.copy(m.seat.color).multiplyScalar(1.5);m.cabinInsert.roughness=config.interiorMaterial==='suede'?.99:.85;
  for(const o of car.interior.trimMeshes)o.material=config.carbonTrim?m.cabinCarbon:m.dash;
}
