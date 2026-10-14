import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const V = (x,y,z) => new THREE.Vector3(x,y,z);
const paint = () => new THREE.MeshPhysicalMaterial({color:'#b91516',metalness:.35,roughness:.22,clearcoat:1,clearcoatRoughness:.09});
export function carbonTexture() {
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
  ctx.fillStyle='#151918';ctx.fillRect(0,0,128,128);
  for(let y=0;y<128;y+=8)for(let x=0;x<128;x+=8){const g=ctx.createLinearGradient(x,y,x+8,y+8);g.addColorStop(0,(x+y)%16?'#454b47':'#252b29');g.addColorStop(1,'#0e1110');ctx.fillStyle=g;ctx.fillRect(x,y,8,8);ctx.fillStyle='#64706825';ctx.fillRect(x+1,y+1,1,6);}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(28,28);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function badgeTexture(text,bg='#e7b518',fg='#181a12') {
  const c=document.createElement('canvas');c.width=128;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,128,128);ctx.fillStyle=fg;ctx.font='italic bold 72px serif';ctx.textAlign='center';ctx.fillText(text,64,91);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
export function surface(fn,nu=50,nv=18) {
  const pos=[],uv=[],indices=[];
  for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){const p=fn(i/nu,j/nv);pos.push(p.x,p.y,p.z);uv.push(i/nu,j/nv);}
  for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function patch(points,nu=24,nv=12,bulge=0) {
  return surface((u,v)=>{const a=points[0].clone().lerp(points[1],u),b=points[3].clone().lerp(points[2],u),p=a.lerp(b,v);p.y+=Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*bulge;return p;},nu,nv);
}
function mesh(group,g,m,x=0,y=0,z=0) {const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
function box(group,m,x,y,z,w,h,d,r=.02){return mesh(group,new RoundedBoxGeometry(w,h,d,3,r),m,x,y,z);}
function tube(group,m,points,r=.008,closed=false){return mesh(group,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,false,'centripetal'),Math.max(24,points.length*8),r,6,closed),m);}
function cylinder(group,m,x,y,z,r,h,segments=32){const o=mesh(group,new THREE.CylinderGeometry(r,r,h,segments),m,x,y,z);return o;}
function interp(profile,x,index){
  for(let i=1;i<profile.length;i++)if(x<=profile[i][0]){
    const a=profile[i-1],b=profile[i],p=profile[Math.max(0,i-2)],n=profile[Math.min(profile.length-1,i+1)],dx=b[0]-a[0],t=THREE.MathUtils.clamp((x-a[0])/dx,0,1);
    const m0=(b[index]-p[index])/(b[0]-p[0]),m1=(n[index]-a[index])/(n[0]-a[0]);
    return (2*t**3-3*t**2+1)*a[index]+(t**3-2*t**2+t)*dx*m0+(-2*t**3+3*t**2)*b[index]+(t**3-t**2)*dx*m1;
  }return profile.at(-1)[index];
}

