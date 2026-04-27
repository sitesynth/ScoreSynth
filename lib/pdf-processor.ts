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
  const FOOTER_H  = 22;  // pt
  const TEXT_SIZE = 7;   // pt
  const PAD_X     = 10;  // pt left padding

  const { downloaderHandle, uploaderHandle } = options;

  const pdfDoc = await PDFDocument.load(pdfArrayBuffer, { ignoreEncryption: true });
  const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const label = `scoresynth.com  ·  For non-commercial use only  ·  Downloaded by @${downloaderHandle}  ·  Uploaded by @${uploaderHandle}`;

  for (const page of pdfDoc.getPages()) {
    const { width } = page.getSize();

    // Dark footer bar
    page.drawRectangle({
      x: 0, y: 0,
      width,
      height: FOOTER_H,
      color: DARK,
    });

    // Centered text vertically in the bar
    const textY = (FOOTER_H - TEXT_SIZE) / 2;

    page.drawText(label, {
      x:    PAD_X,
      y:    textY,
      size: TEXT_SIZE,
      font,
      color: WHITE,
    });
  }

  const bytes = await pdfDoc.save();
  return toPdfBlob(bytes);
}
