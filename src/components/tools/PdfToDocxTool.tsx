import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileDown,
  FileText,
  FileType,
  Layers,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  convertPdfToDocxBlob,
  extractTextFromPdf,
  PdfToDocxConfig,
  PdfToDocxResult,
} from '../../utils/pdfToDocxEngine';
import { formatBytes, triggerBrowserDownload } from '../../utils/pdfEngine';

export const PdfToDocxTool: React.FC = () => {
  const [extractedData, setExtractedData] = useState<PdfToDocxResult | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [customFileName, setCustomFileName] = useState<string>('');

  const [config, setConfig] = useState<PdfToDocxConfig>({
    detectHeadings: true,
    preservePageBreaks: true,
    fontSizePt: 11,
    lineSpacing: 1.5,
  });

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
      setIsExtracting(true);
      setErrorMessage(null);
      const result = await extractTextFromPdf(file);
      setExtractedData(result);
      setActivePageIndex(0);
      setCustomFileName(file.name.replace(/\.pdf$/i, '') + '.docx');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to extract text from PDF.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!extractedData) return;
    try {
      setIsConverting(true);
      setErrorMessage(null);
      const result = await convertPdfToDocxBlob(extractedData, config);
      const finalName = customFileName.trim()
        ? customFileName.endsWith('.docx')
          ? customFileName
          : `${customFileName}.docx`
        : result.fileName;
      triggerBrowserDownload(result.docxBlobUrl, finalName);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to generate Word document.'
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopyText = () => {
    if (!extractedData) return;
    const fullText = extractedData.pages
      .map((p) => `--- Page ${p.pageNumber} ---\n\n` + p.paragraphs.join('\n\n'))
      .join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
        <div className="p-3 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Zone */}
      {!extractedData ? (
        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) handleFileSelected(e.dataTransfer.files);
          }}
          className="rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 p-8 sm:p-12 text-center bg-white transition-all"
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <FileType className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Convert PDF to Word (.docx)
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Extract text, paragraphs, and headings from your PDF and export directly as an editable Microsoft Word document. 100% client-side privacy.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting PDF Content...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Select PDF Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Content: Extracted Document Paper Sheet Proof */}
          <div className="lg:col-span-8 space-y-4">
            {/* Document Meta Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate" title={extractedData.fileName}>
                    {extractedData.fileName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    <span>{extractedData.pageCount} Pages</span>
                    <span aria-hidden="true">·</span>
                    <span>{extractedData.totalWords.toLocaleString()} Words</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatBytes(extractedData.pdfSizeBytes)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 hover:underline cursor-pointer px-1"
                >
                  Change PDF
                </button>
              </div>
            </div>

            {/* Page Navigation Tabs */}
            {extractedData.pages.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {extractedData.pages.map((p, idx) => (
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
                    Page {p.pageNumber} ({p.wordCount} words)
                  </button>
                ))}
              </div>
            )}

            {/* Simulated Word Document Sheet View */}
            <div className="bg-slate-100 p-6 sm:p-8 rounded-xl border border-slate-200 flex justify-center">
              <div className="w-full max-w-2xl bg-white shadow-xl border border-slate-200 rounded-sm p-8 sm:p-12 space-y-4 min-h-[480px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs font-mono text-slate-400">
                  <span>DOCUMENT PREVIEW · PAGE {extractedData.pages[activePageIndex]?.pageNumber} OF {extractedData.pageCount}</span>
                  <span>MICROSOFT WORD (.DOCX)</span>
                </div>

                {extractedData.pages[activePageIndex]?.paragraphs.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs italic">
                    No selectable text detected on this page (it may be a scanned image or empty).
                  </div>
                ) : (
                  <div className="space-y-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {extractedData.pages[activePageIndex]?.paragraphs.map((para, pIdx) => {
                      const isHeader =
                        config.detectHeadings &&
                        para.length < 65 &&
                        !para.endsWith('.') &&
                        para.length > 3;

                      if (isHeader) {
                        return (
                          <h3
                            key={pIdx}
                            className="font-bold text-slate-900 text-sm sm:text-base pt-2 font-display text-blue-950"
                          >
                            {para}
                          </h3>
                        );
                      }

                      return (
                        <p key={pIdx} className="text-slate-700">
                          {para}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Conversion Settings & Export */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5 lg:sticky lg:top-20">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Word Document Options</h3>
              <p className="text-xs text-slate-500 mt-0.5">Customize Word layout and formatting.</p>
            </div>

            {/* Custom Output Filename */}
            <div>
              <label htmlFor="docx-filename" className="block text-xs font-medium text-slate-700 mb-1">
                Output File Name
              </label>
              <input
                id="docx-filename"
                type="text"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="document.docx"
                className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Heading Detection */}
            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                <span className="space-y-0.5">
                  <span className="block font-semibold text-slate-900">Auto-Detect Headings</span>
                  <span className="block text-[11px] text-slate-500">Apply Word Heading 2 styles</span>
                </span>
                <input
                  type="checkbox"
                  checked={config.detectHeadings}
                  onChange={(e) => setConfig((prev) => ({ ...prev, detectHeadings: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
              </label>
            </div>

            {/* Page Breaks */}
            <div>
              <label className="flex items-center justify-between text-xs font-medium text-slate-700 cursor-pointer">
                <span className="space-y-0.5">
                  <span className="block font-semibold text-slate-900">Preserve Page Breaks</span>
                  <span className="block text-[11px] text-slate-500">Insert page breaks between PDF pages</span>
                </span>
                <input
                  type="checkbox"
                  checked={config.preservePageBreaks}
                  onChange={(e) => setConfig((prev) => ({ ...prev, preservePageBreaks: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
              </label>
            </div>

            {/* Font Size */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <label className="block text-xs font-medium text-slate-700">Body Font Size</label>
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

            {/* Summary Telemetry */}
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-600">
              <div className="flex justify-between">
                <span>Output Format:</span>
                <span className="font-semibold text-blue-600">.DOCX (Word)</span>
              </div>
              <div className="flex justify-between">
                <span>Total Words:</span>
                <span className="text-slate-900">{extractedData.totalWords.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Pages Processed:</span>
                <span className="text-slate-900">{extractedData.pageCount} Pages</span>
              </div>
            </div>

            {/* Download Button */}
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleDownloadDocx}
                disabled={isConverting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors rounded-xl cursor-pointer shadow-xs"
              >
                <FileDown className="w-4 h-4" />
                <span>{isConverting ? 'Generating .DOCX...' : 'Convert & Download DOCX'}</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