export function createCar() {
  const root=new THREE.Group();root.name='812 Superfast · Procedural reconstruction';
  const materials={paint:paint(),rim:new THREE.MeshStandardMaterial({color:'#333638',metalness:.94,roughness:.22}),rubber:new THREE.MeshStandardMaterial({color:'#151617',roughness:.91}),caliper:new THREE.MeshStandardMaterial({color:'#edb422',metalness:.42,roughness:.32}),carbon:new THREE.MeshPhysicalMaterial({map:carbonTexture(),color:'#8e9890',roughness:.29,metalness:.5,clearcoat:.5,side:THREE.DoubleSide}),black:new THREE.MeshStandardMaterial({color:'#0c1113',roughness:.45,metalness:.35,side:THREE.DoubleSide}),chrome:new THREE.MeshStandardMaterial({color:'#b9c4c9',metalness:1,roughness:.18}),glass:new THREE.MeshPhysicalMaterial({color:'#344950',metalness:.15,roughness:.09,transparent:true,opacity:.76,side:THREE.DoubleSide,clearcoat:1}),seat:new THREE.MeshStandardMaterial({color:'#73201b',roughness:.78}),dash:new THREE.MeshStandardMaterial({color:'#171b1b',roughness:.81}),brake:new THREE.MeshStandardMaterial({color:'#777b76',metalness:.76,roughness:.53}),headlight:new THREE.MeshStandardMaterial({color:'#d2e4ed',emissive:'#e5f3ff',emissiveIntensity:.25,metalness:.3,roughness:.1}),taillight:new THREE.MeshStandardMaterial({color:'#9a1511',emissive:'#ff2409',emissiveIntensity:.28,roughness:.17}),indicator:new THREE.MeshStandardMaterial({color:'#dd6412',emissive:'#ff8d10',emissiveIntensity:0}),engineRed:new THREE.MeshStandardMaterial({color:'#ad2118',roughness:.6,metalness:.35})};
  materials.paint.side=THREE.DoubleSide;
  const parts=new Map(),wheels=[],steering=[];const front=-1.37,rear=1.35,wheelY=.354;
  function part(id,name,category,description,builder,pivot=null,offset=null,local=false) {
    const g=new THREE.Group();g.name=id;root.add(g);builder(g);
    const center=pivot||new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3());
    if(!local)for(const child of g.children)child.position.sub(center);
    g.position.copy(center);
    const outward=offset||V(center.x*.45,.25,center.z*1.1);
    g.originalParent=root;
    g.userData={partId:id,name,category,description,originalPosition:center.clone(),originalQuaternion:g.quaternion.clone(),originalScale:g.scale.clone(),originalParent:root.uuid,explodeOffset:outward,detached:false,open:0};
    g.traverse(o=>{if(o.isMesh)o.userData.partId=id;});
    parts.set(id,g);return g;
  }
  const profile=[[-2.328,.73,.73],[-2.15,.82,.88],[-1.65,.96,.965],[-1.15,.91,.947],[-.6,.855,.882],[-.2,.87,.882],[.45,.85,.899],[1.1,.93,.95],[1.55,1.02,.973],[2.1,.92,.95],[2.328,.88,.884]];
  const top=(x)=>interp(profile,x,1),width=x=>interp(profile,x,2);
  const hoodHeight=x=>.79+.08*Math.cos((x+.5)*1.4);
  const hoodSurface=(x,z)=>hoodHeight(x)-.012*(z/.667)**2+.014*Math.exp(-(((Math.abs(z)-.41)/.13)**2))*Math.sin(Math.PI*(x+2.19)/1.682);
  const noseX=z=>-2.335+.145*(z/.88)**2;
  const capParameters=(x,kind)=>{
    if(kind==='front'){const blend=THREE.MathUtils.smoothstep(x,-1.05,-.5);return {innerZ:.667,innerY:hoodSurface(x,.667),peakY:top(x),drop:.054*(1-blend)};}
    if(kind==='rear'){const blend=THREE.MathUtils.smoothstep(x,1.06,1.4);return {innerZ:.63,innerY:x<1.63?.905:.916+.045*Math.sin(Math.PI*(x-1.631)/.672)-.05*(.63/.67)**2,peakY:top(x),drop:.045*blend};}
    return {innerZ:.771,innerY:top(x),peakY:top(x)+.018,drop:.013};
  };
  const capY=(x,t,kind)=>{const {innerY,peakY,drop}=capParameters(x,kind);return innerY+(peakY-innerY)*Math.sin(t*Math.PI/2)**2-drop*t**4;};
  const fenderY=(x,z)=>{const {innerZ}=capParameters(x,'front'),t=2/Math.PI*Math.asin(THREE.MathUtils.clamp((Math.abs(z)-innerZ)/(width(x)-innerZ),0,1));return capY(x,t,'front');};
  // Each visible body surface is created once; the wheel arches are genuine holes in the shell.
  for(const s of [-1,1]){
    const side=s===1?'left':'right';
    const panel=(g,x0,x1,kind='door')=>mesh(g,surface((u,v)=>{
      const x=x0+(x1-x0)*u,w=width(x);let lower=.235;
      for(const axle of [front,rear]){const dx=x-axle;if(Math.abs(dx)<.407)lower=Math.max(lower,wheelY+Math.sqrt(Math.max(0,.407**2-dx**2)));}
      const {innerZ}=capParameters(x,kind);let y,z;
      if(v<.43){const t=v/.43;y=capY(x,t,kind);z=s*(innerZ+(w-innerZ)*Math.sin(t*Math.PI/2));}
      else{const t=(v-.43)/.57,edgeY=capY(x,1,kind);y=edgeY+(lower-edgeY)*t;z=s*(w-.043*t*t-.023*Math.sin(Math.PI*t)**2);}
      // Round the nose and tail in plan view rather than terminating the shell on a flat slab.
      const bend=.13*Math.exp(-(x+2.328)/.17)-.07*Math.exp(-(2.328-x)/.15);
      return V(x+bend*(Math.abs(z)/w)**2,y,z);
    },125,42),materials.paint);
    part(`${side}-front-fender`,`${side==='left'?'Left':'Right'} front fender`,'Body','Sculpted front arch and raised shoulder. Surface reconstructed from the front, side and top reference views.',g=>{
      panel(g,-2.328,-.5,'front');
      mesh(g,surface((u,v)=>{const a=Math.PI*u;return V(front+Math.cos(a)*.410,wheelY+Math.sin(a)*.410,s*(.62+.29*v));},64,10),materials.black);
      tube(g,materials.paint,Array.from({length:35},(_,i)=>{const a=Math.PI*i/34,x=front+Math.cos(a)*.407;return V(x,wheelY+Math.sin(a)*.407,s*(width(x)-.043));}),.007);
      tube(g,materials.black,[V(-.98,.744,s*.941),V(-.75,.70,s*.920),V(-.55,.628,s*.885)],.005);
      // Reference-inspired vent behind the front wheel.
      mesh(g,patch([V(-.98,.744,s*.941),V(-.54,.636,s*.887),V(-.59,.556,s*.884),V(-.90,.647,s*.933)]),materials.black);
      const b=mesh(g,new THREE.PlaneGeometry(.083,.10),new THREE.MeshStandardMaterial({map:badgeTexture('A'),roughness:.3}),-.97,.82,s*.951);b.rotation.y=s*Math.PI/2;
    },null,V(-.55,.2,s*1.15));
    part(`${side}-rear-quarter`,`${side==='left'?'Left':'Right'} rear quarter`,'Body','Broad rear haunch with a swept aerodynamic channel. Hidden surface detail is approximate.',g=>{
      panel(g,1.06,2.328,'rear');
      mesh(g,surface((u,v)=>{const a=Math.PI*u;return V(rear+Math.cos(a)*.410,wheelY+Math.sin(a)*.410,s*(.62+.29*v));},64,10),materials.black);
      tube(g,materials.paint,Array.from({length:35},(_,i)=>{const a=Math.PI*i/34,x=rear+Math.cos(a)*.407;return V(x,wheelY+Math.sin(a)*.407,s*(width(x)-.043));}),.007);
      mesh(g,patch([V(1.32,.98,s*.777),V(1.90,.96,s*.912),V(1.79,.90,s*.934),V(1.38,.92,s*.813)]),materials.black);
    },null,V(.65,.25,s*1.15));
    part(`${side}-door`,`${side==='left'?'Left':'Right'} door`,'Body','Independent door panel with a front hinge. Opening angle and hinge geometry are illustrative.',g=>{
      panel(g,-.498,1.058);
      box(g,materials.black,.85,.797,s*.928,.14,.034,.015,.01);
      box(g,materials.paint,.85,.80,s*.941,.11,.022,.013,.008);
      tube(g,materials.paint,[V(-.48,.48,s*.861),V(.1,.45,s*.856),V(.61,.57,s*.88),V(1.02,.76,s*.938)],.005);
      box(g,materials.dash,.28,.65,s*.750,1.25,.34,.038,.035);
    },V(-.50,.65,s*.88),V(0,.1,s*1.45));
    part(`${side}-mirror`,`${side==='left'?'Left':'Right'} mirror`,'Body','Aerodynamic mirror housing with a dark lower support and reflective glass.',g=>{
      tube(g,materials.black,[V(-.36,.887,s*.89),V(-.36,.90,s*1.01),V(-.41,.97,s*1.065)],.026);
      const b=box(g,materials.paint,-.41,.976,s*1.09,.24,.092,.135,.04);b.rotation.y=s*.13;
      const glass=mesh(g,new THREE.PlaneGeometry(.19,.065),materials.chrome,-.294,.975,s*1.09);glass.rotation.y=Math.PI/2;
    },null,V(-.2,.25,s*1.35));
    part(`${side}-skirt`,`${side==='left'?'Left':'Right'} side skirt`,'Exterior','Carbon side skirt, spanning the wheelbase.',g=>{
      mesh(g,patch([V(-.93,.265,s*.93),V(1.0,.265,s*.96),V(.95,.185,s*1.005),V(-.94,.185,s*.978)],30,8),materials.carbon);
      tube(g,materials.paint,[V(-.95,.271,s*.931),V(.05,.265,s*.958),V(1,.277,s*.96)],.018);
    },null,V(0,-.03,s*.95));
  }
  part('hood','Sculpted hood','Front','Long aluminium hood over the front-mid V12. Twin recesses follow the supplied reference.',g=>{
    mesh(g,surface((u,v)=>{const x=-2.19+1.682*u,z=(v-.5)*1.334;return V(x,hoodSurface(x,z),z);},110,52),materials.paint);
    for(const s of [-1,1]){
      tube(g,materials.paint,[V(-2.13,.803,s*.32),V(-1.55,.85,s*.42),V(-.8,.86,s*.47),V(-.51,.815,s*.52)],.007);
      mesh(g,patch([V(-1.29,.840,s*.56),V(-.76,.845,s*.57),V(-.8,.853,s*.47),V(-1.23,.844,s*.49)],20,6),materials.black);
      for(let i=0;i<5;i++)tube(g,materials.carbon,[V(-1.21+i*.082,.849,s*.50),V(-1.20+i*.082,.849,s*.55)],.005);
    }
    const b=mesh(g,new THREE.PlaneGeometry(.053,.067),new THREE.MeshStandardMaterial({map:badgeTexture('A'),roughness:.4}),-2.10,.816,0);b.rotation.x=-Math.PI/2;
  },V(-.509,.81,0),V(-.5,1.25,0));
  part('front-bumper','Front bumper','Front','Flowing nose surrounding a wide central intake, with independent grille and lower splitter.',g=>{
    mesh(g,surface((u,v)=>{const z=(v-.5)*1.334,x=noseX(z)*(1-u)+(-2.19)*u,y=(.690-.032*(z/.667)**2)*(1-u)+hoodSurface(-2.19,z)*u+.018*Math.sin(Math.PI*u);return V(x,y,z);},32,42),materials.paint);
    mesh(g,surface((u,v)=>{const z=(u-.5)*1.68,y=(.690-.032*(z/.667)**2)*(1-v)+(.572-.035*(z/.84)**2)*v,x=noseX(z)-.015*Math.sin(Math.PI*v);return V(x,y,z);},64,18),materials.paint);
    tube(g,materials.paint,[V(noseX(-.8),.58,-.8),V(noseX(-.66)-.02,.30,-.66),V(-2.362,.245,0),V(noseX(.66)-.02,.30,.66),V(noseX(.8),.58,.8)],.039);
    for(const s of [-1,1])mesh(g,surface((u,v)=>{const z=s*(.64+.25*Math.sin(v*Math.PI/2)),y=.267+.367*u,x=noseX(z)+.04*Math.sin(Math.PI*u)+.013*Math.cos(v*Math.PI/2);return V(x,y,z);},36,24),materials.paint);
  },null,V(-1.15,.1,0));
  part('front-grille','Front grille','Front','Dark honeycomb intake. The grille cells and emblem are real geometry.',g=>{
    mesh(g,surface((u,v)=>{const z=(u-.5)*1.36;return V(noseX(z)+.012,.303+.26*v-.028*(z/.68)**2,z);},50,18),materials.black);
    const geo=new THREE.TorusGeometry(.024,.002,3,6);const lattice=new THREE.InstancedMesh(geo,materials.black,156);const matrix=new THREE.Matrix4(),q=new THREE.Quaternion().setFromAxisAngle(V(0,1,0),Math.PI/2);let n=0;
    for(let row=0;row<6;row++)for(let col=0;col<26;col++){const z=-.607+col*.047+(row%2)*.023;matrix.compose(V(noseX(z)+.002,.319+row*.043,z),q,V(1,1,1));lattice.setMatrixAt(n++,matrix);}lattice.count=n;g.add(lattice);
    const emblem=mesh(g,new THREE.PlaneGeometry(.055,.063),new THREE.MeshStandardMaterial({map:badgeTexture('A','#00000000','#bdc4bc'),transparent:true,metalness:.7}),-2.329,.46,0);emblem.rotation.y=-Math.PI/2;
  },null,V(-1.2,0,0));
  part('front-splitter','Front splitter','Exterior','Carbon front splitter. Aero package changes its width and projection.',g=>{
    mesh(g,surface((u,v)=>{const z=(u-.5)*1.79,x=(-2.425+.10*(z/.9)**2)*(1-v)+(-2.08+.10*(z/.9)**2)*v;return V(x,.195+.012*v,z);},48,16),materials.carbon);
    tube(g,materials.carbon,[V(-2.328,.195,-.89),V(-2.424,.188,0),V(-2.328,.195,.89)],.009);
  },null,V(-.55,-.04,0));
  part('air-intakes','Front air intakes','Front','Sculpted lateral intake apertures and internal strakes.',g=>{
    for(const s of [-1,1]){
      mesh(g,surface((u,v)=>{const z=s*(.704+.131*v),y=.337+.219*u;return V(noseX(z)+.002,y,z);},24,16),materials.black);
      for(let i=0;i<3;i++)tube(g,materials.carbon,[V(noseX(.717),.37+i*.047,s*.717),V(noseX(.815),.37+i*.047,s*.815)],.005);
    }
  },null,V(-.95,.15,0));
  for(const s of [-1,1])part(`${s===1?'left':'right'}-headlight`,`${s===1?'Left':'Right'} headlight`,'Front','Swept housing with a projector, LED running strip and indicator.',g=>{
    const lightPoint=(x,z,lift=.005)=>V(x,fenderY(x,z)+lift,s*z);
    const pts=[lightPoint(-2.145,.68),lightPoint(-1.57,.835),lightPoint(-1.65,.925),lightPoint(-2.175,.841)];
    const lensSurface=lift=>surface((u,v)=>{const a=pts[0].clone().lerp(pts[1],u),b=pts[3].clone().lerp(pts[2],u),p=a.lerp(b,v);p.y=fenderY(p.x,p.z)+lift;return p;},40,24);
    mesh(g,lensSurface(.006),materials.black);
    const edge=[];for(let side=0;side<4;side++)for(let i=0;i<12;i++){const p=pts[side].clone().lerp(pts[(side+1)%4],i/12);p.y=fenderY(p.x,p.z)+.012;edge.push(p);}edge.push(edge[0].clone());tube(g,materials.chrome,edge,.004);
    const ledpts=[lightPoint(-2.10,.815,.012),lightPoint(-1.9,.858,.012),lightPoint(-1.72,.887,.012),lightPoint(-1.63,.893,.012)];tube(g,materials.headlight,ledpts,.008);
    for(let i=0;i<4;i++)tube(g,materials.headlight,[lightPoint(-1.72-i*.067,.84,.012),lightPoint(-1.73-i*.067,.874,.012)],.005);
    const lens=mesh(g,new THREE.SphereGeometry(.040,28,16),materials.headlight,-1.946,fenderY(-1.946,.795)+.018,s*.795);lens.scale.set(1,.28,1);
    tube(g,materials.indicator,[lightPoint(-2.08,.855,.012),lightPoint(-1.94,.883,.012)],.006);
    mesh(g,lensSurface(.016),materials.glass);
  },null,V(-.8,.5,s*.72));
  // Cabin glazing and roof are separate; the interior remains visible when removed.
  part('windscreen','Windscreen','Body','Raked front glazing. Approximate curvature based on the reference.',g=>{
    mesh(g,surface((u,v)=>{const x=-.50+.79*u,z=(v-.5)*2*(.762-.13*u),y=.86+.356*u+.035*Math.sin(Math.PI*v);return V(x,y,z);},40,28),materials.glass);
    for(const s of [-1,1])tube(g,materials.paint,[V(-.50,.87,s*.762),V(-.07,1.08,s*.69),V(.29,1.231,s*.632)],.022);
    tube(g,materials.black,[V(-.45,.89,-.40),V(-.40,.92,.15),V(-.41,.923,.31)],.009);
    tube(g,materials.black,[V(-.43,.892,.2),V(-.38,.922,.50),V(-.32,.958,.62)],.008);
  },null,V(-.15,.85,0));
  part('roof','Roof','Body','Compact coupe roof. Paint and carbon finishes share the same physical material system.',g=>{
    mesh(g,surface((u,v)=>{const x=.28+.72*u,z=(v-.5)*1.264,y=1.241+.035*Math.sin(Math.PI*u)-.047*(z/.632)**2;return V(x,y,z);},36,24),materials.paint);
    for(const s of [-1,1])tube(g,materials.paint,[V(.28,1.218,s*.633),V(.63,1.248,s*.635),V(1,1.207,s*.645)],.024);
  },null,V(0,1.2,0));
  part('rear-window','Rear window','Body','Sloping rear glass blending into the short rear deck.',g=>{
    mesh(g,surface((u,v)=>{const x=1+.63*u,z=(v-.5)*(1.286+.16*u),y=1.218-.291*u+.03*Math.sin(Math.PI*v);return V(x,y,z);},36,24),materials.glass);
    for(const s of [-1,1])tube(g,materials.paint,[V(1,1.205,s*.643),V(1.32,1.09,s*.694),V(1.63,.925,s*.72)],.028);
  },null,V(.55,.9,0));
  for(const s of [-1,1])part(`${s===1?'left':'right'}-side-window`,`${s===1?'Left':'Right'} side window`,'Body','Tapered coupe side glazing with a separate quarter-window pillar.',g=>{
    const pts=[V(-.46,.889,s*.771),V(.293,1.218,s*.648),V(1.003,1.198,s*.652),V(1.292,.927,s*.792)];
    mesh(g,patch(pts,30,15,.004),materials.glass);
    tube(g,materials.paint,[...pts,pts[0]],.018);
    tube(g,materials.black,[V(.91,1.208,s*.661),V(.912,.933,s*.821)],.021);
  },null,V(0,.5,s*.95));
  part('rear-deck','Rear deck','Rear','Short rear deck flowing into an integrated trailing lip.',g=>{
    mesh(g,surface((u,v)=>{const x=1.631+.672*u,z=(v-.5)*1.34,y=.916+.045*Math.sin(Math.PI*u)-.05*(z/.67)**2;return V(x,y,z);},40,22),materials.paint);
    tube(g,materials.paint,[V(2.26,.897,-.79),V(2.29,.953,0),V(2.26,.897,.79)],.025);
  },null,V(.7,.6,0));
  part('rear-bumper','Rear bumper','Rear','Rear fascia with twin circular lamps per side and sculpted exhaust surrounds.',g=>{
    box(g,materials.paint,2.245,.687,0,.13,.27,1.77,.065);
    mesh(g,surface((u,v)=>{const z=(u-.5)*1.73,y=.33+.253*v,x=2.319-.082*(z/.865)**2+.013*Math.sin(Math.PI*v);return V(x,y,z);},56,28),materials.paint);
    mesh(g,surface((u,v)=>{const z=(u-.5)*1.74,y=(.813-.015*(z/.87)**2)*(1-v)+(.909-.053*(z/.87)**2)*v,x=2.313-.075*(z/.87)**2-.039*v;return V(x,y,z);},56,18),materials.paint);
    tube(g,materials.paint,[V(2.24,.65,-.85),V(2.31,.36,-.76),V(2.33,.34,0),V(2.31,.36,.76),V(2.24,.65,.85)],.065);
    box(g,materials.black,2.323,.57,0,.02,.13,.47,.015);
    const label=mesh(g,new THREE.PlaneGeometry(.35,.086),new THREE.MeshStandardMaterial({map:badgeTexture('812','#111718','#c3c8bd')}),2.336,.569,0);label.rotation.y=Math.PI/2;
  },null,V(1.2,.1,0));
  part('taillights','Quad taillights','Rear','Four round light units with separately emissive rings.',g=>{
    for(const s of [-1,1])for(const z of [.56,.755]){
      const base=cylinder(g,materials.black,2.323,.766,s*z,.107,.045);base.rotation.z=Math.PI/2;
      const rim=mesh(g,new THREE.TorusGeometry(.076,.015,10,40),materials.taillight,2.352,.77,s*z);rim.rotation.y=Math.PI/2;
      const ring=mesh(g,new THREE.TorusGeometry(.097,.005,6,40),materials.chrome,2.35,.77,s*z);ring.rotation.y=Math.PI/2;
      const lamp=cylinder(g,materials.taillight,2.355,.77,s*z,.047,.014);lamp.rotation.z=Math.PI/2;
    }
    tube(g,materials.taillight,[V(2.285,.919,-.23),V(2.289,.926,0),V(2.285,.919,.23)],.008);
    for(const s of [-1,1])tube(g,materials.indicator,[V(2.359,.647,s*.6),V(2.359,.647,s*.78)],.007);
  },null,V(1.2,.25,0));
  part('rear-diffuser','Rear diffuser','Exterior','Carbon diffuser with vertical strakes and a rising rear ramp.',g=>{
    mesh(g,patch([V(1.76,.16,-.66),V(1.76,.16,.66),V(2.369,.30,.64),V(2.369,.30,-.64)],24,12),materials.carbon);
    for(let i=-3;i<=3;i++){const z=i*.195;mesh(g,patch([V(1.84,.168,z),V(2.36,.30,z),V(2.36,.135,z),V(1.84,.14,z)],14,5),materials.carbon);}
  },null,V(.75,-.04,0));
  part('exhaust','Quad exhaust system','Rear','Four metal exhaust outlets and an illustrative underbody silencer. Internal routing is estimated.',g=>{
    for(const s of [-1,1])for(const z of [.65,.815]){
      const ring=mesh(g,new THREE.TorusGeometry(.067,.009,10,32),materials.chrome,2.385,.29,s*z);ring.rotation.y=Math.PI/2;
      const inside=cylinder(g,materials.black,2.37,.29,s*z,.057,.09);inside.rotation.z=Math.PI/2;
      tube(g,materials.chrome,[V(.1,.23,s*.36),V(1.5,.24,s*.49),V(2.3,.29,s*z)],.042);
    }
    box(g,materials.chrome,1.70,.24,0,.32,.17,.94,.05);
  },null,V(1,-.025,0));
  part('rear-aero','Rear aero lip','Exterior','A configurable carbon trailing lip. The extended package is an illustrative styling option.',g=>{
    tube(g,materials.carbon,[V(2.256,.92,-.79),V(2.31,.97,0),V(2.256,.92,.79)],.018);
  },null,V(.85,.5,0));
  part('chassis','Underbody chassis','Mechanical','Illustrative floor and structural rails. This is not a reconstruction of the actual Ferrari chassis.',g=>{
    box(g,materials.black,.06,.22,0,3.81,.07,1.46,.03);
    for(const s of [-1,1])box(g,materials.chrome,.2,.28,s*.55,2.8,.08,.06,.012);
  },null,V(0,-.08,0));
  for(const x of [front,rear])for(const s of [-1,1]) {
    const axle=x===front?'front':'rear',side=s===1?'left':'right',id=`${side}-${axle}`,center=V(x,wheelY,s*.805),outward=V(0,.06,s*1.3);
    const rim=part(`${id}-wheel`,`${side==='left'?'Left':'Right'} ${axle} wheel`,'Wheels','20-inch inspired alloy wheel with selectable split-spoke or forged star design.',g=>{
      const depth=.255;
      const barrel=mesh(g,new THREE.LatheGeometry([new THREE.Vector2(.235,-depth/2),new THREE.Vector2(.254,-depth/2),new THREE.Vector2(.254,depth/2),new THREE.Vector2(.235,depth/2),new THREE.Vector2(.235,-depth/2)],48),materials.rim);barrel.rotation.x=Math.PI/2;
      for(const r of [.245,.232]){const o=mesh(g,new THREE.TorusGeometry(r,.009,8,64),materials.rim,0,0,s*.153);}
      const split=new THREE.Group();split.name='split-spoke';const star=new THREE.Group();star.name='forged-star';g.add(split,star);
      for(let i=0;i<5;i++){
        const a=i/5*Math.PI*2;
        for(const spread of [-.095,.095]){const angle=a+spread,p0=V(Math.sin(angle)*.035,Math.cos(angle)*.035,s*.162),p1=V(Math.sin(angle+.045)*.222,Math.cos(angle+.045)*.222,s*.161);const spoke=box(split,materials.rim,(p0.x+p1.x)/2,(p0.y+p1.y)/2,s*.166,.015,p0.distanceTo(p1),.020,.005);spoke.rotation.z=-Math.atan2(p1.x-p0.x,p1.y-p0.y);}
        const spoke=box(star,materials.rim,Math.sin(a)*.126,Math.cos(a)*.126,s*.168,.037,.20,.026,.007);spoke.rotation.z=-a;
      }
      star.visible=false;
      const hub=cylinder(g,materials.rim,0,0,s*.17,.044,.018);hub.rotation.x=Math.PI/2;
      const cap=mesh(g,new THREE.CircleGeometry(.022,24),new THREE.MeshStandardMaterial({map:badgeTexture('A'),metalness:.4}),0,0,s*.185);if(s<0)cap.rotation.y=Math.PI;
      for(let i=0;i<5;i++){const a=i*2*Math.PI/5;const b=cylinder(g,materials.chrome,Math.sin(a)*.034,Math.cos(a)*.034,s*.181,.004,.008,8);b.rotation.x=Math.PI/2;}
    },center,outward,true);
    rim.userData.axle=axle;rim.userData.side=s;wheels.push(rim);
    const tire=part(`${id}-tire`,`${side==='left'?'Left':'Right'} ${axle} tire`,'Wheels','Rubber tire with rounded shoulders, recessed tread and sidewall rings.',g=>{
      const points=[new THREE.Vector2(.253,-.146),new THREE.Vector2(.306,-.145),new THREE.Vector2(.332,-.119),new THREE.Vector2(.345,-.087),new THREE.Vector2(.351,0),new THREE.Vector2(.345,.087),new THREE.Vector2(.332,.119),new THREE.Vector2(.306,.145),new THREE.Vector2(.253,.146),new THREE.Vector2(.253,-.146)];
      const t=mesh(g,new THREE.LatheGeometry(points,64),materials.rubber);t.rotation.x=Math.PI/2;
      for(const z of [-.079,-.027,.027,.079])mesh(g,new THREE.TorusGeometry(.3505,.0026,4,80),materials.black,0,0,z);
      for(const r of [.274,.297])mesh(g,new THREE.TorusGeometry(r,.0018,4,64),materials.black,0,0,s*.147);
      const tread=new THREE.InstancedMesh(new THREE.BoxGeometry(.003,.003,.165),materials.black,64),dummy=new THREE.Object3D();
      for(let i=0;i<64;i++){const a=i/64*Math.PI*2;dummy.position.set(Math.sin(a)*.350,Math.cos(a)*.350,0);dummy.rotation.set(0,.2,-a);dummy.updateMatrix();tread.setMatrixAt(i,dummy.matrix);}g.add(tread);
    },center,V(0,.04,s*1.58),true);tire.userData.axle=axle;tire.userData.side=s;wheels.push(tire);
    part(`${id}-disc`,`${side==='left'?'Left':'Right'} ${axle} brake disc`,'Brakes','Perforated carbon-ceramic inspired brake disc. Hole pattern is illustrative.',g=>{
      const d=cylinder(g,materials.brake,0,0,s*.104,.199,.025,64);d.rotation.x=Math.PI/2;
      const h=cylinder(g,materials.chrome,0,0,s*.12,.077,.035);h.rotation.x=Math.PI/2;
      const holes=new THREE.InstancedMesh(new THREE.CircleGeometry(.004,6),materials.black,66),dummy=new THREE.Object3D();let n=0;
      for(let row=0;row<3;row++)for(let i=0;i<22;i++){const a=i/22*Math.PI*2+row*.09;dummy.position.set(Math.sin(a)*(.112+row*.027),Math.cos(a)*(.112+row*.027),s*.119);dummy.rotation.set(0,s<0?Math.PI:0,0);dummy.updateMatrix();holes.setMatrixAt(n++,dummy.matrix);}g.add(holes);
    },center,V(0,.09,s*.93),true);
    part(`${id}-caliper`,`${side==='left'?'Left':'Right'} ${axle} caliper`,'Brakes','Yellow six-piston inspired caliper. Color changes update all four assemblies.',g=>{const b=box(g,materials.caliper,.123,.038,s*.12,.072,.17,.063,.023);b.rotation.z=-.24;for(let i=-1;i<=1;i++)box(g,materials.chrome,.123,.038+i*.038,s*.154,.021,.021,.011,.009);},center,V(0,.15,s*.72),true);
    part(`${id}-suspension`,`${side==='left'?'Left':'Right'} ${axle} suspension`,'Mechanical','Illustrative damper, spring and wishbones. This geometry does not represent a measured suspension.',g=>{
      const spring=[];for(let i=0;i<161;i++){const t=i/160;spring.push(V(.052*Math.cos(t*Math.PI*14),.37+t*.33,s*.63+.052*Math.sin(t*Math.PI*14)));}tube(g,materials.chrome,spring,.006);
      cylinder(g,materials.black,0,.56,s*.63,.023,.42);
      tube(g,materials.chrome,[V(-.27,.30,s*.47),V(0,.29,s*.78),V(.27,.30,s*.47)],.016);
      tube(g,materials.chrome,[V(-.22,.47,s*.43),V(0,.49,s*.75),V(.22,.47,s*.43)],.014);
    },V(x,0,0),V(0,.4,s*.55),true);
  }
  part('engine','V12 engine assembly','Engine','Illustrative front-mid V12: twin banks, twelve intake runners, ancillary pulleys and engine block.',g=>{
    box(g,materials.chrome,-.91,.535,0,.94,.35,.58,.035);
    for(const s of [-1,1]){
      const b=box(g,materials.chrome,-.95,.61,s*.20,.87,.19,.18,.028);b.rotation.x=s*.36;
      for(let i=0;i<6;i++){const x=-1.34+i*.139;tube(g,materials.chrome,[V(x,.65,s*.29),V(x,.73,s*.25),V(x,.775,s*.12),V(x,.77,s*.04)],.033);box(g,materials.black,x,.60,s*.321,.038,.064,.045,.01);}
      tube(g,materials.chrome,[V(-1.2,.45,s*.25),V(-.6,.40,s*.33),V(.0,.24,s*.32)],.028);
    }
    for(let i=0;i<4;i++){const o=cylinder(g,materials.black,-1.449,.46+i*.078,-.16+i*.10,.045,.04);o.rotation.z=Math.PI/2;}
    box(g,materials.chrome,-.35,.42,0,.43,.29,.34,.035);
  },null,V(-.65,.8,0));
  part('engine-covers','V12 engine covers','Engine','Red cam covers with six ribs per bank. Detail is inferred from the component reference.',g=>{
    for(const s of [-1,1]){
      const cover=box(g,materials.engineRed,-.94,.741,s*.247,.89,.098,.18,.03);cover.rotation.x=s*.24;
      for(let i=0;i<6;i++)box(g,materials.chrome,-1.28+i*.139,.795,s*.25,.010,.006,.138,.002);
    }
    box(g,materials.engineRed,-.94,.792,0,.82,.034,.13,.008);
  },null,V(-.3,1.0,0));
  part('dashboard','Dashboard','Interior','Illustrative driver-focused cockpit with circular air vents and a yellow central tachometer.',g=>{
    box(g,materials.dash,-.24,.792,0,.26,.20,1.34,.06);
    for(const z of [-.59,-.19,.18,.57]){const ring=mesh(g,new THREE.TorusGeometry(.050,.011,8,32),materials.chrome,-.081,.82,z);ring.rotation.y=Math.PI/2;const hole=cylinder(g,materials.black,-.08,.82,z,.044,.023);hole.rotation.z=Math.PI/2;}
    const tach=mesh(g,new THREE.CircleGeometry(.058,32),new THREE.MeshStandardMaterial({map:badgeTexture('8')}),-.07,.825,.38);tach.rotation.y=Math.PI/2;
    const binnacle=box(g,materials.dash,-.17,.877,.37,.23,.09,.30,.025);
    box(g,materials.carbon,-.08,.745,0,.025,.045,1.16,.01);
  },null,V(0,.85,0));
  const sw=part('steering-wheel','Steering wheel','Interior','Carbon steering wheel with hub and three spokes. Steering animation also turns the front wheels.',g=>{
    const rim=mesh(g,new THREE.TorusGeometry(.119,.016,12,48),materials.carbon);rim.rotation.y=Math.PI/2;
    for(const a of [0,2.1,4.2])tube(g,materials.chrome,[V(.0,0,0),V(.0,Math.sin(a)*.106,Math.cos(a)*.106)],.012);
    box(g,materials.black,.0,0,0,.035,.061,.066,.016);
    const b=mesh(g,new THREE.CircleGeometry(.021,24),new THREE.MeshStandardMaterial({map:badgeTexture('A')}),.021,0,0);b.rotation.y=Math.PI/2;
    tube(g,materials.chrome,[V(-.045,-.08,-.105),V(-.045,.07,-.105)],.008);
  },V(.022,.783,.395),V(.08,.6,.35),true);steering.push(sw);
  for(const s of [-1,1])part(`${s===1?'driver':'passenger'}-seat`,`${s===1?'Driver':'Passenger'} seat`,'Interior','Sculpted sport seat with leather cushions, side bolsters and contrast seams.',g=>{
    const back=box(g,materials.seat,.65,.727,s*.392,.15,.55,.30,.055);back.rotation.z=.13;
    box(g,materials.seat,.32,.458,s*.392,.47,.13,.29,.05);
    box(g,materials.seat,.69,1.015,s*.392,.13,.12,.22,.044);
    for(const d of [-1,1]){box(g,materials.seat,.34,.505,s*.392+d*.15,.40,.15,.066,.028);const b=box(g,materials.seat,.65,.73,s*.392+d*.148,.18,.39,.069,.03);b.rotation.z=.13;tube(g,materials.chrome,[V(.227,.519,s*.392+d*.105),V(.51,.52,s*.392+d*.105),V(.588,.76,s*.392+d*.113),V(.64,.94,s*.392+d*.101)],.002);}
    box(g,materials.black,.617,.72,s*.392,.011,.29,.19,.035);
  },null,V(.15,.8,s*.6));
  part('center-console','Center console','Interior','Raised carbon console with illustrative transmission buttons and controls.',g=>{
    box(g,materials.carbon,.25,.474,0,.69,.20,.18,.032);
    for(let i=0;i<3;i++){const b=cylinder(g,materials.chrome,.09+i*.098,.581,0,.019,.014,16);}
    box(g,materials.dash,.46,.597,0,.22,.09,.17,.035);
  },null,V(0,.75,0));
  part('interior-trim','Interior trim','Interior','Cabin floor, rear parcel shelf and carbon trim.',g=>{
    box(g,materials.dash,.40,.344,0,1.37,.052,1.45,.025);
    box(g,materials.dash,1.21,.695,0,.34,.13,1.35,.035);
    for(const s of [-1,1])box(g,materials.carbon,.4,.40,s*.76,1.33,.037,.055,.01);
  },null,V(.25,.42,0));
  root.updateMatrixWorld(true);
  return {root,parts,materials,wheels,steering,source:'procedural',dimensions:{length:4.657,width:1.971,height:1.276,wheelbase:2.720}};
}

