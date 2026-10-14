import * as THREE from 'three';

// All upholstery details sample the actual padded surface. No floating inserts.
function profile(y,points){
  let i=0;while(i<points.length-2&&y>points[i+1][0])i++;
  const [a,v]=points[i],[b,w]=points[i+1],t=THREE.MathUtils.clamp((y-a)/(b-a),0,1);
  const slope=(j)=>(points[j+1][1]-points[j][1])/(points[j+1][0]-points[j][0]);
  const tangent=(j)=>{if(j===0)return slope(0);if(j===points.length-1)return slope(j-1);const l=slope(j-1),r=slope(j);return l*r<=0?0:2*l*r/(l+r);};
  return (2*t**3-3*t**2+1)*v+(t**3-2*t**2+t)*tangent(i)*(b-a)+(-2*t**3+3*t**2)*w+(t**3-t**2)*tangent(i+1)*(b-a);
}
export function seatFront(y,u,z=0){
  const width=y>1.105?.112*Math.sqrt(Math.max(.00001,1-((y-1.105)/.037)**2)):profile(y,[[.38,.01],[.43,.18],[.57,.218],[.79,.22],[.90,.19],[1.01,.119],[1.105,.112]]);
  const depth=profile(y,[[.38,.012],[.45,.064],[.78,.067],[.94,.051],[1.08,.048],[1.142,.001]]);
  const cx=.438+(y-.43)*.315,fade=1-THREE.MathUtils.smoothstep(y,.88,1.025);
  const x=cx-depth*Math.max(0,1-Math.abs(u)**(2/.65))**(.65/2)-.046*Math.exp(-(((Math.abs(u)-.78)/.18)**2))*fade;
  return new THREE.Vector3(x,y,z+u*width);
}
export function cushionTop(x,u,z=0){
  const t=THREE.MathUtils.clamp((x+.095)/.625,0,1),width=.226*(.87+.13*Math.sin(t*Math.PI));
  const crown=(.016+.062*Math.sin(t*Math.PI)**.5)*Math.max(0,1-u*u)**.45;
  const bolster=.043*Math.exp(-(((Math.abs(u)-.81)/.19)**2))*Math.sin(t*Math.PI)**.6;
  return new THREE.Vector3(x,.398+crown+bolster,z+u*width);
}
function surface(parent,rows,cols,point,materialFor,materials){
  const p=[],uv=[],all=[],buckets=materials.map(()=>[]);
  for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){p.push(...point(i/rows,j/cols).toArray());uv.push(j/cols,i/rows);}
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
    const a=i*(cols+1)+j,b=a+cols+1,tri=[a,b,a+1,b,b+1,a+1];all.push(...tri);buckets[materialFor((i+.5)/rows,(j+.5)/cols)].push(...tri);
  }
  const base=new THREE.BufferGeometry();base.setAttribute('position',new THREE.Float32BufferAttribute(p,3));base.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));base.setIndex(all);base.computeVertexNormals();
  materials.forEach((m,i)=>{if(!buckets[i].length)return;const g=base.clone();g.setIndex(buckets[i]);const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;parent.add(o);});base.dispose();
}
export function buildSeatPadding(parent,m,z){
  // Closed front/rear section; the two faces share their padded edge.
  surface(parent,112,128,(t,v)=>{
    const y=.38+t*.762,u=v<.25?v*4:v<.75?2-v*4:v*4-4,c=v<.25||v>.75?1:-1;
    const f=seatFront(y,u,z);if(c>0){const center=.438+(y-.43)*.315;f.x=2*center-f.x;}return f;
  },(t,v)=>{const y=.38+t*.762,u=Math.abs(2-v*4);if(v<.25||v>.75||y<.475||y>.966)return 0;return u<.029?2:u<.575?1:0;},[m.seat,m.cabinInsert,m.stitch]);
  // Cushion is a closed loop through its upper face, round sides and underside.
  surface(parent,96,128,(t,v)=>{
    const x=-.095+t*.625,a=-v*Math.PI*2,u=Math.sin(a),f=cushionTop(x,u,z);
    if(Math.cos(a)<0)f.y=.398-(.027+.035*Math.sin(t*Math.PI)**.5)*Math.sqrt(Math.max(0,1-u*u));return f;
  },(t,v)=>{const u=Math.abs(Math.sin(v*Math.PI*2));if(Math.cos(v*Math.PI*2)<0||t<.065||t>.91)return 0;return u<.027?2:u<.58?1:0;},[m.seat,m.cabinInsert,m.stitch]);
  // Filled, gently curved nose and heel prevent paper-thin open cushion ends.
  for(const [x,sign] of [[-.095,-1],[.53,1]]){
    const positions=[],indices=[],uv=[],n=96,rows=12;
    for(let i=0;i<=rows;i++)for(let j=0;j<=n;j++){
      const a=-j/n*Math.PI*2,u=Math.sin(a),edge=cushionTop(x,u,z);if(Math.cos(a)<0)edge.y=.398-.027*Math.sqrt(Math.max(0,1-u*u));
      const t=i/rows,center=new THREE.Vector3(x+sign*.014,.394,z);const p=center.clone().lerp(edge,t);p.x+=sign*.009*Math.sin(t*Math.PI);positions.push(...p.toArray());uv.push(t,j/n);
    }
    for(let i=0;i<rows;i++)for(let j=0;j<n;j++){const a=i*(n+1)+j,b=a+n+1;indices.push(...(sign<0?[a,a+1,b,a+1,b+1,b]:[a,b,a+1,a+1,b,b+1]));}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const mesh=new THREE.Mesh(g,m.seat);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
  }
}
export function embroidery(parent,texture,z){
  const pos=[],uv=[],indices=[],n=12;
  for(let i=0;i<=n;i++)for(let j=0;j<=n;j++){
    const y=1.008+i/n*.074,zz=(j/n-.5)*.058,width=seatFront(y,1,z).z-z;
    const p=seatFront(y,zz/width,z);p.x-=.00065;pos.push(...p.toArray());uv.push(1-j/n,i/n);
  }
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){const a=i*(n+1)+j,b=a+n+1;indices.push(a,a+1,b,a+1,b+1,b);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  const m=new THREE.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.35,roughness:.92,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});parent.add(new THREE.Mesh(g,m));
}
export function dashboardTop(x,z){
  const u=THREE.MathUtils.clamp((x+.76)/.64,0,1);
  return .825+.026*Math.sin(u*Math.PI)-.018*(Math.abs(z)/.76)**3;
}
export function buildDashboard(parent,mat){
  // Low continuous pad follows the windscreen base and folds into the fascia.
  surface(parent,72,160,(t,v)=>{
    const z=-.77+t*1.54;
    const sections=[[-.76,.785],[-.72,.822],[-.48,.849],[-.28,.841],[-.16,.81],[-.135,.753],[-.15,.664],[-.26,.643],[-.65,.68],[-.76,.785]];
    const p=v*(sections.length-1),i=Math.min(sections.length-2,Math.floor(p)),f=p-i;
    const before=sections[Math.max(0,i-1)],a=sections[i],b=sections[i+1],after=sections[Math.min(sections.length-1,i+2)];
    const values=a.map((value,j)=>(2*f**3-3*f**2+1)*value+(f**3-2*f**2+f)*(b[j]-before[j])*.5+(-2*f**3+3*f**2)*b[j]+(f**3-f**2)*(after[j]-value)*.5);
    return new THREE.Vector3(values[0],values[1]-.016*(Math.abs(z)/.77)**3,z);
  },()=>0,[mat]);
}
