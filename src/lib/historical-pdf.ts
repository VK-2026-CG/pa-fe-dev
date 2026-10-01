/**
 * Historical Data PDF (S-P4-03 §D, ARVIJ-1450-SP02): draws a `PdfModel` with
 * pdfkit and encrypts it with the user's password (AES-256, `pdfVersion:
 * '1.7ext3'` = the Standard security handler R5/V5, `AESV3`) as the USER
 * password, a random OWNER password nobody keeps, and printing-only
 * permissions. pdfkit is loaded with a dynamic `import()` so it is a separate
 * chunk fetched on the first download and never grows the initial bundle.
 *
 * The password only ever flows into `createHistoricalPdf`'s `userPassword`; it
 * is not logged, stored or sent anywhere. Colours come from the DLS tokens
 * (CSS custom properties), fonts are the PDF standard Helvetica pair — nothing
 * raw is added to the design system.
 */
import { pageLabel, type PdfCell, type PdfModel, type PdfSection } from './historical-download';

const MARGIN = 40;
const ROW_H = 20;
const HEAD_H = 22;
const MONTH_COL_W = 70;
const CELL_PAD = 8;
const SECTION_GAP = 26;

/** A DLS colour token as the `#rrggbb` pdfkit needs. */
function token(name: string): string {
  const value = typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return /^#[0-9a-f]{3,8}$/i.test(value) ? value : '#000000';
}

/** 24 random bytes as hex — the OWNER password. Generated per file and discarded; no one ever needs it. */
function randomOwnerPassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function sectionHeight(section: PdfSection): number {
  return 24 + HEAD_H + section.rows.length * ROW_H + (section.total ? HEAD_H : 0) + SECTION_GAP;
}

export async function createHistoricalPdf(model: PdfModel, password: string): Promise<Blob> {
  const [{ PDFDocument, registerStdFonts }, helvetica, helveticaBold] = await Promise.all([
    import('pdfkit'),
    import('pdfkit/standard-fonts/Helvetica'),
    import('pdfkit/standard-fonts/HelveticaBold'),
  ]);
  registerStdFonts(helvetica.default, helveticaBold.default);

  const colors = {
    text: token('--color-text'),
    secondary: token('--color-text-secondary'),
    muted: token('--color-text-muted'),
    line: token('--color-border'),
    band: token('--color-bg'),
    success: token('--tone-success'),
    danger: token('--tone-danger'),
    neutral: token('--tone-muted'),
  };
  const toneColor = (cell: PdfCell): string => {
    switch (cell.tone) {
      case 'success': return colors.success;
      case 'danger': return colors.danger;
      case 'muted': return colors.neutral;
      default: return colors.text;
    }
  };

  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    bufferPages: true,
    info: { Title: model.title },
    userPassword: password,
    ownerPassword: randomOwnerPassword(),
    pdfVersion: '1.7ext3',
    permissions: { printing: 'highResolution' }, // print only: no copy, modify, annotate, fill, assemble
  });
  const chunks: Uint8Array[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const finished = new Promise<void>((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);
  });

  const contentW = doc.page.width - MARGIN * 2;
  const bottom = doc.page.height - MARGIN - 20; // keeps the footer clear

  /** One single-line text cell: never wraps, so it can never trigger pdfkit's automatic page break. */
  const cellText = (text: string, x: number, y: number, w: number, align: 'left' | 'center', bold: boolean, color: string, size: number) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).fillColor(color)
      .text(text, x + CELL_PAD, y + (ROW_H - size) / 2 - 1, { width: w - CELL_PAD * 2, align, lineBreak: false });
  };

  // — document header —
  doc.font('Helvetica-Bold').fontSize(20).fillColor(colors.text).text(model.title, MARGIN, MARGIN, { lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.secondary).text(model.scopeLabel, MARGIN, MARGIN + 28, { lineBreak: false });
  let y = MARGIN + 52;
  for (const [caption, value] of [
    [model.captions.businessLine, model.businessLineLabel],
    [model.captions.comparison, model.comparisonLabel],
  ] as const) {
    doc.font('Helvetica').fontSize(10).fillColor(colors.muted).text(caption, MARGIN, y, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.text).text(value, MARGIN + 90, y, { lineBreak: false });
    y += 16;
  }
  doc.font('Helvetica').fontSize(9).fillColor(colors.muted).text(model.asOf, MARGIN, y + 2, { lineBreak: false });
  doc.text(model.generatedOn, MARGIN + 150, y + 2, { lineBreak: false });
  y += 34;

  // — one section per metric —
  for (const section of model.sections) {
    if (y + sectionHeight(section) > bottom) {
      doc.addPage();
      y = MARGIN;
    }
    doc.font('Helvetica').fontSize(9).fillColor(colors.muted).text(model.captions.metric, MARGIN, y + 3, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(13).fillColor(colors.text).text(section.metricLabel, MARGIN + 50, y, { lineBreak: false });
    y += 24;

    const valueCols = section.headers.length - 1;
    const colW = [MONTH_COL_W, ...Array.from({ length: valueCols }, () => (contentW - MONTH_COL_W) / valueCols)];
    const xs = colW.map((_, i) => MARGIN + colW.slice(0, i).reduce((a, b) => a + b, 0));

    // header band
    doc.rect(MARGIN, y, contentW, HEAD_H).fillColor(colors.band).fill();
    section.headers.forEach((header, i) => {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.secondary)
        .text(header, xs[i]! + CELL_PAD, y + (HEAD_H - 8.5) / 2 - 1, { width: colW[i]! - CELL_PAD * 2, align: i === 0 ? 'left' : 'center', lineBreak: false });
    });
    y += HEAD_H;

    for (const row of section.rows) {
      row.forEach((cell, i) => cellText(cell.text, xs[i]!, y, colW[i]!, i === 0 ? 'left' : 'center', false, toneColor(cell), 9));
      y += ROW_H;
      doc.moveTo(MARGIN, y).lineTo(MARGIN + contentW, y).lineWidth(0.5).strokeColor(colors.line).stroke();
    }
    if (section.total) {
      doc.rect(MARGIN, y, contentW, HEAD_H).fillColor(colors.band).fill();
      section.total.forEach((cell, i) => {
        if (cell.text) cellText(cell.text, xs[i]!, y + 1, colW[i]!, i === 0 ? 'left' : 'center', true, cell.tone ? toneColor(cell) : colors.secondary, 9);
      });
      y += HEAD_H;
    }
    y += SECTION_GAP;
  }

  // — footer "Page n of N" on every page (needs the buffered pages to know N) —
  const { start, count } = doc.bufferedPageRange();
  for (let i = 0; i < count; i++) {
    doc.switchToPage(start + i);
    const margins = doc.page.margins;
    const savedBottom = margins.bottom;
    margins.bottom = 0; // writing below the bottom margin would otherwise add a page
    doc.font('Helvetica').fontSize(8).fillColor(colors.muted)
      .text(pageLabel(i + 1, count), MARGIN, doc.page.height - MARGIN + 6, { width: contentW, align: 'center', lineBreak: false });
    margins.bottom = savedBottom;
  }

  doc.end();
  await finished;
  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}
