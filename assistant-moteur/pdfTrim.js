// Reduit le devis aux pages "produits" avant de l'envoyer a l'IA.
// Les devis Technogym ont : details client + tableaux produits + page "TOTAL DE VOTRE SOLUTION",
// PUIS ~15 pages de conditions generales / annexes inutiles (qui ralentissent fortement la lecture IA).
// On garde les pages 1..page-des-totaux ; si on ne trouve pas, on garde tout (securite).
import { PDFDocument } from "pdf-lib";

let pdfjs;
async function getPdfjs() {
  if (!pdfjs) pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return pdfjs;
}

const norm = (s) => (s || "").toUpperCase().replace(/\s+/g, " ");
const STOP_MARKERS = ["TOTAL DE VOTRE SOLUTION", "MONTANT TOTAL", "TVA COMPRISE", "TOTAL (TVA"];

export async function trimToProductPages(pdfBuffer) {
  try {
    const { getDocument } = await getPdfjs();
    const doc = await getDocument({ data: new Uint8Array(pdfBuffer), disableWorker: true, isEvalSupported: false }).promise;
    const n = doc.numPages;
    if (n <= 10) return pdfBuffer; // deja court, inutile de decouper

    let lastKeep = -1;
    for (let p = 1; p <= n; p++) {
      const tc = await page_text(doc, p);
      if (STOP_MARKERS.some((m) => tc.includes(m))) { lastKeep = p; break; }
    }
    if (lastKeep < 1) return pdfBuffer; // marqueur non trouve -> on garde tout

    // pdf-lib : copie les pages 1..lastKeep
    const src = await PDFDocument.load(pdfBuffer);
    const out = await PDFDocument.create();
    const idx = Array.from({ length: lastKeep }, (_, i) => i);
    const pages = await out.copyPages(src, idx);
    pages.forEach((pg) => out.addPage(pg));
    const bytes = await out.save();
    return Buffer.from(bytes);
  } catch (e) {
    return pdfBuffer; // toute erreur -> PDF original (correct, juste plus lent)
  }
}

async function page_text(doc, p) {
  const page = await doc.getPage(p);
  const tc = await page.getTextContent();
  return norm(tc.items.map((it) => it.str).join(" "));
}
