import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export interface PdfFileItem {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  pageCount: number;
  arrayBuffer: ArrayBuffer;
}

export interface PdfPageItem {
  pageNumber: number; // 1-indexed
  rotation: number; // 0, 90, 180, 270
  selected: boolean;
}

/**
 * Loads a PDF file and returns its page count and ArrayBuffer
 */
export async function inspectPdfFile(file: File): Promise<{ pageCount: number; arrayBuffer: ArrayBuffer }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  return { pageCount, arrayBuffer };
}

/**
 * Merges multiple PDF documents into a single PDF
 */
export async function mergePdfDocuments(pdfFiles: PdfFileItem[]): Promise<{ blob: Blob; blobUrl: string; pageCount: number; sizeBytes: number }> {
  if (pdfFiles.length === 0) {
    throw new Error('Please select at least one PDF file to merge.');
  }

  const mergedPdf = await PDFDocument.create();

  for (const pdfItem of pdfFiles) {
    const srcDoc = await PDFDocument.load(pdfItem.arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  const blob = new Blob([mergedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  return {
    blob,
    blobUrl,
    pageCount: mergedPdf.getPageCount(),
    sizeBytes: blob.size,
  };
}

/**
 * Splits a PDF document by extracting specific page indices (1-indexed)
 */
export async function extractPdfPages(
  sourceBuffer: ArrayBuffer,
  pageNumbers: number[]
): Promise<{ blob: Blob; blobUrl: string; pageCount: number; sizeBytes: number }> {
  if (pageNumbers.length === 0) {
    throw new Error('Please specify at least one page to extract.');
  }

  const srcDoc = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
  const totalAvailable = srcDoc.getPageCount();

  // Validate and zero-index
  const validZeroIndices = pageNumbers
    .filter((n) => n >= 1 && n <= totalAvailable)
    .map((n) => n - 1);

  if (validZeroIndices.length === 0) {
    throw new Error('None of the specified pages exist in the document.');
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, validZeroIndices);
  copiedPages.forEach((page) => newDoc.addPage(page));

  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  return {
    blob,
    blobUrl,
    pageCount: newDoc.getPageCount(),
    sizeBytes: blob.size,
  };
}

/**
 * Parses user range string like "1-3, 5, 8-10" into sorted unique page numbers
 */
export function parsePageRangeString(rangeStr: string, maxPages: number): number[] {
  const pagesSet = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(maxPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          pagesSet.add(p);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
        pagesSet.add(pageNum);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}

export interface EditPdfOptions {
  pageRotations: Record<number, number>; // pageIndex -> rotation angle
  removedPages: Set<number>; // pageIndices to exclude
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkColor?: string; // hex
  watermarkSize?: number;
  headerText?: string;
  footerText?: string;
  addPageNumbers?: boolean;
}

/**
 * Edits a PDF: reorders, removes, rotates, stamps watermarks and headers/footers
 */
export async function editPdfDocument(
  sourceBuffer: ArrayBuffer,
  options: EditPdfOptions
): Promise<{ blob: Blob; blobUrl: string; pageCount: number; sizeBytes: number }> {
  const srcDoc = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
  const total = srcDoc.getPageCount();

  // Determine active pages
  const activeIndices: number[] = [];
  for (let i = 0; i < total; i++) {
    if (!options.removedPages.has(i)) {
      activeIndices.push(i);
    }
  }

  if (activeIndices.length === 0) {
    throw new Error('Cannot export an empty PDF. Please keep at least one page.');
  }

  const newDoc = await PDFDocument.create();
  const font = await newDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await newDoc.embedFont(StandardFonts.HelveticaBold);

  const copiedPages = await newDoc.copyPages(srcDoc, activeIndices);

  for (let i = 0; i < copiedPages.length; i++) {
    const page = copiedPages[i];
    const originalIndex = activeIndices[i];

    // Apply rotation
    const rotationDelta = options.pageRotations[originalIndex] || 0;
    if (rotationDelta !== 0) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + rotationDelta) % 360));
    }

    const { width, height } = page.getSize();

    // Draw Watermark
    if (options.watermarkText && options.watermarkText.trim()) {
      const watermarkSize = options.watermarkSize || 42;
      const opacity = options.watermarkOpacity !== undefined ? options.watermarkOpacity : 0.22;
      const textWidth = boldFont.widthOfTextAtSize(options.watermarkText, watermarkSize);

      page.drawText(options.watermarkText, {
        x: (width - textWidth) / 2 + 30,
        y: height / 2 - 20,
        size: watermarkSize,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.35),
        opacity,
        rotate: degrees(45),
      });
    }

    // Draw Header
    if (options.headerText && options.headerText.trim()) {
      page.drawText(options.headerText.trim(), {
        x: 36,
        y: height - 28,
        size: 9,
        font,
        color: rgb(0.4, 0.45, 0.5),
      });
    }

    // Draw Footer / Page Numbers
    const hasFooter = options.footerText && options.footerText.trim();
    const hasNumber = options.addPageNumbers;

    if (hasFooter) {
      page.drawText(options.footerText!.trim(), {
        x: 36,
        y: 24,
        size: 9,
        font,
        color: rgb(0.4, 0.45, 0.5),
      });
    }

    if (hasNumber) {
      const pageStr = `Page ${i + 1} of ${copiedPages.length}`;
      const numWidth = font.widthOfTextAtSize(pageStr, 9);
      page.drawText(pageStr, {
        x: width - numWidth - 36,
        y: 24,
        size: 9,
        font,
        color: rgb(0.4, 0.45, 0.5),
      });
    }

    newDoc.addPage(page);
  }

  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  return {
    blob,
    blobUrl,
    pageCount: newDoc.getPageCount(),
    sizeBytes: blob.size,
  };
}
