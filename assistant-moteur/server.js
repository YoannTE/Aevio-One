import express from "express";
import multer from "multer";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { computeFinancement } from "./leasing.js";
import { extractDevis } from "./extract.js";
import { resolveAsset } from "./assets.js";
import { ficheHTML, dataUri } from "./fiche.js";
import { htmlToPdf } from "./pdf.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// CORS : autorise la page aevio-one.com a appeler ce moteur (origines via CORS_ORIGINS, separees par des virgules)
const ORIGINS = (process.env.CORS_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ORIGINS.length === 0 || (origin && ORIGINS.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Access-Code");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Protection par code d'acces : si FICHE_ACCESS_CODE est defini, il faut le fournir.
const ACCESS_CODE = process.env.FICHE_ACCESS_CODE || "";
function checkAccess(req, res, next) {
  if (!ACCESS_CODE) return next(); // pas de code configure (dev local) -> libre
  const given = req.headers["x-access-code"] || req.body?.code || "";
  if (given === ACCESS_CODE) return next();
  return res.status(401).json({ error: "Code d'accès incorrect." });
}

app.use(express.static(join(__dirname, "public")));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 40 * 1024 * 1024 } });

// Upload-only : 1 devis PDF + N screenshots 3D -> fiche projet PDF (tout automatique)
app.post("/api/fiche", upload.fields([{ name: "devis", maxCount: 1 }, { name: "plans", maxCount: 20 }]), checkAccess, async (req, res) => {
  try {
    const devisFile = req.files?.devis?.[0];
    if (!devisFile) return res.status(400).json({ error: "Devis PDF manquant." });

    // 1) Extraction du devis via Claude
    const d = await extractDevis(devisFile.buffer);
    if (!d.total_ttc) return res.status(422).json({ error: "Montant TTC introuvable dans le devis." });

    // 2) Visuels produits (par CODE / mots-cles)
    for (const p of d.produits) {
      const path = resolveAsset({ code: p.code, name: p.nom });
      p.img = path ? dataUri(path) : null;
    }

    // 3) Plans 3D uploades -> data URIs
    const plans = (req.files?.plans || []).map((f) =>
      `data:${f.mimetype};base64,${f.buffer.toString("base64")}`);

    // 4) Financement + 5) rendu PDF
    const fin = computeFinancement(d.total_ttc);
    const html = ficheHTML(d, plans, fin);
    const pdf = await htmlToPdf(html);

    const safe = (d.client || "fiche_projet").replace(/[^a-z0-9]+/gi, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safe}.pdf"`);
    res.send(pdf);
  } catch (e) {
    console.error(e);
    const msg = String(e?.message || e);
    if (msg.includes("ANTHROPIC_API_KEY") || msg.includes("authentication"))
      return res.status(500).json({ error: "Clé API Claude absente ou invalide (variable ANTHROPIC_API_KEY)." });
    res.status(500).json({ error: "Erreur lors de la génération : " + msg });
  }
});

const PORT = process.env.PORT || 4321;
app.listen(PORT, () => console.log(`Fiche projet app — http://localhost:${PORT}`));
