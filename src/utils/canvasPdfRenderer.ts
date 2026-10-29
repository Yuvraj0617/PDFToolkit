import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker in Vite
try {
  // Use worker from unpkg or cdnjs as robust fallback
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('Failed to configure pdf.js worker URL:', e);
}

export interface RenderedPageCanvas {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Loads a PDF buffer or Blob and renders all pages to canvas Data URLs
 */
export async function renderAllPdfPagesToImages(
  pdfData: ArrayBuffer | Uint8Array | Blob
): Promise<RenderedPageCanvas[]> {
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

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const results: RenderedPageCanvas[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    // Render at scale 1.5 for high DPI crispness
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // White paper base
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render page
      const renderContext = {
        canvasContext: ctx,
        viewport,
        canvas,
      };
      await page.render(renderContext).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      results.push({
        pageNumber: i,
        dataUrl,
        width: viewport.width,
        height: viewport.height,
      });
    }
  }

  return results;
}
