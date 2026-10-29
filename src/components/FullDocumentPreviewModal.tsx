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
import { ImagePageItem, PdfGlobalConfig } from '../types/pdf';
import { PageSheetPreview } from './PageSheetPreview';
import { formatBytes } from '../utils/pdfEngine';

interface FullDocumentPreviewModalProps {
  pages: ImagePageItem[];
  config: PdfGlobalConfig;
  onClose: () => void;
  onDownloadFullPdf: () => Promise<void>;
  isDownloading: boolean;
}

export const FullDocumentPreviewModal: React.FC<FullDocumentPreviewModalProps> = ({
  pages,
  config,
  onClose,
  onDownloadFullPdf,
  isDownloading,
}) => {
  const [zoom, setZoom] = useState<number>(0.85);
  const [viewMode, setViewMode] = useState<'continuous' | 'single'>('continuous');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const includedPages = pages.filter((p) => p.included);
  const totalPages = includedPages.length;

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

  const totalSizeBytes = includedPages.reduce((acc, p) => acc + p.sizeBytes, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-xs text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label="Full Document PDF Preview"
    >
      {/* Top Navigation & Toolbar Bar */}
      <header className="flex items-center justify-between gap-4 px-6 py-3.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">
              {config.fileName.endsWith('.pdf') ? config.fileName : `${config.fileName}.pdf`}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
              <span>{totalPages} {totalPages === 1 ? 'Page' : 'Pages'}</span>
              <span aria-hidden="true">·</span>
              <span className="uppercase">{config.pageSize}</span>
              <span aria-hidden="true">·</span>
              <span>{config.orientation}</span>
            </div>
          </div>
        </div>

        {/* View Controls & Zoom */}
        <div className="flex items-center gap-3 shrink-0">
          {/* View Mode Toggle: Continuous vs Single Page */}
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

          {/* Toggle Sidebar Thumbnails */}
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

          {/* Download Complete PDF Primary Button */}
          <button
            type="button"
            onClick={onDownloadFullPdf}
            disabled={isDownloading || totalPages === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            <span>{isDownloading ? 'Compiling PDF...' : 'Download PDF'}</span>
          </button>

          {/* Close Modal Button */}
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
        {/* Left Thumbnails Drawer */}
        {showThumbnails && (
          <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto p-3 space-y-3">
            <div className="text-xs font-semibold text-slate-400 px-1 uppercase tracking-wider">
              Document Pages ({totalPages})
            </div>
            <div className="space-y-2">
              {includedPages.map((page, idx) => {
                const isActive = currentPageIndex === idx;
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => scrollToPage(idx)}
                    className={`w-full text-left p-2 rounded-lg border transition-all flex flex-col items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between text-xs font-mono tabular-nums text-slate-400">
                      <span>Page {String(idx + 1).padStart(2, '0')}</span>
                      <span>{page.originalFormat}</span>
                    </div>
                    <div className="w-full h-24 overflow-hidden rounded bg-slate-800 flex items-center justify-center p-1">
                      <div className="transform scale-[0.22] origin-center pointer-events-none">
                        <PageSheetPreview
                          page={page}
                          pageIndex={idx}
                          totalPages={totalPages}
                          config={config}
                          scale={0.8}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 truncate w-full text-center">
                      {page.name}
                    </span>
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
              <p>No pages included in this document.</p>
            </div>
          ) : viewMode === 'continuous' ? (
            /* Continuous View: All pages rendered one below another */
            <div className="space-y-12 flex flex-col items-center pb-16">
              {includedPages.map((page, idx) => (
                <div
                  key={page.id}
                  ref={(el) => {
                    pageRefs.current[idx] = el;
                  }}
                  className="flex flex-col items-center space-y-2"
                >
                  <div className="shadow-2xl rounded-xs overflow-hidden">
                    <PageSheetPreview
                      page={page}
                      pageIndex={idx}
                      totalPages={totalPages}
                      config={config}
                      scale={zoom}
                    />
                  </div>
                  <div className="text-xs font-mono tabular-nums text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                    Page {idx + 1} of {totalPages} · {page.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Single Page View: Step through pages with big arrows */
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

                <div className="shadow-2xl rounded-xs overflow-hidden">
                  <PageSheetPreview
                    page={includedPages[currentPageIndex]}
                    pageIndex={currentPageIndex}
                    totalPages={totalPages}
                    config={config}
                    scale={zoom}
                  />
                </div>

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
                <span>
                  Page {currentPageIndex + 1} of {totalPages}
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-[260px]">
                  {includedPages[currentPageIndex].name}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
