import re,json
src=open('src/desk-base.html').read()
extra_css=open('src/extra.css').read()
extra_js=open('src/extra.js').read()

# ---------- nav ----------
groups=[
 ('Machine elements',[('gears','Spur gears','Geometry, ratio &amp; speed'),('shaft','Shaft sizing','Power, torque &amp; diameter'),('fits','Limits &amp; fits','ISO 286 tolerances')]),
 ('Mechanics of materials',[('torsion','Torsion &amp; twist','Solid or hollow shaft'),('beam','Beam bending','Load, stress &amp; deflection'),('axial','Axial &amp; thermal','Elongation, stress, ΔT'),('section','Section properties','A, centroid, I, S, k')]),
 ('Manufacturing',[('sheet','Sheet metal','Bend allowance &amp; flat length'),('cnc','Speeds &amp; feeds','Turning, milling, drilling')]),
 ('Dynamics',[('projectile','Projectile motion','Range, height, time')]),
 ('Tools',[('units','Unit converter','Force, torque, stress…')]),
]
nav='<nav class="tabs" role="tablist" aria-label="Calculators">\n'
first=True
for g,items in groups:
    nav+='    <span class="grp">%s</span>\n'%g
    for k,t,s in items:
        nav+='    <button role="tab" data-tab="%s" aria-selected="%s"><b>%s</b><small>%s</small></button>\n'%(k,'true' if k=='gears' else 'false',t,s)
nav+='  </nav>'
a=src.index('<nav class="tabs" role="tablist" aria-label="Calculators">')
b=src.index('</nav>',a)+len('</nav>')
src=src[:a]+nav+src[b:]

# ---------- new sections ----------
def sec(k,title,desc,std,formula,refs):
    return f'''
  <!-- {k.upper()} -->
  <section class="tool" id="wb-t-{k}" role="tabpanel" hidden>
    <div class="tool-head"><div><h2>{title}</h2><p>{desc}</p></div><span class="std">{std}</span></div>
    <div class="tool-body">
      <div class="inputs" data-in></div>
      <div class="outputs" data-out><div class="formula">{formula}</div></div>
    </div>
    <div class="refbox"><span class="grp-label">References</span><ol class="refs">{''.join('<li>'+r+'</li>' for r in refs)}</ol></div>
  </section>'''
NOTE='Typical material constants are presets only and stay editable. Confirm against your material data sheet and the governing code before design use.'
new=''
new+=sec('fits','Limits &amp; fits (ISO 286)','Limits of size, tolerances, clearance or interference and fit type from the hole and shaft deviations. Enter the deviations from the ISO 286 tables.','ISO 286-1',
 'D<sub>max</sub> = D + ES     D<sub>min</sub> = D + EI\nd<sub>max</sub> = D + es     d<sub>min</sub> = D + ei\nmax clearance = D<sub>max</sub> − d<sub>min</sub>\nmin clearance = D<sub>min</sub> − d<sub>max</sub>\nmin clearance ≥ 0 → clearance fit\nmax clearance ≤ 0 → interference fit\notherwise → transition fit',
 ['ISO 286-1:2010, <i>Geometrical product specifications (GPS) — ISO code system for tolerances on linear sizes</i>. Deviations must be read from the standard tables.','Worked example ⌀25 H8/f6 (hole +33/0 µm, shaft −20/−33 µm) and the clearance/interference definitions: <a href="#drawing">Engineering drawing notes</a>, section on limits and fits.'])
new+=sec('torsion','Torsion &amp; angle of twist','Torque from power and speed, then shear stress and angle of twist for a solid or hollow circular shaft.','τ = Tρ / J',
 'T = 9550·P / n     (N·m, P in kW, n in rpm)\nJ = π(d⁴ − dᵢ⁴) / 32\nτ = T·ρ / J     τ<sub>max</sub> = T·c / J\nφ = T·L / (J·G)',
 ['F. P. Beer, E. R. Johnston &amp; J. T. DeWolf, <i>Mechanics of Materials</i>, 3rd ed., ch. 3 (torsion): τ = Tρ/J, φ = TL/JG.','Power–torque relation T = 9550·P/n as used in the course notes: <a href="#stress">Forces, stress &amp; strain</a>, section G.','Shear moduli G: W. D. Callister &amp; D. G. Rethwisch, <i>Materials Science and Engineering</i>, Table 6.1 (typical room-temperature values). '+NOTE])
