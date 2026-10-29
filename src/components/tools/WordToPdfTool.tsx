import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileDown,
  FileText,
  FileType,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  convertDocxToPdf,
  DocxParseResult,
  parseDocxFile,
  renderDocxToContainer,
  WordToPdfConfig,
} from '../../utils/docxEngine';
import { formatBytes, triggerBrowserDownload } from '../../utils/pdfEngine';
import { renderAllPdfPagesToImages } from '../../utils/canvasPdfRenderer';
import { UniversalSheetDocumentModal, SheetPageItem } from '../UniversalSheetDocumentModal';

export const WordToPdfTool: React.FC = () => {
  const [parsedDoc, setParsedDoc] = useState<DocxParseResult | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreviewRendering, setIsPreviewRendering] = useState<boolean>(false);

  const [config, setConfig] = useState<WordToPdfConfig>({
    pageSize: 'a4',
    marginsMm: 18,
    fontSizePt: 11,
    lineHeight: 1.5,
    showPageNumbers: true,
    documentTitle: '',
  });

  const [previewData, setPreviewData] = useState<{
    pages: SheetPageItem[];
    blobUrl: string;
    sizeBytes: number;
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const docxContainerRef = useRef<HTMLDivElement | null>(null);

  const handleFileSelected = async (files: FileList | File[]) => {
    const file = Array.from(files).find(
      (f) =>
        f.name.toLowerCase().endsWith('.docx') ||
        f.name.toLowerCase().endsWith('.doc') ||
        f.type.includes('word') ||
        f.type.includes('officedocument')
    );

    if (!file) {
      setErrorMessage('Please select a valid Word document (.docx).');
      return;
    }

    try {
      setIsParsing(true);
      setErrorMessage(null);
      const result = await parseDocxFile(file);
      setParsedDoc(result);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
      setConfig((prev) => ({ ...prev, documentTitle: cleanTitle }));
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to parse Word document.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  // Render authentic Word document proof into preview container
  useEffect(() => {
    if (parsedDoc && docxContainerRef.current) {
      setIsPreviewRendering(true);
      renderDocxToContainer(parsedDoc.arrayBuffer, docxContainerRef.current)
        .catch((err) => {
          console.warn('Live preview render error:', err);
        })
        .finally(() => {
          setIsPreviewRendering(false);
        });
    }
  }, [parsedDoc]);

  const handlePreviewPdf = async () => {
    if (!parsedDoc) return;
    try {
      setIsConverting(true);
      setErrorMessage(null);
      const result = await convertDocxToPdf(parsedDoc, config);
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
        fileName: result.fileName,
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to convert document.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!parsedDoc) return;
    try {
      setIsConverting(true);
      setErrorMessage(null);
      const result = await convertDocxToPdf(parsedDoc, config);
      triggerBrowserDownload(result.blobUrl, result.fileName);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to convert document.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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

      {/* Upload Zone */}
      {!parsedDoc ? (
        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) handleFileSelected(e.dataTransfer.files);
          }}
          className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 p-8 sm:p-12 text-center bg-white dark:bg-slate-900 transition-all"
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <FileType className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                Convert Word (.docx) to PDF
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Converts your Word document with 100% preservation of original fonts, font sizes, headings, tables, bullet points, and exact styling.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800/60">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Exact Visual Appearance &amp; Table Formatting Preserved</span>
            </div>

            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-blue-600 rounded-lg hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Parsing Word Document...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Choose Word File (.docx)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Document Preview Sheet */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={parsedDoc.fileName}>
                    {parsedDoc.fileName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                    {parsedDoc.wordCount.toLocaleString()} Words · {parsedDoc.paragraphs.length} Paragraphs · {formatBytes(parsedDoc.sizeBytes)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Styles Preserved</span>
                </span>

                <button
                  type="button"
                  onClick={() => setParsedDoc(null)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:underline cursor-pointer px-1"
                >
                  Change File
                </button>
              </div>
            </div>

            {/* Visual Authentic Document Proof Sheet */}
            <div className="bg-slate-100 dark:bg-slate-950/80 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center overflow-x-auto min-h-[500px]">
              <div className="w-full flex items-center justify-between pb-3 text-xs font-mono text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 mb-4 max-w-3xl">
                <span>AUTHENTIC WORD DOCUMENT PROOF</span>
                <span>ORIGINAL FONTS &amp; TABLES PRESERVED</span>
              </div>

              {isPreviewRendering && (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-12">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Rendering document layout...</span>
                </div>
              )}

              {/* Render Container for docx-preview */}
              <div
                ref={docxContainerRef}
                className="w-full max-w-3xl bg-white shadow-xl border border-slate-200 rounded p-6 sm:p-10 space-y-4 text-slate-900 docx-preview-host overflow-hidden"
              />
            </div>
          </div>

          {/* Right Sidebar: Conversion Settings & Export */}
          <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5 lg:sticky lg:top-20">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">PDF Output Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">High-fidelity export settings.</p>
            </div>

            {/* Paper Format */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Paper Format</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, pageSize: 'a4' }))}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    config.pageSize === 'a4'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  ISO A4
                </button>
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, pageSize: 'letter' }))}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    config.pageSize === 'letter'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  US Letter
                </button>
              </div>
            </div>

            {/* Document Header Title */}
            <div>
              <label htmlFor="doc-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Document Title (Optional)
              </label>
              <input
                id="doc-title"
                type="text"
                value={config.documentTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, documentTitle: e.target.value }))}
                placeholder="Title for PDF document..."
                className="w-full px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Page Numbers */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Include Footer Page Numbers</span>
                <input
                  type="checkbox"
                  checked={config.showPageNumbers}
                  onChange={(e) => setConfig((prev) => ({ ...prev, showPageNumbers: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
              </label>
            </div>

            {/* Preservation Confirmation Info Box */}
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg space-y-1.5 text-xs text-blue-900 dark:text-blue-300">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Visual Preservation Active</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300/80">
                Original Word typography, font weights, italic styles, table borders, cell widths, and alignments are retained in the exported PDF.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <button
                type="button"
                onClick={handlePreviewPdf}
                disabled={isConverting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors rounded-xl cursor-pointer"
              >
                {isConverting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
                <span>Preview Exported PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isConverting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors rounded-xl cursor-pointer shadow-xs"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering &amp; Converting PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>Convert &amp; Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>
      )}

      {previewData && (
        <UniversalSheetDocumentModal
          title="Converted Word to PDF"
          fileName={previewData.fileName}
          pages={previewData.pages}
          totalSizeBytes={previewData.sizeBytes}
          pageSizeLabel={config.pageSize.toUpperCase()}
          onClose={() => setPreviewData(null)}
          onDownload={() => triggerBrowserDownload(previewData.blobUrl, previewData.fileName)}
        />
      )}
    </div>
  );
};
