import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileCheck,
  FileEdit,
  Files,
  FileText,
  FileType,
  HelpCircle,
  Image as ImageIcon,
  Images,
  Layers,
  Lock,
  Minimize2,
  Moon,
  Scissors,
  ShieldCheck,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react';
import { ToolkitTab, ToolMeta } from '../App';
import { useTheme } from '../context/ThemeContext';

interface HomepageProps {
  tools: ToolMeta[];
  onSelectTool: (toolId: ToolkitTab) => void;
  onOpenGuide: () => void;
}

export function Homepage({ tools, onSelectTool, onOpenGuide }: HomepageProps) {
  const { theme, toggleTheme } = useTheme();

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const serviceCategories = [
    {
      id: 'convert',
      title: 'Convert & Export',
      description: 'Format transitions with typography and visual layout preserved.',
      items: tools.filter((t) => t.categoryId === 'convert'),
    },
    {
      id: 'organize',
      title: 'Organize & Pages',
      description: 'Combine, reorder, and isolate specific document pages.',
      items: tools.filter((t) => t.categoryId === 'organize'),
    },
    {
      id: 'optimize',
      title: 'Optimize & Edit',
      description: 'Reduce file size, adjust orientation, and apply stamps or watermarks.',
      items: tools.filter((t) => t.categoryId === 'optimize'),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* 1. Homepage Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Wordmark & Brand Identity */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2 group text-left cursor-pointer"
              >
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  PDFToolkit
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  Studio
                </span>
              </button>
            </div>

            {/* Navigation Anchor Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => handleScrollTo('services')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                Services & Features
              </button>
              <button
                type="button"
                onClick={() => handleScrollTo('why-use')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                Why PDFToolkit
              </button>
              <button
                type="button"
                onClick={() => handleScrollTo('how-it-works')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                How It Works
              </button>
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Light / Dark Mode Switcher */}
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
                aria-label={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </button>

              {/* Help Me Pick Button */}
              <button
                type="button"
                onClick={onOpenGuide}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Help Me Pick</span>
              </button>

              {/* Direct Workspace Launcher CTA */}
              <button
                type="button"
                onClick={() => onSelectTool('image-to-pdf')}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Open Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200 dark:border-slate-800">
        {/* Subtle background ambient accents */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden opacity-60 dark:opacity-30">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-400/20 via-indigo-300/20 to-sky-200/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust Marker Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-medium mb-6 animate-fade-in shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>100% Private Client-Side Processing · Zero Server Uploads</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white font-display max-w-4xl mx-auto leading-tight sm:leading-none">
            All-in-one private PDF toolkit right in your browser.
          </h1>

          {/* Subtitle / Why Use Summary */}
          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Convert, merge, split, compress, and edit PDF documents without uploading your files to any external server. 
            Enjoy instantaneous WebAssembly speed, live visual paper sheet preview, and zero file size limits.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => onSelectTool('image-to-pdf')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Explore Tools</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenGuide}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Which Tool Do I Need? Guide</span>
            </button>
          </div>

          {/* Quick-Launch Popular Workflows Bar */}
          <div className="mt-10 pt-8 border-t border-slate-200/80 dark:border-slate-800/80 max-w-4xl mx-auto">
            <div className="text-xs uppercase tracking-wider font-semibold font-mono text-slate-400 dark:text-slate-500 mb-3">
              Popular Quick Actions
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onSelectTool('merge-pdf')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-2xs cursor-pointer"
              >
                <Files className="w-3.5 h-3.5 text-blue-500" />
                <span>Combine Multiple PDFs</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTool('compress-pdf')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-2xs cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Reduce PDF File Size</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTool('image-to-pdf')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Photos / Scans to PDF</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTool('pdf-to-docx')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors shadow-2xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-sky-500" />
                <span>Convert PDF to Word</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTool('pdf-to-image')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shadow-2xs cursor-pointer"
              >
                <Images className="w-3.5 h-3.5 text-purple-500" />
                <span>Export Pages to Images</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Why PDFToolkit / Key Value Propositions Section */}
      <section id="why-use" className="py-16 sm:py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Why Choose PDFToolkit
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
              Designed for Privacy, Speed, and Zero Restrictions
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Unlike cloud services that send your confidential documents to unknown remote servers, PDFToolkit runs entirely on your machine.
            </p>
          </div>

          {/* 4 Feature Value Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                100% Client-Side Privacy
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Your contracts, receipts, bank statements, and tax forms never touch a server. All operations run strictly inside your browser memory.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Instant WebAssembly Speed
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                No upload wait times, no queueing behind other users, and no network latency. Documents process as fast as your device can calculate.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Zero Size Caps or Paywalls
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                No registration, no subscriptions, and no arbitrary file size limits. Process as many pages and files as you need freely.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Live Paper Sheet Preview
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Inspect every page in real time with continuous vertical scrolling, thumbnail navigation, and rotation before exporting.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* 4. Services & Features Overview Component (Clean, non-messy informative presentation) */}
      <section id="services" className="py-14 sm:py-18 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Services & Features
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
              Everything You Need for PDF Documents
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Eight purpose-built client-side services engineered for format conversion, page assembly, and document enhancement.
            </p>
          </div>

          {/* 3 Structured Columns of Services */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {serviceCategories.map((group) => (
              <div
                key={group.id}
                className="flex flex-col p-5 sm:p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-2xs"
              >
                {/* Category Header */}
                <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-800 dark:text-slate-200">
                    {group.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {group.description}
                  </p>
                </div>

                {/* Services List in this Category */}
                <div className="flex-1 space-y-3">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {item.label}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                              {item.badge}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Clean Studio Transition Strip */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Ready to process your documents?
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  All 8 services are unified inside our studio workspace with real-time sheet preview.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectTool('image-to-pdf')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer shrink-0"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-semibold font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Simple 3-Step Process
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
              How PDFToolkit Works
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Transform, merge, or compress your files directly in your browser with complete transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col items-start">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Select Your Tool
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Choose the exact task you need—whether converting photos, splitting long contracts, reducing file size, or editing text in Word.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col items-start">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Add Your Documents
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Drag and drop your files or browse from your disk. Files stay strictly on your device inside isolated browser memory.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col items-start">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Preview & Export Instantly
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Inspect every page visually with the continuous sheet viewer, rearrange pages if needed, and export directly to your downloads.
              </p>
            </div>
          </div>

          {/* Privacy callout banner */}
          <div className="mt-12 p-6 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Zero Network Transfers for Document Content
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  You can even disconnect your internet after loading this page—all 8 tools will continue working flawlessly offline.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectTool('image-to-pdf')}
              className="shrink-0 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand Info */}
            <div className="md:col-span-1">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display">
                PDFToolkit
              </span>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Modern, private, client-side PDF studio for professionals, students, and businesses.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Client-Side Privacy</span>
              </div>
            </div>

            {/* Quick Tools Links */}
            <div>
              <h5 className="font-semibold text-slate-800 dark:text-slate-200 font-mono uppercase tracking-wider text-[11px] mb-3">
                Convert & Export
              </h5>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectTool('image-to-pdf')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Image to PDF
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectTool('pdf-to-image')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    PDF to Image
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectTool('word-to-pdf')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Word to PDF
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectTool('pdf-to-docx')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    PDF to Word (DOCX)
                  </button>
                </li>
              </ul>
            </div>

            {/* Organize & Optimize Tools */}
            <div>
              <h5 className="font-semibold text-slate-800 dark:text-slate-200 font-mono uppercase tracking-wider text-[11px] mb-3">
                Organize & Optimize
              </h5>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectTool('merge-pdf')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Merge Multiple PDFs
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectTool('split-pdf')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Split & Extract Pages
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectTool('compress-pdf')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Compress PDF
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectTool('edit-pdf')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Edit, Rotate & Watermark
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h5 className="font-semibold text-slate-800 dark:text-slate-200 font-mono uppercase tracking-wider text-[11px] mb-3">
                Assistance & Guide
              </h5>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={onOpenGuide}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Condition Guide (Help Me Pick)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleScrollTo('why-use')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Security & Privacy Model
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    Back to Top ↑
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-slate-500 dark:text-slate-400">
            <div>
              © {new Date().getFullYear()} PDFToolkit. All rights reserved. 100% Client-Side.
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>Runs in browser WebAssembly</span>
              <span>·</span>
              <span>Zero telemetry</span>
              <span>·</span>
              <span>Zero server storage</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
