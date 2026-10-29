import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  FileDown,
  FilePlus2,
  Files,
  GripVertical,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { inspectPdfFile, mergePdfDocuments, PdfFileItem } from '../../utils/pdfLibEngine';
import { formatBytes, triggerBrowserDownload } from '../../utils/pdfEngine';
import { renderAllPdfPagesToImages } from '../../utils/canvasPdfRenderer';
import { UniversalSheetDocumentModal, SheetPageItem } from '../UniversalSheetDocumentModal';

export const MergePdfTool: React.FC = () => {
  const [pdfFiles, setPdfFiles] = useState<PdfFileItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [outputFileName, setOutputFileName] = useState<string>('merged-document.pdf');
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<{
    pages: SheetPageItem[];
    blobUrl: string;
    sizeBytes: number;
    fileName: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (fileList.length === 0) {
      setErrorMessage('Please select valid PDF files (.pdf).');
      return;
    }

    setErrorMessage(null);
    const loadedItems: PdfFileItem[] = [];

    for (const file of fileList) {
      try {
        const { pageCount, arrayBuffer } = await inspectPdfFile(file);
        loadedItems.push({
          id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          name: file.name,
          sizeBytes: file.size,
          pageCount,
          arrayBuffer,
        });
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? `Failed to load "${file.name}": ${err.message}`
            : `Failed to load "${file.name}".`
        );
      }
    }

    if (loadedItems.length > 0) {
      setPdfFiles((prev) => [...prev, ...loadedItems]);
    }
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    setPdfFiles((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleRemove = (id: string) => {
    setPdfFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePreviewMerge = async () => {
    if (pdfFiles.length === 0) return;
    try {
      setIsMerging(true);
      setErrorMessage(null);
      const result = await mergePdfDocuments(pdfFiles);
      const safeName = outputFileName.toLowerCase().endsWith('.pdf')
        ? outputFileName
        : `${outputFileName}.pdf`;

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
        fileName: safeName,
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to merge PDFs.');
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownloadMerge = async () => {
    if (pdfFiles.length === 0) return;
    try {
      setIsMerging(true);
      setErrorMessage(null);
      const result = await mergePdfDocuments(pdfFiles);
      const safeName = outputFileName.toLowerCase().endsWith('.pdf')
        ? outputFileName
        : `${outputFileName}.pdf`;
      triggerBrowserDownload(result.blobUrl, safeName);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to merge PDFs.');
    } finally {
      setIsMerging(false);
    }
  };

  const totalPages = pdfFiles.reduce((acc, f) => acc + f.pageCount, 0);
  const totalSizeBytes = pdfFiles.reduce((acc, f) => acc + f.sizeBytes, 0);

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf"
        onChange={(e) => {
          if (e.target.files) {
            handleFilesSelected(e.target.files);
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
      <section
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) {
            handleFilesSelected(e.dataTransfer.files);
          }
        }}
        className={`rounded-xl border-2 border-dashed p-8 text-center bg-white transition-all ${
          isDragging ? 'border-blue-600 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Files className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Select or Drop PDF files to Merge
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Combine multiple PDF documents into a single unified file. Arrange files in any order.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Choose PDF Files</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PDF File List */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between px-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">
              {pdfFiles.length} {pdfFiles.length === 1 ? 'File' : 'Files'} in Merge Queue
            </span>
            {pdfFiles.length > 0 && (
              <button
                type="button"
                onClick={() => setPdfFiles([])}
                className="text-xs text-red-600 hover:text-red-700 hover:underline cursor-pointer"
              >
                Clear Queue
              </button>
            )}
          </div>

          {pdfFiles.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 space-y-2">
              <p className="text-sm font-medium text-slate-700">No PDF files added yet</p>
              <p className="text-xs text-slate-500">
                Upload two or more PDF files above to merge them in your preferred sequence.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pdfFiles.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-semibold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                        {item.pageCount} {item.pageCount === 1 ? 'Page' : 'Pages'} · {formatBytes(item.sizeBytes)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0}
                      title="Move Up"
                      className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 1)}
                      disabled={index === pdfFiles.length - 1}
                      title="Move Down"
                      className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      title="Remove"
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Merge Settings & Actions */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5 lg:sticky lg:top-20">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Merge Settings</h3>
            <p className="text-xs text-slate-500 mt-0.5">Configure merged document parameters.</p>
          </div>

          <div>
            <label htmlFor="merge-file-name" className="block text-xs font-medium text-slate-700 mb-1">
              Merged File Name
            </label>
            <input
              id="merge-file-name"
              type="text"
              value={outputFileName}
              onChange={(e) => setOutputFileName(e.target.value)}
              placeholder="merged-document.pdf"
              className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          {pdfFiles.length > 0 && (
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums text-slate-600">
              <div className="flex justify-between">
                <span>Total Files:</span>
                <span className="font-semibold text-slate-900">{pdfFiles.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Pages:</span>
                <span className="font-semibold text-slate-900">{totalPages} Pages</span>
              </div>
              <div className="flex justify-between">
                <span>Combined Size:</span>
                <span className="font-semibold text-slate-900">~{formatBytes(totalSizeBytes)}</span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 space-y-2.5">
            <button
              type="button"
              onClick={handlePreviewMerge}
              disabled={isMerging || pdfFiles.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors rounded-xl cursor-pointer"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Preview Merged PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMerge}
              disabled={isMerging || pdfFiles.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors rounded-xl cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>{isMerging ? 'Merging Documents...' : `Merge & Download PDF`}</span>
            </button>
          </div>
        </aside>
      </div>

      {previewData && (
        <UniversalSheetDocumentModal
          title="Merged PDF Document"
          fileName={previewData.fileName}
          pages={previewData.pages}
          totalSizeBytes={previewData.sizeBytes}
          pageSizeLabel="Merged Document"
          onClose={() => setPreviewData(null)}
          onDownload={() => triggerBrowserDownload(previewData.blobUrl, previewData.fileName)}
        />
      )}
    </div>
  );
};
