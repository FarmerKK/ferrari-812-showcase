async(page)=>{
const errors=[];page.on('pageerror',e=>errors.push(e.message));const results=[];const ok=(c,n)=>{if(!c)throw new Error(n);results.push(n);};
await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>window.atelier?.car?.interior);await page.locator('#loading').waitFor({state:'detached'});await page.setViewportSize({width:1600,height:1000});
await page.getByRole('button',{name:'Cockpit',exact:true}).click();await page.waitForTimeout(1500);await page.waitForFunction(()=>atelier.controls.enabled);
ok(await page.locator('#interior-toolbar').isVisible(),'Header Cockpit entry opens the cabin');ok(await page.getByRole('button',{name:'Cockpit',exact:true}).getAttribute('class').then(c=>c.includes('active')),'Cockpit navigation reflects active view');
await page.waitForTimeout(3500);await page.screenshot({path:'output/playwright/interior-final-dashboard.png'});ok(await page.evaluate(()=>atelier.renderer.info.render.calls>50&&atelier.car.parts.get('steering-wheel').visible),'Final cockpit renders real geometry after warmup');
await page.getByRole('button',{name:'Driver',exact:true}).click();await page.waitForTimeout(1500);await page.waitForFunction(()=>atelier.controls.enabled);await page.screenshot({path:'output/playwright/interior-final-driver.png'});
await page.getByRole('button',{name:'Seats',exact:true}).click();await page.waitForTimeout(1500);await page.waitForFunction(()=>atelier.controls.enabled);await page.screenshot({path:'output/playwright/interior-final-seats.png'});
await page.getByRole('button',{name:'Back to exterior',exact:false}).click();await page.waitForTimeout(1500);await page.waitForFunction(()=>atelier.controls.enabled);ok(await page.evaluate(()=>atelier.car.parts.get('left-front-wheel').visible&&atelier.environment.mode==='sunset'),'Exterior restoration works from the header flow');
ok(errors.length===0,'Final navigation has no runtime errors');return {passed:results.length,results,errors};
}