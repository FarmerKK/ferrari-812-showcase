async (page) => {
const results=[],errors=[];page.on('pageerror',e=>errors.push(e.message));const ok=(condition,name)=>{if(!condition)throw new Error(name);results.push(name);};
const settled=async()=>{await page.waitForTimeout(1350);await page.waitForFunction(()=>atelier.controls.enabled);};
await page.setViewportSize({width:1600,height:1000});await page.goto('http://127.0.0.1:5173/?view=interior');await page.waitForFunction(()=>window.atelier?.car?.interior);await page.locator('#loading').waitFor({state:'detached'});await settled();
ok(await page.locator('#interior-toolbar').isVisible(),'Direct cockpit link opens the interior');
ok(await page.evaluate(()=>atelier.car.parts.size===62),'62 complete selectable component groups');
ok(await page.evaluate(()=>atelier.car.materials.seat.isMeshPhysicalMaterial&&atelier.car.materials.seat.normalMap.image.width===1024&&atelier.car.materials.seat.roughnessMap.image.width===1024),'Physical leather uses loaded 1K photographic normal and roughness maps');
ok(await page.evaluate(()=>atelier.car.parts.get('steering-wheel').visible),'Steering wheel remains visible in cockpit mode');
ok(await page.evaluate(()=>atelier.environment.mode==='studio'),'Neutral studio lighting on cockpit entry');
for(const [label,file,expected]of [['Dashboard','dashboard','INTERIOR VIEW'],['Passenger','passenger','PASSENGER DASHBOARD'],['Driver','driver','DRIVER COCKPIT'],['Console','console','CENTER CONSOLE'],['Seats','seats','SPORT SEATS'],['Top view','top','INTERIOR TOP VIEW'],['Door','door','DOOR PANEL']]){
await page.getByRole('button',{name:label,exact:true}).click();await settled();ok((await page.locator('#camera-label').textContent())===expected,label+' camera completes');
await page.screenshot({path:'output/playwright/interior-final-'+file+'.png'});
}
await page.getByRole('button',{name:'Driver',exact:true}).click();await settled();
await page.getByRole('button',{name:'Interior finishes',exact:true}).click();ok(await page.locator('#config-panel').isVisible(),'Interior finishes panel opens');
await page.getByRole('textbox',{name:'Stitching color',exact:true}).fill('#e1ba86');ok(await page.evaluate(()=>atelier.car.materials.stitch.color.getHexString()==='e1ba86'),'Stitch color changes real 3D seam geometry');
await page.getByRole('textbox',{name:'Seatbelt color',exact:true}).fill('#893141');ok(await page.evaluate(()=>atelier.car.materials.belt.color.getHexString()==='893141'),'Woven belt material responds to color picker');
await page.getByRole('button',{name:'Cuoio',exact:true}).click();ok(await page.evaluate(()=>atelier.car.materials.seat.color.getHexString()==='996a3e'),'Leather palette changes sport seats');
await page.getByRole('button',{name:'Suede',exact:true}).click();ok(await page.evaluate(()=>atelier.car.materials.seat.normalMap===null&&atelier.car.materials.seat.roughness===.98),'Suede switches surface response and removes leather grain');
await page.getByRole('button',{name:'Leather',exact:true}).click();ok(await page.evaluate(()=>!!atelier.car.materials.seat.normalMap&&atelier.car.materials.seat.roughness===.84),'Leather restores scanned PBR maps');
await page.getByRole('checkbox',{name:'Carbon interior trim',exact:true}).uncheck();ok(await page.evaluate(()=>atelier.car.interior.trimMeshes.every(o=>o.material===atelier.car.materials.dash)),'Carbon inlays switch to leather in the rendered batches');
await page.getByRole('checkbox',{name:'Carbon interior trim',exact:true}).check();ok(await page.evaluate(()=>atelier.car.interior.trimMeshes.every(o=>o.material===atelier.car.materials.cabinCarbon)),'Carbon inlays restore their woven material');
await page.getByRole('button',{name:'Save configuration',exact:true}).click();const saved=await page.evaluate(()=>atelier.config);await page.getByRole('button',{name:'Reset configuration',exact:true}).click();ok(await page.evaluate(()=>atelier.config.seatColor==='#232528'&&atelier.config.stitchColor==='#c82436'),'Reference black/red defaults restore');
await page.getByRole('button',{name:'Load saved',exact:true}).click();ok(JSON.stringify(await page.evaluate(()=>atelier.config))===JSON.stringify(saved),'New seam and belt choices survive save/reset/load');
await page.getByRole('button',{name:'Reset configuration',exact:true}).click();await page.getByRole('button',{name:'Interior finishes',exact:true}).click();
await page.getByRole('button',{name:'Reveal cabin',exact:true}).click();ok(await page.evaluate(()=>!atelier.car.parts.get('main-body').visible),'Roof cutaway reveals the actual cockpit');
await page.getByRole('button',{name:'Reveal cabin',exact:true}).click();ok(await page.evaluate(()=>atelier.car.parts.get('main-body').visible),'Roof shell restores');
await page.getByRole('button',{name:'Mechanics',exact:true}).click();await page.getByRole('checkbox',{name:'Open doors',exact:true}).check();await settled();ok(await page.evaluate(()=>Math.abs(atelier.car.parts.get('left-door-panel').rotation.y)>.7&&Math.abs(atelier.car.parts.get('right-door-panel').rotation.y)>.7),'Both door cards follow the animated door hinges');
await page.getByRole('checkbox',{name:'Open doors',exact:true}).uncheck();await settled();ok(await page.evaluate(()=>[...atelier.car.parts.values()].filter(p=>p.userData.partId.endsWith('-door-panel')).every(p=>p.position.distanceTo(p.userData.originalPosition)<1e-6&&p.quaternion.angleTo(p.userData.originalQuaternion)<1e-6)),'Door cards close to their exact original transforms');await page.getByRole('button',{name:'Mechanics',exact:true}).click();
await page.getByRole('button',{name:'Seats',exact:true}).click();await settled();const visibility=await page.evaluate(()=>[...atelier.car.parts].map(([id,p])=>[id,p.visible]));
await page.getByRole('button',{name:'About this reconstruction',exact:true}).click();const download=page.waitForEvent('download',{timeout:90000});await page.getByRole('button',{name:'Export model · GLB',exact:true}).click();const glb=await download;await glb.saveAs('output/playwright/812-superfast-cockpit-export.glb');ok(glb.suggestedFilename()==='812-superfast-atelier.glb','Complete model exports from isolated seat view');await page.getByRole('button',{name:'Close about',exact:true}).click();ok(JSON.stringify(await page.evaluate(()=>[...atelier.car.parts].map(([id,p])=>[id,p.visible])))===JSON.stringify(visibility),'Export restores cutaway visibility');
await page.getByRole('button',{name:'Back to exterior',exact:false}).click();await settled();ok(await page.evaluate(()=>atelier.car.parts.get('main-body').visible&&atelier.car.parts.get('left-front-wheel').visible&&atelier.car.parts.get('engine').visible),'Exterior and mechanics restore after cabin inspection');
ok(await page.evaluate(()=>atelier.environment.mode==='sunset'),'Original exterior lighting restores');
await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5173/?view=interior');await page.waitForFunction(()=>window.atelier?.car?.interior);await page.locator('#loading').waitFor({state:'detached'});await settled();
ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile cockpit has no horizontal overflow');
await page.getByRole('button',{name:'Driver',exact:true}).click();await settled();ok(await page.locator('#camera-label').textContent()==='DRIVER COCKPIT','Mobile cockpit view switches');await page.screenshot({path:'output/playwright/interior-final-mobile.png'});
await page.getByRole('button',{name:'Interior finishes',exact:true}).click();await page.getByRole('button',{name:'Cuoio',exact:true}).click();ok(await page.evaluate(()=>atelier.config.seatColor==='#996a3e'),'Mobile interior finishes work');
await page.setViewportSize({width:1600,height:1000});await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>window.atelier?.car?.interior);
ok(errors.length===0,'No browser runtime errors');
return {passed:results.length,results,runtimeErrors:errors};
}