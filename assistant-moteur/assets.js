// Resolution des visuels produits.
// 1) par CODE exact (manifest), 2) sinon par mots-cles du nom produit.
// Les visuels vivent dans le dossier Technogym/Projet/_assets (partage avec les fiches faites a la main).

import { fileURLToPath } from "node:url";
import { dirname, join as pathjoin } from "node:path";
// Visuels embarques dans l'app (dossier ./assets), pour qu'ils partent avec le deploiement.
const __dir = dirname(fileURLToPath(import.meta.url));
export const ASSET_DIR = process.env.ASSET_DIR || pathjoin(__dir, "assets");

// CODE produit -> fichier image
const BY_CODE = {
  // Cardio Excite+ Live (Novotel)
  "DFKDAQ5T0AA0AAX1": "run.png",
  "DFCD3Q5T0AAAAAX1": "bike.png",
  "DFED3Q5T0AA0AAX2": "climb.png",
  "DFHD3Q5T0AA0AAX1": "synchro.png",
  // Musculation / charges libres
  "MB430N0-AN00GGBP": "dap.png",
  "PA04-ANV0GG": "bench.png",
  "A0001521-NB": "dbrack.png",
  "GB04-NRGM": "dumbbells.png", "GB06-NRGM": "dumbbells.png", "GB08-NRGM": "dumbbells.png",
  "GB10-NRGM": "dumbbells.png", "GB12-NRGM": "dumbbells.png", "GB14-NRGM": "dumbbells.png",
  // Accessoires
  "A0000550": "powerpack.png",
  "A0001855-KG": "skilltools.png",
  "A0001014-U": "storage.png",
};

// Mots-cles (dans le nom produit, en minuscules) -> fichier image. Ordre = priorite.
const BY_KEYWORD = [
  [["climb"], "climb.png"],
  [["synchro", "elliptique", "elliptical"], "synchro.png"],
  [["recline", "semi-allong"], "roc_recline.png"],
  [["bike", "vélo vertical", "velo vertical"], "bike.png"],
  [["air bike", "airbike"], "roc_airbike.png"],
  [["group cycle", "indoor cycling"], "roc_groupcycle.png"],
  [["skillrow", "rameur", "rower"], "skillrow.png"],
  [["run", "tapis", "treadmill"], "run.png"],
  [["dual adjustable pulley", "poulie"], "dap.png"],
  [["power pack", "powerpack"], "powerpack.png"],
  [["skilltools", "skill tools"], "skilltools.png"],
  [["storage", "rangement"], "storage.png"],
  [["dumbbell", "haltère", "haltere"], "dumbbells.png"],
  [["rack"], "dbrack.png"],
  [["bench", "banc"], "bench.png"],
];

import { join } from "node:path";
import { existsSync } from "node:fs";

// Retourne le chemin absolu du visuel pour un produit, ou null si introuvable.
export function resolveAsset({ code, name }) {
  const tryFile = (f) => {
    if (!f) return null;
    const p = join(ASSET_DIR, f);
    return existsSync(p) ? p : null;
  };
  // 1) code exact
  if (code && BY_CODE[code]) {
    const p = tryFile(BY_CODE[code]);
    if (p) return p;
  }
  // 2) code prefixe (ex. GB04-NRGM matche GB04)
  if (code) {
    const hit = Object.keys(BY_CODE).find((k) => code.startsWith(k) || k.startsWith(code));
    if (hit) { const p = tryFile(BY_CODE[hit]); if (p) return p; }
  }
  // 3) mots-cles du nom
  const n = (name || "").toLowerCase();
  for (const [words, file] of BY_KEYWORD) {
    if (words.some((w) => n.includes(w))) { const p = tryFile(file); if (p) return p; }
  }
  return null;
}
