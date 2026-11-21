/* Renders the icon SVGs from tools/ttg_icon.py into the PNGs the manifest and page name.
   node tools/ttg_icon_png.js SVGDIR OUTDIR */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const [dir, out] = [process.argv[2], process.argv[3] || '.'];
(async () => { const b = await chromium.launch();
  for (const [svg, png, size] of [['icon.svg', 'icon-512.png', 512], ['icon.svg', 'icon-192.png', 192], ['icon.svg', 'apple-touch-icon.png', 180], ['icon-maskable.svg', 'icon-maskable-512.png', 512]]) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(`<html><body style="margin:0">${fs.readFileSync(path.join(dir, svg), 'utf8').replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    await p.screenshot({ path: path.join(out, png), omitBackground: false }); await p.close(); }
  await b.close(); })();
