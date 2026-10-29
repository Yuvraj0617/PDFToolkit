import React, { useRef, useState } from 'react';
import {
  CheckSquare,
  Download,
  Eye,
  FileDown,
  FileText,
  Layers,
  Plus,
  Scissors,
  Square,
  Upload,
} from 'lucide-react';
import { extractPdfPages, inspectPdfFile, parsePageRangeString } from '../../utils/pdfLibEngine';
import { formatBytes, triggerBrowserDownload } from '../../utils/pdfEngine';
import { renderAllPdfPagesToImages } from '../../utils/canvasPdfRenderer';
import { UniversalSheetDocumentModal, SheetPageItem } from '../UniversalSheetDocumentModal';

export const SplitPdfTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    name: string;
    sizeBytes: number;
    pageCount: number;
    arrayBuffer: ArrayBuffer;
  } | null>(null);

  const [splitMode, setSplitMode] = useState<'range' | 'single-pages' | 'fixed'>('range');
  const [rangeInput, setRangeInput] = useState<string>('1');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set([1]));
  const [fixedBatchSize, setFixedBatchSize] = useState<number>(2);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<{
    pages: SheetPageItem[];
    blobUrl: string;
    sizeBytes: number;
    fileName: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

      // Default to extracting first page or range 1-N if smaller
      const initialRange = pageCount > 1 ? `1-${Math.min(3, pageCount)}` : '1';
      setRangeInput(initialRange);
      const parsed = parsePageRangeString(initialRange, pageCount);
      setSelectedPages(new Set(parsed));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to read PDF.');
    }
  };

  const handleRangeTextChange = (val: string) => {
    setRangeInput(val);
    if (!selectedFile) return;
    const pages = parsePageRangeString(val, selectedFile.pageCount);
    setSelectedPages(new Set(pages));
  };

  const togglePageSelection = (pageNum: number) => {
    if (!selectedFile) return;
    const next = new Set(selectedPages);
    if (next.has(pageNum)) {
      next.delete(pageNum);
    } else {
      next.add(pageNum);
    }
    setSelectedPages(next);
    // Sync text input
    const sorted = Array.from(next).sort((a, b) => a - b);
    setRangeInput(sorted.join(', '));
  };

  const handleSelectAll = () => {
    if (!selectedFile) return;
    const all = new Set<number>();
    for (let i = 1; i <= selectedFile.pageCount; i++) all.add(i);
    setSelectedPages(all);
    setRangeInput(`1-${selectedFile.pageCount}`);
  };

  const handleDeselectAll = () => {
    setSelectedPages(new Set());
    setRangeInput('');
  };

  const getPagesToExtract = (): number[] => {
    if (!selectedFile) return [];
    if (splitMode === 'range') {
      return Array.from(selectedPages).sort((a, b) => a - b);
    }
    return [];
  };

  const handlePreviewSplit = async () => {
    if (!selectedFile) return;
    const pagesToExtract = getPagesToExtract();
    if (pagesToExtract.length === 0) {
      setErrorMessage('Please select at least one page to extract.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const result = await extractPdfPages(selectedFile.arrayBuffer, pagesToExtract);
      const baseName = selectedFile.name.replace(/\.pdf$/i, '');
      const outName = `${baseName}-extracted.pdf`;

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
      setErrorMessage(err instanceof Error ? err.message : 'Failed to extract pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSplit = async () => {
    if (!selectedFile) return;
    const pagesToExtract = getPagesToExtract();
    if (pagesToExtract.length === 0) {
      setErrorMessage('Please select at least one page to extract.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const result = await extractPdfPages(selectedFile.arrayBuffer, pagesToExtract);
      const baseName = selectedFile.name.replace(/\.pdf$/i, '');
      const outName = `${baseName}-pages-${pagesToExtract.join('-')}.pdf`;
      triggerBrowserDownload(result.blobUrl, outName);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to extract pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSinglePage = async (pageNum: number) => {
    if (!selectedFile) return;
    try {
      setIsProcessing(true);
      const result = await extractPdfPages(selectedFile.arrayBuffer, [pageNum]);
      const baseName = selectedFile.name.replace(/\.pdf$/i, '');
      triggerBrowserDownload(result.blobUrl, `${baseName}-page-${pageNum}.pdf`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to extract page.');
    } finally {
      setIsProcessing(false);
    }
  };

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
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Upload a PDF file to Split or Extract Pages
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Extract custom page ranges (e.g. 1-4, 7), split every page into separate files, or select pages interactively.
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
          {/* Main Page Selection / Split Viewport */}
          <div className="lg:col-span-8 space-y-4">
            {/* File Info Bar */}
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    {selectedFile.pageCount} Pages · {formatBytes(selectedFile.sizeBytes)}
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

            {/* Split Mode Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setSplitMode('range')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  splitMode === 'range' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Select Page Range
              </button>
              <button
                type="button"
                onClick={() => setSplitMode('single-pages')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  splitMode === 'single-pages' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Extract Single Pages
              </button>
            </div>

            {/* Mode 1: Range Selection Grid */}
            {splitMode === 'range' ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Choose Pages to Extract</h3>
                    <p className="text-xs text-slate-500">
                      Click pages to toggle or type ranges like <span className="font-mono">1-3, 5</span> below.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Select All</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Deselect</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="range-input" className="block text-xs font-medium text-slate-700 mb-1">
                    Page Range String
                  </label>
                  <input
                    id="range-input"
                    type="text"
                    value={rangeInput}
                    onChange={(e) => handleRangeTextChange(e.target.value)}
                    placeholder="e.g. 1-3, 5, 8-10"
                    className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Visual Page Chips Grid */}
                <div className="pt-2">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-72 overflow-y-auto p-1">
                    {Array.from({ length: selectedFile.pageCount }, (_, i) => i + 1).map((pageNum) => {
                      const isSelected = selectedPages.has(pageNum);
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => togglePageSelection(pageNum)}
                          className={`p-3 rounded-lg border text-center font-mono text-xs font-semibold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <FileText className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span>p.{pageNum}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Mode 2: Individual Pages List */
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">All Individual Pages ({selectedFile.pageCount})</h3>
                  <span className="text-xs text-slate-500">Download each page independently</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                  {Array.from({ length: selectedFile.pageCount }, (_, i) => i + 1).map((pageNum) => (
                    <div
                      key={pageNum}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                          {pageNum}
                        </span>
                        <span className="text-slate-800 font-medium">Page {pageNum}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadSinglePage(pageNum)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Sidebar */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5 lg:sticky lg:top-20">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Extraction Summary</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ready to extract selected pages into a new PDF.</p>
            </div>

            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-600">
              <div className="flex justify-between">
                <span>Source File:</span>
                <span className="font-medium text-slate-900 truncate max-w-[140px]" title={selectedFile.name}>
                  {selectedFile.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Source Pages:</span>
                <span className="text-slate-900">{selectedFile.pageCount} Pages</span>
              </div>
              <div className="flex justify-between">
                <span>Selected to Extract:</span>
                <span className="font-semibold text-blue-600">
                  {selectedPages.size} {selectedPages.size === 1 ? 'Page' : 'Pages'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-2.5">
              <button
                type="button"
                onClick={handlePreviewSplit}
                disabled={isProcessing || selectedPages.size === 0}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors rounded-xl cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Preview Extracted PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSplit}
                disabled={isProcessing || selectedPages.size === 0}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors rounded-xl cursor-pointer shadow-xs"
              >
                <FileDown className="w-4 h-4" />
                <span>
                  {isProcessing ? 'Extracting...' : `Download Split PDF (${selectedPages.size})`}
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {previewData && (
        <UniversalSheetDocumentModal
          title="Extracted PDF Document"
          fileName={previewData.fileName}
          pages={previewData.pages}
          totalSizeBytes={previewData.sizeBytes}
          pageSizeLabel="Extracted Pages"
          onClose={() => setPreviewData(null)}
          onDownload={() => triggerBrowserDownload(previewData.blobUrl, previewData.fileName)}
        />
      )}
    </div>
  );
};
