export type SupportedImageFormat = 'JPG' | 'PNG' | 'WEBP';

export type PageSizePreset = 'a4' | 'letter' | 'legal' | 'fit-image';

export type PageOrientation = 'portrait' | 'landscape' | 'auto';

export type MarginPreset = 'none' | 'compact' | 'standard' | 'archival';

export type ImageFitMode = 'contain' | 'cover' | 'original';

export type ColorFilterMode = 'none' | 'grayscale' | 'scan-contrast' | 'warm-paper';

export type CompressionQuality = 'high' | 'balanced' | 'compact';

export interface ImagePageItem {
  id: string;
  name: string;
  originalFormat: SupportedImageFormat;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  dataUrl: string;
  rotation: 0 | 90 | 180 | 270;
  colorFilter: ColorFilterMode;
  fitModeOverride?: ImageFitMode;
  caption: string;
  included: boolean;
  addedAt: number;
}

export interface PdfGlobalConfig {
  documentTitle: string;
  fileName: string;
  pageSize: PageSizePreset;
  orientation: PageOrientation;
  margin: MarginPreset;
  imageFit: ImageFitMode;
  quality: CompressionQuality;
  showPageNumbers: boolean;
  showHeaderTitle: boolean;
  showImageCaptions: boolean;
  pageBackground: '#ffffff' | '#faf8f5' | '#f4f4f5';
}

export interface ExportHistoryItem {
  id: string;
  fileName: string;
  pageCount: number;
  exportType: 'full-document' | 'single-page';
  pageSizeLabel: string;
  fileSizeBytes: number;
  createdAt: string;
  blobUrl: string;
}
