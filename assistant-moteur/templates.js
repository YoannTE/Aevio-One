// Generation du HTML de la page "Simulation de financement" (style fiche projet).
import { eur } from "./leasing.js";

export function financementHTML({ client, devis, code, ttc, fin }) {
  const cb = fin.creditBail, loc = fin.location, p = fin.premiers;
  const row = (r) => `
    <tr>
      <td class="dur">${r.dureeSans} mois</td><td class="amt">${eur(r.sans)}</td>
      <td class="dur">${r.duree} mois</td><td class="amt">${eur(r.p10)}</td>
      <td class="dur">${r.duree} mois</td><td class="amt">${eur(r.p20)}</td>
      <td class="dur">${r.duree} mois</td><td class="amt">${eur(r.p30)}</td>
    </tr>`;
  const head = `
    <tr>
      <th colspan="2">Sans premier loyer</th>
      <th class="grp" colspan="2">1<sup>er</sup> loyer de 10 % (${eur(p[10])})</th>
      <th colspan="2">1<sup>er</sup> loyer de 20 % (${eur(p[20])})</th>
      <th class="grp" colspan="2">1<sup>er</sup> loyer de 30 % (${eur(p[30])})</th>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { font-family: Arial, Helvetica, sans-serif; color: #2b2b2b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; padding: 15mm 16mm 12mm; display: flex; flex-direction: column; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; }
  .logo { font-weight: 700; font-size: 18px; color: #1d1d1d; }
  .meta { text-align: right; font-size: 10.5px; color: #6b6b6b; line-height: 1.55; }
  .rule { border: none; border-top: 1px solid #e3e3e3; margin: 12px 0 16px; }
  .accent { width: 56px; height: 5px; background: #f4d000; border-radius: 2px; margin-bottom: 14px; }
  h1 { font-size: 26px; font-weight: 700; color: #1d1d1d; }
  .subtitle { font-size: 13px; color: #5a5a5a; margin-top: 5px; }
  .fin-intro { font-size: 12.4px; color: #555; line-height: 1.5; margin-top: 8px; }
  .fin-amount { margin-top: 16px; display: flex; gap: 14px; }
  .fin-box { flex: 1; border: 1px solid #e6e6e6; border-radius: 8px; padding: 12px 14px; }
  .fin-box .k { font-size: 10px; color: #9a9a9a; text-transform: uppercase; letter-spacing: .5px; }
  .fin-box .v { font-size: 16px; font-weight: 700; color: #1d1d1d; margin-top: 3px; }
  .fin-box.hl { background: #fdf8e3; border-color: #f0d873; }
  .fin-section-title { font-size: 12px; font-weight: 700; color: #1d1d1d; background: #f4d000; display: inline-block; padding: 3px 12px; border-radius: 3px; margin: 22px 0 8px; }
  table.fin { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  table.fin th { background: #1f3a5f; color: #fff; font-weight: 600; padding: 6px 4px; text-align: center; font-size: 9.5px; border: 1px solid #fff; }
  table.fin th.grp { background: #27496d; }
  table.fin td { padding: 5px 4px; border-bottom: 1px solid #eee; }
  table.fin td.dur { color: #888; text-align: left; padding-left: 8px; }
  table.fin td.amt { font-weight: 700; color: #1d1d1d; text-align: right; padding-right: 10px; }
  table.fin tr:nth-child(even) td { background: #fafbfc; }
  .fin-note { font-size: 9.5px; color: #aaa; margin-top: 12px; font-style: italic; line-height: 1.4; }
  .footer { margin-top: auto; padding-top: 14px; border-top: 1px solid #ececec; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; }
</style></head><body>
<div class="page">
  <div class="header">
    <div class="logo">TECHNOGYM</div>
    <div class="meta">Devis ${devis || "Q-XXXXXXXX"}<br>${(client || "[PROJET]").toUpperCase()}<br>Client ${code || "AC-XXXXXX"}</div>
  </div>
  <hr class="rule"><div class="accent"></div>
  <h1>Simulation de financement</h1>
  <div class="subtitle">Préparée pour ${client || "[CLIENT]"}</div>
  <p class="fin-intro">Estimation des loyers mensuels pour le financement du projet. Deux formules sont proposées — Crédit-bail et Location — sur des durées de 24 à 60 mois, avec ou sans premier loyer majoré. Loyers exprimés hors taxes, en euros.</p>
  <div class="fin-amount">
    <div class="fin-box"><div class="k">Client</div><div class="v">${client || "—"}</div></div>
    <div class="fin-box"><div class="k">Fournisseur</div><div class="v">Technogym</div></div>
    <div class="fin-box hl"><div class="k">Montant à financer (TTC)</div><div class="v">${eur(ttc)}</div></div>
  </div>
  <div class="fin-section-title">CRÉDIT-BAIL</div>
  <table class="fin"><thead>${head}</thead><tbody>${cb.map(row).join("")}</tbody></table>
  <div class="fin-section-title">LOCATION</div>
  <table class="fin"><thead>${head}</thead><tbody>${loc.map(row).join("")}</tbody></table>
  <p class="fin-note">Loyers mensuels exprimés hors taxes, en euros. Premier loyer majoré le cas échéant. Document indicatif sans valeur contractuelle, sous réserve d'acceptation du dossier par l'organisme financier.</p>
  <div class="footer">
    <span>Yoann VARLOUD · Solution Key Account Manager Hospitality &amp; Residential · yvarloud@technogym.com</span>
    <span>Financement</span>
  </div>
</div>
</body></html>`;
}
