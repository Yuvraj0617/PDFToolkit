import React, { useRef, useState } from 'react';
import {
  Download,
  Eye,
  FileDown,
  FileEdit,
  FileText,
  Plus,
  RotateCw,
  Stamp,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import { editPdfDocument, EditPdfOptions, inspectPdfFile } from '../../utils/pdfLibEngine';
import { formatBytes, triggerBrowserDownload } from '../../utils/pdfEngine';
import { renderAllPdfPagesToImages } from '../../utils/canvasPdfRenderer';
import { UniversalSheetDocumentModal, SheetPageItem } from '../UniversalSheetDocumentModal';

export const EditPdfTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    name: string;
    sizeBytes: number;
    pageCount: number;
    arrayBuffer: ArrayBuffer;
  } | null>(null);

  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [removedPages, setRemovedPages] = useState<Set<number>>(new Set());

  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [enableWatermark, setEnableWatermark] = useState<boolean>(false);
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.18);

  const [headerText, setHeaderText] = useState<string>('');
  const [footerText, setFooterText] = useState<string>('');
  const [addPageNumbers, setAddPageNumbers] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [previewData, setPreviewData] = useState<{
    pages: SheetPageItem[];
    blobUrl: string;
    sizeBytes: number;
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelected = async (files: FileList | File[]) => {
    const file = Array.from(files).find(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (!file) {
      setErrorMessage('Please select a valid PDF file.');
      return;
    }

    try {
      setErrorMessage(null);
      const { pageCount, arrayBuffer } = await inspectPdfFile(file);
      setSelectedFile({
        file,
        name: file.name,
        sizeBytes: file.size,
        pageCount,
        arrayBuffer,
      });
      setPageRotations({});
      setRemovedPages(new Set());
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to read PDF document.');
    }
  };

  const handleRotatePage = (pageIndex: number) => {
    setPageRotations((prev) => {
      const current = prev[pageIndex] || 0;
      return { ...prev, [pageIndex]: (current + 90) % 360 };
    });
  };

  const handleToggleRemovePage = (pageIndex: number) => {
    setRemovedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageIndex)) {
        next.delete(pageIndex);
      } else {
        next.add(pageIndex);
      }
      return next;
    });
  };

  const buildEditOptions = (): EditPdfOptions => ({
    pageRotations,
    removedPages,
    watermarkText: enableWatermark ? watermarkText : undefined,
    watermarkOpacity,
    headerText: headerText.trim() ? headerText : undefined,
    footerText: footerText.trim() ? footerText : undefined,
    addPageNumbers,
  });

  const handlePreviewEditedPdf = async () => {
    if (!selectedFile) return;
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const options = buildEditOptions();
      const result = await editPdfDocument(selectedFile.arrayBuffer, options);
      const base = selectedFile.name.replace(/\.pdf$/i, '');
      const outName = `${base}-edited.pdf`;

      const renderedPages = await renderAllPdfPagesToImages(result.blob);

      setPreviewData({
        pages: renderedPages.map((p) => ({
          pageNumber: p.pageNumber,
          dataUrl: p.dataUrl,
          width: p.width,
          height: p.height,
        })),
        blobUrl: result.blobUrl,
        sizeBytes: result.sizeBytes,
        fileName: outName,
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to edit PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadEditedPdf = async () => {
    if (!selectedFile) return;
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const options = buildEditOptions();
      const result = await editPdfDocument(selectedFile.arrayBuffer, options);
      const base = selectedFile.name.replace(/\.pdf$/i, '');
      triggerBrowserDownload(result.blobUrl, `${base}-edited.pdf`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to edit PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const activePageCount = selectedFile
    ? selectedFile.pageCount - removedPages.size
    : 0;

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={(e) => {
          if (e.target.files) {
            handleFileSelected(e.target.files);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {errorMessage && (
        <div className="p-3 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Upload Zone */}
      {!selectedFile ? (
        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) handleFileSelected(e.dataTransfer.files);
          }}
          className="rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 p-8 text-center bg-white transition-all"
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileEdit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Upload a PDF to Edit, Rotate & Stamp
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Rotate pages, remove pages, add custom watermarks, header annotations, and automatic page numbers.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Select PDF File</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Pages Organizer */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    {activePageCount} of {selectedFile.pageCount} Pages Active · {formatBytes(selectedFile.sizeBytes)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-xs text-slate-500 hover:text-slate-900 hover:underline cursor-pointer"
              >
                Change PDF
              </button>
            </div>

            {/* Pages Grid with Rotate & Delete Actions */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Manage Document Pages</h3>
                <span className="text-xs text-slate-500">Rotate or remove individual pages</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto p-1">
                {Array.from({ length: selectedFile.pageCount }, (_, i) => i).map((pageIdx) => {
                  const isRemoved = removedPages.has(pageIdx);
                  const rotation = pageRotations[pageIdx] || 0;

                  return (
                    <div
                      key={pageIdx}
                      className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                        isRemoved
                          ? 'border-dashed border-slate-200 bg-slate-50 opacity-55'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold text-slate-900">
                          p.{pageIdx + 1}
                        </span>
                        {rotation > 0 && !isRemoved && (
                          <span className="text-[11px] text-blue-600 bg-blue-50 px-1 rounded">
                            {rotation}°
                          </span>
                        )}
                        {isRemoved && (
                          <span className="text-[11px] text-red-600 bg-red-50 px-1 rounded">
                            Excluded
                          </span>
                        )}
                      </div>

                      {/* Paper Placeholder representation */}
                      <div className="my-3 h-28 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200/60 overflow-hidden">
                        <div
                          className="w-16 h-20 bg-white shadow-xs rounded border border-slate-300 flex items-center justify-center transition-transform"
                          style={{ transform: `rotate(${rotation}deg)` }}
                        >
                          <FileText className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleRotatePage(pageIdx)}
                          disabled={isRemoved}
                          title="Rotate 90° Clockwise"
                          className="inline-flex items-center gap-1 p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer text-xs"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Rotate</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleRemovePage(pageIdx)}
                          title={isRemoved ? 'Restore Page' : 'Remove Page'}
                          className={`p-1 rounded cursor-pointer text-xs ${
                            isRemoved
                              ? 'text-blue-600 hover:bg-blue-50'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {isRemoved ? <Undo2 className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Watermark, Annotations, Export */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5 lg:sticky lg:top-20">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Document Annotations</h3>
              <p className="text-xs text-slate-500 mt-0.5">Apply watermark stamps, headers, and numbering.</p>
            </div>

            {/* Watermark Section */}
            <div className="space-y-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-900 cursor-pointer">
                <span className="flex items-center gap-1.5">
                  <Stamp className="w-3.5 h-3.5 text-blue-600" />
                  <span>Diagonal Watermark</span>
                </span>
                <input
                  type="checkbox"
                  checked={enableWatermark}
                  onChange={(e) => setEnableWatermark(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
              </label>

              {enableWatermark && (
                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="e.g. CONFIDENTIAL, DRAFT"
                    className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Opacity: {Math.round(watermarkOpacity * 100)}%</span>
                    <input
                      type="range"
                      min="0.08"
                      max="0.5"
                      step="0.02"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-28 accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Header & Footer Text */}
            <div className="space-y-3">
              <div>
                <label htmlFor="header-text" className="block text-xs font-medium text-slate-700 mb-1">
                  Top Header Text
                </label>
                <input
                  id="header-text"
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="e.g. Project Archive · Version 2.0"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label htmlFor="footer-text" className="block text-xs font-medium text-slate-700 mb-1">
                  Bottom Footer Text
                </label>
                <input
                  id="footer-text"
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="e.g. Internal Use Only"
                  className="w-full px-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                <span>Add Page Numbers (Page 1 of N)</span>
                <input
                  type="checkbox"
                  checked={addPageNumbers}
                  onChange={(e) => setAddPageNumbers(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
              </label>
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <button
                type="button"
                onClick={handlePreviewEditedPdf}
                disabled={isProcessing || activePageCount === 0}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors rounded-xl cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Preview Edited PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadEditedPdf}
                disabled={isProcessing || activePageCount === 0}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors rounded-xl cursor-pointer shadow-xs"
              >
                <FileDown className="w-4 h-4" />
                <span>{isProcessing ? 'Processing PDF...' : `Save & Download PDF (${activePageCount})`}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {previewData && (
        <UniversalSheetDocumentModal
          title="Edited PDF Document"
          fileName={previewData.fileName}
          pages={previewData.pages}
          totalSizeBytes={previewData.sizeBytes}
          pageSizeLabel="Edited Document"
          onClose={() => setPreviewData(null)}
          onDownload={() => triggerBrowserDownload(previewData.blobUrl, previewData.fileName)}
        />
      )}
    </div>
  );
};
