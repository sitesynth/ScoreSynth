import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const WHITE = rgb(1, 1, 1);

function toPdfBlob(bytes: Uint8Array): Blob {
  const copied = new Uint8Array(bytes.length);
  copied.set(bytes);
  return new Blob([copied], { type: "application/pdf" });
}

// ── Upload: strip metadata only, NO visual stamp ──────────────────────────────
/**
 * Strips original metadata and sets ScoreSynth metadata.
 * Does NOT add any visual stamp — that happens at download time.
 */
export async function processPdfForUpload(
  file: File,
  scoreTitle: string
): Promise<Blob> {
  const sourceBytes = await file.arrayBuffer();
  const sourcePdf   = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const finalDoc    = await PDFDocument.create();

  finalDoc.setTitle(scoreTitle);
  finalDoc.setAuthor("ScoreSynth");
  finalDoc.setSubject("Sheet Music");
  finalDoc.setKeywords(["sheet music", "scoresynth", "scoresynth.com", "ss-clean"]);
  finalDoc.setCreator("ScoreSynth");

  const indices = Array.from({ length: sourcePdf.getPageCount() }, (_, i) => i);
  const copied  = await finalDoc.copyPages(sourcePdf, indices);
  for (const p of copied) finalDoc.addPage(p);

  const bytes = await finalDoc.save();
  return toPdfBlob(bytes);
}

// ── Download: add full-width footer bar to every page ────────────────────────
/**
 * Adds a dark footer bar (full page width) at the bottom of every page.
 * Shows: scoresynth.com · For non-commercial use only · Downloaded by @user · Uploaded by @author
 */
export async function stampPdfForDownload(
  pdfArrayBuffer: ArrayBuffer,
  options: { downloaderHandle: string; uploaderHandle: string }
): Promise<Blob> {
  const DARK      = rgb(33 / 255, 24 / 255, 23 / 255); // #211817
  const FOOTER_H  = 26;  // pt — slightly taller
  const TEXT_SIZE = 7;   // pt
  const PAD_X     = 8;   // pt
  const LOGO_SIZE = 16;  // pt — logo square size

  const { downloaderHandle, uploaderHandle } = options;

  const pdfDoc = await PDFDocument.load(pdfArrayBuffer, { ignoreEncryption: true });
  const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Try to load the real ScoreSynth logo
  let logoImage = null;
  try {
    const res = await fetch("/icon-48.png");
    if (res.ok) {
      const bytes = await res.arrayBuffer();
      logoImage = await pdfDoc.embedPng(bytes);
    }
  } catch { /* fallback: no logo */ }

  const label = `scoresynth.com  ·  For non-commercial use only  ·  Downloaded by @${downloaderHandle}  ·  Uploaded by @${uploaderHandle}`;

  for (const page of pdfDoc.getPages()) {
    const { width } = page.getSize();

    // Semi-transparent dark footer bar (50% opacity)
    page.drawRectangle({
      x: 0, y: 0, width, height: FOOTER_H,
      color: DARK, opacity: 0.5,
    });

    const centerY = FOOTER_H / 2;

    // Real logo
    if (logoImage) {
      page.drawImage(logoImage, {
        x:      PAD_X,
        y:      centerY - LOGO_SIZE / 2,
        width:  LOGO_SIZE,
        height: LOGO_SIZE,
        opacity: 1,
      });
    }

    // Footer text
    const textX = PAD_X + (logoImage ? LOGO_SIZE + 5 : 0);
    const textY = centerY - TEXT_SIZE / 2;
    page.drawText(label, {
      x: textX, y: textY,
      size: TEXT_SIZE, font, color: WHITE, opacity: 1,
    });
  }

  const bytes = await pdfDoc.save();
  return toPdfBlob(bytes);
}
