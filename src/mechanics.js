import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { openExhaustServicePassages } from './service-passages.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
const CATALOG='https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams/';
const source=(n,name)=>CATALOG+n+'/'+name;
function mesh(g,geo,m,feature,pos=V()){const o=new THREE.Mesh(geo,m);o.position.copy(pos);o.castShadow=o.receiveShadow=true;o.userData.mechanicalFeature=feature;g.add(o);return o;}
function box(g,m,p,size,feature,r=.008){return mesh(g,new RoundedBoxGeometry(...size,2,r),m,feature,V(...p));}
function cylinder(g,m,p,r,length,feature,axis=V(0,0,1),r2=r,segments=32){const geo=new THREE.CylinderGeometry(r2,r,length,segments);geo.rotateX(Math.PI/2);const o=mesh(g,geo,m,feature,V(...p));o.quaternion.setFromUnitVectors(V(0,0,1),axis.clone().normalize());return o;}
function link(g,m,a,b,r,feature){const A=V(...a),B=V(...b);return cylinder(g,m,A.clone().lerp(B,.5).toArray(),r,A.distanceTo(B),feature,B.sub(A));}
function pipe(g,m,points,r,feature){
 const p=points.map(p=>V(...p)),path=new THREE.CurvePath();let end=p[0];
 // Rounded elbows stay inside the control-point hull. Long straight runs must
 // not acquire spline overshoot through a floor, rail or neighbouring assembly.
 for(let i=1;i<p.length-1;i++){const d=Math.min(.045,p[i].distanceTo(p[i-1])*.24,p[i].distanceTo(p[i+1])*.24),a=p[i].clone().lerp(p[i-1],d/p[i].distanceTo(p[i-1])),b=p[i].clone().lerp(p[i+1],d/p[i].distanceTo(p[i+1]));path.add(new THREE.LineCurve3(end,a));path.add(new THREE.QuadraticBezierCurve3(a,p[i],b));end=b;}
 path.add(new THREE.LineCurve3(end,p.at(-1)));return mesh(g,new THREE.TubeGeometry(path,Math.min(256,Math.max(24,points.length*12)),r,8,false),m,feature);
}
function lathe(g,m,profile,feature,position=V()){
 const geo=new THREE.LatheGeometry(profile.map(([r,z])=>new THREE.Vector2(r,z)),96);geo.rotateX(Math.PI/2);
 const p=geo.attributes.position,idx=geo.index,a=V(),b=V(),c=V();let volume=0;for(let i=0;i<idx.count;i+=3){a.fromBufferAttribute(p,idx.getX(i));b.fromBufferAttribute(p,idx.getX(i+1));c.fromBufferAttribute(p,idx.getX(i+2));volume+=a.dot(b.cross(c));}
 if(volume<0){for(let i=0;i<idx.count;i+=3){const n=idx.getX(i+1);idx.setX(i+1,idx.getX(i+2));idx.setX(i+2,n);}geo.computeVertexNormals();}return mesh(g,geo,m,feature,position);
}
function sector(inner,outer,start,end){const s=new THREE.Shape();s.moveTo(Math.cos(start)*inner,Math.sin(start)*inner);s.lineTo(Math.cos(start)*outer,Math.sin(start)*outer);s.absarc(0,0,outer,start,end,false);s.lineTo(Math.cos(end)*inner,Math.sin(end)*inner);s.absarc(0,0,inner,end,start,true);s.closePath();return s;}
function extrude(g,m,shape,z,depth,feature,bevel=.001){const geo=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:48});geo.translate(0,0,z);return mesh(g,geo,m,feature);}
function batch(g){
 g.updateMatrixWorld(true);const inv=g.matrixWorld.clone().invert(),buckets=new Map(),old=[];
 g.traverse(o=>{if(!o.isMesh||o.userData.articulated)return;if(Array.isArray(o.material))throw new Error('Mechanical batching requires one material per source mesh');let b=buckets.get(o.material);if(!b)buckets.set(o.material,b={geos:[],features:new Set()});const transform=inv.clone().multiply(o.matrixWorld);let geo=o.geometry.clone().applyMatrix4(transform);if(geo.index)geo=geo.toNonIndexed();if(transform.determinant()<0)for(const attr of Object.values(geo.attributes))for(let i=0;i<attr.count;i+=3)for(let j=0;j<attr.itemSize;j++){const b=(i+1)*attr.itemSize+j,c=(i+2)*attr.itemSize+j,n=attr.array[b];attr.array[b]=attr.array[c];attr.array[c]=n;}geo.deleteAttribute('uv1');b.geos.push(geo);b.features.add(o.userData.mechanicalFeature);old.push(o);});
 old.forEach(o=>{o.removeFromParent();o.geometry.dispose();});for(const [m,b]of buckets){const geo=mergeGeometries(b.geos);if(!geo)throw new Error('Mechanical merge failed');const o=mesh(g,geo,m);delete o.userData.mechanicalFeature;o.userData.mechanicalFeatures=[...b.features];b.geos.forEach(x=>x.dispose());}
}
function labelTexture(text){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#efeee5';ctx.font='italic 600 88px serif';ctx.textAlign='center';ctx.fillText(text,256,96);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

export function buildResearchedMechanics(car){
 const m=car.materials;
 m.castAlloy=new THREE.MeshStandardMaterial({name:'Cast aluminium structure',color:'#727a80',metalness:.78,roughness:.4});
 m.mechDark=new THREE.MeshStandardMaterial({name:'Mechanical coated alloy',color:'#252b30',metalness:.65,roughness:.4});
 m.ccm=new THREE.MeshStandardMaterial({name:'Carbon ceramic friction ring',color:'#565956',metalness:.16,roughness:.75});
 m.pad=new THREE.MeshStandardMaterial({name:'Brake friction pad',color:'#232523',roughness:.94});
 m.mechanicalLabel=new THREE.MeshStandardMaterial({name:'Caliper lettering',map:labelTexture('Ferrari'),transparent:true,alphaTest:.3,roughness:.6});
 const newParts=[],brakes=[];car.steeringLinks=[];car.steeringKnuckles=[];
 const part=(id,name,category,description,position,refs,builder)=>{
  let g=car.parts.get(id);if(g){const old=new Set();g.traverse(o=>{if(o.geometry)old.add(o.geometry);});g.clear();old.forEach(x=>x.dispose());}else{g=new THREE.Group();g.name=id;car.root.add(g);car.parts.set(id,g);newParts.push(id);}
  g.position.copy(position);g.quaternion.identity();g.scale.setScalar(1);builder(g);batch(g);
  const centroid=new THREE.Box3().setFromObject(g).getCenter(V());
  g.userData={...g.userData,partId:id,name,category,description,originalPosition:g.position.clone(),originalQuaternion:g.quaternion.clone(),originalScale:g.scale.clone(),originalParent:car.root.uuid,explodeOffset:V(centroid.x*.45,category==='Engine'?.75:.45,centroid.z*.95),detached:false,mechanicalRevision:'812-researched-structure-v1',references:refs,dimensionalBasis:'Published rotor size where specified; other assembly shapes and packaging reconstructed from diagrams.'};
  g.traverse(o=>{if(o.isMesh)o.userData.partId=id;});return g;
 };
 const oriented=(g,side)=>{const p=new THREE.Group();p.scale.z=side;g.add(p);return p;};
 // Rotor sizes: manufacturer-authored Superfast technical sheet. The slot,
 // caliper casting dimensions and running gaps below are reconstruction values.
 for(const [id,wheel]of car.parts){
  if(!/^(left|right)-(front|rear)-wheel$/.test(id))continue;
  const rear=id.includes('-rear-'),side=id.startsWith('left-')?1:-1,R=rear?.180:.199,thickness=rear?.032:.038,inner=rear?.100:.110,hub=rear?.079:.097,center=wheel.position.clone();
  const mount=[];wheel.traverse(o=>{if(o.userData.wheelFeature==='closed-wheel-mount')mount.push(o);});mount.forEach(o=>{o.removeFromParent();o.geometry.dispose();});
  const disc=part(id.replace('wheel','disc'),`${rear?'Rear':'Front'} CCM rotor & bell`,'Brakes',`${Math.round(R*2000)} mm ventilated carbon-ceramic ring, separate mounting bell and real drilled passages. Rotates with the wheel.`,center,[source(rear?'0035':'0033',rear?'rear-suspension-shock-absorber-and-brake-disc':'front-suspension-shock-absorber-and-brake-disc')],g=>{
   const p=oriented(g,side),shape=new THREE.Shape();shape.absarc(0,0,R,0,TAU,false);const bore=new THREE.Path();bore.absarc(0,0,inner,0,TAU,true);shape.holes.push(bore);
   for(let row=0;row<2;row++)for(let i=0;i<22;i++){const a=(i+row*.30)*TAU/22,r=inner+(R-inner)*(row?.77:.35),hole=new THREE.Path();for(let j=0;j<12;j++){const t=-j*TAU/12,x=Math.cos(a)*r+Math.cos(t)*.0026,y=Math.sin(a)*r+Math.sin(t)*.0026;if(j)hole.lineTo(x,y);else hole.moveTo(x,y);}hole.closePath();shape.holes.push(hole);}
   for(const sign of [-1,1])extrude(p,m.ccm,shape,sign>0?thickness/2-.008:-thickness/2,.008,'drilled-friction-plate',0);
   for(let i=0;i<44;i++){const a=i*TAU/44;const vane=mesh(p,new THREE.BoxGeometry(R-inner-.005,.0022,thickness-.016),m.ccm,'rotor-cooling-vane');vane.position.set(Math.cos(a)*(inner+R)/2,Math.sin(a)*(inner+R)/2,0);vane.rotation.z=a+.08;}
   lathe(p,m.mechDark,[[.024,hub-.018],[.060,hub-.018],[.064,hub-.028],[inner-.009,.006],[inner+.007,.005],[inner+.007,-.007],[inner-.012,-.008],[.054,hub-.030],[.024,hub-.030],[.024,hub-.018]],'rotor-mounting-bell');
   for(let i=0;i<12;i++){const a=i*TAU/12;cylinder(p,m.wheelHardware,[Math.cos(a)*(inner+.004),Math.sin(a)*(inner+.004),.008],.004,.006,'rotor-bobbin-fastener',V(0,0,1),.004,6);}
  });
  if(!car.wheels.includes(disc))car.wheels.push(disc);
  const padGap=.0008,slotHalf=thickness/2+.0115,outerR=R+.024,bodyInner=R-.065,span=rear?.52:.61;
  const caliper=part(id.replace('wheel','caliper'),`${rear?'Rear':'Front'} fixed brake caliper`,'Brakes','Opposed casting lobes, separate inner/outer pads and a clear rotor throat. Outer bridges sit beyond the rotor edge.',center,[source(rear?'0030':'0029',rear?'rear-brake-callipers':'front-brake-callipers')],g=>{
   const p=oriented(g,side),pack=new THREE.Group();pack.rotation.z=rear?Math.PI:0;p.add(pack);
   for(const sign of [-1,1]){
    extrude(pack,m.caliper,sector(bodyInner,outerR,-span,span),sign>0?slotHalf:-slotHalf-.029,.029,'caliper-casting-lobe',.0018);
    extrude(pack,m.pad,sector(R-.055,R-.004,-span+.07,span-.07),sign>0?thickness/2+padGap:-thickness/2-padGap-.009,.009,'separate-brake-pad',.0003);
    for(let i=0;i<(rear?2:3);i++){const a=THREE.MathUtils.lerp(-span*.64,span*.64,i/(rear?1:2)),r=R-.024;cylinder(pack,m.caliper,[Math.cos(a)*r,Math.sin(a)*r,sign*(slotHalf+.029)],rear?.019:.018,.008,'piston-casting-boss');}
   }
   for(const a of [-span+.09,span-.09])extrude(pack,m.caliper,sector(R+.006,outerR,a-.055,a+.055),-slotHalf-.012,slotHalf*2+.024,'outer-caliper-bridge',.001);
   for(const a of [-span*.75,span*.75]){const r=R+.014;cylinder(pack,m.wheelHardware,[Math.cos(a)*r,Math.sin(a)*r,slotHalf+.024],.004,.011,'caliper-bridge-fastener',V(0,0,1),.004,6);}
   const logo=mesh(pack,new THREE.PlaneGeometry(rear?.072:.086,.018),m.mechanicalLabel,'caliper-wordmark',V(R-.022,0,slotHalf+.035));logo.rotation.z=Math.PI/2;
   pipe(pack,m.mechDark,[[R+.009,-.045,-slotHalf-.03],[R+.031,-.038,-slotHalf-.04],[R+.032,.038,-slotHalf-.04],[R+.010,.047,-slotHalf-.03]],.0022,'caliper-fluid-crossover');
   cylinder(pack,m.wheelHardware,[R+.003,(rear?-1:1)*(span*.19+.006),slotHalf+.023],.003,.012,'bleed-nipple',V(0,1,0));
  });
  const spec={id:caliper.userData.partId,rotorId:disc.userData.partId,diameter:R*2,thickness,padGap,slotHalf,bodyInnerRadius:bodyInner,outerBridgeInnerRadius:R+.006,caliperOuterRadius:outerR};caliper.userData.brakeAssembly=spec;disc.userData.brakeAssembly=spec;brakes.push(spec);
 }

 // Diagram-derived suspension topology, with reconstructed hardpoint positions.
 for(const axle of ['front','rear'])for(const side of [-1,1]){
  const id=`${side>0?'left':'right'}-${axle}`,rear=axle==='rear',wheel=car.parts.get(id+'-wheel');
  const p=part(id+'-suspension',`${rear?'Rear linked':'Front double-arm'} suspension`,'Mechanical','Inboard spring/damper, upper/lower links, upright and hub bearing. Attachment coordinates are reconstructed, not factory hardpoints.',wheel.position.clone(),[source(rear?'0036':'0034',rear?'rear-suspension-arms':'front-suspension-arms')],g=>{
   const p=oriented(g,side),anchor=rear?-.36:-.41;
   for(const y of [-.078,.135])for(const x of [-.235,.235]){link(p,m.castAlloy,[x,y,anchor],[0,y-.015,-.075],y<0?.017:.013,'suspension-control-arm');cylinder(p,m.mechDark,[x,y,anchor],.023,.055,'control-arm-bushing',V(1,0,0));}
   const knuckle=rear?p:new THREE.Group();if(!rear){p.add(knuckle);car.steeringKnuckles.push({group:knuckle,side});}cylinder(knuckle,m.mechDark,[0,0,-.055],.045,.085,'hub-bearing');box(knuckle,m.castAlloy,[0,.015,-.083],[.07,.26,.055],'upright',.018);if(!rear){link(knuckle,m.castAlloy,[0,0,-.083],[-.10,.005,-.095],.012,'steering-arm');knuckle.traverse(o=>{if(o.isMesh){o.userData.articulated=true;o.userData.steerWithWheel=side;o.userData.steeringWheelCenter=wheel.position.toArray();}});}
   const lower=V(.035,-.005,-.24),upper=V(-.055,.38,-.30),axis=upper.clone().sub(lower).normalize();
   cylinder(p,m.mechDark,lower.clone().lerp(upper,.42).toArray(),.019,.31,'damper-body',axis);cylinder(p,m.wheelHardware,lower.clone().lerp(upper,.79).toArray(),.009,.18,'damper-rod',axis);
   const u=V(1,0,0),v=axis.clone().cross(u).normalize(),coil=[];for(let i=0;i<=192;i++){const t=i/192,a=t*TAU*6.5,point=lower.clone().lerp(upper,.12+t*.73).addScaledVector(u,.041*Math.cos(a)).addScaledVector(v,.041*Math.sin(a));coil.push(point.toArray());}pipe(p,m.mechDark,coil,.0048,'inboard-coil-spring');
   for(const t of [.10,.86])cylinder(p,m.castAlloy,lower.clone().lerp(upper,t).toArray(),.049,.008,'spring-seat',axis);
   if(rear)link(p,m.castAlloy,[-.10,.005,-.095],[-.13,.035,-.39],.009,'rear-toe-link');
   if(rear){box(p,m.mechDark,[-.13,.035,-.32],[.11,.055,.10],'rear-steering-actuator');link(p,m.castAlloy,[.12,-.06,-.1],[.28,-.08,-.34],.012,'rear-longitudinal-link');}
  });p.userData.axle=axle;p.userData.side=side;
 }
 const beam=(g,a,b,w=.065,h=.080)=>{
  const s=new THREE.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();const hole=new THREE.Path();hole.moveTo(-w/2+.006,-h/2+.006);hole.lineTo(-w/2+.006,h/2-.006);hole.lineTo(w/2-.006,h/2-.006);hole.lineTo(w/2-.006,-h/2+.006);hole.closePath();s.holes.push(hole);
  const A=V(...a),B=V(...b),o=extrude(g,m.castAlloy,s,0,A.distanceTo(B),'hollow-frame-member',.001);o.position.copy(A);o.quaternion.setFromUnitVectors(V(0,0,1),B.sub(A).normalize());
 };
 part('front-subframe','Front frame & suspension towers','Mechanical','Paired hollow rails, front crossmember, lower cradle and two suspension towers.',V(),[source('0102','structures-and-elements-front-of-vehicle')],g=>{
  for(const s of [-1,1]){beam(g,[-1.88,.33,s*.48],[-.74,.34,s*.48],.065,.060);beam(g,[-1.70,.31,s*.48],[-1.60,.78,s*.55],.040,.040);beam(g,[-1.12,.31,s*.48],[-1.29,.78,s*.55],.040,.040);beam(g,[-1.60,.78,s*.55],[-1.29,.78,s*.55],.040,.035);cylinder(g,m.castAlloy,[-1.445,.7675,s*.54],.055,.025,'front-damper-tower',V(0,1,0));}beam(g,[-1.87,.20,-.53],[-1.87,.20,.53]);beam(g,[-1.48,.23,-.48],[-1.48,.23,.48],.065,.030);for(const sign of [-1,1]){beam(g,[-.82,.15,sign*.53],[-.82,.15,sign*.49],.045,.025);beam(g,[-.82,.15,sign*.28],[-.82,.15,sign*.10],.045,.025);};
 });
 part('rear-subframe','Rear frame & transaxle cradle','Mechanical','Rear cradle, mounting bushes and upper spring pickup towers.',V(),[source('0104','structures-and-elements-rear-of-vehicle')],g=>{
  for(const s of [-1,1]){beam(g,[.80,.26,s*.47],[1.76,.26,s*.47]);beam(g,[1.04,.28,s*.47],[1.12,.78,s*.55],.040,.040);beam(g,[1.65,.28,s*.47],[1.43,.78,s*.55],.040,.040);beam(g,[1.12,.78,s*.55],[1.43,.78,s*.55],.040,.035);cylinder(g,m.castAlloy,[1.275,.7675,s*.54],.055,.025,'rear-damper-tower',V(0,1,0));}beam(g,[1.70,.25,-.47],[1.70,.25,.47]);for(const sign of [-1,1]){beam(g,[.83,.25,sign*.47],[.83,.25,sign*.29]);beam(g,[.83,.25,sign*.29],[.83,.51,sign*.29],.045,.045);}beam(g,[.83,.51,-.29],[.83,.51,.29],.045,.045);
 });
 part('chassis-frame','Central sills, bulkhead & tunnel','Mechanical','Longitudinal sill beams, firewall perimeter, transmission tunnel and seat crossmembers.',V(),[source('0103','structures-and-elements-centre-of-vehicle')],g=>{
  for(const s of [-1,1]){beam(g,[-.50,.17,s*.73],[.91,.17,s*.73],.075,.060);beam(g,[-.74,.26,s*.73],[-.70,.73,s*.60],.030,.035);beam(g,[-.47,.26,s*.15],[.69,.26,s*.15],.025,.035);beam(g,[.69,.26,s*.15],[.76,.26,s*.225],.025,.035);beam(g,[.76,.26,s*.225],[.85,.26,s*.225],.018,.035);}for(const x of [-.46,.27,.82])for(const s of [-1,1]){beam(g,[x,.185,s*.12],[x,.185,s*.30],.040,.044);beam(g,[x,.185,s*.48],[x,.185,s*.73],.040,.044);}beam(g,[-.70,.73,-.60],[-.70,.73,.60],.030,.035);
 });
 part('engine','65° V12 crankcase & cylinder banks','Engine','Cast crankcase, two cylinder banks, twelve coil/injector stations, fuel rails and front accessory drive. Exterior reconstruction.',V(-1.23,.51,0),['https://www.ferrari.com/content/dam/ferrari-fcom/old/pdf/cs_ferrari_812_superfast_gbr.pdf',source('0001','crankcase')],g=>{
  box(g,m.castAlloy,[0,-.035,0],[1.00,.27,.38],'v12-crankcase',.035);box(g,m.mechDark,[0,-.20,0],[.90,.08,.32],'shallow-oil-sump',.025);
  for(const s of [-1,1]){const head=box(g,m.castAlloy,[0,.095,s*.19],[.99,.16,.18],'cylinder-head-bank',.024);head.rotation.x=s*THREE.MathUtils.degToRad(32.5);for(let i=0;i<6;i++){const x=-.43+i*.172;box(g,m.mechDark,[x,.18,s*.23],[.052,.052,.065],'ignition-coil',.009);cylinder(g,m.wheelHardware,[x,.19,s*.12],.012,.06,'injector-body',V(0,1,0));}link(g,m.mechDark,[-.44,.21,s*.12],[.45,.21,s*.12],.010,'fuel-rail');}
  for(const [y,z,r]of [[-.05,0,.064],[.09,.24,.046],[.10,-.23,.042]])cylinder(g,m.mechDark,[-.535,y,z],r,.035,'accessory-pulley',V(1,0,0));
  pipe(g,m.wheelSeal,[[-.559,-.05,0],[-.559,.09,.24],[-.559,.10,-.23],[-.559,-.05,0]],.008,'accessory-belt');
 });
 part('engine-covers','Twin V12 intake plenums & cam covers','Engine','Two sculpted plenums, twelve inlet runners and cylinder-cover fasteners following the intake layout.',V(-1.23,.51,0),[source('0012','intake-manifold')],g=>{
  for(const s of [-1,1]){const plenum=box(g,m.engineRed,[0,.225,s*.153],[.93,.14,.185],'intake-plenum',.06);plenum.rotation.x=s*.10;const cover=box(g,m.engineRed,[0,.13,s*.30],[.90,.095,.12],'cam-cover',.033);cover.rotation.x=s*.38;for(let i=0;i<6;i++){const x=-.43+i*.172;pipe(g,m.castAlloy,[[x,.14,s*.21],[x,.18,s*.14],[x,.205,s*.07]],.027,'twelve-inlet-runners');cylinder(g,m.wheelHardware,[x,.186,s*.30],.003,.008,'cam-cover-fastener',V(0,1,0),.003,6);box(g,m.castAlloy,[x,.184,s*.30],[.009,.006,.075],'cam-cover-cast-rib',.002);}pipe(g,m.mechDark,[[-.43,.247,s*.235],[0,.247,s*.245],[.43,.247,s*.235]],.0015,'plenum-casting-seam');const name=mesh(g,new THREE.PlaneGeometry(.25,.055),m.mechanicalLabel,'plenum-wordmark',V(0,.301,s*.153));name.rotation.x=-Math.PI/2;}
 });
 part('air-intake','Twin airboxes & intake ducts','Engine','Two filter housings, paired throttle couplings and ducts entering the plenums.',V(),[source('0013','air-intake'),source('0012','intake-manifold')],g=>{
  for(const s of [-1,1]){box(g,m.mechDark,[-1.80,.59,s*.49],[.20,.10,.16],'air-filter-housing',.035);pipe(g,m.mechDark,[[-1.86,.50,s*.56],[-1.75,.60,s*.46],[-1.75,.69,s*.42]],.036,'intake-duct');pipe(g,m.mechDark,[[-1.75,.69,s*.42],[-1.69,.74,s*.29],[-1.68,.745,s*.24],[-1.695,.765,s*.153]],.026,'intake-throttle-elbow');cylinder(g,m.castAlloy,[-1.695,.765,s*.153],.030,.038,'throttle-body',V(1,0,0));}
 });
 part('torque-tube','Central torque tube & propeller shaft','Mechanical','Enclosed longitudinal connection between front engine and rear transaxle.',V(),[source('0022','transmission-housing'),source('0023','transmission-pipe')],g=>{
  link(g,m.castAlloy,[-.73,.265,0],[.85,.265,0],.035,'torque-tube-housing');link(g,m.mechDark,[-.73,.265,0],[.87,.265,0],.018,'central-propeller-shaft');for(const x of [-.72,.80]){cylinder(g,m.castAlloy,[x,.265,0],.050,.025,'torque-tube-flange',V(1,0,0));for(let i=0;i<6;i++){const a=i*TAU/6;cylinder(g,m.wheelHardware,[x,.265+Math.cos(a)*.042,Math.sin(a)*.042],.004,.032,'flange-bolt',V(1,0,0),.004,6);}}
 });
 part('rear-transaxle','Rear DCT transaxle & differential','Mechanical','Rear transmission casing, clutch-end housing, differential casing, service cover and mounting feet. No internal gear tooth geometry is claimed.',V(1.28,.35,0),[source('0025','gearbox-housing'),source('0000','spare-assembly-units')],g=>{
  box(g,m.castAlloy,[-.08,0,0],[.67,.27,.39],'dct-transmission-case',.065);cylinder(g,m.castAlloy,[-.43,-.085,0],.120,.16,'clutch-housing',V(1,0,0));cylinder(g,m.castAlloy,[.05,.012,0],.145,.45,'rear-differential-case');box(g,m.mechDark,[0,-.145,0],[.45,.025,.30],'gearbox-service-pan');for(let i=0;i<8;i++)box(g,m.castAlloy,[-.34+i*.079,0,0],[.009,.28,.40],'gearbox-cooling-rib',.003);
 });
 part('rear-halfshafts','Rear halfshafts & CV joints','Mechanical','A pair of rear driveshafts connecting the differential outputs to the rear hubs.',V(),[source('0036','rear-suspension-arms')],g=>{
  for(const s of [-1,1]){link(g,m.mechDark,[1.33,.362,s*.18],[1.33,.372,s*.78],.018,'rear-drive-halfshaft');for(const z of [.24,.72]){cylinder(g,m.wheelSeal,[1.33,.367,s*z],.039,.077,'cv-joint-boot');for(let i=0;i<5;i++)cylinder(g,m.wheelSeal,[1.33,.367,s*(z-.03+i*.014)],.042-i*.001,.004,'cv-boot-convolution');}}
 });
 part('steering-rack','EPS rack, bellows & tie rods','Mechanical','Electric front steering rack and paired links to the front uprights.',V(),[source('0031','electric-steering-box')],g=>{
  link(g,m.castAlloy,[-1.60,.16,-.22],[-1.60,.16,.22],.022,'eps-rack');cylinder(g,m.mechDark,[-1.64,.17,.20],.032,.12,'eps-motor',V(1,0,0));for(const s of [-1,1]){cylinder(g,m.wheelSeal,[-1.60,.16,s*.24],.025,.08,'rack-bellows');const wheel=car.parts.get(`${s>0?'left':'right'}-front-wheel`),a=V(-1.60,.16,s*.24),local=V(-.10,.005,-s*.095),b=wheel.position.clone().add(local),rod=link(g,m.castAlloy,a.toArray(),b.toArray(),.009,'steering-tie-rod');rod.name=s>0?'left-steering-tie-rod':'right-steering-tie-rod';rod.userData.articulated=true;rod.userData.steeringSide=s;rod.userData.steeringInboard=a.toArray();rod.userData.steeringOutboard=b.toArray();rod.userData.steeringWheelCenter=wheel.position.toArray();car.steeringLinks.push({mesh:rod,wheel,inboard:a,localOutboard:local,length:a.distanceTo(b)});}
 });
 part('cooling-system','Radiators, fans & coolant hoses','Engine','Separate engine-water and oil coolers, paired fan rings and routed coolant hoses.',V(),[source('0021','cooling-radiators-and-air-ducts'),source('0020','cooling-header-tank-and-pipes')],g=>{
  box(g,m.mechDark,[-1.95,.475,0],[.065,.34,.94],'water-radiator');box(g,m.mechDark,[-1.92,.30,0],[.055,.10,.67],'engine-oil-cooler');for(let i=0;i<32;i++)box(g,m.castAlloy,[-1.985,.319+i*.010,0],[.005,.002,.89],'radiator-fin',.0005);for(const s of [-1,1]){const ring=mesh(g,new THREE.TorusGeometry(.135,.012,8,64),m.mechDark,'cooling-fan-shroud',V(-1.90,.475,s*.235));ring.rotation.y=Math.PI/2;cylinder(g,m.mechDark,[-1.89,.475,s*.235],.035,.025,'cooling-fan-motor',V(1,0,0));pipe(g,m.wheelSeal,[[-1.95,.35,s*.43],[-1.76,.285,s*.40],[-1.63,.29,s*.28],[-1.53,.36,s*.26]],.018,'coolant-hose');}
 });
 part('oil-system','Oil reservoir & lubrication lines','Engine','Separate reservoir, service cap and feed/return lines based on the lubrication catalogue assembly.',V(),[source('0018','lubrication-system-tank')],g=>{
  cylinder(g,m.mechDark,[-.86,.54,-.52],.065,.27,'oil-reservoir',V(0,1,0));cylinder(g,m.wheelHardware,[-.86,.688,-.52],.032,.02,'oil-filler-cap',V(0,1,0));pipe(g,m.wheelSeal,[[-.86,.43,-.52],[-.86,.40,-.20],[-.86,.155,-.20],[-1.20,.155,-.20],[-1.26,.245,-.20],[-1.30,.29,-.24]],.012,'oil-feed-line');
 });
 part('fuel-system','Rear fuel tank, pumps & feed lines','Mechanical','Tank volume behind the seating area, two pump service covers, retaining straps and protected feed routing.',V(),[source('0009','fuel-tank-fuel-system-pumps-and-pipes'),source('0010','fuel-tank-and-filler-neck')],g=>{
  box(g,m.mechDark,[1.08,.67,0],[.34,.28,.86],'rear-fuel-tank',.05);for(const s of [-1,1]){cylinder(g,m.mechDark,[1.08,.82,s*.24],.062,.014,'fuel-pump-service-cover',V(0,1,0));box(g,m.castAlloy,[1.08,.675,s*.30],[.355,.29,.022],'fuel-tank-retaining-strap');pipe(g,m.wheelSeal,[[1.02,.56,s*.40],[.94,.45,s*.56],[.94,.148,s*.56],[-.82,.148,s*.56],[-.82,.32,s*.66],[-1.12,.66,s*.64],[-1.19,.73,s*.12]],.005,'protected-fuel-line');}
 });
 part('exhaust-manifolds','Twelve exhaust primaries & catalysts','Engine','Six primaries per cylinder bank merge into two catalyst paths, routed outside the central torque tube.',V(),[source('0014','pre-catalytic-and-catalytic-converter-not-applicable-for-vehicles-with-gpf-euro-6d-')],g=>{
  for(const s of [-1,1]){for(let i=0;i<6;i++){const x=-1.66+i*.172;pipe(g,m.castAlloy,[[x,.55,s*.32],[x,.43,s*.40],[-.97,.26,s*.32]],.017,'twelve-exhaust-primary');}cylinder(g,m.mechDark,[-.95,.235,s*.32],.060,.24,'catalytic-converter',V(1,0,0));}
 });
 part('exhaust-pipes','Dual exhaust pipes & rear silencers','Mechanical','Paired underfloor routes and silencers terminate at the retained quad tailpipe assembly.',V(),[source('0016','silencers')],g=>{
  for(const s of [-1,1]){pipe(g,m.castAlloy,[[-.83,.235,s*.32],[-.83,.165,s*.32],[-.70,.165,s*.40],[.44,.165,s*.39],[1.52,.165,s*.39],[1.70,.165,s*.71],[1.77,.165,s*.71],[1.83,.36,s*.71],[2.04,.36,s*.69],[2.08,.35,s*.60]],.023,'underfloor-exhaust-pipe');box(g,m.mechDark,[1.96,.36,s*.69],[.20,.10,.11],'rear-silencer',.055);box(g,m.castAlloy,[.25,.197,s*.39],[1.21,.006,.16],'exhaust-heat-shield',.003);}
 });
 part('electrical-harness','Power distribution & main harness routes','Mechanical','Battery, fuse enclosure, protected longitudinal harnesses and branch connectors; individual circuits are not reproduced.',V(),[source('0039','battery'),source('0134','main-wiring-harnesses')],g=>{
  box(g,m.mechDark,[-.90,.59,.53],[.16,.20,.16],'battery');box(g,m.mechDark,[-.90,.71,.53],[.12,.035,.15],'fuse-enclosure');for(const s of [-1,1])pipe(g,m.wheelSeal,[[-1.78,.145,s*.35],[-.96,.145,s*.35],[-.92,.145,s*.68],[.65,.148,s*.68],[.96,.148,s*.68],[.96,.83,s*.60],[1.81,.80,s*.60]],.008,'main-protected-harness');
 });
 openExhaustServicePassages(car);car.root.updateMatrixWorld(true);
 car.mechanics={version:'812-researched-structure-v1',brakes,newParts,referenceIndex:'https://www.eurospares.co.uk/ferrari/812/812-superfast/part-diagrams',dimensionalLimit:'Published rotor dimensions; packaging and other dimensions remain diagram-derived reconstructions.'};
}
