import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ImagePageItem, PdfGlobalConfig } from '../types/pdf';
import {
  computePageLayoutMm,
  formatBytes,
  processPageImage,
  QUALITY_FACTORS,
  triggerBrowserDownload,
} from '../utils/pdfEngine';
import { PageSheetPreview } from './PageSheetPreview';

interface PagePreviewModalProps {
  pages: ImagePageItem[];
  activePageId: string;
  config: PdfGlobalConfig;
  onClose: () => void;
  onSelectPage: (id: string) => void;
  onUpdatePage: (id: string, patch: Partial<ImagePageItem>) => void;
  onDownloadSinglePagePdf: (page: ImagePageItem, index: number) => Promise<void>;
  isExportingSingle: boolean;
}

export const PagePreviewModal: React.FC<PagePreviewModalProps> = ({
  pages,
  activePageId,
  config,
  onClose,
  onSelectPage,
  onUpdatePage,
  onDownloadSinglePagePdf,
  isExportingSingle,
}) => {
  const [zoom, setZoom] = useState<number>(0.9);
  const [isDownloadingImage, setIsDownloadingImage] = useState<boolean>(false);

  const currentIndex = pages.findIndex((p) => p.id === activePageId);
  const page = pages[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onSelectPage(pages[currentIndex - 1].id);
      } else if (e.key === 'ArrowRight' && currentIndex < pages.length - 1) {
        onSelectPage(pages[currentIndex + 1].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, pages, onClose, onSelectPage]);

  if (!page) return null;

  const isSideways = page.rotation === 90 || page.rotation === 270;
  const rotatedW = isSideways ? page.height : page.width;
  const rotatedH = isSideways ? page.width : page.height;
  const layout = computePageLayoutMm(rotatedW, rotatedH, page, config);

  const handleRotate = (delta: 90 | -90) => {
    const next = (((page.rotation + delta) % 360) + 360) % 360 as 0 | 90 | 180 | 270;
    onUpdatePage(page.id, { rotation: next });
  };

  const handleDownloadProcessedImage = async () => {
    try {
      setIsDownloadingImage(true);
      const { processedDataUrl } = await processPageImage(
        page,
        QUALITY_FACTORS[config.quality]
      );
      const baseName = page.name.replace(/\.[^/.]+$/, '');
      triggerBrowserDownload(
        processedDataUrl,
        `page-${String(currentIndex + 1).padStart(2, '0')}-${baseName}.jpg`
      );
    } finally {
      setIsDownloadingImage(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Page ${currentIndex + 1} Preview`}
    >
      <div className="flex flex-col w-full max-w-5xl h-[88vh] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-3.5 border-b border-slate-200 bg-white">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 truncate">
              {page.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
              <span>
                Page {currentIndex + 1} of {pages.length}
              </span>
              <span aria-hidden="true">·</span>
              <span>{page.originalFormat}</span>
              <span aria-hidden="true">·</span>
              <span>{rotatedW} × {rotatedH} px</span>
              <span aria-hidden="true">·</span>
              <span>{formatBytes(page.sizeBytes)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadProcessedImage}
              disabled={isDownloadingImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Image</span>
            </button>

            <button
              type="button"
              onClick={() => onDownloadSinglePagePdf(page, currentIndex)}
              disabled={isExportingSingle}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>
                {isExportingSingle ? 'Building...' : `Download Page PDF`}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close page preview"
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Stepper, Rotation, Zoom */}
        <div className="flex items-center justify-between gap-4 px-6 py-2.5 border-b border-slate-200 bg-slate-50">
          {/* Stepper */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => currentIndex > 0 && onSelectPage(pages[currentIndex - 1].id)}
              disabled={currentIndex <= 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="text-xs font-mono tabular-nums text-slate-600 px-2">
              {currentIndex + 1} / {pages.length}
            </span>
            <button
              type="button"
              onClick={() => currentIndex < pages.length - 1 && onSelectPage(pages[currentIndex + 1].id)}
              disabled={currentIndex >= pages.length - 1}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Rotation */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleRotate(-90)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rotate Left</span>
            </button>
            <button
              type="button"
              onClick={() => handleRotate(90)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate Right</span>
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center bg-white border border-slate-200 rounded-md">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)))}
              className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono tabular-nums text-slate-700 min-w-[45px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.15).toFixed(2)))}
              className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Paper Canvas */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-slate-100/90">
          <div className="shadow-xl">
            <PageSheetPreview
              page={page}
              pageIndex={currentIndex}
              totalPages={pages.length}
              config={config}
              scale={zoom}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
