import React, { useState } from 'react';
import {
  ArrowLeft,
  FileEdit,
  Files,
  FileText,
  FileType,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Images,
  Minimize2,
  Moon,
  Scissors,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { ImageToPdfTool } from './components/tools/ImageToPdfTool';
import { MergePdfTool } from './components/tools/MergePdfTool';
import { SplitPdfTool } from './components/tools/SplitPdfTool';
import { WordToPdfTool } from './components/tools/WordToPdfTool';
import { EditPdfTool } from './components/tools/EditPdfTool';
import { PdfToDocxTool } from './components/tools/PdfToDocxTool';
import { CompressPdfTool } from './components/tools/CompressPdfTool';
import { PdfToImageTool } from './components/tools/PdfToImageTool';
import { ConditionGuideModal } from './components/ConditionGuideModal';
import { FunctionButton } from './components/FunctionButton';
import { Homepage } from './components/Homepage';
import { useTheme } from './context/ThemeContext';

export type ToolkitCategory = 'convert' | 'organize' | 'optimize';

export type ToolkitTab =
  | 'image-to-pdf'
  | 'pdf-to-image'
  | 'merge-pdf'
  | 'split-pdf'
  | 'compress-pdf'
  | 'word-to-pdf'
  | 'pdf-to-docx'
  | 'edit-pdf';

export interface ToolMeta {
  id: ToolkitTab;
  categoryId: ToolkitCategory;
  label: string;
  shortLabel: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  condition: string;
  description: string;
  formatTransfer: string;
}

export const TOOLS: ToolMeta[] = [
  {
    id: 'image-to-pdf',
    categoryId: 'convert',
    label: 'Image to PDF',
    shortLabel: 'Photos to PDF',
    badge: 'Photos → PDF',
    icon: ImageIcon,
    condition: 'You have photos, scans, or receipts to package into a printable PDF.',
    description: 'Convert JPG, PNG, and WebP images into formatted, high-resolution PDF documents with page ordering and live preview.',
    formatTransfer: 'JPG, PNG, WebP → PDF',
  },
  {
    id: 'pdf-to-image',
    categoryId: 'convert',
    label: 'PDF to Image',
    shortLabel: 'PDF to Image',
    badge: 'PDF → JPG/PNG',
    icon: Images,
    condition: 'You need image files of specific pages (single page, ranges, or all) to share or embed.',
    description: 'Extract PDF pages into JPG, PNG, or WebP images with single-page download, custom ranges, or full ZIP export.',
    formatTransfer: 'PDF → JPG, PNG, WebP',
  },
  {
    id: 'merge-pdf',
    categoryId: 'organize',
    label: 'Merge PDF',
    shortLabel: 'Merge',
    badge: 'Combine Files',
    icon: Files,
    condition: 'You have multiple PDFs to join into a single, organized file in custom order.',
    description: 'Combine multiple PDF documents into a single organized file with reordering and live document preview.',
    formatTransfer: 'Multiple PDFs → Single PDF',
  },
  {
    id: 'split-pdf',
    categoryId: 'organize',
    label: 'Split PDF',
    shortLabel: 'Split',
    badge: 'Extract Pages',
    icon: Scissors,
    condition: 'A document is too long or you only need specific pages (e.g. pages 1–3, or separate pages).',
    description: 'Extract specific page ranges, separate each page individually, or divide documents into batches.',
    formatTransfer: '1 PDF → Extracted Pages',
  },
  {
    id: 'compress-pdf',
    categoryId: 'optimize',
    label: 'Compress PDF',
    shortLabel: 'Compress',
    badge: 'Reduce Size',
    icon: Minimize2,
    condition: 'A PDF is too heavy to email (e.g. > 25MB) or upload to online portals.',
    description: 'Reduce PDF file size while maintaining crystal-clear visual quality, readable typography, and instant side-by-side comparison.',
    formatTransfer: 'Heavy PDF → Compressed PDF',
  },
  {
    id: 'word-to-pdf',
    categoryId: 'convert',
    label: 'Word to PDF',
    shortLabel: 'Word to PDF',
    badge: 'DOCX → PDF',
    icon: FileType,
    condition: 'You have a Microsoft Word file to lock and export for publication or printing.',
    description: 'Convert Microsoft Word (.docx) documents into clean, publication-ready PDFs with fonts and layout preserved.',
    formatTransfer: 'DOCX → PDF',
  },
  {
    id: 'pdf-to-docx',
    categoryId: 'convert',
    label: 'PDF to Word',
    shortLabel: 'PDF to Word',
    badge: 'PDF → DOCX',
    icon: FileText,
    condition: 'You need to edit text, paragraphs, or tables from a PDF inside Microsoft Word.',
    description: 'Extract and convert PDF text and structure into editable Microsoft Word (.docx) documents.',
    formatTransfer: 'PDF → Editable DOCX',
  },
  {
    id: 'edit-pdf',
    categoryId: 'optimize',
    label: 'Edit PDF',
    shortLabel: 'Edit PDF',
    badge: 'Rotate & Stamp',
    icon: FileEdit,
    condition: 'Pages are sideways/upside-down or you need watermark stamps, headers, or page numbers.',
    description: 'Rotate pages, exclude pages, add watermark stamps, headers, and page numbers with live inspection.',
    formatTransfer: 'PDF → Cleaned / Stamped PDF',
  },
];

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'tool'>('home');
  const [activeTab, setActiveTab] = useState<ToolkitTab>('image-to-pdf');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const { theme, toggleTheme } = useTheme();

  const currentTool = TOOLS.find((t) => t.id === activeTab) || TOOLS[0];

  const handleSelectTool = (toolId: ToolkitTab) => {
    setActiveTab(toolId);
    setCurrentView('tool');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentView === 'home') {
    return (
      <>
        <Homepage
          tools={TOOLS}
          onSelectTool={handleSelectTool}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
        <ConditionGuideModal
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          activeTab={activeTab}
          onSelectTool={handleSelectTool}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* 1. Studio Header with Brand Identity, Back to Home & Theme Toggle */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-15">
            {/* Wordmark & Brand Identity (click to return to home) */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleGoHome}
                className="flex items-center gap-2 group cursor-pointer text-left"
                title="Return to Homepage"
              >
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  PDFToolkit
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  Studio
                </span>
              </button>

              <button
                type="button"
                onClick={handleGoHome}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Back to Homepage"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
              </button>
            </div>

            {/* Quick Actions, Theme Toggle & Privacy Trust Marker */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Light / Dark Mode Switcher */}
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
                aria-label={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>

              {/* Guide Button */}
              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                title="Browse tools by specific condition"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Help Me Pick</span>
                <span className="sm:hidden">Guide</span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono pl-3 border-l border-slate-200 dark:border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>100% Client-Side Privacy</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Direct Function Button Component Grid (Responsive for all devices) */}
      <section className="bg-white dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                All Functions
              </span>
              <span className="text-xs text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                Click any tool to navigate
              </span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              8 Tools Available
            </div>
          </div>

          {/* Grid Layout: 2 cols on mobile, 4 cols on tablet, 8 cols on laptop/desktop */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-2.5"
            role="tablist"
            aria-label="PDF Tools"
          >
            {TOOLS.map((tool) => (
              <FunctionButton
                key={tool.id}
                id={tool.id}
                label={tool.label}
                badge={tool.badge}
                icon={tool.icon}
                isActive={activeTab === tool.id}
                onClick={() => handleSelectTool(tool.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. Active Tool Context Bar */}
      <div className="bg-slate-100/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <currentTool.icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{currentTool.label}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" aria-hidden="true">|</span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-medium border border-slate-200 dark:border-slate-700">
              {currentTool.formatTransfer}
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden md:inline" aria-hidden="true">|</span>
            <p className="text-slate-600 dark:text-slate-400 text-xs hidden md:inline">
              {currentTool.description}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono shrink-0">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer flex items-center gap-1 font-sans font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Not sure which tool? Guide</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Tool Workspace */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'image-to-pdf' && <ImageToPdfTool />}
        {activeTab === 'pdf-to-image' && <PdfToImageTool />}
        {activeTab === 'merge-pdf' && <MergePdfTool />}
        {activeTab === 'split-pdf' && <SplitPdfTool />}
        {activeTab === 'compress-pdf' && <CompressPdfTool />}
        {activeTab === 'word-to-pdf' && <WordToPdfTool />}
        {activeTab === 'pdf-to-docx' && <PdfToDocxTool />}
        {activeTab === 'edit-pdf' && <EditPdfTool />}
      </main>

      {/* Condition Guide Modal */}
      <ConditionGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        activeTab={activeTab}
        onSelectTool={handleSelectTool}
      />

      {/* Clean Studio Footer with Homepage Return */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGoHome}
              className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              PDFToolkit
            </button>
            <span>—</span>
            <span>Modern Client-Side PDF Studio</span>
            <span className="hidden md:inline">·</span>
            <button
              type="button"
              onClick={handleGoHome}
              className="hidden md:inline text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              ← Return to Homepage
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-[11px]">
            <span>8 Fast PDF Tools</span>
            <span>·</span>
            <span>Zero Server Uploads</span>
            <span>·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">100% Client-Side Privacy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
