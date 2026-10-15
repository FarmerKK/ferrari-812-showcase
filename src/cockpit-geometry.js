import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
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

export function prepareCockpitMaterials(m){
  const perf=texture(512,512,c=>{c.fillStyle='#e4e4e4';c.fillRect(0,0,512,512);for(let y=0;y<9;y++)for(let x=0;x<9;x++){const px=x*64+(y%2?32:0),py=y*64;const grad=c.createRadialGradient(px-2,py-2,1,px,py,8);grad.addColorStop(0,'#151515');grad.addColorStop(.55,'#555');grad.addColorStop(1,'#e4e4e4');c.fillStyle=grad;c.beginPath();c.arc(px,py,8,0,TAU);c.fill();}});perf.wrapS=perf.wrapT=THREE.RepeatWrapping;perf.repeat.set(40,4);
  perf.repeat.set(12,6);m.perforated=m.seat.clone();m.perforated.map=perf;m.perforated.bumpMap=perf;m.perforated.bumpScale=.00035;m.perforated.normalMap=null;m.perforated.roughnessMap=null;m.perforated.roughness=.62;
  const weave=texture(512,512,c=>{for(let y=0;y<32;y++)for(let x=0;x<32;x++){const vertical=(x-y+64)%4<2;const grd=c.createLinearGradient(x*16,y*16,x*16+(vertical?16:0),y*16+(vertical?0:16));grd.addColorStop(0,'#353a40');grd.addColorStop(.45,'#92989e');grd.addColorStop(1,'#30353a');c.fillStyle=grd;c.fillRect(x*16,y*16,16,16);c.strokeStyle='#ffffff0b';for(let k=2;k<16;k+=3){c.beginPath();c.moveTo(x*16+(vertical?k:0),y*16+(vertical?0:k));c.lineTo(x*16+(vertical?k:16),y*16+(vertical?16:k));c.stroke();}}});weave.wrapS=weave.wrapT=THREE.RepeatWrapping;weave.repeat.set(3,3);m.cabinCarbon.map=weave;m.cabinCarbon.color.set('#a3a9af');m.cabinCarbon.roughness=.31;m.cabinCarbon.clearcoat=.8;m.cabinCarbon.clearcoatRoughness=.15;
  weave.repeat.set(10,10);m.cabinCarbon.color.set('#62686e');
  m.satin=new THREE.MeshPhysicalMaterial({color:'#969da5',metalness:.88,roughness:.36,clearcoat:.15});m.darkMetal=new THREE.MeshStandardMaterial({color:'#363c44',metalness:.6,roughness:.34});m.gaugeGlass=new THREE.MeshPhysicalMaterial({color:'#b5c6d8',transparent:true,opacity:.075,roughness:.1,metalness:.15,depthWrite:false});
  m.columnRubber=m.cabinRubber.clone();m.columnRubber.name='Steering column shroud';
  m.wheelCarbon=m.cabinCarbon.clone();m.wheelCarbon.map=m.cabinCarbon.map.clone();m.wheelCarbon.map.repeat.set(28,28);m.wheelCarbon.color.set('#34393e');m.wheelCarbon.roughness=.36;m.wheelCarbon.clearcoat=.55;
}

const centers=[.705,.075,-.27,-.705];
const frontX=z=>-.154-.17*(Math.abs(z)/.77)**4;
const brow=z=>.821+centers.reduce((n,c)=>n+.036*Math.exp(-(((z-c)/.082)**2)),0);

