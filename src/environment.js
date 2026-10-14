import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const materialCache=new Map();
const standard=(color,roughness=.8,metalness=0)=>{const key=`${color}-${roughness}-${metalness}`;if(!materialCache.has(key))materialCache.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness}));return materialCache.get(key);};
function box(g,m,x,y,z,w,h,d){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function textTexture(text,bg='#202722',color='#d6d8c8',w=1024,h=128){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=color;ctx.font=`600 ${h*.45}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,h/2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function noiseTexture(kind='asphalt'){
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');const data=ctx.createImageData(512,512);let seed=82912;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<data.data.length;i+=4){const n=rand();let rgb;if(kind==='grass')rgb=[36+n*25,49+n*29,28+n*16];else rgb=[48+n*23,51+n*23,49+n*23];data.data[i]=rgb[0];data.data[i+1]=rgb[1];data.data[i+2]=rgb[2];data.data[i+3]=255;}ctx.putImageData(data,0,0);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='grass'?100:45,kind==='grass'?100:25);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function roundedPath(x0,z0,x1,z1,r){const s=new THREE.Shape();s.moveTo(x0+r,z0);s.lineTo(x1-r,z0);s.quadraticCurveTo(x1,z0,x1,z0+r);s.lineTo(x1,z1-r);s.quadraticCurveTo(x1,z1,x1-r,z1);s.lineTo(x0+r,z1);s.quadraticCurveTo(x0,z1,x0,z1-r);s.lineTo(x0,z0+r);s.quadraticCurveTo(x0,z0,x0+r,z0);return s;}
export const environmentPresets={
  sunset:{label:'Golden hour',tag:'CIRCUIT · GOLDEN HOUR',description:'Warm light. Long shadows.',color:'#d2a278',sun:[-30,18,30],sky:'#7f897a',fog:'#899582',intensity:2.7,ambient:.8,exposure:.86},
  day:{label:'Daylight',tag:'CIRCUIT · DAYLIGHT',description:'Clear skies. Every detail.',color:'#c3d7df',sun:[-18,48,25],sky:'#b4c8c7',fog:'#a8bbac',intensity:3.3,ambient:1.55,exposure:.92},
  night:{label:'Night racing',tag:'CIRCUIT · NIGHT RACING',description:'Floodlit asphalt. Deep reflections.',color:'#1f3457',sun:[-24,14,30],sky:'#09101c',fog:'#0d1824',intensity:.55,ambient:.48,exposure:1.0},
  studio:{label:'Cinematic studio',tag:'ATELIER · CINEMATIC STUDIO',description:'Softboxes. Pure sculpture.',color:'#53594f',sun:[-5,8,7],sky:'#171d18',fog:'#171d18',intensity:2.3,ambient:1.15,exposure:.8}
};
export function createEnvironment(scene,renderer) {
  const circuit=new THREE.Group();circuit.name='Fictional racing circuit';scene.add(circuit);
  const studio=new THREE.Group();studio.name='Cinematic atelier';scene.add(studio);studio.visible=false;
  const grass=standard('#a4b799');grass.map=noiseTexture('grass');
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(500,500),grass);ground.rotation.x=-Math.PI/2;ground.position.y=-.035;ground.receiveShadow=true;circuit.add(ground);
  const asphalt=standard('#aeb4a9',.92);asphalt.map=noiseTexture();
  const track=roundedPath(-105,-70,105,8,32),inner=roundedPath(-93,-58,93,-4,26);track.holes.push(new THREE.Path(inner.getPoints(90)));
  const trackMesh=new THREE.Mesh(new THREE.ShapeGeometry(track,64),asphalt);trackMesh.rotation.x=Math.PI/2;trackMesh.position.y=.0;trackMesh.receiveShadow=true;trackMesh.material.side=THREE.DoubleSide;circuit.add(trackMesh);
  // Shape coordinates are mirrored by the +90-degree rotation; compensate to retain world-space lane placement.
  trackMesh.scale.y=-1;
  const concrete=standard('#888d80'),dark=standard('#1f2926',.55,.35),red=standard('#a43224'),white=standard('#c6c7b8'),paint=standard('#afae96');
  box(circuit,asphalt,0,.002,-9,160,.015,5.3);
  box(circuit,concrete,0,.01,-13,160,.025,2.1);
  for(const z of [6.8,-4.4,-11.5])box(circuit,white,0,.018,z,146,.012,.11);
  for(let x=-70;x<70;x+=2.0){box(circuit,Math.round(x)%4===0?red:white,x,.035,7.5,2,.07,1.1);box(circuit,Math.round(x)%4===0?white:red,x,.027,-4.8,2,.06,.65);}
  for(let i=-5;i<=9;i++){const x=i*7;for(const z of [-2.9,2.9]){box(circuit,white,x,.022,z,.075,.008,1.9);box(circuit,white,x+.42,.022,z-.90,.84,.008,.072);box(circuit,white,x+.42,.022,z+.90,.84,.008,.072);}}
  // The starting line is actual alternating tile geometry.
  for(let i=0;i<20;i++)for(let j=0;j<2;j++)box(circuit,(i+j)%2?dark:white,9.5+j*.4,.025,-3.8+i*.4,.4,.01,.4);
  for(let i=-18;i<=18;i++){const x=i*4;box(circuit,dark,x,.4,-6.2,3.97,.55,.35);for(const y of [.18,.38,.58])box(circuit,concrete,x,y,9.7,4,.07,.12);box(circuit,dark,x,1.2,9.7,.07,2.2,.07);box(circuit,dark,x,1.95,9.7,4,.025,.025);}
  // Pit complex: separate garage bays, shutters, glass control room and canopy.
  box(circuit,concrete,0,2.2,-21,108,4.4,10);
  box(circuit,dark,0,4.52,-20.3,112,.35,11.9);
  box(circuit,dark,0,5.45,-23.4,77,1.6,5.2);
  const glass=standard('#789390',.15,.55);
  for(let i=-8;i<=8;i++){
    const x=i*6;
    box(circuit,dark,x,1.63,-15.96,5.1,3.0,.07);
    for(let j=0;j<11;j++)box(circuit,standard(j%2?'#404b43':'#333f35'),x,.28+j*.253,-15.89,4.9,.225,.025);
    box(circuit,white,x-2.64,1.6,-15.86,.13,3.2,.20);
    const number=new THREE.Mesh(new THREE.PlaneGeometry(.8,.35),new THREE.MeshBasicMaterial({map:textTexture(String(i+9).padStart(2,'0'),'#a63729','#eee5d4')}));number.position.set(x,3.7,-15.93);circuit.add(number);
    box(circuit,glass,x,5.45,-20.78,5.5,1.15,.02);
  }
  const banner=new THREE.Mesh(new THREE.PlaneGeometry(35,1),new THREE.MeshStandardMaterial({map:textTexture('AUTODROMO   /   ATELIER 812','#202a22','#d3d6c7'),roughness:.65}));banner.position.set(0,4.08,-14.75);circuit.add(banner);
  box(circuit,white,0,3.55,-14.5,112,.12,3.1);
  for(let x=-52;x<=52;x+=13)box(circuit,dark,x,1.8,-13,.12,3.6,.12);
  // Grandstands along the opposite viewing line. Steps, seats and roof all exist in 3D.
  for(const gx of [-45,45]){
    for(let row=0;row<9;row++){
      box(circuit,concrete,gx,.4+row*.43,22+row*.93,35,.30,1.0);
      for(let col=0;col<48;col++)box(circuit,(col+row)%9<3?red:dark,gx-16.5+col*.7,.72+row*.43,22+row*.93,.47,.29,.42);
    }
    for(const dx of [-17,0,17])box(circuit,dark,gx+dx,3.0,29,.20,6,.20);
    const roof=box(circuit,white,gx,6.0,26,38,.15,12);roof.rotation.x=.06;
  }
  // Trackside lighting fixtures and night floodlights.
  const floodlights=[];
  for(let i=-2;i<=2;i++)for(const z of [-13,16]){
    const x=i*27;
    box(circuit,dark,x,5.0,z,.12,10,.12);box(circuit,dark,x,9.9,z,2,.12,.15);
    for(const dx of [-.7,0,.7])box(circuit,new THREE.MeshStandardMaterial({color:'#bdcec7',emissive:'#b3d2ff',emissiveIntensity:1}),x+dx,9.8,z,.46,.24,.13);
    const light=new THREE.SpotLight('#c9dfff',60,65,.63,.55,1);light.position.set(x,9.7,z);light.target.position.set(x,0,0);scene.add(light.target);circuit.add(light);floodlights.push(light);
  }
  for(let i=0;i<25;i++){
    const x=(i-12)*14,z=-95-(i%4)*5,h=4+(i%5)*2;
    box(circuit,standard('#596656'),x,h/2,z,7+(i%3)*3,h,6);
  }
  // Distant terrain is low-poly geometry rather than a backdrop photograph.
  const terrain=standard('#607661',1);
  for(let i=0;i<35;i++){const a=i/35*Math.PI*2,r=210;const mountain=new THREE.Mesh(new THREE.ConeGeometry(35+(i%4)*9,12+(i%5)*5,5),terrain);mountain.position.set(Math.cos(a)*r,3,Math.sin(a)*r);mountain.rotation.y=i*.8;circuit.add(mountain);}
  for(let i=0;i<20;i++){const x=(i-10)*9,z=-40-(i%5)*3;const trunk=box(circuit,dark,x,1.2,z,.2,2.4,.2);const tree=new THREE.Mesh(new THREE.IcosahedronGeometry(2+(i%3)*.2,1),standard('#2e4831'));tree.scale.set(1,1.45,1);tree.position.set(x,3.7,z);circuit.add(tree);}
  // Batch static repeated geometry (garage shutters, seats, kerbs and barrier rails).
  const batches=new Map();circuit.updateMatrixWorld(true);
  for(const o of [...circuit.children])if(o.isMesh&&o.geometry.type==='BoxGeometry'){
    const {width,height,depth}=o.geometry.parameters,key=`${o.material.uuid}:${width}:${height}:${depth}`;
    if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);
  }
  for(const objects of batches.values())if(objects.length>3){const first=objects[0],batch=new THREE.InstancedMesh(first.geometry,first.material,objects.length);batch.castShadow=batch.receiveShadow=true;objects.forEach((o,i)=>{o.updateMatrix();batch.setMatrixAt(i,o.matrix);circuit.remove(o);if(i)o.geometry.dispose();});circuit.add(batch);}
  const studioGround=new THREE.Mesh(new THREE.PlaneGeometry(200,200),standard('#242b24',.48,.35));studioGround.rotation.x=-Math.PI/2;studioGround.position.y=-.01;studioGround.receiveShadow=true;studio.add(studioGround);
  for(const s of [-1,1]){const strip=box(studio,new THREE.MeshBasicMaterial({color:'#dde5d3'}),0,4.5,s*5,12,.04,.20);}
  const sky=new Sky();sky.scale.setScalar(450);scene.add(sky);
  const pmrem=new THREE.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
  const room=new RoomEnvironment();const roomRT=pmrem.fromScene(room,.04);room.dispose();
  const sun=new THREE.DirectionalLight('#ffe9cf',3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:100});sun.shadow.bias=-.0003;sun.shadow.normalBias=.02;sun.shadow.radius=4;sun.target.position.set(0,.6,0);scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight('#cddbc8',1.4);fill.position.set(3,5,-4);scene.add(fill);
  const rim=new THREE.DirectionalLight('#eef8ec',1.8);rim.position.set(2,3,4);scene.add(rim);
  const hemisphere=new THREE.HemisphereLight('#dfe7d7','#52614a',1.3);scene.add(hemisphere);
  const headlamps=[];for(const s of [-1,1]){const light=new THREE.SpotLight('#e2f0ff',6,14,.3,.6,1.5);light.position.set(-2.12,.80,s*.79);light.target.position.set(-12,.05,s*.8);scene.add(light,light.target);headlamps.push(light);}
  // Soft contact occlusion under the vehicle (procedurally generated shadow texture).
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');const grad=ctx.createRadialGradient(64,64,5,64,64,64);grad.addColorStop(0,'rgba(0,0,0,.72)');grad.addColorStop(.6,'rgba(0,0,0,.35)');grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(5.6,2.8),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.018;scene.add(shadow);
  let current='sunset',skyRT=null;
  function setMode(mode){
    const p=environmentPresets[mode];if(!p)return;current=mode;
    const inStudio=mode==='studio';circuit.visible=!inStudio;studio.visible=inStudio;sky.visible=!inStudio;scene.background=new THREE.Color(p.sky);scene.fog=new THREE.FogExp2(p.fog,inStudio?.013:mode==='night'?.009:.0029);
    sun.position.set(...p.sun);sun.color.set(mode==='sunset'?'#ffddae':mode==='night'?'#a8c5f4':'#f6f3e7');sun.intensity=p.intensity;hemisphere.intensity=inStudio?.65:p.ambient;fill.intensity=mode==='night'?1.1:inStudio?.8:1.0;rim.intensity=inStudio?1.8:mode==='night'?1.8:1.4;
    renderer.toneMappingExposure=p.exposure;
    floodlights.forEach(l=>{l.intensity=mode==='night'?80:0;});
    const uniforms=sky.material.uniforms;uniforms.turbidity.value=mode==='sunset'?5:2;uniforms.rayleigh.value=mode==='sunset'?1.4:2;uniforms.mieCoefficient.value=.004;uniforms.mieDirectionalG.value=.8;uniforms.sunPosition.value.copy(sun.position).normalize();
    if(skyRT){skyRT.dispose();skyRT=null;}
    if(inStudio||mode==='night'){scene.environment=roomRT.texture;scene.environmentIntensity=inStudio?.58:.65;}
    else{skyRT=pmrem.fromScene(sky,.04);scene.environment=skyRT.texture;scene.environmentIntensity=mode==='sunset'?.24:.55;}
  }
  setMode(current);
  return {setMode,get mode(){return current;},headlamps,sun,contactShadow:shadow,setQuality(high){sun.shadow.mapSize.set(high?2048:1024,high?2048:1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}},dispose(){skyRT?.dispose();roomRT.dispose();pmrem.dispose();}};
}