new+=sec('beam','Beam bending','Simply supported beam with a central point load: reactions, maximum moment, bending stress and deflection.','M = PL / 4',
 'M = P·L / 4\nσ<sub>max</sub> = M·c / I = M / S\nδ<sub>max</sub> = P·L³ / (48·E·I)\nI = b·h³/12 (rectangle)     π·d⁴/64 (circle)',
 ['Beer, Johnston &amp; DeWolf, <i>Mechanics of Materials</i>, 3rd ed., ch. 4 (pure bending): σ = −My/I, σ<sub>max</sub> = Mc/I.','Central-load deflection δ = PL³/48EI: R. C. Hibbeler, <i>Mechanics of Materials</i>, beam-deflection table (inside cover).','Section modulus and I formulas: <a href="#stress">Forces, stress &amp; strain</a>, section M (Hibbeler inside-cover tables).','Young\'s modulus: Callister &amp; Rethwisch, Table 6.1. '+NOTE])
new+=sec('axial','Axial load &amp; thermal','Elongation, stress and strain of a bar under axial load, plus free or fully restrained thermal expansion.','δ = PL / EA',
 'σ = P / A     ε = σ / E\nδ = P·L / (E·A)\nδ<sub>th</sub> = α·ΔT·L     (free bar, σ = 0)\nfully restrained: σ = −E·α·ΔT',
 ['R. C. Hibbeler, <i>Mechanics of Materials</i>, ch. 4 (axial load) and the course lecture on axially loaded members: <a href="#stress">notes, section F</a>.','E: Callister &amp; Rethwisch, Table 6.1. α (linear thermal expansion): Callister &amp; Rethwisch, Table 19.1. Typical values only; check your alloy\'s data sheet.'])
new+=sec('section','Section properties','Area, centroid, second moments of area, section modulus and radius of gyration for standard shapes.','I = ∫y² dA',
 'Rectangle: Ix̄ = b·h³/12     Circle: π·d⁴/64\nTriangle: Ix̄ = b·h³/36\nSemicircle: ȳ = 4r/3π, Ix̄ = πr⁴/8 − 8r⁴/9π\nparallel axis: I = Ī + A·d²     k = √(I/A)',
 ['R. C. Hibbeler, <i>Engineering Mechanics: Statics</i>, 12th ed., inside-cover geometric properties, tabulated in <a href="#tables">Section-property tables</a>.','Note: the ZigZag summary\'s Iȳ = hb³/36 for the triangle applies to a right triangle; this tool uses Iȳ = hb³/48 for the isosceles triangle it draws (derivation in the notes).'])
new+=sec('projectile','Projectile motion','Range, maximum height, flight time and landing speed for a launch from any height, gravity only.','a<sub>x</sub> = 0, a<sub>y</sub> = −g',
 'vₓ = v₀·cos θ     v<sub>y0</sub> = v₀·sin θ\nx = vₓ·t     y = y₀ + v<sub>y0</sub>·t − ½·g·t²\nt<sub>f</sub> = [v<sub>y0</sub> + √(v<sub>y0</sub>² + 2·g·y₀)] / g\nh = y₀ + v<sub>y0</sub>² / 2g     R = vₓ·t<sub>f</sub>',
 ['Course dynamics notes, projectile motion: <a href="#dynamics">Dynamics of a particle</a>.','R. C. Hibbeler, <i>Engineering Mechanics: Dynamics</i>, projectile-motion equations.'])
