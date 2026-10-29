import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileArchive,
  FileDown,
  FileText,
  Gauge,
  Layers,
  Minimize2,
  Plus,
  RefreshCw,
  Settings2,
  Sliders,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  CompressionOptions,
  CompressionPreset,
  CompressPdfResult,
  compressPdfDocument,
  inspectPdfForCompression,
  PRESET_CONFIGS,
} from '../../utils/compressPdfEngine';
import { formatBytes, triggerBrowserDownload } from '../../utils/pdfEngine';
import { renderAllPdfPagesToImages, RenderedPageCanvas } from '../../utils/canvasPdfRenderer';
import { UniversalSheetDocumentModal, SheetPageItem } from '../UniversalSheetDocumentModal';

export const CompressPdfTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    name: string;
    sizeBytes: number;
    pageCount: number;
    arrayBuffer: ArrayBuffer;
  } | null>(null);

  const [preset, setPreset] = useState<CompressionPreset>('balanced');
  const [customDpi, setCustomDpi] = useState<number>(144);
  const [customQuality, setCustomQuality] = useState<number>(0.75);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [customFileName, setCustomFileName] = useState<string>('');

  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressProgress, setCompressProgress] = useState<{ current: number; total: number; message: string }>({
    current: 0,
    total: 0,
    message: '',
  });

  const [compressResult, setCompressResult] = useState<CompressPdfResult | null>(null);
  const [renderedCompressedPages, setRenderedCompressedPages] = useState<RenderedPageCanvas[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Universal sheet document preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelected = async (files: FileList | File[]) => {
    const file = Array.from(files).find(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (!file) {
      setErrorMessage('Please select a valid PDF file (.pdf).');
      return;
    }

    try {
      setErrorMessage(null);
      setCompressResult(null);
      setRenderedCompressedPages([]);
      setActivePageIndex(0);

      const { pageCount, sizeBytes, arrayBuffer } = await inspectPdfForCompression(file);
      setSelectedFile({
        file,
        name: file.name,
        sizeBytes,
        pageCount,
        arrayBuffer,
      });

      const baseName = file.name.replace(/\.pdf$/i, '');
      setCustomFileName(`${baseName}-compressed.pdf`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to inspect PDF file.');
    }
  };

  const handleRunCompression = async () => {
    if (!selectedFile) return;

    try {
      setIsCompressing(true);
      setErrorMessage(null);
      setCompressProgress({ current: 0, total: selectedFile.pageCount, message: 'Starting compression...' });

      const options: CompressionOptions = {
        preset,
        dpi: customDpi,
        quality: customQuality,
        grayscale,
      };

      const result = await compressPdfDocument(
        selectedFile.arrayBuffer,
        selectedFile.name,
        options,
        (current, total, phase) => {
          setCompressProgress({ current, total, message: phase });
        }
      );

      setCompressResult(result);

      // Render compressed pages for preview
      setCompressProgress({
        current: result.pageCount,
        total: result.pageCount,
        message: 'Preparing document preview...',
      });
      const pages = await renderAllPdfPagesToImages(result.blob);
      setRenderedCompressedPages(pages);
      setActivePageIndex(0);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Compression failed.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressResult) return;
    const finalName = customFileName.trim()
      ? customFileName.endsWith('.pdf')
        ? customFileName
        : `${customFileName}.pdf`
      : compressResult.fileName;
    triggerBrowserDownload(compressResult.blobUrl, finalName);
  };

  const sheetPages: SheetPageItem[] = renderedCompressedPages.map((p) => ({
    pageNumber: p.pageNumber,
    dataUrl: p.dataUrl,
    width: p.width,
    height: p.height,
    title: `Page ${p.pageNumber}`,
  }));

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
        <div className="p-3 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Drop Zone when no file is loaded */}
      {!selectedFile ? (
        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) handleFileSelected(e.dataTransfer.files);
          }}
          className="rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 p-8 sm:p-14 text-center bg-white transition-all shadow-2xs"
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <Minimize2 className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Compress PDF Document
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Reduce PDF file size by up to 85% while preserving sharp readability and image clarity. 100% private in-browser compression.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Select PDF Document</span>
              </button>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-3 text-left border-t border-slate-100">
              <div className="space-y-0.5">
                <span className="block text-[11px] font-semibold text-slate-800">Adaptive Quality</span>
                <span className="block text-[10px] text-slate-400">Balanced, Extreme & Gentle presets</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[11px] font-semibold text-slate-800">Email Ready</span>
                <span className="block text-[10px] text-slate-400">Fits strict portal upload limits</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[11px] font-semibold text-slate-800">Zero Uploads</span>
                <span className="block text-[10px] text-slate-400">Files never leave your browser</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Left Workspace (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Document Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    <span>{selectedFile.pageCount} {selectedFile.pageCount === 1 ? 'Page' : 'Pages'}</span>
                    <span aria-hidden="true">·</span>
                    <span>Original: {formatBytes(selectedFile.sizeBytes)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Change PDF
                </button>
              </div>
            </div>

            {/* In-Progress Compression Loader */}
            {isCompressing && (
              <div className="p-6 bg-white border border-blue-200 rounded-xl shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2 text-blue-900 font-semibold">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>{compressProgress.message}</span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-500">
                    {compressProgress.total > 0
                      ? `${Math.round((compressProgress.current / compressProgress.total) * 100)}%`
                      : ''}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                    style={{
                      width: `${
                        compressProgress.total > 0
                          ? Math.min(100, Math.round((compressProgress.current / compressProgress.total) * 100))
                          : 15
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Compression Completed Stats Card */}
            {compressResult && !isCompressing && (
              <div className="p-5 bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-xl shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {compressResult.isAlreadyCompact
                          ? 'Document Already Compact'
                          : 'Compression Complete!'}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {compressResult.isAlreadyCompact
                          ? 'This PDF was already optimized. Structural stream packing applied.'
                          : `Successfully reduced file size by ${compressResult.savingsPercent}%.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPreviewModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>Preview Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download ({formatBytes(compressResult.compressedSizeBytes)})</span>
                    </button>
                  </div>
                </div>

                {/* Numeric Comparison Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-200/60 font-mono tabular-nums">
                  <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-lg border border-emerald-100">
                    <span className="block text-[11px] text-slate-500 font-sans">Original Size</span>
                    <span className="block text-sm font-semibold text-slate-900">
                      {formatBytes(compressResult.originalSizeBytes)}
                    </span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-lg border border-emerald-100">
                    <span className="block text-[11px] text-slate-500 font-sans">Compressed Size</span>
                    <span className="block text-sm font-semibold text-emerald-700">
                      {formatBytes(compressResult.compressedSizeBytes)}
                    </span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-lg border border-emerald-100">
                    <span className="block text-[11px] text-slate-500 font-sans">Data Saved</span>
                    <span className="block text-sm font-semibold text-emerald-700">
                      {formatBytes(compressResult.savingsBytes)}
                    </span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-lg border border-emerald-100">
                    <span className="block text-[11px] text-slate-500 font-sans">Reduction</span>
                    <span className="block text-sm font-bold text-emerald-800">
                      {compressResult.savingsPercent > 0 ? `-${compressResult.savingsPercent}%` : 'Optimal'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Document Preview Canvas Area */}
            {renderedCompressedPages.length > 0 ? (
              <div className="space-y-3">
                {/* Page Navigation Tabs */}
                {renderedCompressedPages.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {renderedCompressedPages.map((p, idx) => (
                      <button
                        key={p.pageNumber}
                        type="button"
                        onClick={() => setActivePageIndex(idx)}
                        className={`px-3 py-1.5 text-xs font-mono tabular-nums font-medium rounded-lg border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          activePageIndex === idx
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Page {p.pageNumber}
                      </button>
                    ))}
                  </div>
                )}

                {/* Simulated Paper Sheet Proof */}
                <div className="bg-slate-100 p-6 sm:p-8 rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[460px]">
                  <div className="w-full max-w-2xl bg-white shadow-xl border border-slate-200 rounded-sm overflow-hidden transition-all">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-mono text-slate-500">
                      <span>COMPRESSED SHEET · PAGE {renderedCompressedPages[activePageIndex]?.pageNumber} OF {renderedCompressedPages.length}</span>
                      <button
                        type="button"
                        onClick={() => setShowPreviewModal(true)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Fullscreen Continuous Proof</span>
                      </button>
                    </div>

                    <div className="p-4 sm:p-6 flex justify-center bg-slate-50/50">
                      {renderedCompressedPages[activePageIndex] && (
                        <img
                          src={renderedCompressedPages[activePageIndex].dataUrl}
                          alt={`Compressed Page ${renderedCompressedPages[activePageIndex].pageNumber}`}
                          className="max-h-[640px] w-auto object-contain shadow-sm border border-slate-200 rounded-sm"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Ready to compress guidance card */
              <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Gauge className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Ready to Compress
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Select a compression preset on the right and click <strong>Compress Document</strong>. FolioPress will calculate the optimal reduction while retaining maximum text and graphics clarity.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleRunCompression}
                    disabled={isCompressing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors rounded-lg cursor-pointer shadow-xs"
                  >
                    <Minimize2 className="w-4 h-4" />
                    <span>Compress Document Now</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Presets & Controls (4 cols) */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-5 lg:sticky lg:top-20 shadow-2xs">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Compression Level</h3>
              <p className="text-xs text-slate-500 mt-0.5">Choose your preferred balance of file size & quality.</p>
            </div>

            {/* Presets List */}
            <div className="space-y-2">
              {(['balanced', 'extreme', 'gentle', 'lossless'] as const).map((key) => {
                const conf = PRESET_CONFIGS[key];
                const isSelected = preset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPreset(key)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/30'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-semibold ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                        {conf.label}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        {conf.estimatedSavings}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {conf.description}
                    </p>
                  </button>
                );
              })}

              {/* Custom Preset Button */}
              <button
                type="button"
                onClick={() => setPreset('custom')}
                className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                  preset === 'custom'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/30'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-semibold ${preset === 'custom' ? 'text-blue-950' : 'text-slate-900'}`}>
                    Custom Settings
                  </span>
                  <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Fine-tune resolution DPI, JPEG quality factor, and monochrome filter.
                </p>
              </button>
            </div>

            {/* Custom Settings Sliders */}
            {preset === 'custom' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3.5">
                {/* DPI Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Resolution (DPI)</span>
                    <span className="font-mono tabular-nums text-slate-900 font-semibold">{customDpi} DPI</span>
                  </div>
                  <input
                    type="range"
                    min="72"
                    max="220"
                    step="12"
                    value={customDpi}
                    onChange={(e) => setCustomDpi(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>72 (Compact)</span>
                    <span>144 (Standard)</span>
                    <span>220 (High)</span>
                  </div>
                </div>

                {/* Quality Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Image Quality</span>
                    <span className="font-mono tabular-nums text-slate-900 font-semibold">{Math.round(customQuality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.30"
                    max="0.95"
                    step="0.05"
                    value={customQuality}
                    onChange={(e) => setCustomQuality(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>30% (Low)</span>
                    <span>75% (Medium)</span>
                    <span>95% (Max)</span>
                  </div>
                </div>

                {/* Grayscale Toggle */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                    <span className="space-y-0.5">
                      <span className="block font-semibold text-slate-900">Convert to Grayscale</span>
                      <span className="block text-[11px] text-slate-500">Extra ~30% reduction for B&W docs</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={grayscale}
                      onChange={(e) => setGrayscale(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Custom Output Filename */}
            <div>
              <label htmlFor="compress-filename" className="block text-xs font-medium text-slate-700 mb-1">
                Output File Name
              </label>
              <input
                id="compress-filename"
                type="text"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="document-compressed.pdf"
                className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleRunCompression}
                disabled={isCompressing}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors rounded-lg cursor-pointer shadow-xs"
              >
                {isCompressing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Compressing ({compressProgress.total > 0 ? `${compressProgress.current}/${compressProgress.total}` : '...'})</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    <span>{compressResult ? 'Re-Compress with Current Preset' : 'Compress Document'}</span>
                  </>
                )}
              </button>

              {compressResult && !isCompressing && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors rounded-lg cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Compressed PDF</span>
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Universal Document Preview Modal */}
      {showPreviewModal && compressResult && (
        <UniversalSheetDocumentModal
          title="Compressed PDF Preview"
          fileName={customFileName || compressResult.fileName}
          pages={sheetPages}
          totalSizeBytes={compressResult.compressedSizeBytes}
          pageSizeLabel="Optimized PDF"
          onClose={() => setShowPreviewModal(false)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};
