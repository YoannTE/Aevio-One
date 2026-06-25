// Construit le HTML complet de la fiche projet : pages produits + page(s) plans 3D + page financement.
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { eur } from "./leasing.js";

function dataUri(path) {
  const ext = extname(path).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "application/octet-stream";
  return `data:${mime};base64,${readFileSync(path).toString("base64")}`;
}

const STYLE = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { font-family: Arial, Helvetica, sans-serif; color: #2b2b2b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; overflow: hidden; padding: 15mm 16mm 12mm; position: relative; display: flex; flex-direction: column; page-break-after: always; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; }
  .logo { font-weight: 700; font-size: 18px; color: #1d1d1d; }
  .meta { text-align: right; font-size: 10.5px; color: #6b6b6b; line-height: 1.55; }
  .rule { border: none; border-top: 1px solid #e3e3e3; margin: 12px 0 16px; }
  .accent { width: 56px; height: 5px; background: #f4d000; border-radius: 2px; margin-bottom: 14px; }
  h1 { font-size: 26px; font-weight: 700; color: #1d1d1d; }
  .subtitle { font-size: 13px; color: #5a5a5a; margin-top: 5px; }
  .lead { font-size: 12px; color: #8a8a8a; margin-top: 2px; }
  .products { margin-top: 14px; }
  .card { display: flex; gap: 20px; padding: 11px 0; border-bottom: 1px solid #ececec; align-items: flex-start; }
  .card:first-child { padding-top: 0; }
  .thumb { flex: 0 0 110px; width: 110px; height: 110px; border: 1px solid #e6e6e6; border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: center; }
  .thumb img { max-width: 92px; max-height: 92px; }
  .thumb.empty { color: #c9c9c9; font-size: 10px; text-align: center; }
  .info { flex: 1; padding-top: 2px; }
  .info h2 { font-size: 16px; font-weight: 700; color: #1d1d1d; }
  .ref { display: inline-block; margin-top: 6px; margin-right: 6px; font-size: 10.5px; color: #9a7d00; border: 1px solid #f0d873; background: #fdf8e3; border-radius: 11px; padding: 2px 9px; }
  .qty { display: inline-block; margin-top: 6px; font-size: 10.5px; color: #555; border: 1px solid #ddd; background: #f6f6f6; border-radius: 11px; padding: 2px 9px; }
  .desc { font-size: 12.4px; line-height: 1.45; color: #555; margin-top: 8px; }
  .spec { font-size: 11.4px; color: #777; margin-top: 8px; padding-left: 10px; border-left: 3px solid #f4d000; }
  .plan-grid { margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .plan-cell { border: 1px solid #e6e6e6; border-radius: 8px; background: #fafafa; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 86mm; }
  .plan-cell img { max-width: 100%; max-height: 100%; }
  .fin-intro { font-size: 12.4px; color: #555; line-height: 1.5; margin-top: 8px; }
  .fin-amount { margin-top: 14px; display: flex; gap: 14px; }
  .fin-box { flex: 1; border: 1px solid #e6e6e6; border-radius: 8px; padding: 12px 14px; }
  .fin-box .k { font-size: 10px; color: #9a9a9a; text-transform: uppercase; letter-spacing: .5px; }
  .fin-box .v { font-size: 16px; font-weight: 700; color: #1d1d1d; margin-top: 3px; }
  .fin-box.hl { background: #fdf8e3; border-color: #f0d873; }
  .fin-section-title { font-size: 12px; font-weight: 700; color: #1d1d1d; background: #f4d000; display: inline-block; padding: 3px 12px; border-radius: 3px; margin: 18px 0 8px; }
  table.fin { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  table.fin th { background: #1f3a5f; color: #fff; font-weight: 600; padding: 6px 4px; text-align: center; font-size: 9.5px; border: 1px solid #fff; }
  table.fin th.grp { background: #27496d; }
  table.fin td { padding: 5px 4px; border-bottom: 1px solid #eee; }
  table.fin td.dur { color: #888; text-align: left; padding-left: 8px; }
  table.fin td.amt { font-weight: 700; color: #1d1d1d; text-align: right; padding-right: 10px; }
  table.fin tr:nth-child(even) td { background: #fafbfc; }
  .fin-note { font-size: 9.5px; color: #aaa; margin-top: 10px; font-style: italic; line-height: 1.4; }
  .footer { margin-top: auto; padding-top: 14px; border-top: 1px solid #ececec; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; }
`;

const FOOTER = "Yoann VARLOUD · Solution Key Account Manager Hospitality &amp; Residential · yvarloud@technogym.com";
const CAT_TITLES = {
  cardio: "Sélection Cardio",
  musculation: "Musculation & charges libres",
  accessoires: "Accessoires & entraînement fonctionnel",
};

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function metaBlock(d) {
  return `<div class="meta">Devis ${d.devis || "Q-XXXXXXXX"}<br>${(d.client || "").toUpperCase()}<br>Client ${d.code_client || "AC-XXXXXX"}</div>`;
}

function card(p) {
  const thumb = p.img
    ? `<div class="thumb"><img src="${p.img}" alt=""></div>`
    : `<div class="thumb empty">visuel<br>à venir</div>`;
  return `
    <div class="card">
      ${thumb}
      <div class="info">
        <h2>${p.nom}</h2>
        <span class="ref">Réf. ${p.code || "—"}</span><span class="qty">Quantité : ${p.quantite}</span>
        <p class="desc">${p.description || ""}</p>
        ${p.specs ? `<p class="spec">${p.specs}</p>` : ""}
      </div>
    </div>`;
}

// d = donnees extraites (+ produits enrichis avec .img dataUri) ; plans = [dataUri] ; fin = computeFinancement(ttc)
export function ficheHTML(d, plans, fin) {
  const sub = `<div class="subtitle">Préparée pour ${d.client}${d.ville ? " · " + d.ville : ""}</div>`;
  const pages = [];

  // 1) Pages produits, par categorie, 5 cartes/page
  for (const cat of ["cardio", "musculation", "accessoires"]) {
    const items = d.produits.filter((p) => p.categorie === cat);
    if (!items.length) continue;
    chunk(items, 5).forEach((group, i, all) => {
      const titre = CAT_TITLES[cat] + (all.length > 1 ? ` (${i + 1}/${all.length})` : "") + (cat === "cardio" && d.gamme ? ` — ${d.gamme}` : "");
      pages.push(`
        <div class="page">
          <div class="header"><div class="logo">TECHNOGYM</div>${metaBlock(d)}</div>
          <hr class="rule"><div class="accent"></div>
          <h1>${titre}</h1>${sub}
          <div class="lead">Visuels et caractéristiques des équipements proposés. Les illustrations ont une valeur indicative.</div>
          <div class="products">${group.map(card).join("")}</div>
          <div class="footer"><span>${FOOTER}</span><span class="pg"></span></div>
        </div>`);
    });
  }

  // 2) Pages plans 3D, grille de 6/page
  if (plans && plans.length) {
    chunk(plans, 6).forEach((group, i, all) => {
      const titre = "Implantation — Projection 3D" + (all.length > 1 ? ` (${i + 1}/${all.length})` : "");
      pages.push(`
        <div class="page">
          <div class="header"><div class="logo">TECHNOGYM</div>${metaBlock(d)}</div>
          <hr class="rule"><div class="accent"></div>
          <h1>${titre}</h1>${sub}
          <div class="lead">Visualisation 3D de l'aménagement de l'espace fitness avec les équipements proposés. Rendu indicatif.</div>
          <div class="plan-grid">${group.map((src) => `<div class="plan-cell"><img src="${src}" alt=""></div>`).join("")}</div>
          <div class="footer"><span>${FOOTER}</span><span class="pg"></span></div>
        </div>`);
    });
  }

  // 3) Page financement
  const cb = fin.creditBail, loc = fin.location, p = fin.premiers;
  const head = `<tr>
    <th colspan="2">Sans premier loyer</th>
    <th class="grp" colspan="2">1<sup>er</sup> loyer de 10 % (${eur(p[10])})</th>
    <th colspan="2">1<sup>er</sup> loyer de 20 % (${eur(p[20])})</th>
    <th class="grp" colspan="2">1<sup>er</sup> loyer de 30 % (${eur(p[30])})</th></tr>`;
  const frow = (r) => `<tr>
    <td class="dur">${r.dureeSans} mois</td><td class="amt">${eur(r.sans)}</td>
    <td class="dur">${r.duree} mois</td><td class="amt">${eur(r.p10)}</td>
    <td class="dur">${r.duree} mois</td><td class="amt">${eur(r.p20)}</td>
    <td class="dur">${r.duree} mois</td><td class="amt">${eur(r.p30)}</td></tr>`;
  pages.push(`
    <div class="page">
      <div class="header"><div class="logo">TECHNOGYM</div>${metaBlock(d)}</div>
      <hr class="rule"><div class="accent"></div>
      <h1>Simulation de financement</h1>${sub}
      <p class="fin-intro">Estimation des loyers mensuels pour le financement du projet. Deux formules — Crédit-bail et Location — sur des durées de 24 à 60 mois, avec ou sans premier loyer majoré. Loyers HT, en euros.</p>
      <div class="fin-amount">
        <div class="fin-box"><div class="k">Client</div><div class="v">${d.client}</div></div>
        <div class="fin-box"><div class="k">Fournisseur</div><div class="v">Technogym</div></div>
        <div class="fin-box hl"><div class="k">Montant à financer (TTC)</div><div class="v">${eur(d.total_ttc)}</div></div>
      </div>
      <div class="fin-section-title">CRÉDIT-BAIL</div>
      <table class="fin"><thead>${head}</thead><tbody>${cb.map(frow).join("")}</tbody></table>
      <div class="fin-section-title">LOCATION</div>
      <table class="fin"><thead>${head}</thead><tbody>${loc.map(frow).join("")}</tbody></table>
      <p class="fin-note">Loyers mensuels HT, en euros. Premier loyer majoré le cas échéant. Document indicatif sans valeur contractuelle, sous réserve d'acceptation du dossier par l'organisme financier.</p>
      <div class="footer"><span>${FOOTER}</span><span class="pg"></span></div>
    </div>`);

  // pagination
  const total = pages.length;
  const body = pages.map((p, i) => p.replace('class="pg">', `class="pg">Page ${i + 1} / ${total}`)).join("\n");
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${STYLE}</style></head><body>${body}</body></html>`;
}

export { dataUri };
