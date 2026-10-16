async(page)=>{
await page.goto('http://127.0.0.1:5173/');await page.setViewportSize({width:1600,height:1000});await page.waitForFunction(()=>window.atelier?.car?.wheelDetails);await page.locator('#loading').waitFor({state:'detached',timeout:120000});await page.waitForFunction(()=>atelier.controls.enabled,null,{timeout:120000});
await page.getByRole('button',{name:'Environment',exact:true}).click();await page.locator('[data-environment="studio"]').click();await page.getByRole('button',{name:'Close environments',exact:true}).click();await page.getByRole('tab',{name:'Wheels',exact:true}).click();
await page.getByRole('button',{name:'Camera',exact:true}).click();await page.getByRole('button',{name:'Wheel inspection',exact:true}).click();await page.waitForFunction(()=>atelier.controls.enabled);await page.waitForTimeout(700);await page.screenshot({path:'output/playwright/wheel-split-graphite.png'});
await page.getByRole('button',{name:'Silver',exact:true}).click();await page.waitForTimeout(500);await page.screenshot({path:'output/playwright/wheel-split-silver.png'});
const camera=async(id,offset,file)=>{await page.evaluate(({id,offset})=>{const g=atelier.car.parts.get(id),p=g.position.clone();atelier.camera.position.copy(p).add({x:offset[0],y:offset[1],z:offset[2]});atelier.controls.target.copy(p);atelier.camera.fov=35;atelier.camera.updateProjectionMatrix();atelier.controls.update();},{id,offset});await page.waitForTimeout(600);await page.screenshot({path:'output/playwright/'+file+'.png'});};
await camera('left-front-wheel',[-.03,.025,1.40],'wheel-front-face');await camera('left-front-wheel',[-.85,.22,.96],'wheel-front-oblique');
await page.getByRole('button',{name:'Forged star',exact:true}).click();await camera('right-rear-wheel',[.68,.16,-1.05],'wheel-star-rear-oblique');
await page.getByRole('button',{name:'Split spoke',exact:true}).click();await page.getByRole('button',{name:'Graphite',exact:true}).click();return await page.evaluate(()=>atelier.car.wheelDetails);
}
