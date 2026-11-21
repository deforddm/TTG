/* Draws Trygalle Run's own coach horse (ttgHorseParts in src/048_ttg_art.js) as SVG markup, so the title art's horses are the game's horses.
   node tools/ttg_horse_svg.js '<json list of horse options>' -> JSON list of SVG fragments, in the horse's own units
   (facing +x, hooves on y = 0, withers about 9.8 up). Used by tools/ttg_title_art.py. */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', '048_ttg_art.js'), 'utf8');
const pick = (a, b) => src.slice(src.indexOf(a), src.indexOf(b));
const lib = pick('function taMix', 'function taAlpha') + pick('const taN', '/* ================= the coach horse') + pick('function ttgHorseParts', '/* draw the horse') + pick('/* the same horse as SVG', '/* a horse from above');
const ttgHorseSVG = new Function(lib + '; return ttgHorseSVG;')();
const specs = JSON.parse(process.argv[2] || '[{}]');
console.log(JSON.stringify(specs.map(o => ttgHorseSVG(o))));
