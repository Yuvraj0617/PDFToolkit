import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Ensure PDF.js worker is properly configured
try {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('PDF.js worker setup warning:', e);
}

export type CompressionPreset = 'balanced' | 'extreme' | 'gentle' | 'lossless' | 'custom';

export interface CompressionOptions {
  preset: CompressionPreset;
  // Used if preset === 'custom' or internally mapped
  dpi: number;
  quality: number; // 0.1 to 1.0
  grayscale: boolean;
}

export interface CompressPdfResult {
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savingsBytes: number;
  savingsPercent: number;
  pageCount: number;
  blob: Blob;
  blobUrl: string;
  fileName: string;
  appliedPreset: CompressionPreset;
  isAlreadyCompact: boolean;
}

export const PRESET_CONFIGS: Record<
  Exclude<CompressionPreset, 'custom'>,
  { label: string; description: string; dpi: number; quality: number; estimatedSavings: string }
> = {
  balanced: {
    label: 'Balanced (Recommended)',
    description: 'Crisp readability and sharp graphics with significant size reduction.',
    dpi: 144,
    quality: 0.74,
    estimatedSavings: '~40% – 65% reduction',
  },
  extreme: {
    label: 'Extreme Compression',
    description: 'Smallest possible file size for strict portal limits and email attachments.',
    dpi: 96,
    quality: 0.58,
    estimatedSavings: '~65% – 85% reduction',
  },
  gentle: {
    label: 'Gentle (High Quality)',
    description: 'Highest visual fidelity and print-grade resolution with light compression.',
    dpi: 180,
    quality: 0.86,
    estimatedSavings: '~20% – 40% reduction',
  },
  lossless: {
    label: 'Lossless Structural',
    description: 'Packs object streams & cleans unreferenced data without rasterizing text.',
    dpi: 72,
    quality: 1.0,
    estimatedSavings: '~5% – 25% reduction',
  },
};

/**
 * Inspects a PDF file and returns its page count, size, and ArrayBuffer
 */
export async function inspectPdfForCompression(
  file: File
): Promise<{ pageCount: number; sizeBytes: number; arrayBuffer: ArrayBuffer }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  return { pageCount, sizeBytes: file.size, arrayBuffer };
}

/**
 * Compresses a PDF client-side using adaptive canvas re-encoding or lossless stream packing
 */
export async function compressPdfDocument(
  sourceBuffer: ArrayBuffer,
  originalFileName: string,
  options: CompressionOptions,
  onProgress?: (current: number, total: number, phase: string) => void
): Promise<CompressPdfResult> {
  const originalSizeBytes = sourceBuffer.byteLength;

  // Mode 1: Lossless structural compression with pdf-lib object stream packing
  if (options.preset === 'lossless') {
    onProgress?.(1, 1, 'Optimizing PDF object streams...');
    const srcDoc = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
    const compressedBytes = await srcDoc.save({ useObjectStreams: true });
    const compressedSizeBytes = compressedBytes.byteLength;

    const savingsBytes = Math.max(0, originalSizeBytes - compressedSizeBytes);
    const savingsPercent =
      originalSizeBytes > 0 ? (savingsBytes / originalSizeBytes) * 100 : 0;

    const blob = new Blob([compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    const baseName = originalFileName.replace(/\.pdf$/i, '');

    return {
      originalSizeBytes,
      compressedSizeBytes,
      savingsBytes,
      savingsPercent: Number(savingsPercent.toFixed(1)),
      pageCount: srcDoc.getPageCount(),
      blob,
      blobUrl,
      fileName: `${baseName}-compressed.pdf`,
      appliedPreset: 'lossless',
      isAlreadyCompact: compressedSizeBytes >= originalSizeBytes,
    };
  }

  // Mode 2: Visual adaptive compression (re-encoding pages with high-DPI canvas & JPEG packing)
  let targetDpi = options.dpi;
  let targetQuality = options.quality;

  if (options.preset !== 'custom') {
    const config = PRESET_CONFIGS[options.preset];
    targetDpi = config.dpi;
    targetQuality = config.quality;
  }

  // Load PDF with pdfjs-dist
  onProgress?.(0, 1, 'Analyzing document pages...');
  const loadingTask = pdfjsLib.getDocument({
    data: sourceBuffer.slice(0),
    useSystemFonts: true,
  });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const newPdf = await PDFDocument.create();

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.(
      pageNum,
      numPages,
      `Compressing page ${pageNum} of ${numPages}...`
    );

    const page = await pdfDoc.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const pointWidth = unscaledViewport.width;
    const pointHeight = unscaledViewport.height;

    // Scale calculation based on target DPI (Standard PDF is 72 pt/inch)
    const scale = Math.max(1.0, targetDpi / 72);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error(`Failed to initialize canvas context for page ${pageNum}`);
    }

    // Fill white background for clean rendering
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the page
    const renderContext = {
      canvasContext: ctx,
      viewport,
      canvas,
    };
    await page.render(renderContext).promise;

    // Optional Grayscale conversion
    if (options.grayscale) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Luminance formula
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // Convert canvas to optimized JPEG Data URL
    const jpegDataUrl = canvas.toDataURL('image/jpeg', targetQuality);

    // Embed in new PDF preserving the original point dimensions
    const embeddedJpg = await newPdf.embedJpg(jpegDataUrl);
    const newPage = newPdf.addPage([pointWidth, pointHeight]);
    newPage.drawImage(embeddedJpg, {
      x: 0,
      y: 0,
      width: pointWidth,
      height: pointHeight,
    });
  }

  onProgress?.(numPages, numPages, 'Packaging optimized PDF streams...');
  const compressedBytes = await newPdf.save({ useObjectStreams: true });
  let compressedSizeBytes = compressedBytes.byteLength;
  let finalBlob = new Blob([compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  let isAlreadyCompact = false;

  // Safety guard: If rasterizing accidentally inflated a tiny vector-only PDF, fall back to lossless stream
  if (compressedSizeBytes >= originalSizeBytes) {
    try {
      const fallbackDoc = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
      const fallbackBytes = await fallbackDoc.save({ useObjectStreams: true });
      if (fallbackBytes.byteLength < compressedSizeBytes) {
        compressedSizeBytes = fallbackBytes.byteLength;
        finalBlob = new Blob([fallbackBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      }
      isAlreadyCompact = compressedSizeBytes >= originalSizeBytes;
    } catch {
      // Keep rasterized version
    }
  }

  const savingsBytes = Math.max(0, originalSizeBytes - compressedSizeBytes);
  const savingsPercent =
    originalSizeBytes > 0 ? (savingsBytes / originalSizeBytes) * 100 : 0;
  const blobUrl = URL.createObjectURL(finalBlob);
  const baseName = originalFileName.replace(/\.pdf$/i, '');

  return {
    originalSizeBytes,
    compressedSizeBytes,
    savingsBytes,
    savingsPercent: Number(savingsPercent.toFixed(1)),
    pageCount: numPages,
    blob: finalBlob,
    blobUrl,
    fileName: `${baseName}-compressed.pdf`,
    appliedPreset: options.preset,
    isAlreadyCompact,
  };
}
