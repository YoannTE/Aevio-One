// Extraction des vignettes produits depuis le PDF du devis (secours quand pas de visuel en bibliotheque).
// Strategie : pour chaque image rasterisee du PDF on note sa position (page, y) ; pour chaque CODE produit
// on note la position de son texte ; on associe chaque image au CODE le plus proche verticalement.
import { PNG } from "pngjs";

// Import paresseux du build "legacy" de pdf.js (compatible Node).
let pdfjs;
async function getPdfjs() {
  if (!pdfjs) pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return pdfjs;
}

// Multiplication de matrices 2D pdf.js [a,b,c,d,e,f]
function mul(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function imgToPngBuffer(img) {
  const { width, height, kind, data } = img;
  if (!width || !height || !data) return null;
  const png = new PNG({ width, height });
  const out = png.data; // RGBA
  if (kind === 3) {
    // RGBA_32BPP
    out.set(data.subarray(0, out.length));
  } else if (kind === 2) {
    // RGB_24BPP
    for (let i = 0, j = 0; i < width * height; i++) {
      out[j++] = data[i * 3]; out[j++] = data[i * 3 + 1]; out[j++] = data[i * 3 + 2]; out[j++] = 255;
    }
  } else if (kind === 1) {
    // GRAYSCALE_1BPP (peu probable pour une photo) -> on ignore
    return null;
  } else {
    return null;
  }
  return PNG.sync.write(png);
}

// Renvoie une Map code(normalise) -> dataURI PNG, pour les vignettes du devis.
// knownCodes : liste des references produit (du devis lu par Claude) pour fiabiliser l'association.
export async function extractDevisImages(pdfBuffer, knownCodes = []) {
  const normc = (c) => (c || "").toUpperCase().replace(/\s/g, "");
  const known = new Set();
  for (const c of knownCodes) for (const part of String(c).split(/[\/,]/)) { const n = normc(part); if (n.length >= 4) known.add(n); }
  const matchesKnown = (code) => {
    if (known.size === 0) return true; // pas de liste fournie -> on garde tout
    const n = normc(code);
    for (const k of known) if (k === n || k.startsWith(n) || n.startsWith(k)) return true;
    return false;
  };

  const { getDocument, OPS } = await getPdfjs();
  const doc = await getDocument({ data: new Uint8Array(pdfBuffer), disableWorker: true, isEvalSupported: false }).promise;

  const images = []; // {page, y, h, w, buf}
  const codes = [];  // {page, y, code}

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const pageH = viewport.height;

    // Positions des textes "CODE ..." (les references produit)
    const tc = await page.getTextContent();
    for (const it of tc.items) {
      const s = (it.str || "").trim();
      // une reference Technogym : lettres+chiffres+tirets, au moins 5 caracteres, pas une phrase
      const m = s.match(/\b([A-Z0-9]{2,}[A-Z0-9\-]{3,})\b/);
      if (m && /[0-9]/.test(m[1]) && /[A-Z]/.test(m[1]) && s.length < 40 && matchesKnown(m[1])) {
        const ty = it.transform[5];
        codes.push({ page: p, y: ty, code: m[1] });
      }
    }

    // Positions + bitmaps des images
    const opList = await page.getOperatorList();
    let ctm = [1, 0, 0, 1, 0, 0];
    const stack = [];
    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      const args = opList.argsArray[i];
      if (fn === OPS.save) stack.push(ctm.slice());
      else if (fn === OPS.restore) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
      else if (fn === OPS.transform) ctm = mul(ctm, args);
      else if (fn === OPS.paintImageXObject || fn === OPS.paintImageXObjectRepeat) {
        const name = args[0];
        const w = Math.abs(ctm[0]), h = Math.abs(ctm[3]);
        const x = ctm[4], y = ctm[5];
        // filtre : ignore bannieres/larges (>55% largeur page) et minuscules (<20pt)
        if (w > viewport.width * 0.55 || w < 20 || h < 20) continue;
        // ignore le logo (haut de page)
        if (y > pageH - 90) continue;
        let obj = null;
        try {
          // garde-fou : certaines images ne "repondent" jamais -> on abandonne apres 3 s
          obj = await Promise.race([
            new Promise((res) => page.objs.get(name, res)),
            new Promise((res) => setTimeout(() => res(null), 3000)),
          ]);
        } catch { obj = null; }
        const buf = obj ? imgToPngBuffer(obj) : null;
        if (buf) images.push({ page: p, y, h, w, buf });
      }
    }
  }

  // Association image -> code le plus proche (meme page, y proche)
  const norm = (c) => (c || "").toUpperCase().replace(/\s/g, "");
  const map = new Map();
  for (const img of images) {
    let best = null, bestD = Infinity;
    for (const c of codes) {
      if (c.page !== img.page) continue;
      const d = Math.abs(c.y - img.y);
      if (d < bestD) { bestD = d; best = c; }
    }
    if (best && bestD < 120 && !map.has(norm(best.code))) {
      map.set(norm(best.code), "data:image/png;base64," + img.buf.toString("base64"));
    }
  }
  return map;
}

// Cherche dans la map l'image pour un produit (code exact, prefixe, ou 1er code d'une plage)
export function devisImageFor(map, code) {
  if (!map || !code) return null;
  const norm = (c) => c.toUpperCase().replace(/\s/g, "");
  const candidates = code.split(/[\/,]/).map((c) => norm(c.trim())).filter(Boolean);
  for (const c of candidates) {
    if (map.has(c)) return map.get(c);
    for (const k of map.keys()) if (k.startsWith(c) || c.startsWith(k)) return map.get(k);
  }
  return null;
}
