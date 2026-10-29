import { jsPDF } from 'jspdf';
import {
  ImagePageItem,
  MarginPreset,
  PageSizePreset,
  PdfGlobalConfig,
  SupportedImageFormat,
} from '../types/pdf';

export const PAGE_DIMENSIONS_MM: Record<
  Exclude<PageSizePreset, 'fit-image'>,
  { width: number; height: number; label: string }
> = {
  a4: { width: 210, height: 297, label: 'ISO A4 (210 × 297 mm)' },
  letter: { width: 215.9, height: 279.4, label: 'US Letter (215.9 × 279.4 mm)' },
  legal: { width: 215.9, height: 355.6, label: 'US Legal (215.9 × 355.6 mm)' },
};

export const MARGIN_VALUES_MM: Record<MarginPreset, number> = {
  none: 0,
  compact: 10,
  standard: 18,
  archival: 28,
};

export const QUALITY_FACTORS = {
  high: 0.95,
  balanced: 0.82,
  compact: 0.62,
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function estimatePdfSizeBytes(pages: ImagePageItem[]): number {
  if (pages.length === 0) return 0;
  let total = 4096;
  for (const page of pages) {
    if (!page.included) continue;
    total += 1536;
    if (page.originalFormat === 'JPG') {
      total += page.sizeBytes;
    } else {
      const approxPixels = page.width * page.height;
      const approxJpegBytes = Math.round(approxPixels * 0.16);
      total += Math.min(page.sizeBytes, Math.max(20480, approxJpegBytes));
    }
  }
  return total;
}

export function detectSupportedFormat(file: File): SupportedImageFormat | null {
  const mime = file.type.toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (mime === 'image/jpeg' || mime === 'image/jpg' || ext === 'jpg' || ext === 'jpeg') {
    return 'JPG';
  }
  if (mime === 'image/png' || ext === 'png') {
    return 'PNG';
  }
  if (mime === 'image/webp' || ext === 'webp') {
    return 'WEBP';
  }
  return null;
}

export async function readImageFile(file: File): Promise<ImagePageItem> {
  const format = detectSupportedFormat(file);
  if (!format) {
    throw new Error(`Unsupported file format for "${file.name}". Please upload JPG, PNG, or WebP.`);
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Failed to read file "${file.name}"`));
    reader.readAsDataURL(file);
  });

  const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error(`Failed to decode image "${file.name}"`));
    img.src = dataUrl;
  });

  const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');

  return {
    id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    originalFormat: format,
    mimeType: file.type || `image/${format.toLowerCase()}`,
    sizeBytes: file.size,
    width: dimensions.width,
    height: dimensions.height,
    dataUrl,
    rotation: 0,
    colorFilter: 'none',
    caption: cleanBaseName,
    included: true,
    addedAt: Date.now(),
  };
}

/**
 * Renders the image with its rotation and color filter onto an offscreen canvas
 * and returns a processed JPEG data URL + rotated dimensions.
 */
export async function processPageImage(
  page: ImagePageItem,
  qualityFactor: number
): Promise<{
  processedDataUrl: string;
  rotatedWidth: number;
  rotatedHeight: number;
}> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.crossOrigin = 'anonymous';
    element.onload = () => resolve(element);
    element.onerror = (err) => reject(err);
    element.src = page.dataUrl;
  });

  const isSideways = page.rotation === 90 || page.rotation === 270;
  const rotatedWidth = isSideways ? img.naturalHeight : img.naturalWidth;
  const rotatedHeight = isSideways ? img.naturalWidth : img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = rotatedWidth;
  canvas.height = rotatedHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      processedDataUrl: page.dataUrl,
      rotatedWidth,
      rotatedHeight,
    };
  }

  // Fill white base in case PNG/WebP has transparency
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, rotatedWidth, rotatedHeight);

  // Apply filter
  if (page.colorFilter === 'grayscale') {
    ctx.filter = 'grayscale(100%)';
  } else if (page.colorFilter === 'scan-contrast') {
    ctx.filter = 'grayscale(100%) contrast(145%) brightness(105%)';
  } else if (page.colorFilter === 'warm-paper') {
    ctx.filter = 'sepia(18%) contrast(104%) brightness(99%)';
  } else {
    ctx.filter = 'none';
  }

  ctx.save();
  ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
  ctx.rotate((page.rotation * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx.restore();

  const processedDataUrl = canvas.toDataURL('image/jpeg', qualityFactor);
  return {
    processedDataUrl,
    rotatedWidth,
    rotatedHeight,
  };
}

/**
 * Calculates exact page geometry (in mm) and image placement box (in mm)
 * for a given page item and global PDF configuration.
 */
export function computePageLayoutMm(
  rotatedWidthPx: number,
  rotatedHeightPx: number,
  page: ImagePageItem,
  config: PdfGlobalConfig
): {
  pageWidthMm: number;
  pageHeightMm: number;
  orientation: 'p' | 'l';
  imgX: number;
  imgY: number;
  imgW: number;
  imgH: number;
  marginMm: number;
} {
  const marginMm = MARGIN_VALUES_MM[config.margin];

  if (config.pageSize === 'fit-image') {
    // Convert px to mm at 96 DPI (1 px = 0.264583 mm), clamped to reasonable bounds
    const rawW = Math.max(60, Math.min(500, rotatedWidthPx * 0.264583));
    const rawH = Math.max(60, Math.min(500, rotatedHeightPx * 0.264583));
    const pageWidthMm = rawW + marginMm * 2;
    const pageHeightMm = rawH + marginMm * 2;
    return {
      pageWidthMm,
      pageHeightMm,
      orientation: pageWidthMm > pageHeightMm ? 'l' : 'p',
      imgX: marginMm,
      imgY: marginMm,
      imgW: rawW,
      imgH: rawH,
      marginMm,
    };
  }

  const baseDim = PAGE_DIMENSIONS_MM[config.pageSize];
  let isLandscape = false;
  if (config.orientation === 'landscape') {
    isLandscape = true;
  } else if (config.orientation === 'portrait') {
    isLandscape = false;
  } else {
    // Auto-match image aspect ratio
    isLandscape = rotatedWidthPx > rotatedHeightPx;
  }

  const pageWidthMm = isLandscape ? baseDim.height : baseDim.width;
  const pageHeightMm = isLandscape ? baseDim.width : baseDim.height;

  const headerReserveMm = config.showHeaderTitle ? 8 : 0;
  const footerReserveMm = config.showPageNumbers || config.showImageCaptions ? 10 : 0;

  const availW = Math.max(20, pageWidthMm - marginMm * 2);
  const availH = Math.max(20, pageHeightMm - marginMm * 2 - headerReserveMm - footerReserveMm);
  const availX = marginMm;
  const availY = marginMm + headerReserveMm;

  const fitMode = page.fitModeOverride || config.imageFit;
  const imgAspect = rotatedWidthPx / rotatedHeightPx;
  const boxAspect = availW / availH;

  let imgW = availW;
  let imgH = availH;

  if (fitMode === 'contain') {
    if (imgAspect > boxAspect) {
      imgW = availW;
      imgH = availW / imgAspect;
    } else {
      imgH = availH;
      imgW = availH * imgAspect;
    }
  } else if (fitMode === 'cover') {
    // Fill available box
    imgW = availW;
    imgH = availH;
  } else {
    // 'original' centered within available bounds
    const naturalW = rotatedWidthPx * 0.264583;
    const naturalH = rotatedHeightPx * 0.264583;
    const scale = Math.min(1, availW / naturalW, availH / naturalH);
    imgW = naturalW * scale;
    imgH = naturalH * scale;
  }

  const imgX = availX + (availW - imgW) / 2;
  const imgY = availY + (availH - imgH) / 2;

  return {
    pageWidthMm,
    pageHeightMm,
    orientation: isLandscape ? 'l' : 'p',
    imgX,
    imgY,
    imgW,
    imgH,
    marginMm,
  };
}

/**
 * Compiles either an array of pages (Full PDF Document) or a single page item
 * into a downloadable PDF blob using jsPDF.
 */
export async function generatePdfDocument(
  pages: ImagePageItem[],
  config: PdfGlobalConfig,
  customFileName?: string
): Promise<{
  blob: Blob;
  blobUrl: string;
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
}> {
  if (pages.length === 0) {
    throw new Error('No pages selected for PDF generation.');
  }

  const qualityFactor = QUALITY_FACTORS[config.quality];
  let pdf: jsPDF | null = null;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { processedDataUrl, rotatedWidth, rotatedHeight } = await processPageImage(
      page,
      qualityFactor
    );

    const layout = computePageLayoutMm(rotatedWidth, rotatedHeight, page, config);

    if (i === 0) {
      pdf = new jsPDF({
        orientation: layout.orientation,
        unit: 'mm',
        format: [layout.pageWidthMm, layout.pageHeightMm],
        compress: true,
      });
    } else if (pdf) {
      pdf.addPage([layout.pageWidthMm, layout.pageHeightMm], layout.orientation);
    }

    if (!pdf) continue;

    // Fill page background
    if (config.pageBackground !== '#ffffff') {
      pdf.setFillColor(config.pageBackground);
      pdf.rect(0, 0, layout.pageWidthMm, layout.pageHeightMm, 'F');
    }

    // Header Document Title
    if (config.showHeaderTitle && config.documentTitle.trim()) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        config.documentTitle.trim(),
        Math.max(10, layout.marginMm),
        Math.max(7, layout.marginMm + 3)
      );
    }

    // Draw image
    pdf.addImage(
      processedDataUrl,
      'JPEG',
      layout.imgX,
      layout.imgY,
      layout.imgW,
      layout.imgH,
      undefined,
      config.quality === 'compact' ? 'FAST' : 'MEDIUM'
    );

    // Footer Caption & Page Number
    const footerY = layout.pageHeightMm - Math.max(6, layout.marginMm * 0.55);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);

    if (config.showImageCaptions && page.caption.trim()) {
      pdf.text(page.caption.trim(), Math.max(10, layout.marginMm), footerY);
    }

    if (config.showPageNumbers) {
      const pageLabel = `Page ${String(i + 1).padStart(2, '0')} of ${String(pages.length).padStart(2, '0')}`;
      pdf.text(
        pageLabel,
        layout.pageWidthMm - Math.max(10, layout.marginMm),
        footerY,
        { align: 'right' }
      );
    }
  }

  if (!pdf) {
    throw new Error('Failed to initialize PDF document.');
  }

  const rawName = (customFileName || config.fileName || 'foliopress-document').trim();
  const sanitizedFileName = rawName.toLowerCase().endsWith('.pdf')
    ? rawName
    : `${rawName}.pdf`;

  const blob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return {
    blob,
    blobUrl,
    fileName: sanitizedFileName,
    fileSizeBytes: blob.size,
    pageCount: pages.length,
  };
}

export function triggerBrowserDownload(url: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
