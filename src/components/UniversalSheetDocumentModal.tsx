import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  LayoutList,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { formatBytes } from '../utils/pdfEngine';

export interface SheetPageItem {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
  title?: string;
}

interface UniversalSheetDocumentModalProps {
  title: string;
  fileName: string;
  pages: SheetPageItem[];
  totalSizeBytes?: number;
  pageSizeLabel?: string;
  onClose: () => void;
  onDownload: () => void | Promise<void>;
  isDownloading?: boolean;
}

export const UniversalSheetDocumentModal: React.FC<UniversalSheetDocumentModalProps> = ({
  title,
  fileName,
  pages,
  totalSizeBytes,
  pageSizeLabel = 'ISO A4',
  onClose,
  onDownload,
  isDownloading = false,
}) => {
  const [zoom, setZoom] = useState<number>(0.85);
  // Default to continuous vertical scroll as confirmed by the user
  const [viewMode, setViewMode] = useState<'continuous' | 'single'>('continuous');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const totalPages = pages.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (viewMode === 'single') {
        if (e.key === 'ArrowLeft' && currentPageIndex > 0) {
          setCurrentPageIndex((prev) => prev - 1);
        } else if (e.key === 'ArrowRight' && currentPageIndex < totalPages - 1) {
          setCurrentPageIndex((prev) => prev + 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, totalPages, viewMode, onClose]);

  const scrollToPage = (idx: number) => {
    setCurrentPageIndex(idx);
    if (viewMode === 'continuous') {
      pageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-xs text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} Document Preview`}
    >
      {/* Top Navigation & Toolbar Bar */}
      <header className="flex items-center justify-between gap-4 px-6 py-3.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">{fileName}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
              <span>{totalPages} {totalPages === 1 ? 'Page' : 'Pages'}</span>
              <span aria-hidden="true">·</span>
              <span className="uppercase">{pageSizeLabel}</span>
              {totalSizeBytes !== undefined && totalSizeBytes > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{formatBytes(totalSizeBytes)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* View Controls & Zoom */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Continuous vs Single View Toggle */}
          <div className="hidden sm:flex items-center p-1 bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('continuous')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'continuous'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Continuous Scroll
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Single Page
            </button>
          </div>

          {/* Toggle Thumbnails */}
          <button
            type="button"
            onClick={() => setShowThumbnails((prev) => !prev)}
            title="Toggle Page Thumbnails"
            className={`p-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showThumbnails
                ? 'bg-slate-800 border-slate-700 text-blue-400'
                : 'bg-transparent border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <LayoutList className="w-4 h-4" />
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)))}
              title="Zoom Out"
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono tabular-nums text-slate-300 min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.15).toFixed(2)))}
              title="Zoom In"
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(0.85)}
              title="Fit to Screen"
              className="p-1.5 text-slate-400 hover:text-white border-l border-slate-700 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Direct Download Button */}
          <button
            type="button"
            onClick={() => onDownload()}
            disabled={isDownloading || totalPages === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
          >
            <FileDown className="w-4 h-4" />
            <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Preview Work Area: Left Thumbnails + Center Document Viewport */}
      <div className="flex-1 flex min-h-0 overflow-hidden bg-slate-950">
        {/* Left Thumbnails Sidebar */}
        {showThumbnails && (
          <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto p-3 space-y-3">
            <div className="text-xs font-semibold text-slate-400 px-1 uppercase tracking-wider font-mono">
              Pages ({totalPages})
            </div>
            <div className="space-y-2">
              {pages.map((page, idx) => {
                const isActive = currentPageIndex === idx;
                return (
                  <button
                    key={page.pageNumber}
                    type="button"
                    onClick={() => scrollToPage(idx)}
                    className={`w-full text-left p-2 rounded-lg border transition-all flex flex-col items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between text-xs font-mono tabular-nums text-slate-400">
                      <span>Page {String(page.pageNumber).padStart(2, '0')}</span>
                    </div>
                    <div className="w-full h-28 overflow-hidden rounded bg-slate-800 flex items-center justify-center p-1">
                      <img
                        src={page.dataUrl}
                        alt={`Thumbnail Page ${page.pageNumber}`}
                        className="max-h-full max-w-full object-contain shadow-xs rounded"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Center Canvas Viewport */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto flex flex-col items-center p-6 sm:p-10 bg-slate-950"
        >
          {totalPages === 0 ? (
            <div className="m-auto text-center space-y-2 text-slate-400 text-sm">
              <p>No pages available in this document.</p>
            </div>
          ) : viewMode === 'continuous' ? (
            /* Continuous View: All pages stacked vertically like Photo-to-PDF */
            <div className="space-y-12 flex flex-col items-center pb-16">
              {pages.map((page, idx) => {
                const baseWidth = Math.min(800, page.width * 0.7);
                const sheetW = Math.round(baseWidth * zoom);
                const sheetH = Math.round(sheetW * (page.height / page.width));

                return (
                  <div
                    key={page.pageNumber}
                    ref={(el) => {
                      pageRefs.current[idx] = el;
                    }}
                    className="flex flex-col items-center space-y-2"
                  >
                    <div
                      className="shadow-2xl rounded-xs overflow-hidden bg-white border border-slate-300"
                      style={{ width: `${sheetW}px`, height: `${sheetH}px` }}
                    >
                      <img
                        src={page.dataUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-xs font-mono tabular-nums text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                      Page {page.pageNumber} of {totalPages}
                      {page.title ? ` · ${page.title}` : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Single Page View: Previous/Next Navigation */
            <div className="m-auto flex flex-col items-center space-y-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentPageIndex <= 0}
                  title="Previous Page (Left Arrow)"
                  className="p-3 bg-slate-900 border border-slate-800 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {(() => {
                  const activePage = pages[currentPageIndex];
                  const baseWidth = Math.min(800, activePage.width * 0.7);
                  const sheetW = Math.round(baseWidth * zoom);
                  const sheetH = Math.round(sheetW * (activePage.height / activePage.width));

                  return (
                    <div
                      className="shadow-2xl rounded-xs overflow-hidden bg-white border border-slate-300"
                      style={{ width: `${sheetW}px`, height: `${sheetH}px` }}
                    >
                      <img
                        src={activePage.dataUrl}
                        alt={`Page ${activePage.pageNumber}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPageIndex((prev) => Math.min(totalPages - 1, prev + 1))
                  }
                  disabled={currentPageIndex >= totalPages - 1}
                  title="Next Page (Right Arrow)"
                  className="p-3 bg-slate-900 border border-slate-800 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-slate-300 bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800">
                <span>Page {pages[currentPageIndex].pageNumber} of {totalPages}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
