// Rendu HTML -> PDF via Chrome headless (Chrome est deja installe sur le Mac).
import { execFile } from "node:child_process";
import { writeFile, readFile, rm, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
// Mac en local par defaut ; surchargeable via CHROME_PATH (ex. /usr/bin/chromium sur le serveur Linux).
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export async function htmlToPdf(html) {
  const dir = await mkdtemp(join(tmpdir(), "fiche-"));
  const htmlPath = join(dir, "doc.html");
  const pdfPath = join(dir, "doc.pdf");
  try {
    await writeFile(htmlPath, html, "utf8");
    await execFileP(CHROME, [
      "--headless", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
      "--no-pdf-header-footer", `--print-to-pdf=${pdfPath}`, htmlPath,
    ], { maxBuffer: 64 * 1024 * 1024 });
    return await readFile(pdfPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
