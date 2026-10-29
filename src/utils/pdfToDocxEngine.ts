import * as pdfjsLib from 'pdfjs-dist';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

export interface StyledRun {
  text: string;
  fontSizePt: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
}

export interface StyledParagraph {
  runs: StyledRun[];
  alignment: 'left' | 'center' | 'right';
  isHeading: boolean;
  headingLevel?: 1 | 2 | 3;
  spacingBefore: number;
  spacingAfter: number;
}

export interface ExtractedPageText {
  pageNumber: number;
  lines: string[];
  paragraphs: string[];
  styledParagraphs: StyledParagraph[];
  wordCount: number;
}

export interface PdfToDocxResult {
  fileName: string;
  pdfSizeBytes: number;
  pageCount: number;
  totalWords: number;
  detectedBodyFontSize: number;
  detectedPrimaryFont: string;
  pages: ExtractedPageText[];
  docxBlob?: Blob;
  docxBlobUrl?: string;
  docxSizeBytes?: number;
}

export interface PdfToDocxConfig {
  detectHeadings: boolean;
  preservePageBreaks: boolean;
  fontSizePt: number;
  lineSpacing: number;
  preserveOriginalFonts: boolean;
  preserveExactSizes: boolean;
}

/**
 * Resolves standard Microsoft Word font family from PDF font name and CSS font family string
 */
function resolveDocxFont(fontName: string, styleFamily: string): string {
  const combined = (fontName + ' ' + styleFamily).toLowerCase();
  if (
    combined.includes('times') ||
    combined.includes('roman') ||
    combined.includes('cambria') ||
    combined.includes('garamond') ||
    combined.includes('georgia') ||
    (combined.includes('serif') && !combined.includes('sans'))
  ) {
    if (combined.includes('georgia')) return 'Georgia';
    if (combined.includes('cambria')) return 'Cambria';
    if (combined.includes('garamond')) return 'Garamond';
    return 'Times New Roman';
  }
  if (combined.includes('courier') || combined.includes('consolas') || combined.includes('mono')) {
    if (combined.includes('consolas')) return 'Consolas';
    return 'Courier New';
  }
  if (combined.includes('arial') || combined.includes('helvetica')) {
    return 'Arial';
  }
  if (combined.includes('calibri')) {
    return 'Calibri';
  }
  if (combined.includes('verdana')) {
    return 'Verdana';
  }
  if (combined.includes('trebuchet')) {
    return 'Trebuchet MS';
  }
  if (combined.includes('tahoma')) {
    return 'Tahoma';
  }
  if (combined.includes('segoe')) {
    return 'Segoe UI';
  }
  return 'Calibri';
}

/**
 * Detects bold font weight from PDF font name descriptor
 */
function detectIsBold(fontName: string, styleFamily: string): boolean {
  const combined = (fontName + ' ' + styleFamily).toLowerCase();
  return (
    combined.includes('bold') ||
    combined.includes('black') ||
    combined.includes('heavy') ||
    combined.includes('semibold') ||
    combined.includes('demibold') ||
    combined.includes('bld') ||
    combined.includes('700') ||
    combined.includes('800') ||
    combined.includes('900') ||
    combined.includes('w7') ||
    combined.includes('w8') ||
    combined.includes('w9')
  );
}

/**
 * Detects italic font slant from PDF font name descriptor
 */
function detectIsItalic(fontName: string, styleFamily: string): boolean {
  const combined = (fontName + ' ' + styleFamily).toLowerCase();
  return (
    combined.includes('italic') ||
    combined.includes('oblique') ||
    combined.includes('ital') ||
    combined.includes('slanted') ||
    combined.includes('kursiv')
  );
}

interface RawExtractedItem {
  str: string;
  topY: number;
  x: number;
  width: number;
  height: number;
  fontSizePt: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
}

/**
 * Extracts high-fidelity structured text, typography, fonts, sizes, styles,
 * alignments, and paragraphs from all pages of a PDF using pdfjs-dist.
 */
