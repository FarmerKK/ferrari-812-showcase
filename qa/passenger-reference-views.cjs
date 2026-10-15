async(page)=>{
await page.goto('http://127.0.0.1:5173/?view=interior');await page.bringToFront();await page.setViewportSize({width:1600,height:1000});await page.waitForFunction(()=>window.atelier?.car?.interior);await page.locator('#loading').waitFor({state:'detached'});await page.waitForFunction(()=>atelier.controls.enabled,null,{timeout:120000});
for(const [name,pos,target,fov]of [['front',[.66,.96,.01],[-.22,.752,-.03],58],['passenger',[.39,.91,-.19],[-.20,.753,-.506],51],['door-angle',[.29,.94,-.61],[-.20,.748,-.49],57],['screen-close',[.20,.75,-.48],[-.18,.695,-.50],35]]){
await page.evaluate(({pos,target,fov})=>{atelier.camera.position.set(...pos);atelier.controls.target.set(...target);atelier.camera.fov=fov;atelier.camera.updateProjectionMatrix();atelier.controls.update();},{pos,target,fov});await page.waitForTimeout(700);await page.screenshot({path:'output/playwright/passenger-'+name+'.png'});
}
await page.getByRole('button',{name:'Dashboard',exact:true}).click();await page.waitForFunction(()=>atelier.controls.enabled);return {version:await page.evaluate(()=>atelier.car.interior.detailVersion)};
}
