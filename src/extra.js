
/* ===== extra calculators engine (Desk layout) ===== */
(function(){
var fmt=function(x,dp){
  if(!isFinite(x))return "—";
  var a=Math.abs(x);
  if(a===0)return "0";
  if(dp!=null)return x.toFixed(dp);
  if(a>=1e6||a<1e-3)return x.toExponential(3);
  if(a>=1000)return x.toLocaleString("en-US",{maximumFractionDigits:1});
  if(a>=100)return x.toFixed(1);
  if(a>=1)return x.toFixed(3);
  return x.toPrecision(3);
};
var D={
  arrow:function(x1,y1,x2,y2,cls){
    cls=cls||"gr";var a=Math.atan2(y2-y1,x2-x1),s=6;
    var h=function(x,y,ang){return "M"+x+","+y+" l"+(-s*Math.cos(ang-.4))+","+(-s*Math.sin(ang-.4))+" M"+x+","+y+" l"+(-s*Math.cos(ang+.4))+","+(-s*Math.sin(ang+.4));};
    return '<path class="'+cls+'" d="M'+x1+','+y1+' L'+x2+','+y2+' '+h(x2,y2,a)+'"/>';
  },
  dim:function(x1,y1,x2,y2,label,off){
    off=off||0;var dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy)||1,nx=-dy/l*off,ny=dx/l*off;
    var a=[x1+nx,y1+ny],b=[x2+nx,y2+ny],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
    var tx=(dy!==0&&Math.abs(dy)>Math.abs(dx))?'<text x="'+(mx+6)+'" y="'+my+'" class="b">'+label+'</text>':'<text x="'+mx+'" y="'+(my-5)+'" text-anchor="middle" class="b">'+label+'</text>';
    return '<path class="gr" d="M'+x1+','+y1+' L'+a[0]+','+a[1]+' M'+x2+','+y2+' L'+b[0]+','+b[1]+'"/>'+D.arrow(mx,my,a[0],a[1])+D.arrow(mx,my,b[0],b[1])+tx;
  },
  txt:function(x,y,t,anchor,cls){return '<text x="'+x+'" y="'+y+'" text-anchor="'+(anchor||"start")+'" '+(cls?'class="'+cls+'"':'')+'>'+t+'</text>';}
};
var C={};
/* Configs for every calculator. Formulas and constants are referenced on each page. */
{
const PI=Math.PI, cl=(x,a,b)=>Math.max(a,Math.min(b,x));
const svg=(inner,h)=>`<svg viewBox="0 0 560 ${h||320}" xmlns="http://www.w3.org/2000/svg" role="img">${inner}</svg>`;
const f=fmt;
/* Typical textbook values: W.D. Callister & D. Rethwisch, Materials Science and Engineering, Table 6.1 (E, G), Table 19.1 (alpha) */
const MAT_E=[["Aluminum",69],["Brass",97],["Copper",110],["Nickel",207],["Steel",207],["Titanium",107]];
const MAT_G=[["Aluminum",25],["Brass",37],["Copper",46],["Nickel",76],["Steel",83],["Titanium",45]];
const MAT_EA=[["Aluminum","69,23.6"],["Brass","97,20.0"],["Copper","110,17.0"],["Nickel","207,13.3"],["Steel (plain carbon)","207,12.0"],["Titanium","107,8.5"]];


/* ---------- 1. Shaft torsion ---------- */
C.torsion={
  caption:"Side view and end view of the shaft. Length and diameter are drawn with a display-friendly ratio; the stress triangle shows the linear variation of τ with radius.",
  presets:[{label:"Material (G)",target:"G",options:MAT_G.map(m=>[m[0]+" — "+m[1]+" GPa",m[1]])}],
  inputs:[
    {id:"P",label:"Power P",unit:"kW",value:30,min:0},
    {id:"n",label:"Speed n",unit:"rpm",value:1500,min:1},
    {id:"d",label:"Outer diameter d",unit:"mm",value:40,min:1},
    {id:"di",label:"Inner diameter (0 = solid)",unit:"mm",value:0,min:0},
    {id:"L",label:"Length L",unit:"mm",value:800,min:1},
    {id:"G",label:"Shear modulus G",unit:"GPa",value:83,min:0.1}
  ],
  compute(v){
    const T=9550*v.P/v.n;                       // N·m
    const J=PI*(Math.pow(v.d,4)-Math.pow(v.di,4))/32; // mm^4
    const tau=T*1000*(v.d/2)/J;                 // MPa
    const phi=T*1000*v.L/(J*v.G*1000);          // rad
    const res=[["Torque T",f(T),"N·m"],["Polar moment J",f(J),"mm⁴"],["τ max (outer)",f(tau),"MPa"],
      ["τ at inner radius",f(tau*v.di/v.d),"MPa"],["Angle of twist φ",f(phi*180/PI),"deg"],["φ",f(phi*1000),"mrad"]];
    return {res,T,J,tau,warn:v.di>=v.d?"Inner diameter must be smaller than outer diameter.":""};
  },
  draw(v,r){
    const Lv=300,dv=cl(Lv*v.d/v.L*2.2,30,110),x0=130,yc=92,di=cl(v.di/v.d,0,.95)*dv;
    let s=`<rect class="th" x="${x0}" y="${yc-dv/2}" width="${Lv}" height="${dv}" fill="none"/>`;
    if(v.di>0)s+=`<path class="ds" d="M${x0},${yc-di/2}H${x0+Lv}M${x0},${yc+di/2}H${x0+Lv}"/>`;
    s+=`<path class="ch" d="M${x0-28},${yc}H${x0+Lv+28}"/>`;
    s+=`<path class="cl" d="M${x0-16},${yc-dv/2-8}a${dv/2+14},${dv/2+14} 0 0 0 0,${dv+16}"/>`+D.txt(x0-22,yc-dv/2-14,"T","end","b");
    s+=`<path class="cl" d="M${x0+Lv+16},${yc-dv/2-8}a${dv/2+14},${dv/2+14} 0 0 1 0,${dv+16}"/>`+D.txt(x0+Lv+22,yc-dv/2-14,"T","start","b");
    s+=D.dim(x0,yc+dv/2,x0+Lv,yc+dv/2,`L = ${f(v.L)} mm`,30);
    s+=D.dim(x0,yc-dv/2,x0,yc+dv/2,`d = ${f(v.d)}`,38);
    const cx=190,cy=240,R=56,ri=R*cl(v.di/v.d,0,.95);
    s+=`<circle class="th" cx="${cx}" cy="${cy}" r="${R}" fill="var(--sage)" fill-opacity=".2"/>`;
    s+=ri>0?`<circle class="ln" cx="${cx}" cy="${cy}" r="${ri}" fill="var(--panel)"/>`:"";
    s+=`<path class="ch" d="M${cx-R-12},${cy}H${cx+R+12}M${cx},${cy-R-12}V${cy+R+12}"/>`;
    const x1=cx+R+40,tmax=70,tmin=tmax*cl(v.di/v.d,0,.95);
    s+=`<path class="fl" d="M${x1},${cy-ri} L${x1+tmin},${cy-ri} L${x1+tmax},${cy-R} L${x1},${cy-R}Z"/>`;
    s+=`<path class="fl" d="M${x1},${cy+ri} L${x1+tmin},${cy+ri} L${x1+tmax},${cy+R} L${x1},${cy+R}Z"/>`;
    s+=`<path class="gr" d="M${x1},${cy-R-6}V${cy+R+6}"/>`+D.txt(x1+tmax+8,cy-R+4,`τmax = ${f(r.tau)} MPa`,"start","b");
    s+=D.txt(cx,cy+R+26,"end view","middle")+D.txt(x1+4,cy+R+26,"shear stress τ(ρ)","start");
    return svg(s,300);
  }
};

/* ---------- 2. Beam bending ---------- */
C.beam={
  caption:"Simply supported beam, central point load. Deflection is exaggerated so it is visible; the section shows the linear bending-stress profile.",
  presets:[{label:"Material (E)",target:"E",options:MAT_E.map(m=>[m[0]+" — "+m[1]+" GPa",m[1]])}],
  inputs:[
    {id:"P",label:"Central load P",unit:"N",value:5000,min:0},
    {id:"L",label:"Span L",unit:"mm",value:1000,min:1},
    {id:"sec",label:"Section",type:"select",options:[["rect","Rectangle b × h"],["circ","Solid circle d"]]},
    {id:"b",label:"Width b",unit:"mm",value:40,min:1,show:v=>v.sec==="rect"},
    {id:"h",label:"Height h",unit:"mm",value:60,min:1,show:v=>v.sec==="rect"},
    {id:"d",label:"Diameter d",unit:"mm",value:50,min:1,show:v=>v.sec==="circ"},
    {id:"E",label:"Young's modulus E",unit:"GPa",value:207,min:0.1}
  ],
  compute(v){
    let I,c;
    if(v.sec==="rect"){I=v.b*Math.pow(v.h,3)/12;c=v.h/2}else{I=PI*Math.pow(v.d,4)/64;c=v.d/2}
    const M=v.P*v.L/4;                 // N·mm
    const sig=M*c/I, S=I/c;
    const dlt=v.P*Math.pow(v.L,3)/(48*v.E*1000*I);
    return {res:[["Reaction at each support",f(v.P/2),"N"],["Max moment M = PL/4",f(M/1000),"N·m"],["Moment of inertia I",f(I),"mm⁴"],
      ["Section modulus S = I/c",f(S),"mm³"],["σ max = M c / I",f(sig),"MPa"],["δ max = PL³/48EI",f(dlt),"mm"],["δ / L",f(dlt/v.L,5),""]],I,c,sig,dlt};
  },
  draw(v,r){
    const x0=70,x1=490,yb=110,n=40;
    const dv=cl(r.dlt/v.L*420*60,3,46);          // exaggerated display deflection
    const pts=[];for(let i=0;i<=n;i++){const xs=i/n,xn=xs<=.5?xs:1-xs;const g=xn*(3-4*xn*xn)/1;
      pts.push([x0+(x1-x0)*xs,yb+dv*g*1.0])}
    const tv=12;
    let s=`<path class="th" d="M${pts.map(p=>p[0].toFixed(1)+","+(p[1]-tv/2).toFixed(1)).join(" L")}"/>`;
    s+=`<path class="th" d="M${pts.map(p=>p[0].toFixed(1)+","+(p[1]+tv/2).toFixed(1)).join(" L")}"/>`;
    s+=`<path class="ds" d="M${x0},${yb}H${x1}"/>`;
    const tri=x=>`<path class="ln" d="M${x},${yb+tv/2} l-12,20 h24z"/>`;
    s+=tri(x0)+tri(x1)+`<circle class="ln" cx="${x1+0}" cy="${yb+tv/2+26}" r="4" fill="var(--panel)"/>`;
    const xm=(x0+x1)/2;
    s+=D.arrow(xm,yb-60,xm,yb+dv-tv/2-2,"cl")+D.txt(xm+8,yb-50,`P = ${f(v.P)} N`,"start","b");
    s+=D.dim(x0,yb+90,x1,yb+90,`L = ${f(v.L)} mm`,0);
    s+=D.txt(xm,yb+dv+tv/2+22,`δmax = ${f(r.dlt)} mm (drawn exaggerated)`,"middle");
    /* section */
    const cx=150,cy=275;let hh,ww;
    if(v.sec==="rect"){const k=70/Math.max(v.b,v.h);ww=v.b*k;hh=v.h*k;
      s+=`<rect class="th" x="${cx-ww/2}" y="${cy-hh/2}" width="${ww}" height="${hh}" fill="var(--steel)" fill-opacity=".18"/>`;
      s+=D.dim(cx-ww/2,cy+hh/2,cx+ww/2,cy+hh/2,`b=${f(v.b)}`,24)+D.dim(cx+ww/2,cy-hh/2,cx+ww/2,cy+hh/2,`h=${f(v.h)}`,-34);}
    else{hh=70;ww=70;s+=`<circle class="th" cx="${cx}" cy="${cy}" r="35" fill="var(--steel)" fill-opacity=".18"/>`+D.dim(cx-35,cy+35,cx+35,cy+35,`d=${f(v.d)}`,24);}
    s+=`<path class="ch" d="M${cx-ww/2-14},${cy}H${cx+ww/2+14}"/>`;
    const sx=300;
    s+=`<path class="fl" d="M${sx},${cy-hh/2} L${sx+70},${cy-hh/2} L${sx},${cy}Z"/><path class="fb" d="M${sx},${cy+hh/2} L${sx-70},${cy+hh/2} L${sx},${cy}Z"/>`;
    s+=D.txt(sx+76,cy-hh/2+4,`σmax = ${f(r.sig)} MPa`,"start","b")+D.txt(sx-76,cy+hh/2+4,"−σmax","end");
    s+=D.txt(cx,cy+hh/2+52,"section","middle")+D.txt(sx,cy+hh/2+52,"bending stress σ(y)","middle");
    return svg(s,350);
  }
};

/* ---------- 3. Axial load and thermal ---------- */
C.axial={
  caption:"Bar fixed at the left. Dashed outline = original length; solid = deformed (elongation exaggerated).",
  presets:[{label:"Material (E, α)",targets:["E","al"],options:MAT_EA.map(m=>[m[0],m[1]])}],
  inputs:[
    {id:"P",label:"Axial load P (+ tension)",unit:"kN",value:50},
    {id:"L",label:"Length L",unit:"mm",value:1500,min:1},
    {id:"d",label:"Diameter d",unit:"mm",value:20,min:1},
    {id:"E",label:"Young's modulus E",unit:"GPa",value:207,min:0.1},
    {id:"al",label:"Thermal expansion α",unit:"µm/m·°C",value:12,min:0},
    {id:"dT",label:"Temperature change ΔT",unit:"°C",value:40}
  ],
  compute(v){
    const A=PI*v.d*v.d/4;
    const sig=v.P*1000/A, eps=sig/(v.E*1000), dP=eps*v.L;
    const dth=v.al*1e-6*v.dT*v.L, sRes=-v.E*1000*v.al*1e-6*v.dT;
    return {res:[["Area A",f(A),"mm²"],["Stress σ = P/A",f(sig),"MPa"],["Strain ε = σ/E",f(eps*1e6),"µε"],["δ = PL/EA",f(dP),"mm"],
      ["Free thermal δ = αΔT L",f(dth),"mm"],["Total δ (free end)",f(dP+dth),"mm"],["Fully restrained: σ = −EαΔT",f(sRes),"MPa"]],dP,dth,A};
  },
  draw(v,r){
    const x0=110,Lv=300,h=cl(v.d/v.L*Lv*3,16,56),yc=110;
    const tot=r.dP+r.dth,ext=cl(tot/v.L*Lv*60,-50,80);
    let s=`<path class="th" d="M${x0},${yc-70}V${yc+70}"/>`+[-60,-40,-20,0,20,40,60].map(k=>`<path class="gr" d="M${x0},${yc+k} l-10,10"/>`).join("");
    s+=`<rect class="ds" x="${x0}" y="${yc-h/2}" width="${Lv}" height="${h}" fill="none"/>`;
    s+=`<rect class="th" x="${x0}" y="${yc-h/2}" width="${Lv+ext}" height="${h}" fill="var(--sage)" fill-opacity=".2"/>`;
    s+=`<path class="ch" d="M${x0-10},${yc}H${x0+Lv+ext+44}"/>`;
    s+=D.arrow(x0+Lv+ext+4,yc,x0+Lv+ext+(v.P>=0?54:-2),yc,"cl")+D.txt(x0+Lv+ext+30,yc+22,`P = ${f(v.P)} kN`,"middle","b");
    s+=D.dim(x0,yc+h/2,x0+Lv,yc+h/2,`L = ${f(v.L)} mm`,30);
    s+=D.txt(x0+(Lv+ext)/2,yc-h/2-14,`total δ = ${f(tot)} mm (exaggerated)`,"middle","b");
    s+=`<path class="cl" d="M${x0+Lv},${yc+h/2+4}v12"/>`;
    return svg(s,230);
  }
};

/* ---------- 4. Limits and fits ---------- */
C.fits={
  caption:"Tolerance zones relative to the zero (basic-size) line — hole left, shaft right. Enter the deviations from the ISO 286 tables.",
  presets:[{label:"Example",targets:["D","ES","EI","es","ei"],options:[["⌀25 H8/f6 (course example)","25,33,0,-20,-33"]]}],
  inputs:[
    {id:"D",label:"Basic size D",unit:"mm",value:25,min:0.1},
    {id:"ES",label:"Hole upper dev. ES",unit:"µm",value:33},
    {id:"EI",label:"Hole lower dev. EI",unit:"µm",value:0},
    {id:"es",label:"Shaft upper dev. es",unit:"µm",value:-20},
    {id:"ei",label:"Shaft lower dev. ei",unit:"µm",value:-33}
  ],
  compute(v){
    const Dmax=v.D+v.ES/1000,Dmin=v.D+v.EI/1000,dmax=v.D+v.es/1000,dmin=v.D+v.ei/1000;
    const maxC=Dmax-dmin,minC=Dmin-dmax;
    const type=minC>=0?"Clearance fit":(maxC<=0?"Interference fit":"Transition fit");
    const res=[["Hole limits",`${f(Dmin,3)} – ${f(Dmax,3)}`,"mm"],["Shaft limits",`${f(dmin,3)} – ${f(dmax,3)}`,"mm"],
      ["Hole tolerance",f((v.ES-v.EI)),"µm"],["Shaft tolerance",f((v.es-v.ei)),"µm"],["Fit type",type,""]];
    if(type==="Clearance fit"){res.push(["Max clearance",f(maxC,3),"mm"],["Min clearance",f(minC,3),"mm"]);}
    else if(type==="Interference fit"){res.push(["Max interference",f(-minC,3),"mm"],["Min interference",f(-maxC,3),"mm"]);}
    else res.push(["Max clearance",f(maxC,3),"mm"],["Max interference",f(-minC,3),"mm"]);
    return {res,type,warn:(v.ES<v.EI||v.es<v.ei)?"Upper deviation must be ≥ lower deviation.":""};
  },
  draw(v){
    const all=[v.ES,v.EI,v.es,v.ei,1].map(Math.abs),s0=110/Math.max(...all),y0=170;
    const Y=x=>y0-x*s0;
    let s=`<path class="ln" d="M70,${y0}H490"/>`+D.txt(488,y0-6,"zero line (basic size)","end");
    const box=(x,a,b,cls,lab)=>`<rect class="${cls}" x="${x}" y="${Math.min(Y(a),Y(b))}" width="90" height="${Math.max(Math.abs(Y(a)-Y(b)),1.5)}"/>`+D.txt(x+45,Math.min(Y(a),Y(b))-(lab?8:0),"","middle");
    s+=box(150,v.ES,v.EI,"fl")+box(320,v.es,v.ei,"fb");
    s+=D.txt(195,26,"HOLE","middle","b")+D.txt(365,26,"SHAFT","middle","b");
    const tag=(x,val,anchor)=>D.txt(x,Y(val)+4,(val>0?"+":"")+val+" µm",anchor);
    s+=tag(144,v.ES,"end")+tag(144,v.EI,"end")+tag(416,v.es,"start")+tag(416,v.ei,"start");
    s+=`<path class="ds" d="M240,${Y(v.ES)}H320M240,${Y(v.EI)}H320"/>`;
    return svg(s,330);
  }
};

/* ---------- 6. Projectile ---------- */
C.projectile={
  caption:"Trajectory under gravity only (a_x = 0, a_y = −g). Axes drawn to a common scale.",
  inputs:[
    {id:"v0",label:"Launch speed v₀",unit:"m/s",value:25,min:0},
    {id:"th",label:"Launch angle θ",unit:"deg",value:40,min:-89,step:0.5},
    {id:"y0",label:"Launch height y₀",unit:"m",value:1.5,min:0},
    {id:"g",label:"Gravity g",unit:"m/s²",value:9.81,min:0.1}
  ],
  compute(v){
    const t=v.th*PI/180,vx=v.v0*Math.cos(t),vy=v.v0*Math.sin(t);
    const tf=(vy+Math.sqrt(vy*vy+2*v.g*v.y0))/v.g,R=vx*tf;
    const tm=vy>0?vy/v.g:0,h=v.y0+(vy>0?vy*vy/(2*v.g):0);
    const vyE=vy-v.g*tf,vE=Math.hypot(vx,vyE);
    return {res:[["vₓ = v₀ cos θ",f(vx),"m/s"],["v_y0 = v₀ sin θ",f(vy),"m/s"],["Flight time t_f",f(tf),"s"],["Range R",f(R),"m"],["Max height h",f(h),"m"],
      ["Time to max height",f(tm),"s"],["Speed at landing",f(vE),"m/s"],["Speed at top (= vₓ)",f(vx),"m/s"]],vx,vy,tf,R,h};
  },
  draw(v,r){
    const s=Math.min(430/Math.max(r.R,1e-6),200/Math.max(r.h,1e-6)),x0=70,y0=270;
    const pts=[];for(let i=0;i<=60;i++){const t=r.tf*i/60,x=r.vx*t,y=v.y0+r.vy*t-.5*v.g*t*t;pts.push([x0+x*s,y0-Math.max(y,0)*s])}
    let g=`<path class="ln" d="M${x0-10},${y0}H${x0+r.R*s+40}M${x0},${y0+6}V${y0-r.h*s-30}"/>`;
    g+=`<path class="cl" d="M${pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L")}"/>`;
    g+=`<circle cx="${x0}" cy="${y0-v.y0*s}" r="4" fill="var(--clay)"/>`;
    const a=v.th*PI/180,L=60;g+=D.arrow(x0,y0-v.y0*s,x0+L*Math.cos(a),y0-v.y0*s-L*Math.sin(a),"ln");
    g+=D.txt(x0+L*Math.cos(a)+6,y0-v.y0*s-L*Math.sin(a),`v₀ ${f(v.v0)}`,"start","b");
    g+=D.dim(x0,y0+10,x0+r.R*s,y0+10,`R = ${f(r.R)} m`,14);
    if(r.vy>0){const xt=x0+r.vx*(r.vy/v.g)*s;g+=`<path class="ds" d="M${xt},${y0}V${y0-r.h*s}"/>`+D.txt(xt+6,y0-r.h*s-6,`h = ${f(r.h)} m`,"start","b");}
    return svg(g,320);
  }
};

/* ---------- 7. Section properties ---------- */
C.section={
  caption:"Centroidal axes are drawn as chain lines. Units are mm. Formulas after Hibbeler's inside-cover table.",
  inputs:[
    {id:"sh",label:"Shape",type:"select",options:[["rect","Rectangle"],["circ","Circle"],["ring","Hollow circle"],["tri","Triangle (isosceles)"],["semi","Semicircle"]]},
    {id:"b",label:"Base / width b",unit:"mm",value:60,min:1,show:v=>v.sh==="rect"||v.sh==="tri"},
    {id:"h",label:"Height h",unit:"mm",value:90,min:1,show:v=>v.sh==="rect"||v.sh==="tri"},
    {id:"d",label:"Outer diameter d",unit:"mm",value:60,min:1,show:v=>v.sh==="circ"||v.sh==="ring"||v.sh==="semi"},
    {id:"di",label:"Inner diameter",unit:"mm",value:40,min:0,show:v=>v.sh==="ring"}
  ],
  compute(v){
    let A,yb,Ix,Iy,c,J=null;
    if(v.sh==="rect"){A=v.b*v.h;yb=v.h/2;Ix=v.b*Math.pow(v.h,3)/12;Iy=v.h*Math.pow(v.b,3)/12;c=v.h/2}
    else if(v.sh==="circ"){A=PI*v.d*v.d/4;yb=v.d/2;Ix=Iy=PI*Math.pow(v.d,4)/64;c=v.d/2;J=PI*Math.pow(v.d,4)/32}
    else if(v.sh==="ring"){A=PI*(v.d*v.d-v.di*v.di)/4;yb=v.d/2;Ix=Iy=PI*(Math.pow(v.d,4)-Math.pow(v.di,4))/64;c=v.d/2;J=PI*(Math.pow(v.d,4)-Math.pow(v.di,4))/32}
    else if(v.sh==="tri"){A=v.b*v.h/2;yb=v.h/3;Ix=v.b*Math.pow(v.h,3)/36;Iy=v.h*Math.pow(v.b,3)/48;c=2*v.h/3}
    else{const r=v.d/2;A=PI*r*r/2;yb=4*r/(3*PI);Ix=PI*Math.pow(r,4)/8-8*Math.pow(r,4)/(9*PI);Iy=PI*Math.pow(r,4)/8;c=r-yb+ (r-(r-yb)>0?0:0);c=Math.max(yb,r-yb)}
    const res=[["Area A",f(A),"mm²"],["Centroid from base",f(yb),"mm"],["Ix̄ (horizontal axis)",f(Ix),"mm⁴"],["Iȳ (vertical axis)",f(Iy),"mm⁴"],
      ["Section modulus Sx = Ix̄/c",f(Ix/c),"mm³"],["Radius of gyration kx",f(Math.sqrt(Ix/A)),"mm"]];
    if(J)res.push(["Polar J",f(J),"mm⁴"]);
    return {res,yb,warn:v.sh==="ring"&&v.di>=v.d?"Inner diameter must be smaller than outer.":""};
  },
  draw(v,r){
    const cx=280,cy=150;let s="";
    const k=v.sh==="rect"||v.sh==="tri"?170/Math.max(v.b,v.h):170/v.d;
    if(v.sh==="rect"){const w=v.b*k,h=v.h*k;s+=`<rect class="th" x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="var(--steel)" fill-opacity=".18"/>`;
      s+=D.dim(cx-w/2,cy+h/2,cx+w/2,cy+h/2,`b = ${f(v.b)}`,22)+D.dim(cx+w/2,cy-h/2,cx+w/2,cy+h/2,`h = ${f(v.h)}`,-34);
      s+=`<path class="ch" d="M${cx-w/2-12},${cy}H${cx+w/2+12}M${cx},${cy-h/2-12}V${cy+h/2+12}"/>`;}
    if(v.sh==="circ"||v.sh==="ring"){const R=v.d*k/2,ri=v.sh==="ring"?Math.min(v.di,v.d*.95)*k/2:0;
      s+=`<circle class="th" cx="${cx}" cy="${cy}" r="${R}" fill="var(--steel)" fill-opacity=".18"/>`+(ri?`<circle class="ln" cx="${cx}" cy="${cy}" r="${ri}" fill="var(--panel)"/>`:"");
      s+=D.dim(cx-R,cy+R,cx+R,cy+R,`d = ${f(v.d)}`,24)+`<path class="ch" d="M${cx-R-12},${cy}H${cx+R+12}M${cx},${cy-R-12}V${cy+R+12}"/>`;}
    if(v.sh==="tri"){const w=v.b*k,h=v.h*k,yb=cy+h/2;
      s+=`<path class="th" d="M${cx-w/2},${yb} L${cx+w/2},${yb} L${cx},${yb-h}Z" fill="var(--steel)" fill-opacity=".18"/>`;
      s+=D.dim(cx-w/2,yb,cx+w/2,yb,`b = ${f(v.b)}`,22)+D.dim(cx+w/2+10,yb,cx+w/2+10,yb-h,`h = ${f(v.h)}`,22);
      s+=`<path class="ch" d="M${cx-w/2-12},${yb-h/3}H${cx+w/2+12}M${cx},${yb-h-10}V${yb+10}"/>`;}
    if(v.sh==="semi"){const R=v.d*k/2,yb=cy+R/2,ybar=4*R/(3*PI);
      s+=`<path class="th" d="M${cx-R},${yb} A${R},${R} 0 0 1 ${cx+R},${yb}Z" fill="var(--steel)" fill-opacity=".18"/>`;
      s+=D.dim(cx-R,yb,cx+R,yb,`d = ${f(v.d)}`,22)+`<path class="ch" d="M${cx-R-12},${yb-ybar}H${cx+R+12}M${cx},${yb-R-10}V${yb+10}"/>`;
      s+=D.txt(cx+8,yb-ybar-6,`ȳ = ${f(r.yb)}`,"start","b");}
    return svg(s,300);
  }
};
}
function build(name,cfg){
  var sec=document.getElementById('wb-t-'+name); if(!sec) return;
  var inBox=sec.querySelector('[data-in]'), outBox=sec.querySelector('[data-out]');
  var vals={}, rows={};
  var fields=document.createElement('div'); fields.className='fields';
  if(cfg.presets){
    cfg.presets.forEach(function(p){
      var w=document.createElement('div'); w.className='field full';
      w.innerHTML='<label>'+p.label+'</label><div class="inp"><select><option value="">— choose a typical value —</option>'+p.options.map(function(o){return '<option value="'+o[1]+'">'+o[0]+'</option>';}).join('')+'</select></div>';
      w.querySelector('select').addEventListener('change',function(e){
        if(e.target.value==='')return;
        (p.targets||[p.target]).forEach(function(t,k){
          var v=String(e.target.value).split(',')[k], el=inBox.querySelector('#ex-'+name+'-'+t);
          if(el) el.value=v;
        });
        update();
      });
      fields.appendChild(w);
    });
  }
  cfg.inputs.forEach(function(f){
    var w=document.createElement('div'); rows[f.id]=w;
    if(f.type==='select'){
      w.className='field full';
      w.innerHTML='<label for="ex-'+name+'-'+f.id+'">'+f.label+'</label><div class="inp"><select id="ex-'+name+'-'+f.id+'">'+f.options.map(function(o){return '<option value="'+o[0]+'">'+o[1]+'</option>';}).join('')+'</select></div>';
      vals[f.id]=f.options[0][0];
    }else{
      w.className='field';
      w.innerHTML='<label for="ex-'+name+'-'+f.id+'">'+f.label+'</label><div class="inp"><input id="ex-'+name+'-'+f.id+'" type="number" step="'+(f.step||'any')+'" '+(f.min!=null?'min="'+f.min+'"':'')+' value="'+f.value+'">'+(f.unit?'<span class="u">'+f.unit+'</span>':'')+'</div>';
      vals[f.id]=f.value;
    }
    fields.appendChild(w);
  });
  var lab=document.createElement('span'); lab.className='grp-label'; lab.textContent='Inputs';
  var fig=document.createElement('div'); fig.className='fig draw edraw';
  var svgHost=document.createElement('div'); var cap=document.createElement('div'); cap.className='cap'; cap.textContent=cfg.caption||'';
  fig.appendChild(svgHost); fig.appendChild(cap);
  inBox.appendChild(lab); inBox.appendChild(fields); inBox.appendChild(fig);
  var resBox=document.createElement('div'); resBox.className='res';
  var warn=document.createElement('div');
  outBox.insertBefore(warn,outBox.firstChild); outBox.insertBefore(resBox,outBox.firstChild);
  function read(){
    cfg.inputs.forEach(function(f){
      var el=inBox.querySelector('#ex-'+name+'-'+f.id);
      vals[f.id]=f.type==='select'?el.value:parseFloat(el.value);
    });
  }
  function update(){
    read();
    cfg.inputs.forEach(function(f){ rows[f.id].style.display=(f.show&&!f.show(vals))?'none':''; });
    var r; try{ r=cfg.compute(vals); }catch(e){ r={res:[],warn:String(e)}; }
    var list=r.res.slice();
    if(cfg.hero){ var hi=-1; list.forEach(function(x,i){ if(x[0].indexOf(cfg.hero)===0) hi=i; }); if(hi>0){ var hx=list.splice(hi,1)[0]; list.unshift(hx); } }
    resBox.innerHTML=list.map(function(x,i){
      var val=x[1]; var unit=x[2]?'<em>'+x[2]+'</em>':'';
      return '<div'+(i===0?' class="hero"':'')+'><span>'+x[0]+'</span><strong>'+val+unit+'</strong></div>';
    }).join('');
    if((list.length-1)%2===1) resBox.insertAdjacentHTML('beforeend','<div></div>');
    warn.innerHTML=r.warn?'<div class="note">'+r.warn+'</div>':'';
    try{ svgHost.innerHTML=cfg.draw(vals,r); }catch(e){ svgHost.innerHTML=''; }
  }
  inBox.addEventListener('input',update); inBox.addEventListener('change',update);
  update();
}
C.torsion.hero='τ max'; C.beam.hero='σ max'; C.axial.hero='Stress'; C.fits.hero='Fit type'; C.projectile.hero='Range'; C.section.hero='Area';
Object.keys(C).forEach(function(k){ build(k,C[k]); });
})();