export async function extractTextFromPdf(file: File): Promise<PdfToDocxResult> {
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages: ExtractedPageText[] = [];
  let totalWords = 0;

  const allFontSizes: number[] = [];
  const fontCounts: Record<string, number> = {};

  // Step 1: Pre-extract and parse items page by page
  for (let p = 1; p <= numPages; p++) {
    const page = await pdfDoc.getPage(p);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const rawItems: RawExtractedItem[] = [];

    for (const item of textContent.items) {
      if ('str' in item && typeof item.str === 'string' && item.str.length > 0) {
        const a = item.transform[0];
        const b = item.transform[1];
        const d = item.transform[3];
        const tx = item.transform[4];
        const ty = item.transform[5];

        const rawSize = Math.hypot(a, b) || Math.abs(d) || item.height || 11;
        const fontSizePt = Math.round(rawSize * 10) / 10;
        const topY = viewport.height - ty; // convert to top-down coordinate

        const style = textContent.styles ? textContent.styles[item.fontName] : undefined;
        const styleFamily = style?.fontFamily || '';
        const resolvedFont = resolveDocxFont(item.fontName, styleFamily);
        const bold = detectIsBold(item.fontName, styleFamily);
        const italic = detectIsItalic(item.fontName, styleFamily);

        rawItems.push({
          str: item.str,
          topY,
          x: tx,
          width: item.width || 0,
          height: item.height || fontSizePt,
          fontSizePt,
          fontFamily: resolvedFont,
          bold,
          italic,
        });

        if (item.str.trim()) {
          allFontSizes.push(fontSizePt);
          fontCounts[resolvedFont] = (fontCounts[resolvedFont] || 0) + 1;
        }
      }
    }

    // Sort items top-to-bottom, then left-to-right
    rawItems.sort((i1, i2) => {
      const yDiff = i1.topY - i2.topY;
      if (Math.abs(yDiff) <= 3.5) {
        return i1.x - i2.x;
      }
      return yDiff;
    });

    // Group items into visual lines
    interface LineGroup {
      topY: number;
      minX: number;
      maxX: number;
      height: number;
      items: RawExtractedItem[];
    }

    const lines: LineGroup[] = [];
    let currentLine: LineGroup | null = null;

    for (const item of rawItems) {
      if (!currentLine) {
        currentLine = {
          topY: item.topY,
          minX: item.x,
          maxX: item.x + item.width,
          height: item.height,
          items: [item],
        };
      } else if (Math.abs(item.topY - currentLine.topY) <= 3.8) {
        currentLine.items.push(item);
        currentLine.maxX = Math.max(currentLine.maxX, item.x + item.width);
        currentLine.height = Math.max(currentLine.height, item.height);
      } else {
        lines.push(currentLine);
        currentLine = {
          topY: item.topY,
          minX: item.x,
          maxX: item.x + item.width,
          height: item.height,
          items: [item],
        };
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    // Assemble lines into styled runs with spacing heuristics
    interface ProcessedLine {
      runs: StyledRun[];
      topY: number;
      minX: number;
      maxX: number;
      height: number;
      fullText: string;
      alignment: 'left' | 'center' | 'right';
      avgFontSize: number;
      isBold: boolean;
    }

    const processedLines: ProcessedLine[] = [];

    for (const line of lines) {
      line.items.sort((a, b) => a.x - b.x);

      const assembledRuns: StyledRun[] = [];
      let prevEnd = -1;

      for (const item of line.items) {
        let textToAdd = item.str;

        // If there's a space gap between items on the same line, ensure space
        if (prevEnd > 0 && item.x - prevEnd > 2.5 && !textToAdd.startsWith(' ')) {
          textToAdd = ' ' + textToAdd;
        }

        prevEnd = item.x + item.width;

        // Merge with previous run if same font style
        const lastRun = assembledRuns[assembledRuns.length - 1];
        if (
          lastRun &&
          lastRun.fontFamily === item.fontFamily &&
          Math.abs(lastRun.fontSizePt - item.fontSizePt) < 0.5 &&
          lastRun.bold === item.bold &&
          lastRun.italic === item.italic
        ) {
          lastRun.text += textToAdd;
        } else {
          assembledRuns.push({
            text: textToAdd,
            fontSizePt: item.fontSizePt,
            fontFamily: item.fontFamily,
            bold: item.bold,
            italic: item.italic,
          });
        }
      }

      const fullText = assembledRuns.map((r) => r.text).join('').trim();
      if (!fullText) continue;

      // Determine text alignment based on horizontal bounds relative to page viewport
      const lineWidth = line.maxX - line.minX;
      let alignment: 'left' | 'center' | 'right' = 'left';
      const leftMargin = line.minX;
      const rightMargin = viewport.width - line.maxX;

      if (lineWidth < viewport.width * 0.72) {
        if (Math.abs(leftMargin - rightMargin) < 28 && leftMargin > 40) {
          alignment = 'center';
        } else if (rightMargin < 72 && leftMargin > rightMargin + 50) {
          alignment = 'right';
        }
      }

      const avgFontSize =
        assembledRuns.reduce((acc, r) => acc + r.fontSizePt, 0) / assembledRuns.length;
      const isBold = assembledRuns.every((r) => r.bold);

      processedLines.push({
        runs: assembledRuns,
        topY: line.topY,
        minX: line.minX,
        maxX: line.maxX,
        height: line.height,
        fullText,
        alignment,
        avgFontSize,
        isBold,
      });
    }

    // Now group lines into structured paragraphs with heading and spacing detection
    const styledParagraphs: StyledParagraph[] = [];
    const plainParagraphs: string[] = [];
    const lineBuckets: string[] = [];

    let currentParaRuns: StyledRun[] = [];
    let currentParaAlignment: 'left' | 'center' | 'right' = 'left';
    let currentParaIsHeading = false;
    let currentParaHeadingLevel: 1 | 2 | 3 | undefined;
    let currentParaSpacingBefore = 0;
    let prevLineBottom = -1;

    const flushCurrentParagraph = () => {
      if (currentParaRuns.length === 0) return;
      const pText = currentParaRuns.map((r) => r.text).join('').trim();
      if (pText) {
        plainParagraphs.push(pText);
        styledParagraphs.push({
          runs: [...currentParaRuns],
          alignment: currentParaAlignment,
          isHeading: currentParaIsHeading,
          headingLevel: currentParaHeadingLevel,
          spacingBefore: currentParaSpacingBefore,
          spacingAfter: currentParaIsHeading ? 8 : 4,
        });
      }
      currentParaRuns = [];
      currentParaIsHeading = false;
      currentParaHeadingLevel = undefined;
      currentParaSpacingBefore = 0;
    };

    for (let i = 0; i < processedLines.length; i++) {
      const line = processedLines[i];
      lineBuckets.push(line.fullText);

      // Determine if line qualifies as a heading
      const isHeaderLike =
        line.avgFontSize >= 14 ||
        (line.isBold && line.fullText.length < 80 && !line.fullText.endsWith('.')) ||
        (line.avgFontSize >= 12.5 && line.fullText.length < 65 && !line.fullText.endsWith('.'));

      let headingLvl: 1 | 2 | 3 | undefined;
      if (isHeaderLike) {
        if (line.avgFontSize >= 18) headingLvl = 1;
        else if (line.avgFontSize >= 14) headingLvl = 2;
        else headingLvl = 3;
      }

      const verticalGap = prevLineBottom > 0 ? line.topY - prevLineBottom : 0;
      const hasSignificantGap = verticalGap > line.height * 1.5;
      const alignmentChanged = currentParaRuns.length > 0 && line.alignment !== currentParaAlignment;

      if (isHeaderLike || currentParaIsHeading || hasSignificantGap || alignmentChanged) {
        flushCurrentParagraph();
        currentParaAlignment = line.alignment;
        currentParaIsHeading = isHeaderLike;
        currentParaHeadingLevel = headingLvl;
        currentParaSpacingBefore = hasSignificantGap ? 12 : isHeaderLike ? 14 : 4;
        currentParaRuns.push(...line.runs);
      } else {
        if (currentParaRuns.length === 0) {
          currentParaAlignment = line.alignment;
        } else {
          // Append space between lines inside the same paragraph if needed
          const last = currentParaRuns[currentParaRuns.length - 1];
          if (last && !last.text.endsWith(' ') && !line.runs[0]?.text.startsWith(' ')) {
            last.text += ' ';
          }
        }
        currentParaRuns.push(...line.runs);
      }

      prevLineBottom = line.topY + line.height;
    }
    flushCurrentParagraph();

    const pageWords = plainParagraphs.reduce(
      (acc, p) => acc + p.split(/\s+/).filter(Boolean).length,
      0
    );
    totalWords += pageWords;

    pages.push({
      pageNumber: p,
      lines: lineBuckets,
      paragraphs: plainParagraphs,
      styledParagraphs,
      wordCount: pageWords,
    });
  }

  // Calculate most common body font size and font name
  const detectedBodyFontSize =
    allFontSizes.length > 0
      ? getModeNumber(allFontSizes)
      : 11;

  let maxFontCount = 0;
  let detectedPrimaryFont = 'Calibri';
  for (const [font, count] of Object.entries(fontCounts)) {
    if (count > maxFontCount) {
      maxFontCount = count;
      detectedPrimaryFont = font;
    }
  }

  return {
    fileName: file.name,
    pdfSizeBytes: file.size,
    pageCount: numPages,
    totalWords,
    detectedBodyFontSize,
    detectedPrimaryFont,
    pages,
  };
}

/**
 * Calculates statistical mode of number array
 */
function getModeNumber(arr: number[]): number {
  const counts: Record<number, number> = {};
  let maxNum = arr[0] || 11;
  let maxCount = 0;
  for (const n of arr) {
    const rounded = Math.round(n * 2) / 2;
    counts[rounded] = (counts[rounded] || 0) + 1;
    if (counts[rounded] > maxCount) {
      maxCount = counts[rounded];
      maxNum = rounded;
    }
  }
  return maxNum;
}

/**
 * Converts extracted high-fidelity PDF data to a native Microsoft Word (.docx) document
 * with exact font names, font sizes, weights (bold), styles (italic), alignments,
 * spacing, and headings preserved.
 */
export async function convertPdfToDocxBlob(
  extracted: PdfToDocxResult,
  config: PdfToDocxConfig
): Promise<{ docxBlob: Blob; docxBlobUrl: string; sizeBytes: number; fileName: string }> {
  const docxChildren: Paragraph[] = [];

  const baseFont = config.preserveOriginalFonts
    ? extracted.detectedPrimaryFont || 'Calibri'
    : 'Calibri';

  for (let pIdx = 0; pIdx < extracted.pages.length; pIdx++) {
    const page = extracted.pages[pIdx];

    // Optional Page break before subsequent pages
    if (config.preservePageBreaks && pIdx > 0) {
      docxChildren.push(
        new Paragraph({
          children: [new TextRun({ break: 1 })],
          pageBreakBefore: true,
        })
      );
    }

    for (const para of page.styledParagraphs) {
      // Map alignment to docx AlignmentType
      let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;
      if (para.alignment === 'center') alignment = AlignmentType.CENTER;
      if (para.alignment === 'right') alignment = AlignmentType.RIGHT;

      // Map heading level
      let heading: (typeof HeadingLevel)[keyof typeof HeadingLevel] | undefined = undefined;
      if (config.detectHeadings && para.isHeading) {
        if (para.headingLevel === 1) heading = HeadingLevel.HEADING_1;
        else if (para.headingLevel === 2) heading = HeadingLevel.HEADING_2;
        else heading = HeadingLevel.HEADING_3;
      }

      // Build TextRuns preserving exact font family, size, bold, italic
      const runs = para.runs.map((r) => {
        const fontName = config.preserveOriginalFonts ? r.fontFamily : baseFont;
        // docx uses half-points: 11pt = 22, 12pt = 24
        const fontSizeHalfPts = config.preserveExactSizes
          ? Math.max(14, Math.round(r.fontSizePt * 2))
          : Math.round(config.fontSizePt * 2);

        return new TextRun({
          text: r.text,
          font: fontName,
          size: fontSizeHalfPts,
          bold: r.bold,
          italics: r.italic,
        });
      });

      docxChildren.push(
        new Paragraph({
          alignment,
          heading,
          spacing: {
            before: Math.round(para.spacingBefore * 20),
            after: Math.round(para.spacingAfter * 20),
            line: Math.round(config.lineSpacing * 240),
          },
          children: runs.length > 0 ? runs : [new TextRun('')],
        })
      );
    }
  }

  // Fallback in case of empty document
  if (docxChildren.length === 0) {
    docxChildren.push(
      new Paragraph({
        children: [new TextRun('No selectable text could be extracted from the source PDF.')],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docxChildren,
      },
    ],
  });

  const docxBlob = await Packer.toBlob(doc);
  const docxBlobUrl = URL.createObjectURL(docxBlob);
  const outputDocxName = extracted.fileName.replace(/\.pdf$/i, '') + '.docx';

  return {
    docxBlob,
    docxBlobUrl,
    sizeBytes: docxBlob.size,
    fileName: outputDocxName,
  };
}
