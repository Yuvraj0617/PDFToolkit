import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Ensure PDF.js worker is initialized
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker initialization:', e);
}

export type ImageFormat = 'png' | 'jpeg' | 'webp';

export interface ImageExportOptions {
  format: ImageFormat;
  scale: number; // e.g. 1.0 (72dpi), 1.5 (110dpi), 2.0 (144dpi), 3.0 (216dpi), 4.0 (300dpi)
  quality: number; // 0.1 to 1.0 (used for jpeg & webp)
}

export interface RenderedPageImage {
  pageNumber: number;
  dataUrl: string;
  blob?: Blob;
  width: number;
  height: number;
  sizeBytes: number;
}

/**
 * Inspects a PDF and returns the document object and page count
 */
export async function loadPdfDocument(pdfData: ArrayBuffer | Uint8Array | Blob) {
  let data: ArrayBuffer | Uint8Array;
  if (pdfData instanceof Blob) {
    data = await pdfData.arrayBuffer();
  } else {
    data = pdfData;
  }

  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: false,
  });

  return await loadingTask.promise;
}

/**
 * Renders a single page from an open PDF document to an image DataURL and Blob
 */
export async function renderSinglePdfPage(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  options: ImageExportOptions
): Promise<RenderedPageImage> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: options.scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Pure white paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport,
    canvas,
  };

  await page.render(renderContext).promise;

  const mimeType =
    options.format === 'png'
      ? 'image/png'
      : options.format === 'webp'
      ? 'image/webp'
      : 'image/jpeg';

  const dataUrl =
    options.format === 'png'
      ? canvas.toDataURL(mimeType)
      : canvas.toDataURL(mimeType, options.quality);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to convert canvas to blob'));
      },
      mimeType,
      options.format === 'png' ? undefined : options.quality
    );
  });

  return {
    pageNumber,
    dataUrl,
    blob,
    width: canvas.width,
    height: canvas.height,
    sizeBytes: blob.size,
  };
}

/**
 * Creates a ZIP archive containing the provided images
 */
export async function createZipFromImages(
  images: Array<{ fileName: string; blob: Blob }>,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  images.forEach((img) => {
    zip.file(img.fileName, img.blob);
  });

  return await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress && metadata.percent) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );
}

/**
 * Helper to download an image Blob directly
 */
export function downloadImageBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
