/* Draws From the Ranks' beastHorse (src/017b_beasts.js) into SVG path markup, so the title art's horses are the game's own horses.
   node tools/ttg_horse_svg.js '<json list of {run, g, col, mane, up}>' -> JSON list of SVG fragments, in the horse's own units
   (facing +x, feet on y = 0, barrel about 11 long). Used by tools/ttg_title_art.py. */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', '017b_beasts.js'), 'utf8');
const body = src.slice(src.indexOf('function beastHorse'), src.indexOf('/* an ox as one flat shape'));
const beastHorse = new Function(body + '; return beastHorse;')();
function svgCtx(){
  const out = []; let d = '';
  const n = v => +v.toFixed(2);
  return {out, fillStyle:'#000', strokeStyle:'#000', lineWidth:1, lineCap:'round', lineJoin:'round', save(){}, restore(){},
    beginPath(){ d = ''; }, moveTo(x, y){ d += `M${n(x)} ${n(y)}`; }, lineTo(x, y){ d += `L${n(x)} ${n(y)}`; },
    quadraticCurveTo(a, b, x, y){ d += `Q${n(a)} ${n(b)} ${n(x)} ${n(y)}`; }, closePath(){ d += 'Z'; },
    fill(){ out.push(`<path d="${d}" fill="${this.fillStyle}"/>`); },
    stroke(){ out.push(`<path d="${d}" fill="none" stroke="${this.strokeStyle}" stroke-width="${n(this.lineWidth)}" stroke-linecap="${this.lineCap}" stroke-linejoin="${this.lineJoin}"/>`); }};
}
const specs = JSON.parse(process.argv[2] || '[{}]');
console.log(JSON.stringify(specs.map(o => { const c = svgCtx(); beastHorse(c, o.col || '#0a090e', o); return c.out.join(''); })));
