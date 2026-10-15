async(page)=>{
await page.bringToFront();await page.setViewportSize({width:1600,height:1000});await page.waitForFunction(()=>window.atelier?.car?.interior);await page.locator('#loading').waitFor({state:'detached'});await page.waitForFunction(()=>atelier.controls.enabled,null,{timeout:120000});
for(const [name,file]of [['Dashboard','dashboard'],['Driver','driver'],['Console','console']]){await page.getByRole('button',{name,exact:true}).click();await page.waitForFunction(()=>atelier.controls.enabled);await page.waitForTimeout(700);await page.screenshot({path:'output/playwright/photo-'+file+'.png'});}
await page.getByRole('button',{name:'Dashboard',exact:true}).click();await page.waitForFunction(()=>atelier.controls.enabled);await page.evaluate(()=>{atelier.camera.position.set(.54,1.01,-.40);atelier.controls.target.set(-.23,.78,.22);atelier.camera.fov=63;atelier.camera.updateProjectionMatrix();atelier.controls.update();});await page.waitForTimeout(800);await page.screenshot({path:'output/playwright/photo-reference-angle.png'});
return await page.evaluate(()=>({version:atelier.car.interior.detailVersion,...atelier.diagnostics}));
}
