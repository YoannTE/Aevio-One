// Extraction des donnees du devis Technogym via l'API Claude.
// Lit le PDF directement (vision/document) et renvoie un JSON structure :
// client, n° devis, code client, total TTC, et la liste des produits avec description marketing.
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // lit ANTHROPIC_API_KEY dans l'environnement

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    client: { type: "string", description: "Nom du client (ex. Novotel Monte Carlo)" },
    devis: { type: "string", description: "Numero de devis commencant par Q-" },
    code_client: { type: "string", description: "Code client commencant par AC-" },
    ville: { type: "string", description: "Ville du client si disponible, sinon vide" },
    gamme: { type: "string", description: "Gamme cardio principale (ex. Excite+ Live, Artis), sinon vide" },
    total_ttc: { type: "number", description: "Montant total TTC du devis, en euros (nombre, ex 57853.64)" },
    produits: {
      type: "array",
      description: "Tous les produits/equipements du devis (hors lignes livraison/installation/total).",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          nom: { type: "string", description: "Nom commercial du produit" },
          code: { type: "string", description: "Reference CODE exacte du produit" },
          quantite: { type: "integer", description: "Quantite" },
          categorie: { type: "string", enum: ["cardio", "musculation", "accessoires"], description: "Categorie" },
          specs: { type: "string", description: "Specs cles condensees (console, coloris, puissance, finition)" },
          description: { type: "string", description: "Description marketing en francais, 2-3 phrases, fidele aux specs du devis, ton premium hotellerie" },
        },
        required: ["nom", "code", "quantite", "categorie", "specs", "description"],
      },
    },
  },
  required: ["client", "devis", "code_client", "ville", "gamme", "total_ttc", "produits"],
};

const PROMPT = `Tu es l'assistant commercial de Yoann VARLOUD (Technogym, Key Account Hospitality & Residential).
On te fournit un DEVIS Technogym en PDF. Extrais fidelement :
- le nom du client, le numero de devis (Q-...), le code client (AC-...), la ville, la gamme cardio, le total TTC ;
- la liste de TOUS les equipements (ignore les lignes "Livraison & Installation", "Total", "TVA").
Pour chaque equipement : nom, CODE exact, quantite, categorie (cardio / musculation / accessoires), specs condensees, et une description marketing en francais (2-3 phrases, ton premium hotellerie, fidele aux specs du devis : console, coloris, puissance, finition...).
Regroupe les halteres (Dumbbell) en UNE seule entree "Haltères — set" avec la plage de poids dans le nom et la quantite totale de paires.
Reponds uniquement via l'outil de sortie structuree.`;

export async function extractDevis(pdfBuffer) {
  const b64 = pdfBuffer.toString("base64");
  const resp = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{
      role: "user",
      content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
        { type: "text", text: PROMPT },
      ],
    }],
  });
  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("Reponse API sans contenu texte.");
  return JSON.parse(textBlock.text);
}
