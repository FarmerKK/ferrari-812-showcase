async(page)=>{
await page.goto('http://127.0.0.1:5173/?view=interior');await page.bringToFront();await page.setViewportSize({width:1600,height:1000});await page.waitForFunction(()=>window.atelier?.car?.interior);await page.locator('#loading').waitFor({state:'detached'});await page.waitForFunction(()=>atelier.controls.enabled,null,{timeout:120000});
for(const [name,pos,target,fov]of [['instrument-back',[-.33,.99,.05],[-.12,.86,.426],50],['gallery-finish',[.40,.90,-.44],[-.16,.766,-.16],50],['column-driver-side',[-.09,.93,.71],[-.06,.79,.426],60],['wheel-detail',[.56,.98,.426],[.078,.837,.426],46]]){
await page.evaluate(({pos,target,fov})=>{atelier.camera.position.set(...pos);atelier.controls.target.set(...target);atelier.camera.fov=fov;atelier.camera.updateProjectionMatrix();atelier.controls.update();},{pos,target,fov});await page.waitForTimeout(700);await page.screenshot({path:'output/playwright/formed-'+name+'.png'});
}
await page.getByRole('button',{name:'Driver',exact:true}).click();await page.waitForFunction(()=>atelier.controls.enabled);return {version:await page.evaluate(()=>atelier.car.interior.detailVersion)};
}
