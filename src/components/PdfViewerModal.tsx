import React from 'react';
import { Download, FileDown, X } from 'lucide-react';
import { formatBytes, triggerBrowserDownload } from '../utils/pdfEngine';

interface PdfViewerModalProps {
  title: string;
  blobUrl: string;
  fileName: string;
  sizeBytes?: number;
  pageCount?: number;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  title,
  blobUrl,
  fileName,
  sizeBytes,
  pageCount,
  onClose,
}) => {
  const handleDownload = () => {
    triggerBrowserDownload(blobUrl, fileName);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-xs text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label="PDF Document Viewer"
    >
      {/* Top Header */}
      <header className="flex items-center justify-between gap-4 px-6 py-3.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white truncate">{title}</h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
            <span className="truncate">{fileName}</span>
            {pageCount !== undefined && (
              <>
                <span aria-hidden="true">·</span>
                <span>{pageCount} {pageCount === 1 ? 'Page' : 'Pages'}</span>
              </>
            )}
            {sizeBytes !== undefined && (
              <>
                <span aria-hidden="true">·</span>
                <span>{formatBytes(sizeBytes)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close viewer"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Embedded PDF Viewport */}
      <div className="flex-1 w-full h-full bg-slate-900 p-2 sm:p-4">
        <iframe
          src={`${blobUrl}#toolbar=1`}
          title={title}
          className="w-full h-full rounded-lg border border-slate-800 bg-white"
        />
      </div>
    </div>
  );
};