export function applyConfig(car,config) {
  const m=car.materials;
  m.paint.color.set(config.paint);m.paint.roughness=config.roughness;m.paint.metalness=config.metalness;m.paint.clearcoat=config.clearcoat;
  m.paint.map=config.finish==='carbon'?m.carbon.map:null;
  m.paint.iridescence=config.finish==='pearl'?.4:0;m.paint.iridescenceIOR=1.32;m.paint.iridescenceThicknessRange=[150,300];m.paint.needsUpdate=true;
  m.rim.color.set(config.wheelColor);m.rim.roughness=config.wheelMaterial==='satin'?.5:.2;m.rim.metalness=config.wheelMaterial==='satin'?.65:.94;
  m.rubber.roughness=config.tireRoughness;m.caliper.color.set(config.caliperColor);m.seat.color.set(config.seatColor);m.seat.roughness=config.interiorMaterial==='suede'?.98:(car.interior?.84:.74);m.dash.color.set(config.dashColor);
  m.headlight.emissiveIntensity=config.headlights?3.4:.15;m.taillight.emissiveIntensity=config.brakeLights?4:config.taillights?1.8:.1;
  for(const [id,g] of car.parts){
    if(id.endsWith('-wheel')){const split=g.getObjectByName('split-spoke'),star=g.getObjectByName('forged-star');if(split)split.visible=config.wheelStyle==='split';if(star)star.visible=config.wheelStyle==='star';}
    if(id.endsWith('-mirror'))g.traverse(o=>{if(o.isMesh&&[m.paint,m.carbon].includes(o.material))o.material=config.mirrorFinish==='carbon'?m.carbon:m.paint;});
    if(['front-splitter','rear-diffuser','rear-aero'].includes(id))g.scale.set(1,config.aero==='extended'?1.17:1,config.aero==='extended'?1.12:1);
    if(id==='interior-trim')g.traverse(o=>{if(o.isMesh&&[m.carbon,m.dash].includes(o.material))o.material=config.carbonTrim?m.carbon:m.dash;});
  }
}

export function disposeCar(car) {
  const geometries=new Set(),materials=new Set(),textures=new Set();car.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
  Object.values(car.materials||{}).forEach(m=>materials.add(m));
  for(const m of materials)for(const v of Object.values(m))if(v?.isTexture)textures.add(v);
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());car.root.removeFromParent();
}
