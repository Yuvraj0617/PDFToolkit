import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  FileEdit,
  Files,
  FileText,
  FileType,
  Image as ImageIcon,
  Images,
  Minimize2,
  Scissors,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { ToolkitCategory, ToolkitTab } from '../App';

interface ConditionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ToolkitTab;
  onSelectTool: (toolId: ToolkitTab) => void;
}

interface ConditionItem {
  id: ToolkitTab;
  category: ToolkitCategory;
  categoryTitle: string;
  name: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  scenario: string;
  example: string;
  inputOutput: string;
}

const CONDITIONS: ConditionItem[] = [
  // Section 1: Convert & Export
  {
    id: 'image-to-pdf',
    category: 'convert',
    categoryTitle: 'Convert & Export',
    name: 'Image to PDF',
    badge: 'Photos to PDF',
    icon: ImageIcon,
    scenario: 'You have photos, receipts, ID scans, or screenshots that need to be packaged into a single printable document.',
    example: 'E.g., mobile camera photos, scanned invoice receipts, or photo portfolios.',
    inputOutput: 'JPG, PNG, WebP → PDF',
  },
  {
    id: 'pdf-to-image',
    category: 'convert',
    categoryTitle: 'Convert & Export',
    name: 'PDF to Image',
    badge: 'Extract to JPG/PNG',
    icon: Images,
    scenario: 'You need image files of document pages to post online, paste into slides, or share on messaging apps.',
    example: 'E.g., download page 1 for a cover photo, extract pages 2–5, or download all as a ZIP.',
    inputOutput: 'PDF → JPG, PNG, WebP',
  },
  {
    id: 'word-to-pdf',
    category: 'convert',
    categoryTitle: 'Convert & Export',
    name: 'Word to PDF',
    badge: 'DOCX to PDF',
    icon: FileType,
    scenario: 'You have a Microsoft Word (.docx) document and want to export it as a locked, publication-ready PDF with fonts and layout preserved.',
    example: 'E.g., final contracts, resumes, term papers, and legal forms.',
    inputOutput: 'DOCX → PDF',
  },
  {
    id: 'pdf-to-docx',
    category: 'convert',
    categoryTitle: 'Convert & Export',
    name: 'PDF to Word',
    badge: 'PDF to DOCX',
    icon: FileText,
    scenario: 'You received a PDF and need to edit the text, copy formatted sections, or make changes inside Microsoft Word.',
    example: 'E.g., updating an existing resume, revising agreement clauses, or extracting report text.',
    inputOutput: 'PDF → Editable DOCX',
  },

  // Section 2: Organize & Pages
  {
    id: 'merge-pdf',
    category: 'organize',
    categoryTitle: 'Organize & Pages',
    name: 'Merge PDF',
    badge: 'Combine Files',
    icon: Files,
    scenario: 'You have multiple separate PDF files and want to combine them into one sequential file in custom order.',
    example: 'E.g., joining cover page + financial statements + appendix into one presentation.',
    inputOutput: 'Multiple PDFs → Single PDF',
  },
  {
    id: 'split-pdf',
    category: 'organize',
    categoryTitle: 'Organize & Pages',
    name: 'Split PDF',
    badge: 'Extract Pages',
    icon: Scissors,
    scenario: 'A document is too long or you only need specific pages (e.g. pages 1–4, or extract each page into its own file).',
    example: 'E.g., extracting just your signed signature page or pulling chapter 2 from an eBook.',
    inputOutput: '1 PDF → Extracted Pages',
  },

  // Section 3: Optimize & Edit
  {
    id: 'compress-pdf',
    category: 'optimize',
    categoryTitle: 'Optimize & Edit',
    name: 'Compress PDF',
    badge: 'Reduce File Size',
    icon: Minimize2,
    scenario: 'Your PDF file is too large to email (e.g. > 25MB) or upload to job portals, visa applications, or websites.',
    example: 'E.g., reducing a 45MB scanned document down to 4.2MB while keeping text sharp and readable.',
    inputOutput: 'Heavy PDF → Compressed PDF',
  },
  {
    id: 'edit-pdf',
    category: 'optimize',
    categoryTitle: 'Optimize & Edit',
    name: 'Edit PDF',
    badge: 'Rotate & Stamp',
    icon: FileEdit,
    scenario: 'Some pages were scanned upside-down or sideways, or you need to stamp a "CONFIDENTIAL" watermark or page numbers.',
    example: 'E.g., rotate landscape page 3 by 90°, remove blank page 5, and stamp company watermarks.',
    inputOutput: 'PDF → Cleaned / Watermarked PDF',
  },
];

export const ConditionGuideModal: React.FC<ConditionGuideModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTool,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = CONDITIONS.filter((item) => {
    const matchesCategory =
      selectedFilterCategory === 'all' || item.category === selectedFilterCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;
    const matchesQuery =
      item.name.toLowerCase().includes(query) ||
      item.scenario.toLowerCase().includes(query) ||
      item.example.toLowerCase().includes(query) ||
      item.badge.toLowerCase().includes(query) ||
      item.inputOutput.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <h2 id="guide-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              PDFToolkit Guide: Pick the Right Tool for Your Condition
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Select what you need to accomplish. 100% processed privately inside your browser.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedFilterCategory('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedFilterCategory === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Conditions (8)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilterCategory('convert')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedFilterCategory === 'convert'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Convert & Export (4)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilterCategory('organize')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedFilterCategory === 'organize'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Organize & Pages (2)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilterCategory('optimize')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedFilterCategory === 'optimize'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Optimize & Edit (2)
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search condition or file type..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Scrollable Condition Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filtered.map((item) => {
              const Icon = item.icon;
              const isCurrent = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectTool(item.id);
                    onClose();
                  }}
                  className={`group relative p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.name}
                          </h3>
                          {isCurrent && (
                            <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400 font-mono">
                              (Active)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {item.categoryTitle} · {item.badge}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                      {item.inputOutput}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1.5 leading-relaxed">
                    <span className="text-slate-400 dark:text-slate-500 font-normal">When to use: </span>
                    {item.scenario}
                  </p>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mb-3">
                    {item.example}
                  </p>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      100% in-browser processing
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        isCurrent
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      }`}
                    >
                      {isCurrent ? 'Currently Open' : 'Open Tool'}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
              No matching tools found for "{searchQuery}". Try searching for "compress", "merge", "image", or "word".
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Tip: You can switch tools directly from the top grid at any time.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