# insert before UNITS section marker
mark='  <!-- UNITS -->'
assert mark in src
src=src.replace(mark,new+'\n'+mark,1)

# ---------- gears: n1 / n2 ----------
src=src.replace('<div class="field full"><label for="wb-g-t">Input torque on pinion <i>T₁</i></label><div class="inp"><input id="wb-g-t" type="number" step="0.5" min="0" value="10"><span class="u">N·m</span></div></div>',
 '<div class="field"><label for="wb-g-t">Input torque on pinion <i>T₁</i></label><div class="inp"><input id="wb-g-t" type="number" step="0.5" min="0" value="10"><span class="u">N·m</span></div></div>\n          <div class="field"><label for="wb-g-n1">Pinion speed <i>n₁</i></label><div class="inp"><input id="wb-g-n1" type="number" step="10" min="0" value="1450"><span class="u">rpm</span></div></div>')
src=src.replace('<div><span>Tangential force F<sub>t</sub></span><strong id="wb-g-ft">–</strong></div>',
 '<div><span>Tangential force F<sub>t</sub></span><strong id="wb-g-ft">–</strong></div>\n          <div><span>Output speed n₂ = n₁·z₁/z₂</span><strong id="wb-g-n2">–</strong></div>\n          <div><span>Base dia. d<sub>b1</sub> / d<sub>b2</sub></span><strong id="wb-g-db">–</strong></div>')
src=src.replace("set('g-t2', u(T1*i*eta,'N·m')); set('g-ft', u(2*T1*1000/d1,'N',0));",
 "set('g-t2', u(T1*i*eta,'N·m')); set('g-ft', u(2*T1*1000/d1,'N',0));\n    var n1=num('g-n1'); set('g-n2', u(n1/i,'rpm',1)); set('g-db', ok(d1,d2,al) ? fmt(d1*Math.cos(al*PI/180))+' / '+fmt(d2*Math.cos(al*PI/180))+'<em>mm</em>' : '–');")
assert "g-n2'" in src and 'wb-g-n1' in src

# ---------- home texts ----------
old='<p>Calculators for gears, sheet metal, machining and shafts. Every result updates a live drawing, and every formula names its source.</p>\n    <ul><li>Spur gears</li><li>Sheet-metal bend</li><li>Speeds &amp; feeds</li><li>Shaft sizing</li><li>Unit converter</li></ul>'
assert old in src
src=src.replace(old,'<p>11 calculators for gears, shafts, fits, beams, sheet metal, machining and dynamics. Every result updates a live drawing, and every formula names its source.</p>\n    <ul><li>Spur gears</li><li>Shaft sizing</li><li>Limits &amp; fits</li><li>Torsion</li><li>Beam bending</li><li>Axial &amp; thermal</li><li>Section properties</li><li>Sheet-metal bend</li><li>Speeds &amp; feeds</li><li>Projectile</li><li>Unit converter</li></ul>')
# ---------- css + js ----------
k=src.rindex('</style>'); src=src[:k]+extra_css+src[k:]
# js: append as new script before final </body>
idx=src.rindex('</body>') if '</body>' in src else None
print('has </body>:',idx is not None)

# ---- proper standalone head ----
hs=src.index('<!doctype html>'); be=src.index('<body>')
title_m=re.search(r'<title>(.*?)</title>',src)
src=src[:hs]+'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Besho's Engineering Desk: engineering calculators with live drawings, plus university notes, course files and TA pages.">
<meta name="color-scheme" content="light dark">
<title>Besho's Engineering Desk</title>
</head>
'''+src[be:]
src=src.replace('<title>Besho\'s Engineering Desk</title>\n<link rel="preconnect"','<link rel="preconnect"',1) if False else src
# drop the duplicate <title> that sat inside the body
src=re.sub(r'<body>\s*<title>.*?</title>','<body>',src,count=1,flags=re.S)
k=src.rindex('</body>'); src=src[:k]+'<script>\n'+extra_js+'\n</script>\n'+src[k:]
open('index.html','w').write(src)