export function referenceDashboard(g,{m,trimMeshes}){
  // The leather pad terminates at a sculpted eyebrow, leaving the vent gallery open.
  patch(g,m.dash,150,64,(t,v)=>{const z=-.775+t*1.55,x=THREE.MathUtils.lerp(-.76,frontX(z)-.045,v),y=THREE.MathUtils.lerp(.816,brow(z),v)+.015*Math.sin(v*Math.PI);return V(x,y,z);});
  patch(g,m.dash,150,20,(t,v)=>{const z=-.775+t*1.55,top=brow(z);return V(frontX(z)-.045+.017*Math.sin(v*Math.PI*.5),top-.025*v,z);});
  // Lower leather roll and glovebox form a separate supporting layer.
  patch(g,m.dash,128,32,(t,v)=>{const z=-.77+t*1.54,a=v*Math.PI;return V(frontX(z)-.015+.045*Math.sin(a),.665+.025*Math.cos(a),z);});
  box(g,m.dash,-.237,.57,-.54,.24,.18,.41,.035);box(g,m.cabinRubber,-.246,.572,-.54,.245,.004,.376,.002);box(g,m.dash,-.168,.604,-.075,.07,.115,.49,.018);
  // Curved rear wall of the gallery; the air vents sit inside it, not on a flat plate.
  patch(g,m.cabinRubber,120,20,(t,v)=>{const z=-.77+t*1.54;return V(frontX(z)-.081,.688+(1-v)*(brow(z)-.70),z);});
  for(const [a,b]of [[-.77,.19],[.64,.77]]){const tray=patch(g,m.satin,96,24,(t,v)=>{const z=a+t*(b-a);return V(frontX(z)-.075+.066*v,.705+.014*Math.sin(v*Math.PI),z);});tray.userData.cockpitFeature='formed-vent-gallery';
    const accent=[];for(let i=0;i<=96;i++){const z=a+.009+i/96*(b-a-.018);accent.push(V(frontX(z)-.008,.704,z));}tube(g,m.cabinRed,accent,.0018);
  }
  const seam=[];for(let i=0;i<=160;i++){const z=-.75+i/160*1.5;seam.push(V(frontX(z)-.030,brow(z)-.016,z));}stitched(g,m.stitch,seam);
  box(g,m.dash,-.251,.708,.426,.28,.13,.405,.040);
  // Actual hexagonal grille cells in the gap between the two central nozzles.
  box(g,m.cabinRubber,-.226,.773,-.100,.008,.043,.195,.004);
  for(let row=0;row<5;row++)for(let col=0;col<28;col++){const z=-.189+col*.006+(row%2?.003:0),y=.759+row*.00693;hexCell(g,m.darkMetal,-.218,y,z,.004);}
  face(g,legend('Ferrari','#d3d6db'),-.143,.732,-.10,.112,.022,.02);
  const line=[];for(let i=0;i<42;i++){const z=-.74+i/41*.64;line.push(V(frontX(z)-.017,.628,z));}tube(g,m.cabinRubber,line,.0012);
}

