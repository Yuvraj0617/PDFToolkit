import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileDown,
  GripVertical,
  Plus,
  RotateCw,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  ImagePageItem,
  MarginPreset,
  PageOrientation,
  PageSizePreset,
  PdfGlobalConfig,
} from '../../types/pdf';
import {
  estimatePdfSizeBytes,
  formatBytes,
  generatePdfDocument,
  readImageFile,
  triggerBrowserDownload,
} from '../../utils/pdfEngine';
import { PageSheetPreview } from '../PageSheetPreview';
import { PagePreviewModal } from '../PagePreviewModal';
import { FullDocumentPreviewModal } from '../FullDocumentPreviewModal';

export const ImageToPdfTool: React.FC = () => {
  const [pages, setPages] = useState<ImagePageItem[]>([]);
  const [isDraggingOverDropzone, setIsDraggingOverDropzone] = useState<boolean>(false);
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);
  const [dragOverPageIndex, setDragOverPageIndex] = useState<number | null>(null);

  const [activePreviewPageId, setActivePreviewPageId] = useState<string | null>(null);
  const [showFullPdfPreview, setShowFullPdfPreview] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [exportingSinglePageId, setExportingSinglePageId] = useState<string | null>(null);

  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [config, setConfig] = useState<PdfGlobalConfig>({
    documentTitle: '',
    fileName: 'images-document.pdf',
    pageSize: 'a4',
    orientation: 'auto',
    margin: 'standard',
    imageFit: 'contain',
    quality: 'high',
    showPageNumbers: true,
    showHeaderTitle: false,
    showImageCaptions: false,
    pageBackground: '#ffffff',
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!statusBanner) return;
    const timer = setTimeout(() => setStatusBanner(null), 4000);
    return () => clearTimeout(timer);
  }, [statusBanner]);

  useEffect(() => {
    if (!showClearConfirm) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowClearConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showClearConfirm]);

  const handleFilesAdded = useCallback(async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    const addedItems: ImagePageItem[] = [];
    const errors: string[] = [];

    for (const file of filesArray) {
      try {
        const item = await readImageFile(file);
        addedItems.push(item);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `Failed to load ${file.name}`);
      }
    }

    if (addedItems.length > 0) {
      setPages((prev) => [...prev, ...addedItems]);
      setStatusBanner({
        type: 'success',
        message: `Added ${addedItems.length} ${
          addedItems.length === 1 ? 'image' : 'images'
        } to the document.`,
      });
    }

    if (errors.length > 0) {
      setStatusBanner({
        type: 'error',
        message: errors[0],
      });
    }
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const items = e.clipboardData?.files;
      if (items && items.length > 0) {
        handleFilesAdded(items);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFilesAdded]);

  const handleUpdatePage = useCallback((id: string, patch: Partial<ImagePageItem>) => {
    setPages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }, []);

  const handleRemovePage = useCallback((id: string) => {
    setPages((prev) => prev.filter((item) => item.id !== id));
    setActivePreviewPageId((prevId) => (prevId === id ? null : prevId));
  }, []);

  const handleRotatePage = useCallback((id: string) => {
    setPages((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextRotation = (((item.rotation + 90) % 360) as 0 | 90 | 180 | 270);
        return { ...item, rotation: nextRotation };
      })
    );
  }, []);

  const handleCardDragStart = (index: number) => {
    setDraggedPageIndex(index);
  };

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedPageIndex === null || draggedPageIndex === index) return;
    setDragOverPageIndex(index);
  };

  const handleCardDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedPageIndex === null || draggedPageIndex === dropIndex) {
      setDraggedPageIndex(null);
      setDragOverPageIndex(null);
      return;
    }
    setPages((prev) => {
      const next = [...prev];
      const [draggedItem] = next.splice(draggedPageIndex, 1);
      next.splice(dropIndex, 0, draggedItem);
      return next;
    });
    setDraggedPageIndex(null);
    setDragOverPageIndex(null);
  };

  const handleExportFullPdf = async () => {
    const includedPages = pages.filter((p) => p.included);
    if (includedPages.length === 0) {
      setStatusBanner({
        type: 'error',
        message: 'Please add at least one image to export into the PDF document.',
      });
      return;
    }

    try {
      setIsGeneratingPdf(true);
      const result = await generatePdfDocument(includedPages, config);
      triggerBrowserDownload(result.blobUrl, result.fileName);
      setStatusBanner({
        type: 'success',
        message: `Successfully downloaded "${result.fileName}" (${result.pageCount} ${
          result.pageCount === 1 ? 'page' : 'pages'
        }).`,
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to generate PDF.',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadSinglePagePdf = async (page: ImagePageItem, pageIndex: number) => {
    try {
      setExportingSinglePageId(page.id);
      const cleanBase = page.name.replace(/\.[^/.]+$/, '');
      const singleFileName = `page-${pageIndex + 1}-${cleanBase}.pdf`;
      const result = await generatePdfDocument([page], config, singleFileName);
      triggerBrowserDownload(result.blobUrl, result.fileName);
      setStatusBanner({
        type: 'success',
        message: `Downloaded Page ${pageIndex + 1} as "${result.fileName}".`,
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to export single page PDF.',
      });
    } finally {
      setExportingSinglePageId(null);
    }
  };

  const estimatedPdfBytes = useMemo(
    () => estimatePdfSizeBytes(pages),
    [pages]
  );

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={(e) => {
          if (e.target.files) {
            handleFilesAdded(e.target.files);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {statusBanner && (
        <div
          role="status"
          className={`flex items-center justify-between gap-4 px-4 py-3 rounded-lg border text-xs font-medium ${
            statusBanner.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusBanner.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-xs underline hover:no-underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Dropzone */}
      <section
        aria-label="Upload Images"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOverDropzone(true);
        }}
        onDragLeave={() => setIsDraggingOverDropzone(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOverDropzone(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesAdded(e.dataTransfer.files);
          }
        }}
        className={`rounded-xl border-2 border-dashed transition-all p-8 text-center bg-white ${
          isDraggingOverDropzone
            ? 'border-blue-600 bg-blue-50/50'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Drag & drop images to convert to PDF
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Supports JPG, PNG, and WebP files. Paste from clipboard also supported.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Choose Image Files</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid: Left Queue + Right Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          {pages.length > 0 && (
            <div className="flex items-center justify-between px-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">
                  {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
                </span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="text-slate-400">Drag cards to reorder</span>
              </div>

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          )}

          {pages.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 space-y-2">
              <p className="text-sm font-medium text-slate-700">No images added yet</p>
              <p className="text-xs text-slate-500">
                Upload multiple JPG, PNG, or WebP images above to convert them into a PDF.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pages.map((page, index) => {
                const isBeingDragged = draggedPageIndex === index;
                const isDragTarget = dragOverPageIndex === index;
                const isSideways = page.rotation === 90 || page.rotation === 270;
                const dispW = isSideways ? page.height : page.width;
                const dispH = isSideways ? page.width : page.height;

                return (
                  <div
                    key={page.id}
                    draggable
                    onDragStart={() => handleCardDragStart(index)}
                    onDragOver={(e) => handleCardDragOver(e, index)}
                    onDrop={(e) => handleCardDrop(e, index)}
                    onDragEnd={() => {
                      setDraggedPageIndex(null);
                      setDragOverPageIndex(null);
                    }}
                    className={`group flex flex-col justify-between bg-white border rounded-xl p-4 transition-all ${
                      isDragTarget
                        ? 'border-blue-600 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-300'
                    } ${isBeingDragged ? 'opacity-40' : 'opacity-100'}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            title="Drag to reorder"
                            className="text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing shrink-0"
                          >
                            <GripVertical className="w-4 h-4" />
                          </span>
                          <span className="text-xs font-semibold text-slate-900 font-mono">
                            Page {index + 1}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            · {page.originalFormat}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRotatePage(page.id)}
                            title="Rotate 90°"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePage(page.id)}
                            title="Delete"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Thumbnail */}
                      <div
                        onClick={() => setActivePreviewPageId(page.id)}
                        className="relative my-3 h-48 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer group/thumb border border-slate-200/80"
                      >
                        <div className="transform scale-[0.32] origin-center pointer-events-none">
                          <PageSheetPreview
                            page={page}
                            pageIndex={index}
                            totalPages={pages.length}
                            config={config}
                            scale={1}
                          />
                        </div>

                        <div className="absolute inset-0 bg-slate-950/0 group-hover/thumb:bg-slate-950/25 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover/thumb:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900/90 rounded-lg">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview Page</span>
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate" title={page.name}>
                          {page.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                          {dispW} × {dispH} px · {formatBytes(page.sizeBytes)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setActivePreviewPageId(page.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadSinglePagePdf(page, index)}
                        disabled={exportingSinglePageId === page.id}
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>
                          {exportingSinglePageId === page.id ? 'Saving...' : 'Page PDF'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Settings */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5 lg:sticky lg:top-20">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">PDF Document Settings</h3>
            <p className="text-xs text-slate-500 mt-0.5">Adjust page layout before exporting.</p>
          </div>

          <div>
            <label htmlFor="pdf-file-name" className="block text-xs font-medium text-slate-700 mb-1">
              File Name
            </label>
            <input
              id="pdf-file-name"
              type="text"
              value={config.fileName}
              onChange={(e) => setConfig((prev) => ({ ...prev, fileName: e.target.value }))}
              placeholder="document.pdf"
              className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">Page Size</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'a4', label: 'A4' },
                  { id: 'letter', label: 'US Letter' },
                  { id: 'fit-image', label: 'Fit Image' },
                ] as Array<{ id: PageSizePreset; label: string }>
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, pageSize: item.id }))}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    config.pageSize === item.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {config.pageSize !== 'fit-image' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Orientation</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: 'auto', label: 'Auto' },
                    { id: 'portrait', label: 'Portrait' },
                    { id: 'landscape', label: 'Landscape' },
                  ] as Array<{ id: PageOrientation; label: string }>
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, orientation: item.id }))}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      config.orientation === item.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">Margins</label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'none', label: 'None (0 mm)' },
                  { id: 'standard', label: 'Standard (18 mm)' },
                ] as Array<{ id: MarginPreset; label: string }>
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, margin: item.id }))}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    config.margin === item.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
              <span>Add Page Numbers</span>
              <input
                type="checkbox"
                checked={config.showPageNumbers}
                onChange={(e) => setConfig((prev) => ({ ...prev, showPageNumbers: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            {pages.length > 0 && (
              <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                <span className="text-slate-600 font-medium">Estimated PDF Size</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  ~{formatBytes(estimatedPdfBytes)}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowFullPdfPreview(true)}
              disabled={pages.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors rounded-xl cursor-pointer"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Preview Whole PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportFullPdf}
              disabled={isGeneratingPdf || pages.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors rounded-xl cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>
                {isGeneratingPdf ? 'Compiling PDF...' : `Download PDF (${pages.length})`}
              </span>
            </button>
          </div>
        </aside>
      </div>

      {activePreviewPageId && (
        <PagePreviewModal
          pages={pages}
          activePageId={activePreviewPageId}
          config={config}
          onClose={() => setActivePreviewPageId(null)}
          onSelectPage={(id) => setActivePreviewPageId(id)}
          onUpdatePage={handleUpdatePage}
          onDownloadSinglePagePdf={handleDownloadSinglePagePdf}
          isExportingSingle={exportingSinglePageId === activePreviewPageId}
        />
      )}

      {showFullPdfPreview && (
        <FullDocumentPreviewModal
          pages={pages}
          config={config}
          onClose={() => setShowFullPdfPreview(false)}
          onDownloadFullPdf={handleExportFullPdf}
          isDownloading={isGeneratingPdf}
        />
      )}

      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900">Remove all uploaded images?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to clear all {pages.length} {pages.length === 1 ? 'image' : 'images'}? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setPages([]);
                  setActivePreviewPageId(null);
                  setShowFullPdfPreview(false);
                  setShowClearConfirm(false);
                  setStatusBanner({
                    type: 'success',
                    message: 'All images have been removed from the document queue.',
                  });
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
