async(page)=>{
await page.goto('http://127.0.0.1:5173/?view=interior');await page.setViewportSize({width:1600,height:1000});await page.waitForFunction(()=>window.atelier?.car?.interior);await page.locator('#loading').waitFor({state:'detached'});await page.waitForFunction(()=>atelier.controls.enabled,null,{timeout:120000});
const audit=await page.evaluate(()=>{
  const edges=new Map(),key=(p,i)=>[p.getX(i),p.getY(i),p.getZ(i)].map(n=>Math.round(n*1e6)).join(',');let triangles=0;
  atelier.car.parts.get('dashboard').traverse(o=>{if(!o.isMesh||![atelier.car.materials.dash,atelier.car.materials.lowerDash].includes(o.material))return;const p=o.geometry.attributes.position,index=o.geometry.index,at=i=>index?index.getX(i):i,count=index?index.count:p.count;
    for(let i=0;i<count;i+=3){const a=key(p,at(i)),b=key(p,at(i+1)),c=key(p,at(i+2));if(a===b||b===c||c===a)continue;triangles++;for(const [u,v]of [[a,b],[b,c],[c,a]]){const k=u<v?u+'|'+v:v+'|'+u;edges.set(k,(edges.get(k)||0)+1);}}
  });
  let openEdges=0;for(const count of edges.values())if(count===1)openEdges++;
  const part=atelier.car.parts.get('steering-wheel'),frame=atelier.car.steering[0].parent;const center=frame.getWorldPosition(atelier.camera.position.clone());
  return {triangles,openEdges,wheelCenterX:center.x,hoodTextureRepeat:atelier.car.materials.hoodLeather.map.repeat.toArray(),detailVersion:atelier.car.interior.detailVersion};
});
if(audit.triangles<20000)throw new Error('Missing padded dashboard geometry');if(audit.openEdges!==0)throw new Error('Unclosed padded dashboard boundaries: '+audit.openEdges);if(Math.abs(audit.wheelCenterX-.026)>.000001)throw new Error('Steering frame has not moved into the shortened mounting position');return {passed:3,audit};
}
