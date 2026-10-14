async(page)=>{
await page.reload();await page.waitForFunction(()=>window.atelier?.car?.interior);await page.locator('#loading').waitFor({state:'detached'});await page.setViewportSize({width:1600,height:1000});
await page.getByRole('tab',{name:'Interior',exact:true}).click();await page.getByRole('button',{name:'Enter the cockpit',exact:false}).click();
for(const [label,file]of [['Dashboard','dashboard'],['Driver','driver'],['Console','console'],['Seats','seats'],['Top view','top'],['Door','door']]){
await page.getByRole('button',{name:label,exact:true}).click();await page.waitForTimeout(1350);await page.waitForFunction(()=>atelier.controls.enabled);await page.waitForTimeout(500);await page.screenshot({path:'output/playwright/interior-final-'+file+'.png'});
}
return {diag:await page.evaluate(()=>atelier.diagnostics)};
}