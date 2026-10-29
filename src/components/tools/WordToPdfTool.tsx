import React, { useRef, useState } from 'react';
import {
  Download,
  Eye,
  FileDown,
  FileText,
  FileType,
  Plus,
  Settings,
  Upload,
} from 'lucide-react';
import { convertDocxToPdf, DocxParseResult, parseDocxFile, WordToPdfConfig } from '../../utils/docxEngine';
import { formatBytes, triggerBrowserDownload } from '../../utils/pdfEngine';
import { renderAllPdfPagesToImages } from '../../utils/canvasPdfRenderer';
import { UniversalSheetDocumentModal, SheetPageItem } from '../UniversalSheetDocumentModal';

export const WordToPdfTool: React.FC = () => {
  const [parsedDoc, setParsedDoc] = useState<DocxParseResult | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        <div className="p-3 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg">
          {errorMessage}
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
          className="rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 p-8 text-center bg-white transition-all"
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileType className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Convert Word (.docx) to PDF
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload your Microsoft Word document. Text, headings, paragraphs, and structure are cleanly formatted into a publication-ready PDF.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isParsing ? 'Parsing Document...' : 'Choose Word File'}</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Document Preview Sheet */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate" title={parsedDoc.fileName}>
                    {parsedDoc.fileName}
                  </p>
                  <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    {parsedDoc.wordCount.toLocaleString()} Words · {parsedDoc.paragraphs.length} Paragraphs · {formatBytes(parsedDoc.sizeBytes)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setParsedDoc(null)}
                className="text-xs text-slate-500 hover:text-slate-900 hover:underline cursor-pointer"
              >
                Change Document
              </button>
            </div>

            {/* Visual Simulated Document Proof Sheet */}
            <div className="bg-slate-100 p-6 sm:p-8 rounded-xl border border-slate-200 flex justify-center">
              <div className="w-full max-w-2xl bg-white shadow-lg border border-slate-200 rounded p-8 sm:p-12 space-y-5 min-h-[500px]">
                {config.documentTitle.trim() && (
                  <div className="border-b border-slate-200 pb-4">
                    <h1 className="text-xl font-bold text-slate-900 font-display">
                      {config.documentTitle}
                    </h1>
                  </div>
                )}

                <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-[500px] overflow-y-auto pr-2">
                  {parsedDoc.paragraphs.slice(0, 15).map((para, idx) => {
                    const isHeading = para.length < 75 && !para.endsWith('.') && para.length > 3;
                    return (
                      <p
                        key={idx}
                        className={isHeading ? 'font-bold text-slate-900 pt-2 text-sm' : 'text-slate-700'}
                      >
                        {para}
                      </p>
                    );
                  })}
                  {parsedDoc.paragraphs.length > 15 && (
                    <p className="text-xs text-slate-400 italic pt-2 border-t border-slate-100">
                      + {parsedDoc.paragraphs.length - 15} more paragraphs compiled into final PDF
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Conversion Settings & Export */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5 lg:sticky lg:top-20">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">PDF Output Settings</h3>
              <p className="text-xs text-slate-500 mt-0.5">Customize typography and page geometry.</p>
            </div>

            <div>
              <label htmlFor="doc-title" className="block text-xs font-medium text-slate-700 mb-1">
                Document Header Title
              </label>
              <input
                id="doc-title"
                type="text"
                value={config.documentTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, documentTitle: e.target.value }))}
                placeholder="Title printed on header..."
                className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Paper Format</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, pageSize: 'a4' }))}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    config.pageSize === 'a4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ISO A4
                </button>
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, pageSize: 'letter' }))}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    config.pageSize === 'letter' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  US Letter
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Font Size (pt)</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                {[10, 11, 12].map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, fontSizePt: pt }))}
                    className={`py-1.5 text-xs font-mono tabular-nums font-medium rounded-md transition-colors cursor-pointer ${
                      config.fontSizePt === pt ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {pt} pt
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                <span>Add Footer Page Numbers</span>
                <input
                  type="checkbox"
                  checked={config.showPageNumbers}
                  onChange={(e) => setConfig((prev) => ({ ...prev, showPageNumbers: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
              </label>
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <button
                type="button"
                onClick={handlePreviewPdf}
                disabled={isConverting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors rounded-xl cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Preview Formatted PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isConverting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors rounded-xl cursor-pointer shadow-xs"
              >
                <FileDown className="w-4 h-4" />
                <span>{isConverting ? 'Converting Document...' : 'Convert & Download PDF'}</span>
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
