import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import gsap from 'gsap';
import { createIcons, Bookmark, Paintbrush, CircleDot, Disc3, CarFront, Armchair, Lightbulb, FolderOpen, RotateCcw, ArrowUpRight, Scan, ArrowRight, X, Mouse, Video, ChevronDown, Orbit, Focus, Layers3, Combine, Settings2, Sunset, Camera, Maximize } from 'lucide';
import { createCar, applyConfig, disposeCar } from './car.js';
import { loadDetailedCar } from './detailed-car.js';
import { configureInterior } from './interior.js';
import { createEnvironment, environmentPresets } from './environment.js';
import { ExhaustAudio } from './exhaust-audio.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const iconsUpdate=()=>createIcons({icons:{Bookmark,Paintbrush,CircleDot,Disc3,CarFront,Armchair,Lightbulb,FolderOpen,RotateCcw,ArrowUpRight,Scan,ArrowRight,X,Mouse,Video,ChevronDown,Orbit,Focus,Layers3,Combine,Settings2,Sunset,Camera,Maximize},attrs:{'stroke-width':1.5}});
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const duration=reducedMotion?.01:1.15;
const DEFAULTS={paint:'#d20b16',paintName:'Rosso Corsa',finish:'gloss',roughness:.20,metalness:.25,clearcoat:1,wheelColor:'#4b5054',wheelMaterial:'polished',wheelStyle:'split',caliperColor:'#edb422',tireRoughness:.91,seatColor:'#232528',dashColor:'#17191c',lowerDashColor:'#835b40',stitchColor:'#c82436',beltColor:'#bf1930',interiorMaterial:'leather',carbonTrim:true,mirrorFinish:'paint',aero:'standard',headlights:false,taillights:true,brakeLights:false,indicators:false,environment:'sunset',quality:'adaptive'};
let config={...DEFAULTS},car,renderer,scene,camera,controls,composer,bloom,environment,ssao,scenePass;
let selected=null,selectionMaterials=new Map(),currentCategory='paint',currentPage='showcase',cameraMode='orbit';
let animationId,alive=true,frameCount=0,lastPerf=performance.now(),fps=60,lowQuality=false,qualityCooldown=0,cameraTween,slowSamples=0,fastSamples=0;
let cameraFit=1,hasViewport=false;
const cabinModes=new Set(['interior','passenger','driver','console','seats','cabin-top','door']);
let cabinLighting=[],cabinCutaway=false,cabinPreviousEnvironment=null;
let doorsOpen=false,hoodOpen=false,wheelSpin=false,steer=0,cinematic=false,modelBusy=false,cameraTransition=false;
const doorMotion={angle:0},hoodMotion={angle:0};
const pointerStart=new THREE.Vector2(),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const paintColors=[['Rosso Corsa','#d20b16'],['Giallo Modena','#d5ae35'],['Nero Daytona','#151c1a'],['Bianco Avus','#e5e2d7'],['Grigio Silverstone','#777d78'],['Blu Pozzi','#15394e']];
let toastTimer;
const exhaust=new ExhaustAudio(state=>{
  const start=$('#engine-start');if(!start)return;
  start.textContent=state.loading?'Cancel loading':state.running?'Stop engine':'Start engine';start.setAttribute('aria-pressed',String(state.running||state.loading));
  $('#engine-rev').disabled=!state.running||state.revving;$('#engine-rev').textContent=state.revving?'Revving…':'Rev exhaust';$('#sound-status').textContent=state.loading?'LOADING RECORDINGS':state.revving?'EXHAUST · REV':state.running?'ENGINE · IDLE':'ENGINE · OFF';$('#sound-toggle').setAttribute('aria-pressed',String(state.running));$('#sound-mute').setAttribute('aria-pressed',String(state.muted));$('#sound-mute').textContent=state.muted?'Unmute':'Mute';
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)exhaust.stop();});
window.addEventListener('pagehide',e=>{if(e.persisted)exhaust.stop();else exhaust.dispose();});
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
function download(data,name,type){const blob=data instanceof Blob?data:new Blob([data],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function safeColor(v){return typeof v==='string'&&/^#[a-f\d]{6}$/i.test(v);}
function validateConfig(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Invalid configuration');
  const out={...DEFAULTS};
  for(const key of ['paint','wheelColor','caliperColor','seatColor','dashColor','lowerDashColor','stitchColor','beltColor'])if(safeColor(raw[key]))out[key]=raw[key];
  const enums={finish:['gloss','matte','metallic','pearl','carbon'],wheelMaterial:['polished','satin'],wheelStyle:['split','star'],interiorMaterial:['leather','suede'],mirrorFinish:['paint','carbon'],aero:['standard','extended'],environment:Object.keys(environmentPresets),quality:['adaptive','high','low']};
  for(const [key,values] of Object.entries(enums))if(values.includes(raw[key]))out[key]=raw[key];
  for(const key of ['roughness','metalness','clearcoat','tireRoughness'])if(typeof raw[key]==='number'&&Number.isFinite(raw[key]))out[key]=THREE.MathUtils.clamp(raw[key],0,1);
  for(const key of ['carbonTrim','headlights','taillights','brakeLights','indicators'])if(typeof raw[key]==='boolean')out[key]=raw[key];
  out.paintName=paintColors.find(p=>p[1].toLowerCase()===out.paint.toLowerCase())?.[0]||'Bespoke color';return out;
}
function swatches(colors,key){return `<div class="swatches">${colors.map(([name,color])=>`<button class="swatch ${config[key]===color?'active':''}" style="--swatch:${color}" data-color="${color}" data-color-key="${key}" data-color-name="${name}" title="${name}" aria-label="${name}" aria-pressed="${config[key]===color}"></button>`).join('')}</div>`;}
function slider(key,label){return `<div><label class="range-label" for="${key}">${label}<output id="${key}-value">${Math.round(config[key]*100)}%</output></label><input id="${key}" data-range="${key}" type="range" min="0" max="1" step="0.01" value="${config[key]}" /></div>`;}
function toggle(key,label){return `<label class="setting-row"><span>${label}</span><input type="checkbox" data-toggle="${key}" ${config[key]?'checked':''} /></label>`;}
function segmented(key,options){return `<div class="segmented">${options.map(([value,label])=>`<button data-setting="${key}" data-value="${value}" class="${config[key]===value?'active':''}">${label}</button>`).join('')}</div>`;}
function colorInput(key,label){return `<label class="custom-color">${label}<input aria-label="${label}" type="color" data-picker="${key}" value="${config[key]}" /></label>`;}
function drawCategory(){
  const panel=$('#category-content');let html='';
  if(currentCategory==='paint')html=`<div class="field-eyebrow">EXTERIOR COLOR</div><div class="field-title"><span id="paint-name">${config.paintName}</span><small>PERSONALISE</small></div>${swatches(paintColors,'paint')}${colorInput('paint','Bespoke color')}<div class="field-eyebrow">PAINT FINISH</div>${segmented('finish',[['gloss','Gloss'],['matte','Matte'],['metallic','Metallic'],['pearl','Pearl'],['carbon','Carbon']])}${slider('roughness','Surface roughness')}${slider('metalness','Metallic intensity')}${slider('clearcoat','Clearcoat')}`;
  if(currentCategory==='wheels')html=`<div class="field-eyebrow">20-INCH ALLOY WHEELS</div><div class="field-title">A signature in motion</div>${segmented('wheelStyle',[['split','Split spoke'],['star','Forged star']])}${swatches([['Graphite','#4b5054'],['Silver','#b8bec3'],['Gold','#9a7e42'],['Black','#101413']],'wheelColor')}${colorInput('wheelColor','Wheel color')}${segmented('wheelMaterial',[['polished','Polished alloy'],['satin','Satin alloy']])}${slider('tireRoughness','Rubber roughness')}`;
  if(currentCategory==='brakes')html=`<div class="field-eyebrow">CARBON-CERAMIC INSPIRED</div><div class="field-title">The finishing accent</div>${swatches([['Yellow','#edb422'],['Red','#c32f22'],['Silver','#a7aca6'],['Black','#242c27'],['Blue','#255c93']],'caliperColor')}${colorInput('caliperColor','Caliper color')}<p class="subtle">Four individually inspectable calipers and perforated discs. Select a wheel to explore the assembly.</p><button class="secondary-button" data-view="wheel">Inspect front wheel <i data-lucide="arrow-right"></i></button>`;
  if(currentCategory==='exterior')html=`<div class="field-eyebrow">AERODYNAMIC DETAILS</div><div class="field-title">Form follows feeling</div>${segmented('aero',[['standard','Standard aero'],['extended','Extended aero']])}<div class="field-eyebrow">MIRROR FINISH</div>${segmented('mirrorFinish',[['paint','Body color'],['carbon','Carbon fibre']])}<p class="subtle">Extended aero adjusts the carbon splitter, diffuser and trailing lip. An illustrative styling package.</p>`;
  if(currentCategory==='interior')html=`<div class="field-eyebrow">COCKPIT COLLECTION</div><div class="field-title">Leather. Carbon. Craft.</div>${swatches([['Nero','#232528'],['Bordeaux','#73201b'],['Cuoio','#996a3e'],['Crema','#c9baa0']],'seatColor')}${colorInput('seatColor','Seat color')}${colorInput('dashColor','Dashboard color')}${colorInput('lowerDashColor','Lower dashboard color')}${colorInput('stitchColor','Stitching color')}${colorInput('beltColor','Seatbelt color')}${segmented('interiorMaterial',[['leather','Leather'],['suede','Suede']])}${toggle('carbonTrim','Carbon interior trim')}<button class="secondary-button" data-view="interior">Enter the cockpit <i data-lucide="arrow-right"></i></button>`;
  if(currentCategory==='lights')html=`<div class="field-eyebrow">LIGHT SIGNATURE</div><div class="field-title">Designed to illuminate</div>${toggle('headlights','LED headlights')}${toggle('taillights','Quad rear lamps')}${toggle('brakeLights','Brake lights')}${toggle('indicators','Turn indicators')}<p class="subtle">Headlights illuminate the asphalt; light intensity and lens materials update in real time.</p>`;
  panel.innerHTML=html;iconsUpdate();
}
function clearHighlight(){for(const [mesh,material] of selectionMaterials){const highlighted=mesh.material;mesh.material=material;highlighted.dispose();}selectionMaterials.clear();}
function highlight(){if(!selected)return;selected.traverse(o=>{if(o.isMesh&&o.material?.clone){selectionMaterials.set(o,o.material);o.material=o.material.clone();if(o.material.emissive){o.material.emissive.set('#d56830');o.material.emissiveIntensity=.45;}}});}
function updateCar(){clearHighlight();applyConfig(car,config);configureInterior(car,config);highlight();environment.headlamps.forEach(l=>l.intensity=config.headlights?7:0);}
function setConfig(key,value){config[key]=value;if(key==='paint')config.paintName=paintColors.find(p=>p[1]===value)?.[0]||'Bespoke color';
  if(key==='finish'){const finishes={gloss:[.20,.25,1],matte:[.82,.12,0],metallic:[.28,.91,.85],pearl:[.24,.57,1],carbon:[.34,.55,.7]};[config.roughness,config.metalness,config.clearcoat]=finishes[value];}
  updateCar();
}
function selectPart(part,{focus=false}={}){
  clearHighlight();selected=part;highlight();$('#vehicle-details').hidden=!!part;$('#part-details').hidden=!part;
  if(part){$('#part-name').textContent=part.userData.name;$('#part-description').textContent=part.userData.description;updatePartDetails();if(focus)focusPart(part);}
  iconsUpdate();
}
function updatePartDetails(){if(!selected)return;const b=new THREE.Box3().setFromObject(selected),size=b.getSize(new THREE.Vector3());const mat=selected.getObjectByProperty('isMesh',true)?.material;$('#part-meta').innerHTML=`<dt>Collection</dt><dd>${selected.userData.category}</dd><dt>Status</dt><dd>${selected.userData.detached?'Detached':'Assembled'}</dd><dt>Model fidelity</dt><dd>Approximate</dd><dt>Bounds</dt><dd>${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m</dd><dt>Roughness</dt><dd>${mat?.roughness?.toFixed(2)??'—'}</dd>`;$('#detach-part').textContent=selected.userData.detached?'Reassemble component':'Detach component';}
function setDetached(part,detached){
  part.userData.detached=detached;
  const dest=part.userData.originalPosition.clone();if(detached)dest.add(part.userData.explodeOffset);
  gsap.to(part.position,{x:dest.x,y:dest.y,z:dest.z,duration,ease:'power2.inOut',overwrite:true,onUpdate:()=>{if(part===selected)updatePartDetails();}});
  updateAssembly();
}
function updateAssembly(){const n=[...car.parts.values()].filter(p=>p.userData.detached).length;$('#part-counter').textContent=n?`${n} / ${car.parts.size} COMPONENTS DETACHED`:'ASSEMBLED';$('#explode').classList.toggle('active',n>0);renderPartsList();}
function explodeAll(detached){gsap.killTweensOf(doorMotion);gsap.killTweensOf(hoodMotion);doorMotion.angle=0;hoodMotion.angle=0;doorsOpen=false;hoodOpen=false;wheelSpin=false;setSteering(0);drawMechanics();for(const p of car.parts.values()){gsap.killTweensOf(p.rotation);p.quaternion.copy(p.userData.originalQuaternion);setDetached(p,detached);}$('#explode').setAttribute('aria-pressed',String(detached));if(detached)goCamera('exploded');else goCamera('orbit');toast(detached?'Every component, revealed. Click a part to inspect.':'All components reassembled.');}
function focusPart(part){if($('main').classList.contains('cockpit-mode')&&part.userData.category!=='Interior')setCabinView('inspect');const box=new THREE.Box3().setFromObject(part),target=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()).length();const direction=camera.position.clone().sub(controls.target).normalize();transitionCamera(target.clone().addScaledVector(direction,Math.max(1.15,size*1.35)),target);cameraMode='inspect';$('#camera-label').textContent=part.userData.name.toUpperCase();}
function transitionCamera(position,target){
  cameraTween?.kill();cinematic=false;controls.autoRotate=false;$('#auto-rotate').setAttribute('aria-pressed','false');cameraTransition=true;controls.enabled=false;
  const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;
  const startPosition=camera.position.clone(),startTarget=controls.target.clone(),motion={t:0};
  cameraTween=gsap.to(motion,{t:1,duration,ease:'power2.inOut',onUpdate:()=>{camera.position.lerpVectors(startPosition,position,motion.t);controls.target.lerpVectors(startTarget,target,motion.t);camera.lookAt(controls.target);},onComplete:()=>{camera.position.copy(position);controls.target.copy(target);controls.enabled=true;cameraTransition=false;controls.update();render();lastPerf=performance.now();frameCount=0;qualityCooldown=performance.now()+10000;}});
}
const cameraViews={orbit:{label:'Three-quarter view',pos:[-5.5,2.35,5.0],target:[0,.62,0]},front:{label:'Front view',pos:[-6.7,1.22,0],target:[-.15,.66,0]},rear:{label:'Rear view',pos:[6.7,1.24,0],target:[.2,.66,0]},left:{label:'Left view',pos:[0,1.65,7.7],target:[0,.65,0]},right:{label:'Right view',pos:[0,1.65,-7.7],target:[0,.65,0]},top:{label:'Top view',pos:[0,8,.001],target:[0,.3,0]},interior:{label:'Interior view',pos:[.62,1.075,.01],target:[-.25,.77,0]},passenger:{label:'Passenger dashboard',pos:[.39,.91,-.19],target:[-.20,.753,-.506]},driver:{label:'Driver cockpit',pos:[.53,1.105,.426],target:[-.18,.84,.426]},console:{label:'Center console',pos:[.60,1.14,.02],target:[.12,.58,0]},seats:{label:'Sport seats',pos:[-.83,1.42,1.38],target:[.35,.66,0]},'cabin-top':{label:'Interior top view',pos:[.03,3.35,.001],target:[.03,.43,0]},door:{label:'Door panel',pos:[.28,.86,0],target:[.36,.60,.73]},wheel:{label:'Wheel inspection',pos:[-2.18,.79,2.13],target:[-1.37,.354,.89]},engine:{label:'Engine inspection',pos:[-2.31,2.55,1.69],target:[-.91,.65,0]},cinematic:{label:'Cinematic camera',pos:[-5.8,1.8,5.2],target:[0,.6,0]},exploded:{label:'Exploded overview',pos:[-7.5,4.3,7.3],target:[0,.85,0]}};
function createCabinLighting(){
  RectAreaLightUniformsLib.init();
  for(const [position,intensity,width,height,target] of [[[-.01,1.38,-.78],5.0,.70,.45,[-.22,.75,-.40]],[[.40,1.30,.72],1.2,.70,.50,[-.18,.76,.10]],[[.90,1.10,.0],.45,.60,.40,[-.18,.70,-.30]]]){
    const light=new THREE.RectAreaLight('#f2f1ed',.12,width,height);light.position.set(...position);light.lookAt(...target);light.userData.inspectionIntensity=intensity;scene.add(light);cabinLighting.push(light);
  }
}
function revealCabin(value){
  cabinCutaway=value;
  for(const id of ['main-body','windscreen','rear-window','left-side-window','right-side-window','left-quarter-window','right-quarter-window']){const p=car.parts.get(id);if(p)p.visible=!value;}
  $('#cabin-cutaway').setAttribute('aria-pressed',String(value));
}
function setCabinView(mode){
  const active=cabinModes.has(mode);$('main').classList.toggle('cockpit-mode',active);$('#interior-toolbar').hidden=!active;
  if(active)setPage('showcase');
  $$('nav .nav-item').forEach(b=>b.classList.toggle('active',active?b.dataset.view==='interior':b.dataset.page===currentPage));
  if(active&&!cabinModes.has(cameraMode)){cabinPreviousEnvironment=config.environment;setEnvironment('studio');}
  if(!active&&cabinPreviousEnvironment){setEnvironment(cabinPreviousEnvironment);cabinPreviousEnvironment=null;}
  for(const p of car.parts.values())p.visible=true;
  if(active){currentCategory='interior';$$('.category').forEach(b=>{b.classList.toggle('active',b.dataset.category==='interior');b.setAttribute('aria-selected',String(b.dataset.category==='interior'));});drawCategory();}
  else{$('main').classList.remove('interior-finishes-open');}
  revealCabin(active&&['seats','cabin-top'].includes(mode));
  if(active)for(const [id,p] of car.parts)if(/^(left|right)-(front|rear)-(wheel|tire|disc|caliper|suspension)$/.test(id)||['engine','engine-covers','exhaust'].includes(id))p.visible=false;
  if(mode==='seats'){
    const visible=new Set(['driver-seat','passenger-seat','center-console','left-seatbelt','right-seatbelt']);
    for(const [id,p] of car.parts)p.visible=visible.has(id);
  }
  camera.fov=active?(mode==='driver'?55:mode==='passenger'?51:mode==='interior'?66:mode==='console'?49:44):(innerWidth<640?43:35);camera.updateProjectionMatrix();ssao.setSize(ssao.width,ssao.height);
  controls.minDistance=active?.055:.12;controls.maxPolarAngle=active?Math.PI*.96:Math.PI*.49;
  cabinLighting.forEach(l=>l.intensity=active?l.userData.inspectionIntensity:.12);
  ssao.enabled=active&&!lowQuality;scenePass.enabled=true;
  $$('[data-cabin-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cabinView===mode)));
}
function goCamera(mode){const view=cameraViews[mode];if(!view)return;setCabinView(mode);cameraMode=mode;$('#camera-label').textContent=view.label.toUpperCase();if(mode==='engine')setHood(true);if(cabinModes.has(mode))setDoors(false);
  let pos=new THREE.Vector3(...view.pos),target=new THREE.Vector3(...view.target);if(!cabinModes.has(mode)&&!['wheel','engine'].includes(mode)){pos.multiplyScalar(cameraFit);if(innerWidth<640)target.y=-.38;}
  transitionCamera(pos,target);if(mode==='cinematic')gsap.delayedCall(duration,()=>{if(cameraMode==='cinematic'){cinematic=true;controls.autoRotate=true;controls.autoRotateSpeed=.55;$('#auto-rotate').setAttribute('aria-pressed','true');}});$('#camera-menu').hidden=true;
}
function setDoors(open){doorsOpen=open;gsap.to(doorMotion,{angle:open?.78:0,duration,ease:'power2.inOut',overwrite:true,onUpdate:()=>{for(const s of [-1,1]){const side=s===1?'left':'right',door=car.parts.get(`${side}-door`);if(!door)continue;const pivot=door.userData.originalPosition,q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-s*doorMotion.angle);for(const id of [`${side}-door`,`${side}-side-window`,`${side}-mirror`,`${side}-door-panel`]){const p=car.parts.get(id);if(!p||p.userData.detached)continue;p.position.copy(p.userData.originalPosition).sub(pivot).applyQuaternion(q).add(pivot);p.quaternion.copy(p.userData.originalQuaternion).premultiply(q);}}}});drawMechanics();}
function setHood(open){hoodOpen=open;const p=car.parts.get('hood');gsap.to(hoodMotion,{angle:open?-.88:0,duration,ease:'power2.inOut',overwrite:true,onUpdate:()=>{if(p&&!p.userData.detached)p.rotation.z=hoodMotion.angle;}});drawMechanics();}
function setSteering(value){steer=value;for(const g of car.steerable||car.wheels)if(g.userData.axle==='front')g.rotation.y=value*.45;for(const g of car.steering)g.rotation.x=value*1.2;}
function drawMechanics(){$('#mechanics-menu').innerHTML=`<label class="setting-row">Open doors<input type="checkbox" id="doors-control" ${doorsOpen?'checked':''}/></label><label class="setting-row">Open hood<input type="checkbox" id="hood-control" ${hoodOpen?'checked':''}/></label><label class="setting-row">Spin wheels<input type="checkbox" id="spin-control" ${wheelSpin?'checked':''}/></label><label class="range-label" for="steer-control">Steering</label><input id="steer-control" type="range" min="-1" max="1" step=".01" value="${steer}"/>`;}
function renderPartsList(){const q=$('#part-search').value.toLowerCase();$('#parts-list').replaceChildren();for(const p of car.parts.values()){if(!`${p.userData.name} ${p.userData.category}`.toLowerCase().includes(q))continue;const b=document.createElement('button');b.dataset.part=p.userData.partId;const label=document.createElement('span');label.textContent=p.userData.name;const state=document.createElement('small');state.textContent=p.userData.detached?'DETACHED':p.userData.category.toUpperCase();b.append(label,state);$('#parts-list').append(b);}}
function setPage(page){currentPage=page;$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));$('main').classList.remove('parts-mode','environment-mode','configure-mode');if(page==='parts')$('main').classList.add('parts-mode');if(page==='environment')$('main').classList.add('environment-mode');if(page==='customize')$('main').classList.add('configure-mode');$('#parts-drawer').hidden=page!=='parts';$('#environment-drawer').hidden=page!=='environment';if(page==='parts')renderPartsList();if(page==='environment')renderEnvironments();}
function renderEnvironments(){$('#environment-options').innerHTML=Object.entries(environmentPresets).map(([id,p])=>`<button class="env-option ${config.environment===id?'active':''}" data-environment="${id}"><span class="env-sample" style="--env-color:${p.color}"></span><span>${p.label}<small>${p.description}</small></span></button>`).join('');$('#quality').value=config.quality;}
function setEnvironment(mode){environment.setMode(mode);config.environment=mode;$('#environment-label').textContent=environmentPresets[mode].tag;$('#light-label').textContent=environmentPresets[mode].label;renderEnvironments();}
function setQuality(value){config.quality=value;slowSamples=fastSamples=0;const low=value==='low'||(value==='adaptive'&&innerWidth<640);lowQuality=low;renderer.setPixelRatio(low?Math.min(devicePixelRatio,1):Math.min(devicePixelRatio,1.75));environment.setQuality(!low);bloom.enabled=!low;ssao.enabled=!low&&$('main').classList.contains('cockpit-mode');scenePass.enabled=true;resize();}
function resize(){if(!renderer)return;const {width,height}=$('#viewport').getBoundingClientRect();const nextFit=width<640?1.57:Math.max(1,1.6/(width/height));if(hasViewport&&!cabinModes.has(cameraMode)&&!['wheel','engine','inspect'].includes(cameraMode))camera.position.sub(controls.target).multiplyScalar(nextFit/cameraFit).add(controls.target);cameraFit=nextFit;hasViewport=true;camera.aspect=width/height;camera.fov=cabinModes.has(cameraMode)?(cameraMode==='driver'?55:cameraMode==='passenger'?51:cameraMode==='interior'?66:cameraMode==='console'?49:44):(width<640?43:35);camera.updateProjectionMatrix();renderer.setSize(width,height);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(width,height);}
function setupEvents(){
  $('#sound-toggle').onclick=()=>{const panel=$('#sound-panel');panel.hidden=!panel.hidden;$('#sound-toggle').setAttribute('aria-expanded',String(!panel.hidden));};
  $('#sound-close').onclick=()=>{$('#sound-panel').hidden=true;$('#sound-toggle').setAttribute('aria-expanded','false');};
  $('#engine-start').onclick=async()=>{if(exhaust.running||exhaust.loading)exhaust.stop();else try{await exhaust.start();}catch(e){toast(e.message);}};
  $('#engine-rev').onclick=()=>exhaust.rev();$('#sound-volume').oninput=e=>exhaust.setVolume(e.target.value);$('#sound-mute').onclick=()=>exhaust.setMuted(!exhaust.muted);
  $('#interior-finishes').onclick=()=>{$('main').classList.toggle('interior-finishes-open');$('#interior-finishes').setAttribute('aria-expanded',String($('main').classList.contains('interior-finishes-open')));};
  $('#cabin-cutaway').onclick=()=>revealCabin(!cabinCutaway);
  $('#exit-cockpit').onclick=()=>{selectPart(null);goCamera('orbit');};
  document.addEventListener('click',e=>{
    const cabinView=e.target.closest('[data-cabin-view]');if(cabinView)goCamera(cabinView.dataset.cabinView);
    const category=e.target.closest('[data-category]');if(category){currentCategory=category.dataset.category;$$('.category').forEach(b=>{const active=b===category;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});drawCategory();}
    const color=e.target.closest('[data-color]');if(color){setConfig(color.dataset.colorKey,color.dataset.color);drawCategory();}
    const setting=e.target.closest('[data-setting]');if(setting){setConfig(setting.dataset.setting,setting.dataset.value);drawCategory();}
    const page=e.target.closest('[data-page]');if(page)setPage(page.dataset.page);
    const part=e.target.closest('[data-part]');if(part){selectPart(car.parts.get(part.dataset.part),{focus:true});if(innerWidth<=960){setPage('showcase');$('#config-panel').style.display='none';$('.right-panel').style.display='block';$('.right-panel').style.top='165px';$('.right-panel').style.background='rgba(16,23,15,.92)';$('.right-panel').style.padding='18px';$('.right-panel').style.width=innerWidth<640?'calc(100% - 34px)':'245px';$('.right-panel').style.right='17px';}}
    const view=e.target.closest('[data-view]');if(view)goCamera(view.dataset.view);
    const env=e.target.closest('[data-environment]');if(env){setEnvironment(env.dataset.environment);toast(`${environmentPresets[env.dataset.environment].label} environment`);}
  });
  document.addEventListener('input',e=>{const key=e.target.dataset.range;if(key){setConfig(key,Number(e.target.value));$(`#${key}-value`).textContent=`${Math.round(config[key]*100)}%`;updatePartDetails();}const picker=e.target.dataset.picker;if(picker){setConfig(picker,e.target.value);if(picker==='paint')$('#paint-name').textContent=config.paintName;$$(`[data-color-key="${picker}"]`).forEach(b=>{b.classList.toggle('active',b.dataset.color===config[picker]);b.setAttribute('aria-pressed',String(b.dataset.color===config[picker]));});}if(e.target.id==='steer-control')setSteering(Number(e.target.value));});
  document.addEventListener('change',e=>{if(e.target.dataset.toggle){setConfig(e.target.dataset.toggle,e.target.checked);updatePartDetails();}if(e.target.id==='doors-control')setDoors(e.target.checked);if(e.target.id==='hood-control')setHood(e.target.checked);if(e.target.id==='spin-control')wheelSpin=e.target.checked;});
  $('#part-search').addEventListener('input',renderPartsList);
  $('#close-parts').onclick=()=>setPage('showcase');$('#close-environment').onclick=()=>setPage('showcase');
  $('#camera-menu').innerHTML=Object.entries(cameraViews).filter(([k])=>k!=='exploded').map(([id,v])=>`<button data-view="${id}">${v.label}</button>`).join('');
  $('#camera-toggle').onclick=()=>{$('#camera-menu').hidden=!$('#camera-menu').hidden;$('#mechanics-menu').hidden=true;};
  $('#mechanics-toggle').onclick=()=>{$('#mechanics-menu').hidden=!$('#mechanics-menu').hidden;$('#camera-menu').hidden=true;drawMechanics();};
  $('#camera-reset').onclick=()=>goCamera('orbit');$('#auto-rotate').onclick=()=>{controls.autoRotate=!controls.autoRotate;cinematic=controls.autoRotate;$('#auto-rotate').setAttribute('aria-pressed',String(controls.autoRotate));};
  $('#explode').onclick=()=>explodeAll(true);$('#assemble').onclick=()=>explodeAll(false);
  $('#detach-part').onclick=()=>{if(selected){if(selected.userData.partId==='hood')setHood(false);if(selected.userData.partId.endsWith('-door'))setDoors(false);setDetached(selected,!selected.userData.detached);}};
  $('#focus-part').onclick=()=>selected&&focusPart(selected);
  $('#clear-selection').onclick=()=>{selectPart(null);$('.right-panel').removeAttribute('style');$('#config-panel').removeAttribute('style');goCamera('orbit');};
  $('#environment-toggle').onclick=()=>setPage(currentPage==='environment'?'showcase':'environment');$('#quality').onchange=e=>setQuality(e.target.value);
  $('#save').onclick=()=>{try{localStorage.setItem('atelier-812.configuration',JSON.stringify({version:1,config,savedAt:new Date().toISOString()}));toast('Your configuration has been saved on this device.');}catch{toast('This browser could not save your configuration.');}};
  $('#load').onclick=()=>{try{const value=localStorage.getItem('atelier-812.configuration');if(!value){toast('No saved configuration yet. Use Save configuration first.');return;}const saved=JSON.parse(value);if(saved.version!==1)throw new Error('Unsupported version');config=validateConfig(saved.config);updateCar();setEnvironment(config.environment);setQuality(config.quality);drawCategory();toast('Your saved configuration is ready.');}catch{toast('The saved configuration could not be loaded.');}};
  $('#reset-config').onclick=()=>{config={...DEFAULTS};updateCar();setEnvironment(config.environment);setQuality(config.quality);drawCategory();toast('Original configuration restored.');};
  $('#screenshot').onclick=()=>{try{render();renderer.domElement.toBlob(blob=>{if(blob){download(blob,'812-superfast-atelier.png','image/png');toast('Render captured as PNG.');}else toast('Image capture failed.');},'image/png');}catch{toast('Image capture is unavailable in this browser.');}};
  $('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#app').requestFullscreen();}catch{toast('Full screen is unavailable in this browser.');}};
  $('#about').onclick=()=>$('#about-dialog').showModal();$('#close-about').onclick=()=>$('#about-dialog').close();$('#export-model').onclick=exportModel;$('#import-model').onchange=e=>importModel(e.target.files[0]);
  const canvas=renderer.domElement;canvas.addEventListener('pointerdown',e=>pointerStart.set(e.clientX,e.clientY));canvas.addEventListener('pointerup',e=>{if(e.button!==0||pointerStart.distanceTo(new THREE.Vector2(e.clientX,e.clientY))>5)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(car.root,true).find(h=>h.object.visible&&h.object.userData.partId&&visibleInHierarchy(h.object));if(hit){const part=car.parts.get(hit.object.userData.partId);selectPart(part);if(innerWidth<=960){$('#config-panel').style.display='none';$('.right-panel').style.cssText=`display:block;top:165px;right:17px;width:${innerWidth<640?'calc(100% - 34px)':'245px'};background:rgba(16,23,15,.95);padding:18px;z-index:6;max-height:calc(100% - 270px);overflow-y:auto;`;}}});
  controls.addEventListener('start',()=>{if(cameraTransition)return;cinematic=false;controls.autoRotate=false;$('#auto-rotate').setAttribute('aria-pressed','false');});
  $('#viewport').addEventListener('keydown',e=>{if(e.target!==$('#viewport'))return;if(e.key==='Escape')selectPart(null);if(e.key.toLowerCase()==='r')goCamera('orbit');if(e.key.toLowerCase()==='e')explodeAll(true);if(e.key.toLowerCase()==='a')explodeAll(false);const arrows={ArrowLeft:-.12,ArrowRight:.12};if(e.key in arrows){const p=camera.position.clone().sub(controls.target);p.applyAxisAngle(new THREE.Vector3(0,1,0),arrows[e.key]);camera.position.copy(p.add(controls.target));e.preventDefault();}if(['+','-','ArrowUp','ArrowDown'].includes(e.key)){const factor=['+','ArrowUp'].includes(e.key)?.91:1.1;camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);e.preventDefault();}});
  window.addEventListener('resize',resize);document.addEventListener('fullscreenchange',resize);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)lastPerf=performance.now();});
}
function visibleInHierarchy(o){while(o){if(!o.visible)return false;o=o.parent;}return true;}
async function exportModel(){
  if(modelBusy)return;modelBusy=true;$('#export-model').disabled=true;clearHighlight();
  const snapshots=[];
  for(const p of car.parts.values()){gsap.killTweensOf(p.position);gsap.killTweensOf(p.rotation);snapshots.push([p,p.position.clone(),p.quaternion.clone(),p.visible]);p.position.copy(p.userData.originalPosition);p.quaternion.copy(p.userData.originalQuaternion);p.visible=true;}
  car.root.traverse(o=>{const n=o.geometry?.getAttribute('normal');if(n){const v=new THREE.Vector3();for(let i=0;i<n.count;i++){v.fromBufferAttribute(n,i);if(v.lengthSq()<1e-10)v.set(0,1,0);else v.normalize();n.setXYZ(i,v.x,v.y,v.z);}n.needsUpdate=true;}});
  try{const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');const exporter=new GLTFExporter();const result=await exporter.parseAsync(car.root,{binary:true,onlyVisible:true,trs:true});download(result,'812-superfast-atelier.glb','model/gltf-binary');toast('Assembled model exported as GLB.');}catch(error){console.error('Model export failed',error);toast('Model export failed. Please try again.');}
  finally{for(const [p,pos,q,visible]of snapshots){p.position.copy(pos);p.quaternion.copy(q);p.visible=visible;}highlight();modelBusy=false;$('#export-model').disabled=false;}
}
async function importModel(file){
  if(!file||modelBusy)return;if(file.size>100*1024*1024){toast('Use a GLB smaller than 100 MB.');return;}
  if(!file.name.toLowerCase().endsWith('.glb')){toast('Use a self-contained GLB, including all textures.');return;}
  modelBusy=true;toast('Loading your model…');
  try{
    const [{GLTFLoader},{DRACOLoader}]=await Promise.all([import('three/addons/loaders/GLTFLoader.js'),import('three/addons/loaders/DRACOLoader.js')]);const loader=new GLTFLoader(),draco=new DRACOLoader();draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');loader.setDRACOLoader(draco);
    let loaded;try{loaded=await loader.parseAsync(await file.arrayBuffer(),'');}finally{draco.dispose();}
    const imported=loaded.scene,box=new THREE.Box3().setFromObject(imported),size=box.getSize(new THREE.Vector3());if(size.length()<.001)throw new Error('Empty model');
    const scale=4.657/Math.max(size.x,size.z);imported.scale.multiplyScalar(scale);imported.updateMatrixWorld(true);const normalized=new THREE.Box3().setFromObject(imported),center=normalized.getCenter(new THREE.Vector3());imported.position.set(-center.x,-normalized.min.y,-center.z);imported.updateMatrixWorld(true);
    const parts=new Map(),materials={...car.materials};
    // Explicit partId or known semantic names only; ambiguous connected meshes remain intact.
    const names={hood:'hood',bonnet:'hood',roof:'roof',engine:'engine',dashboard:'dashboard',steering_wheel:'steering-wheel',left_door:'left-door',right_door:'right-door',front_bumper:'front-bumper',rear_bumper:'rear-bumper',diffuser:'rear-diffuser',exhaust:'exhaust'};
    const meshes=[];imported.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;meshes.push(o);}});
    for(const o of meshes){const id=o.userData.partId||names[o.name.toLowerCase().replace(/[ -]+/g,'_')];if(!id)continue;let group=parts.get(id);if(!group){group=new THREE.Group();group.name=id;imported.add(group);const template=car.parts.get(id);group.userData={partId:id,name:template?.userData.name||id,category:template?.userData.category||'Imported',description:'Imported geometry. Fidelity and rights depend on the supplied asset.',originalPosition:new THREE.Vector3(),originalQuaternion:new THREE.Quaternion(),originalScale:new THREE.Vector3(1,1,1),originalParent:imported.uuid,explodeOffset:template?.userData.explodeOffset.clone()||new THREE.Vector3(0,1,0),detached:false};parts.set(id,group);}group.attach(o);o.userData.partId=id;}
    if(!parts.size){const group=new THREE.Group();group.name='imported-body';imported.add(group);for(const o of meshes)group.attach(o);group.userData={partId:'imported-body',name:'Imported vehicle',category:'Static',description:'No recognized component boundaries. The supplied mesh is preserved as a single selectable object.',originalPosition:new THREE.Vector3(),originalQuaternion:new THREE.Quaternion(),originalScale:new THREE.Vector3(1,1,1),originalParent:imported.uuid,explodeOffset:new THREE.Vector3(0,1,0),detached:false};group.traverse(o=>{if(o.isMesh)o.userData.partId='imported-body';});parts.set('imported-body',group);}
    // Rebind recognized material names to the editable atelier material slots.
    const paintNames=/paint|body|carpaint|exterior/i;imported.traverse(o=>{if(!o.isMesh)return;if(paintNames.test(o.material?.name||''))o.material=materials.paint;});
    selectPart(null);car.root.removeFromParent();window.__originalCar=car;car={root:imported,parts,materials,wheels:[],steering:[],source:'imported'};scene.add(imported);updateCar();updateAssembly();goCamera('orbit');$('#about-dialog').close();toast(`Model loaded · ${parts.size} selectable component${parts.size===1?'':'s'}. Original procedural model available after reload.`);
  }catch(error){console.error('GLB import failed',error);toast('Could not load this GLB. The current vehicle remains available.');}
  finally{modelBusy=false;$('#import-model').value='';}
}
function render(){renderer.info.reset();if(lowQuality)renderer.render(scene,camera);else composer.render();}
function tick(now){
  if(!alive)return;animationId=requestAnimationFrame(tick);if(document.hidden)return;
  const elapsed=THREE.MathUtils.clamp((now-(tick.last||now))/1000,0,.05);tick.last=now;
  if(!$('#sound-panel').hidden){const levels=exhaust.levels();$$('.sound-meter i').forEach((bar,i)=>bar.style.transform=`scaleY(${.12+levels[i]*.88})`);}
  if(!cameraTransition)controls.update(elapsed);
  if(wheelSpin)for(const g of car.wheels){g.rotation.z+=elapsed*.65;}
  car.materials.indicator.emissiveIntensity=config.indicators&&Math.floor(now/470)%2===0?3:0;
  if(car.source==='licensed-cc0'){const flash=config.indicators&&Math.floor(now/470)%2===0;car.materials.headlight.emissive.set(flash?'#ff7900':'#e5f3ff');car.materials.headlight.emissiveIntensity=flash?2.3:config.headlights?3.4:.15;}
  if(cinematic){camera.position.y=1.8+Math.sin(now*.0002)*.28;controls.target.y=.64;}
  render();frameCount++;
  if(now-lastPerf>2500){fps=Math.round(frameCount*1000/(now-lastPerf));$('#performance').textContent=`${fps} FPS · ${lowQuality?'PERFORMANCE':'HIGH'} QUALITY`;frameCount=0;lastPerf=now;
    if(config.quality==='adaptive'&&now>qualityCooldown){slowSamples=fps<25?slowSamples+1:0;fastSamples=fps>60?fastSamples+1:0;
      if(slowSamples>=3&&!lowQuality){setQuality('low');config.quality='adaptive';qualityCooldown=now+60000;}
      else if(fastSamples>=3&&lowQuality&&innerWidth>=640){setQuality('adaptive');qualityCooldown=now+60000;}
    }
  }
}
async function boot(){
  try{
    scene=new THREE.Scene();renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.info.autoReset=false;renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.outputColorSpace=THREE.SRGBColorSpace;$('#viewport').appendChild(renderer.domElement);
    camera=new THREE.PerspectiveCamera(35,1,.02,600);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=.12;controls.maxDistance=21;controls.maxPolarAngle=Math.PI*.49;controls.enablePan=true;controls.screenSpacePanning=true;controls.target.set(0,.62,0);
    const rt=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType});rt.samples=4;composer=new EffectComposer(renderer,rt);scenePass=new RenderPass(scene,camera);composer.addPass(scenePass);ssao=new SSAOPass(scene,camera,1,1,16);ssao.enabled=false;ssao.kernelRadius=.09;ssao.minDistance=.000001;ssao.maxDistance=.00025;composer.addPass(ssao);bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.13,.28,1.45);composer.addPass(bloom);composer.addPass(new OutputPass());
    $('#load-status').textContent='Loading the detailed 812';environment=createEnvironment(scene,renderer);car=await loadDetailedCar((loaded,total)=>{$('#load-status').textContent=total?`Loading the detailed 812 · ${Math.round(loaded/total*100)}%`:'Loading the detailed 812';});scene.add(car.root);createCabinLighting();updateCar();setupEvents();drawCategory();drawMechanics();renderPartsList();setEnvironment('sunset');resize();setQuality('adaptive');
    const initial=new THREE.Vector3(...cameraViews.orbit.pos).multiplyScalar(cameraFit);if(innerWidth<640)controls.target.y=-.38;camera.position.copy(initial);controls.update();render();iconsUpdate();lastPerf=performance.now();
    qualityCooldown=performance.now()+15000;$('#loading').style.opacity='0';setTimeout(()=>$('#loading').remove(),650);animationId=requestAnimationFrame(tick);
    // Read-only diagnostics for manual QA; actions remain exposed through the UI.
    window.atelier={get sound(){return exhaust.status;},get soundLevels(){return exhaust.levels();},get car(){return car;},get config(){return {...config};},get camera(){return camera;},get controls(){return controls;},get renderer(){return renderer;},get scene(){return scene;},get environment(){return environment;},get selected(){return selected;},get diagnostics(){return {partCount:car.parts.size,meshCount:(()=>{let n=0;car.root.traverse(o=>{if(o.isMesh)n++;});return n;})(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,fps,quality:lowQuality?'low':'high',source:car.source};}};
    const requestedView=new URLSearchParams(location.search).get('view');if(cabinModes.has(requestedView)||requestedView==='wheel')goCamera(requestedView);if(requestedView==='wheel')$('[data-category="wheels"]').click();
  }catch(error){console.error('Atelier initialization failed',error);$('#loading').innerHTML='<div class="loader-mark">812</div><p>3D initialization failed. Enable WebGL and reload this page.</p>';}
}
window.addEventListener('pagehide',event=>{if(event.persisted)return;alive=false;cancelAnimationFrame(animationId);gsap.globalTimeline.clear();clearHighlight();controls?.dispose();if(car)disposeCar(car);environment?.dispose();if(scene){const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});for(const m of materials)for(const v of Object.values(m))if(v?.isTexture)textures.add(v);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}ssao?.dispose();composer?.dispose();renderer?.dispose();});
boot();
