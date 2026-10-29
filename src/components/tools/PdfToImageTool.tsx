import React, { useEffect, useRef, useState } from 'react';
import {
  Archive,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileDown,
  FileImage,
  FolderArchive,
  Grid,
  Image as ImageIcon,
  Layers,
  Maximize2,
  RefreshCw,
  Search,
  Settings2,
  Sliders,
  Sparkles,
  Square,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  ImageExportOptions,
  ImageFormat,
  RenderedPageImage,
  createZipFromImages,
  downloadImageBlob,
  loadPdfDocument,
  renderSinglePdfPage,
} from '../../utils/pdfToImageEngine';
import { formatBytes } from '../../utils/pdfEngine';
import { SheetPageItem, UniversalSheetDocumentModal } from '../UniversalSheetDocumentModal';

interface LoadedPdfState {
  file: File;
  name: string;
  sizeBytes: number;
  pageCount: number;
  pdfDoc: any;
}

export const PdfToImageTool: React.FC = () => {
  const [loadedPdf, setLoadedPdf] = useState<LoadedPdfState | null>(null);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [renderedThumbnails, setRenderedThumbnails] = useState<RenderedPageImage[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  // Export Settings
  const [format, setFormat] = useState<ImageFormat>('png');
  const [scale, setScale] = useState<number>(2.0); // 2.0 = ~150 DPI
  const [quality, setQuality] = useState<number>(0.92);

  // Processing & Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgressText, setExportProgressText] = useState<string>('');
  const [exportPercent, setExportPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview modals
  const [inspectImage, setInspectImage] = useState<RenderedPageImage | null>(null);
  const [showFullSheetModal, setShowFullSheetModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle PDF file selection
  const handlePdfUpload = async (files: FileList | File[]) => {
    const file = Array.from(files).find(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (!file) {
      setErrorMessage('Please provide a valid PDF document.');
      return;
    }

    try {
      setErrorMessage(null);
      setIsInspecting(true);
      setRenderedThumbnails([]);
      setSelectedPages(new Set());

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await loadPdfDocument(arrayBuffer);
      const pageCount = pdfDoc.numPages;

      setLoadedPdf({
        file,
        name: file.name,
        sizeBytes: file.size,
        pageCount,
        pdfDoc,
      });

      // Default: select all pages
      const allPages = new Set<number>();
      for (let i = 1; i <= pageCount; i++) {
        allPages.add(i);
      }
      setSelectedPages(allPages);

      // Render rapid visual thumbnails for the grid preview (scale 1.0 for speed)
      const thumbs: RenderedPageImage[] = [];
      for (let i = 1; i <= pageCount; i++) {
        const thumb = await renderSinglePdfPage(pdfDoc, i, {
          format: 'jpeg',
          scale: 1.0,
          quality: 0.85,
        });
        thumbs.push(thumb);
        // Progressive update so user sees pages appear immediately
        setRenderedThumbnails([...thumbs]);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to parse and render PDF pages. Please verify the document is not password protected.'
      );
    } finally {
      setIsInspecting(false);
    }
  };

  // Toggle selection for a single page
  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  };

  // Selection actions
  const selectAllPages = () => {
    if (!loadedPdf) return;
    const all = new Set<number>();
    for (let i = 1; i <= loadedPdf.pageCount; i++) {
      all.add(i);
    }
    setSelectedPages(all);
  };

  const deselectAllPages = () => {
    setSelectedPages(new Set());
  };

  const invertSelection = () => {
    if (!loadedPdf) return;
    const inverted = new Set<number>();
    for (let i = 1; i <= loadedPdf.pageCount; i++) {
      if (!selectedPages.has(i)) {
        inverted.add(i);
      }
    }
    setSelectedPages(inverted);
  };

  const selectOddPages = () => {
    if (!loadedPdf) return;
    const odds = new Set<number>();
    for (let i = 1; i <= loadedPdf.pageCount; i += 2) {
      odds.add(i);
    }
    setSelectedPages(odds);
  };

  const selectEvenPages = () => {
    if (!loadedPdf) return;
    const evens = new Set<number>();
    for (let i = 2; i <= loadedPdf.pageCount; i += 2) {
      evens.add(i);
    }
    setSelectedPages(evens);
  };

  // Base filename helper
  const getBaseName = () => {
    if (!loadedPdf) return 'document';
    return loadedPdf.name.replace(/\.pdf$/i, '');
  };

  // Download a single page directly at the configured format and scale
  const downloadSinglePage = async (pageNumber: number) => {
    if (!loadedPdf) return;
    try {
      setIsExporting(true);
      setExportProgressText(`Rendering Page ${pageNumber} (${format.toUpperCase()})...`);
      setExportPercent(40);

      const rendered = await renderSinglePdfPage(loadedPdf.pdfDoc, pageNumber, {
        format,
        scale,
        quality,
      });

      setExportPercent(90);
      const ext = format === 'jpeg' ? 'jpg' : format;
      const fileName = `${getBaseName()}_page_${String(pageNumber).padStart(2, '0')}.${ext}`;

      if (rendered.blob) {
        downloadImageBlob(rendered.blob, fileName);
      }
      setExportPercent(100);
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to download page image.');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgressText('');
        setExportPercent(0);
      }, 500);
    }
  };

  // Download a batch of pages (either selected or all)
  const downloadPagesBatch = async (pageNumbersToExport: number[], zipLabel: string) => {
    if (!loadedPdf || pageNumbersToExport.length === 0) return;

    // If only 1 page is chosen, download it directly without zip overhead
    if (pageNumbersToExport.length === 1) {
      await downloadSinglePage(pageNumbersToExport[0]);
      return;
    }

    try {
      setIsExporting(true);
      const total = pageNumbersToExport.length;
      const ext = format === 'jpeg' ? 'jpg' : format;
      const images: Array<{ fileName: string; blob: Blob }> = [];

      for (let index = 0; index < total; index++) {
        const pageNum = pageNumbersToExport[index];
        setExportProgressText(`Rendering high-res page ${pageNum} (${index + 1} of ${total})...`);
        const pct = Math.round(((index + 0.5) / (total + 1)) * 100);
        setExportPercent(pct);

        const rendered = await renderSinglePdfPage(loadedPdf.pdfDoc, pageNum, {
          format,
          scale,
          quality,
        });

        if (rendered.blob) {
          const fileName = `${getBaseName()}_page_${String(pageNum).padStart(2, '0')}.${ext}`;
          images.push({ fileName, blob: rendered.blob });
        }
      }

      setExportProgressText('Packaging images into ZIP archive...');
      setExportPercent(90);

      const zipBlob = await createZipFromImages(images, (progressPct) => {
        setExportPercent(90 + Math.round(progressPct * 0.1));
      });

      const zipFileName = `${getBaseName()}_${zipLabel}_images.zip`;
      downloadImageBlob(zipBlob, zipFileName);

      setExportProgressText('Ready! Download started.');
      setExportPercent(100);
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Batch export failed.');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgressText('');
        setExportPercent(0);
      }, 800);
    }
  };

  // Convert rendered thumbnails to SheetPageItem for UniversalSheetDocumentModal
  const sheetPages: SheetPageItem[] = renderedThumbnails.map((thumb) => ({
    pageNumber: thumb.pageNumber,
    dataUrl: thumb.dataUrl,
    width: thumb.width,
    height: thumb.height,
    title: `Page ${thumb.pageNumber}`,
  }));

  return (
    <div className="space-y-6">
      {/* Upload Zone when no document is loaded */}
      {!loadedPdf && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 sm:p-12 text-center">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.length) {
                handlePdfUpload(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className="max-w-2xl mx-auto border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 transition-all rounded-2xl p-10 cursor-pointer group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.length) {
                  handlePdfUpload(e.target.files);
                }
              }}
              accept=".pdf,application/pdf"
              className="hidden"
            />
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileImage className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Choose or Drop a PDF Document
            </h2>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Extract every page into sharp PNG, JPG, or WebP images. Download single pages (1, 2, ...), custom selections, or all at once.
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors">
              <Upload className="w-4 h-4" />
              <span>Select PDF File</span>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400 font-mono">
              <span>Client-side extraction</span>
              <span>•</span>
              <span>100% private</span>
              <span>•</span>
              <span>Full resolution output</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace when PDF is loaded */}
      {loadedPdf && (
        <div className="space-y-6">
          {/* Header Summary & Switch File Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileImage className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {loadedPdf.name}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-mono font-medium text-slate-600">
                    {loadedPdf.pageCount} {loadedPdf.pageCount === 1 ? 'page' : 'pages'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Original size: {formatBytes(loadedPdf.sizeBytes)} · Status: Ready for extraction
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowFullSheetModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Document Proof</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Change PDF</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handlePdfUpload(e.target.files);
                  }
                }}
                accept=".pdf,application/pdf"
                className="hidden"
              />
            </div>
          </div>

          {/* Export Options & Batch Download Controls Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              {/* Settings Controls */}
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                {/* Format Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                    Format:
                  </span>
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                    {(['png', 'jpeg', 'webp'] as ImageFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setFormat(fmt)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all uppercase cursor-pointer ${
                          format === fmt
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {fmt === 'jpeg' ? 'JPG' : fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution / DPI Scale */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                    Clarity:
                  </span>
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                    {[
                      { label: 'Standard (150 DPI)', value: 2.0 },
                      { label: 'High (225 DPI)', value: 3.0 },
                      { label: 'Ultra (300 DPI)', value: 4.0 },
                      { label: 'Compact (72 DPI)', value: 1.0 },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setScale(opt.value)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          scale === opt.value
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* JPG/WebP Quality Slider */}
                {format !== 'png' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 font-mono">
                      Quality ({Math.round(quality * 100)}%):
                    </span>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                )}
              </div>

              {/* Status / Notice */}
              <div className="text-xs text-slate-500 font-mono">
                {format === 'png' ? 'Lossless PNG • Crisp typography' : `${format.toUpperCase()} • Compressed image`}
              </div>
            </div>

            {/* Selection Toolbar and Primary Download Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Quick Select Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-700 mr-1">Select:</span>
                <button
                  type="button"
                  onClick={selectAllPages}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  All ({loadedPdf.pageCount})
                </button>
                <button
                  type="button"
                  onClick={deselectAllPages}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  None
                </button>
                <button
                  type="button"
                  onClick={invertSelection}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  Invert
                </button>
                {loadedPdf.pageCount > 2 && (
                  <>
                    <button
                      type="button"
                      onClick={selectOddPages}
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    >
                      Odds
                    </button>
                    <button
                      type="button"
                      onClick={selectEvenPages}
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    >
                      Evens
                    </button>
                  </>
                )}
                <span className="text-xs text-slate-400 font-mono ml-2">
                  {selectedPages.size} of {loadedPdf.pageCount} chosen
                </span>
              </div>

              {/* Action Buttons: Download Selected & Download All */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Download Selected Pages */}
                <button
                  type="button"
                  disabled={selectedPages.size === 0 || isExporting}
                  onClick={() => {
                    const sorted = Array.from(selectedPages).sort((a, b) => a - b);
                    downloadPagesBatch(sorted, `selected_${sorted.length}_pages`);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs ${
                    selectedPages.size === 0 || isExporting
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Download Selected ({selectedPages.size})
                    {selectedPages.size > 1 ? ' as ZIP' : ''}
                  </span>
                </button>

                {/* Download All Pages Primary Action */}
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => {
                    const allPages = Array.from({ length: loadedPdf.pageCount }, (_, i) => i + 1);
                    downloadPagesBatch(allPages, 'all_pages');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    Download All {loadedPdf.pageCount} Pages ({format.toUpperCase()})
                  </span>
                </button>
              </div>
            </div>

            {/* Export Progress Bar */}
            {isExporting && (
              <div className="pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5 font-mono">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    {exportProgressText || 'Processing images...'}
                  </span>
                  <span>{exportPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${exportPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Page Jump / Instructions */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-medium text-slate-700">
              Individual Page Grid — Click a page to inspect or download directly:
            </span>
            <span className="font-mono text-slate-400">
              {renderedThumbnails.length} of {loadedPdf.pageCount} rendered
            </span>
          </div>

          {/* Pages Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: loadedPdf.pageCount }).map((_, idx) => {
              const pageNumber = idx + 1;
              const isSelected = selectedPages.has(pageNumber);
              const thumb = renderedThumbnails.find((t) => t.pageNumber === pageNumber);

              return (
                <div
                  key={pageNumber}
                  className={`group relative bg-white rounded-xl border transition-all flex flex-col overflow-hidden ${
                    isSelected
                      ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {/* Top Card Bar: Checkbox + Page Badge */}
                  <div className="p-2.5 pb-2 flex items-center justify-between bg-slate-50/80 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => togglePageSelection(pageNumber)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 fill-blue-50" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                      )}
                      <span>Page {pageNumber}</span>
                    </button>

                    <button
                      type="button"
                      title="Inspect full resolution"
                      onClick={() => {
                        if (thumb) setInspectImage(thumb);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail Preview Paper Area */}
                  <div
                    onClick={() => togglePageSelection(pageNumber)}
                    className="p-3 bg-slate-100/50 flex-1 flex items-center justify-center min-h-[180px] cursor-pointer"
                  >
                    {thumb ? (
                      <div className="relative shadow-md border border-slate-200/80 rounded-sm bg-white overflow-hidden max-w-full">
                        <img
                          src={thumb.dataUrl}
                          alt={`Page ${pageNumber}`}
                          className="w-full h-auto max-h-[220px] object-contain block select-none pointer-events-none"
                          loading="lazy"
                        />
                        {/* Hover Overlay preview hint */}
                        <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white/90 backdrop-blur-xs text-[11px] font-semibold text-slate-800 px-2 py-1 rounded shadow-xs">
                            {isSelected ? 'Selected' : 'Click to Select'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-2 py-8">
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                        <span className="text-[11px] font-mono">Rendering...</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer: Individual 1-Click Download Button */}
                  <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400 truncate">
                      {thumb ? `${Math.round(thumb.width * (scale / 1.0))}×${Math.round(thumb.height * (scale / 1.0))}px` : 'Calculating'}
                    </span>

                    <button
                      type="button"
                      title={`Download Page ${pageNumber} as ${format.toUpperCase()}`}
                      disabled={isExporting}
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadSinglePage(pageNumber);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-md transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Download className="w-3 h-3" />
                      <span>{format === 'jpeg' ? 'JPG' : format.toUpperCase()}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-800 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Single Page High-Res Lightbox Modal */}
      {inspectImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileImage className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Page {inspectImage.pageNumber} Preview
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {getBaseName()} · {inspectImage.width} × {inspectImage.height} px
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadSinglePage(inspectImage.pageNumber)}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Page {inspectImage.pageNumber} ({format.toUpperCase()})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInspectImage(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="flex-1 overflow-auto p-6 bg-slate-900/95 flex items-center justify-center">
              <div className="max-w-full max-h-full shadow-2xl bg-white border border-slate-700 rounded-sm overflow-hidden">
                <img
                  src={inspectImage.dataUrl}
                  alt={`Page ${inspectImage.pageNumber}`}
                  className="max-h-[72vh] w-auto object-contain block"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 px-6 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Paper sheet high-fidelity view</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const cur = inspectImage.pageNumber;
                    if (cur > 1) {
                      const prev = renderedThumbnails.find((t) => t.pageNumber === cur - 1);
                      if (prev) setInspectImage(prev);
                    }
                  }}
                  disabled={inspectImage.pageNumber <= 1}
                  className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40 cursor-pointer"
                >
                  ← Previous Page
                </button>
                <span>
                  {inspectImage.pageNumber} / {loadedPdf?.pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const cur = inspectImage.pageNumber;
                    if (loadedPdf && cur < loadedPdf.pageCount) {
                      const next = renderedThumbnails.find((t) => t.pageNumber === cur + 1);
                      if (next) setInspectImage(next);
                    }
                  }}
                  disabled={!loadedPdf || inspectImage.pageNumber >= loadedPdf.pageCount}
                  className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40 cursor-pointer"
                >
                  Next Page →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Document Sheet Modal Proof */}
      {showFullSheetModal && loadedPdf && (
        <UniversalSheetDocumentModal
          title={`Document Proof: ${loadedPdf.name}`}
          fileName={loadedPdf.name}
          pages={sheetPages}
          totalSizeBytes={loadedPdf.sizeBytes}
          pageSizeLabel="Multi-Page Document"
          onClose={() => setShowFullSheetModal(false)}
          onDownload={() => {
            const allPages = Array.from({ length: loadedPdf.pageCount }, (_, i) => i + 1);
            downloadPagesBatch(allPages, 'all_pages');
          }}
          isDownloading={isExporting}
        />
      )}
    </div>
  );
};
