import * as pdfjsLib from 'pdfjs-dist';
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

export interface ExtractedPageText {
  pageNumber: number;
  lines: string[];
  paragraphs: string[];
  wordCount: number;
}

export interface PdfToDocxResult {
  fileName: string;
  pdfSizeBytes: number;
  pageCount: number;
  totalWords: number;
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
}

/**
 * Extracts structured text, lines, and paragraphs from all pages of a PDF using pdfjs-dist
 */
export async function extractTextFromPdf(
  file: File
): Promise<PdfToDocxResult> {
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages: ExtractedPageText[] = [];
  let totalWords = 0;

  for (let p = 1; p <= numPages; p++) {
    const page = await pdfDoc.getPage(p);
    const textContent = await page.getTextContent();

    // Group items into lines based on Y coordinate
    interface TextItem {
      str: string;
      x: number;
      y: number;
      height: number;
    }

    const items: TextItem[] = [];
    for (const item of textContent.items) {
      if ('str' in item && typeof item.str === 'string' && item.str.trim()) {
        const x = item.transform[4];
        const y = item.transform[5];
        const height = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12;
        items.push({ str: item.str, x, y, height });
      }
    }

    // Sort items top-to-bottom (higher Y in PDF coordinate system means higher up on page)
    // Then left-to-right (lower X)
    items.sort((a, b) => {
      const yDiff = Math.abs(a.y - b.y);
      if (yDiff < 4) {
        return a.x - b.x;
      }
      return b.y - a.y;
    });

    // Merge items into lines
    const lineBuckets: string[] = [];
    let currentLineY: number | null = null;
    let currentLineText = '';

    for (const item of items) {
      if (currentLineY === null) {
        currentLineY = item.y;
        currentLineText = item.str;
      } else if (Math.abs(item.y - currentLineY) < 4.5) {
        // Same line
        currentLineText += (currentLineText.endsWith(' ') || item.str.startsWith(' ') ? '' : ' ') + item.str;
      } else {
        // New line
        if (currentLineText.trim()) {
          lineBuckets.push(currentLineText.trim());
        }
        currentLineY = item.y;
        currentLineText = item.str;
      }
    }
    if (currentLineText.trim()) {
      lineBuckets.push(currentLineText.trim());
    }

    // Group lines into paragraphs (heuristics: lines ending with punctuation or isolated short lines)
    const paragraphs: string[] = [];
    let tempPara = '';

    for (const line of lineBuckets) {
      if (!tempPara) {
        tempPara = line;
      } else {
        const isHeaderLike = line.length < 50 && !line.endsWith('.') && line.length > 3;
        const prevEndsWithPeriod = tempPara.endsWith('.') || tempPara.endsWith(':') || tempPara.endsWith('!');

        if (isHeaderLike || prevEndsWithPeriod) {
          paragraphs.push(tempPara);
          tempPara = line;
        } else {
          tempPara += ' ' + line;
        }
      }
    }
    if (tempPara) {
      paragraphs.push(tempPara);
    }

    const pageWords = paragraphs.reduce((acc, p) => acc + p.split(/\s+/).filter(Boolean).length, 0);
    totalWords += pageWords;

    pages.push({
      pageNumber: p,
      lines: lineBuckets,
      paragraphs,
      wordCount: pageWords,
    });
  }

  return {
    fileName: file.name,
    pdfSizeBytes: file.size,
    pageCount: numPages,
    totalWords,
    pages,
  };
}

/**
 * Builds a Microsoft Word (.docx) document from extracted PDF content
 */
export async function convertPdfToDocxBlob(
  extracted: PdfToDocxResult,
  config: PdfToDocxConfig
): Promise<{ docxBlob: Blob; docxBlobUrl: string; sizeBytes: number; fileName: string }> {
  const docxChildren: Paragraph[] = [];

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

    for (const paraText of page.paragraphs) {
      const isHeader =
        config.detectHeadings &&
        paraText.length < 65 &&
        !paraText.endsWith('.') &&
        paraText.length > 3;

      if (isHeader) {
        docxChildren.push(
          new Paragraph({
            text: paraText,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          })
        );
      } else {
        docxChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paraText,
                size: config.fontSizePt * 2, // docx uses half-points
              }),
            ],
            spacing: {
              after: 160,
              line: Math.round(config.lineSpacing * 240),
            },
          })
        );
      }
    }
  }

  // Fallback in case of empty document
  if (docxChildren.length === 0) {
    docxChildren.push(
      new Paragraph({
        children: [new TextRun('No text could be extracted from the source PDF.')],
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