export function referenceVents(g,{m}){
  centers.forEach(z=>{const pack=new THREE.Group();pack.position.set(frontX(z)-.005,.766+(Math.abs(z)>.5?.017:0),z);pack.rotation.y=Math.sign(z)*(Math.abs(z)>.5?.21:.025);g.add(pack);
    // Bell-shaped aluminium nozzle with a thick rolled mouth and an open throat.
    lathe(pack,m.satin,[[.067,-.085],[.065,-.062],[.058,-.031],[.053,.003],[.0535,.011],[.051,.015],[.0475,.014],[.046,.006],[.046,-.035],[.051,-.068]]);
    ring(pack,m.cabinRubber,.002,0,0,.0545,.0026);ring(pack,m.cabinRed,.014,0,0,.0517,.0013);ring(pack,m.satin,.017,0,0,.0484,.0011);
    disc(pack,m.cabinRubber,-.059,0,0,.048);
    for(let i=-3;i<=3;i++){const y=i*.0112,len=2*Math.sqrt(.0445**2-y*y);const blade=box(pack,m.darkMetal,-.012,y,0,.009,.0018,len,.0006);blade.rotation.z=-.19;}
    for(const a of [0,TAU/3,TAU*2/3]){const arm=box(pack,m.darkMetal,-.005,Math.cos(a)*.022,Math.sin(a)*.022,.004,.044,.0018,.0006);arm.rotation.x=-a;}
    ring(pack,m.darkMetal,.001,0,0,.009,.002);disc(pack,m.satin,.003,0,0,.0064);disc(pack,m.cabinRubber,.004,0,0,.0043);
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
  const hood=shell(pack,m.perforated,clusterOutline.map(([u,v])=>[u*.97,v]),[[-.257,.71,.28],[-.204,.94,.67],[-.105,1.025,.99],[-.018,1.02,1.03],[.006,1,1],[-.002,.955,.935],[-.028,.94,.89]]);hood.userData.cockpitFeature='recessed-instrument-hood';
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
  const fixed=new THREE.Group();fixed.position.set(.078,.837,.426);fixed.rotation.z=.16;g.add(fixed);const w=new THREE.Group();w.name='steering-rotor';w.userData.articulated=true;fixed.add(w);
  for(const [start,end,material]of [[-.58,.58,m.perforated],[.58,2.56,m.cabinCarbon],[2.56,3.72,m.perforated],[3.72,5.70,m.cabinCarbon]]){
    patch(w,material,112,28,(t,v)=>{const a=start+(end-start)*t,c=wheelOutline(a),tangent=wheelOutline(a+.001).sub(wheelOutline(a-.001)).normalize(),n=V(0,-tangent.z,tangent.y),b=v*TAU,grip=.019+.003*Math.exp(-((Math.sin(a)/.3)**2));return c.add(V(Math.cos(b)*.018,0,0)).addScaledVector(n,Math.sin(b)*grip);});
  }
  // An inclined, flattened clamshell enters the knee bolster below the instruments.
  // The shaft itself is hidden inside this fairing, as on the production car.
  const shroud=patch(fixed,m.columnRubber,64,64,(t,v)=>{const x=-.218+t*.198,a=v*TAU,cy=-.088+.072*t,ry=.033-.011*t,rz=.056-.027*t;return V(x,cy+Math.sin(a)*ry,Math.cos(a)*rz);});shroud.userData.cockpitFeature='contoured-column-fairing';
  const seam=[];for(let i=0;i<=40;i++){const t=i/40;seam.push(V(-.218+t*.198,-.088+.072*t,.056-.027*t));}tube(fixed,m.cabinRubber,seam,.0007);
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
  const airbag=[[-.065,.026],[-.049,.041],[0,.045],[.049,.041],[.065,.026],[.062,-.010],[.040,-.036],[0,-.042],[-.040,-.036],[-.062,-.010]];paddedFace(w,m.seat,airbag,.010,.023);
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

function knob(g,m,x,y,z,r){lathe(g,m.satin,[[r*.90,-.007],[r,-.002],[r,.006],[r*.89,.009],[r*.81,.009]],x,y,z);disc(g,m.cabinRubber,x+.009,y,z,r*.82);for(let i=0;i<36;i++){const a=i/36*TAU;const mark=box(g,m.darkMetal,x+.001,y+Math.sin(a)*r,z+Math.cos(a)*r,.005,.001,.001,.0002);mark.rotation.x=-a;}disc(g,m.cabinRed,x+.010,y+r*.55,z,.0009);}
export function referenceClimate(g,{m}){
  box(g,m.darkMetal,-.128,.661,-.075,.027,.039,.49,.013);box(g,m.cabinRubber,-.111,.662,-.075,.008,.025,.379,.006);
  face(g,legend('21.0°     AUTO     21.0°','#e6e8ec','#050707'),-.105,.662,-.075,.278,.011,.19);for(const z of [.146,-.296])knob(g,m,-.111,.661,z,.018);
  box(g,m.darkMetal,-.145,.603,-.075,.028,.044,.426,.012);for(const z of [.112,-.262])knob(g,m,-.126,.603,z,.016);
  for(let i=0;i<8;i++){const z=.062-i*.039;box(g,m.cabinRubber,-.126,.603,z,.012,.028,.034,.002);face(g,legend(['AUTO','↟','−','AC','+','↡','REAR','OFF'][i],i===0?'#f7a951':'#d1d4d7'),-.118,.603,z,.027,.007,.11);}
}
export function referencePassenger(g,{m}){const z=-.493;box(g,m.cabinRubber,-.119,.665,z,.009,.028,.276,.004);face(g,legend('0 km/h       N      812 SUPERFAST','#c5cbd1','#050707'),-.113,.665,z,.246,.011,.17);}
