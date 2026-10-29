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
  Type,
  Upload,
} from 'lucide-react';
import {
  convertPdfToDocxBlob,
  extractTextFromPdf,
  PdfToDocxConfig,
  PdfToDocxResult,
  StyledParagraph,
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
    lineSpacing: 1.25,
    preserveOriginalFonts: true,
    preserveExactSizes: true,
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
      setConfig((prev) => ({
        ...prev,
        fontSizePt: result.detectedBodyFontSize || 11,
      }));
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

  const activePage = extractedData?.pages[activePageIndex];

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
          className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 p-8 sm:p-12 text-center bg-white dark:bg-slate-900 transition-all"
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <FileType className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                Convert PDF to Word (.docx)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Extracts content with full preservation of original fonts, exact font sizes, bold weights, italic formatting, alignments, and headings into editable Microsoft Word (.docx).
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800/60">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Font Faces, Sizes, Bold &amp; Slants Preserved</span>
            </div>

            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-blue-600 rounded-lg hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting PDF Typography &amp; Content...</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={extractedData.fileName}>
                    {extractedData.fileName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                    <span>{extractedData.pageCount} Pages</span>
                    <span aria-hidden="true">·</span>
                    <span>{extractedData.totalWords.toLocaleString()} Words</span>
                    <span aria-hidden="true">·</span>
                    <span>Font: {extractedData.detectedPrimaryFont}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatBytes(extractedData.pdfSizeBytes)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
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
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:underline cursor-pointer px-1"
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
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Page {p.pageNumber} ({p.wordCount} words)
                  </button>
                ))}
              </div>
            )}

            {/* Authentic Word Document Sheet View with Preserved Fonts & Sizes */}
            <div className="bg-slate-100 dark:bg-slate-950/80 p-4 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-center">
              <div className="w-full max-w-2xl bg-white shadow-xl border border-slate-200 rounded-sm p-8 sm:p-12 space-y-4 min-h-[500px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs font-mono text-slate-400">
                  <span>
                    WORD PROOF · PAGE {activePage?.pageNumber} OF {extractedData.pageCount}
                  </span>
                  <span>PRESERVED TYPOGRAPHY &amp; STYLES</span>
                </div>

                {!activePage || activePage.styledParagraphs.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs italic">
                    No selectable text detected on this page (it may be a scanned image or empty).
                  </div>
                ) : (
                  <div className="space-y-3.5 leading-relaxed text-slate-800">
                    {activePage.styledParagraphs.map((para: StyledParagraph, pIdx: number) => {
                      const textAlignClass =
                        para.alignment === 'center'
                          ? 'text-center'
                          : para.alignment === 'right'
                          ? 'text-right'
                          : 'text-left';

                      return (
                        <div
                          key={pIdx}
                          className={`${textAlignClass} transition-all`}
                          style={{
                            marginTop: `${para.spacingBefore}px`,
                            marginBottom: `${para.spacingAfter}px`,
                          }}
                        >
                          {para.runs.map((run, rIdx) => {
                            const fontStyle = {
                              fontFamily: config.preserveOriginalFonts
                                ? `"${run.fontFamily}", Calibri, sans-serif`
                                : undefined,
                              fontSize: config.preserveExactSizes
                                ? `${Math.max(10, run.fontSizePt)}pt`
                                : `${config.fontSizePt}pt`,
                              fontWeight: run.bold ? 700 : 400,
                              fontStyle: run.italic ? 'italic' : 'normal',
                            };

                            return (
                              <span key={rIdx} style={fontStyle} className="inline text-slate-800">
                                {run.text}
                              </span>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Conversion Settings & Export */}
          <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5 lg:sticky lg:top-20">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Word Document Options</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">High-fidelity conversion settings.</p>
            </div>

            {/* Custom Output Filename */}
            <div>
              <label htmlFor="docx-filename" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Output File Name
              </label>
              <input
                id="docx-filename"
                type="text"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="document.docx"
                className="w-full px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Preserve Original Fonts Toggle */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <span className="space-y-0.5">
                  <span className="block font-semibold text-slate-900 dark:text-slate-100">Preserve Original Fonts</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Retain {extractedData.detectedPrimaryFont} and font faces
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={config.preserveOriginalFonts}
                  onChange={(e) => setConfig((prev) => ({ ...prev, preserveOriginalFonts: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
              </label>
            </div>

            {/* Preserve Exact Font Sizes Toggle */}
            <div>
              <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <span className="space-y-0.5">
                  <span className="block font-semibold text-slate-900 dark:text-slate-100">Preserve Exact Font Sizes</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Match original PDF point sizes per word/header
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={config.preserveExactSizes}
                  onChange={(e) => setConfig((prev) => ({ ...prev, preserveExactSizes: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
              </label>
            </div>

            {/* Heading Detection */}
            <div>
              <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <span className="space-y-0.5">
                  <span className="block font-semibold text-slate-900 dark:text-slate-100">Auto-Detect Headings</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">Apply Word Heading styles</span>
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
              <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <span className="space-y-0.5">
                  <span className="block font-semibold text-slate-900 dark:text-slate-100">Preserve Page Breaks</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">Insert breaks between PDF pages</span>
                </span>
                <input
                  type="checkbox"
                  checked={config.preservePageBreaks}
                  onChange={(e) => setConfig((prev) => ({ ...prev, preservePageBreaks: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                />
              </label>
            </div>

            {/* Summary Telemetry */}
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Output Format:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">.DOCX (Word)</span>
              </div>
              <div className="flex justify-between">
                <span>Primary Font:</span>
                <span className="text-slate-900 dark:text-slate-200">{extractedData.detectedPrimaryFont}</span>
              </div>
              <div className="flex justify-between">
                <span>Body Size:</span>
                <span className="text-slate-900 dark:text-slate-200">{extractedData.detectedBodyFontSize} pt</span>
              </div>
              <div className="flex justify-between">
                <span>Total Words:</span>
                <span className="text-slate-900 dark:text-slate-200">{extractedData.totalWords.toLocaleString()}</span>
              </div>
            </div>

            {/* Download Button */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleDownloadDocx}
                disabled={isConverting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors rounded-xl cursor-pointer shadow-xs"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Compiling .DOCX with Fonts &amp; Styles...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>Convert &amp; Download DOCX</span>
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
