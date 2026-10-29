import React from 'react';
import { ImagePageItem, PdfGlobalConfig } from '../types/pdf';
import { computePageLayoutMm } from '../utils/pdfEngine';

interface PageSheetPreviewProps {
  page: ImagePageItem;
  pageIndex: number;
  totalPages: number;
  config: PdfGlobalConfig;
  scale?: number;
  showMarginGuides?: boolean;
}

export const PageSheetPreview: React.FC<PageSheetPreviewProps> = ({
  page,
  pageIndex,
  totalPages,
  config,
  scale = 1,
  showMarginGuides = false,
}) => {
  const isSideways = page.rotation === 90 || page.rotation === 270;
  const rotatedW = isSideways ? page.height : page.width;
  const rotatedH = isSideways ? page.width : page.height;

  const layout = computePageLayoutMm(rotatedW, rotatedH, page, config);

  // Convert mm to preview pixels (e.g., 2.15 px per mm at scale = 1)
  const pxPerMm = 2.15 * scale;
  const sheetW = Math.round(layout.pageWidthMm * pxPerMm);
  const sheetH = Math.round(layout.pageHeightMm * pxPerMm);

  const imgLeftPct = (layout.imgX / layout.pageWidthMm) * 100;
  const imgTopPct = (layout.imgY / layout.pageHeightMm) * 100;
  const imgWidthPct = (layout.imgW / layout.pageWidthMm) * 100;
  const imgHeightPct = (layout.imgH / layout.pageHeightMm) * 100;

  const marginHorizPct = (layout.marginMm / layout.pageWidthMm) * 100;
  const marginVertPct = (layout.marginMm / layout.pageHeightMm) * 100;

  const getCssFilter = () => {
    switch (page.colorFilter) {
      case 'grayscale':
        return 'grayscale(100%)';
      case 'scan-contrast':
        return 'grayscale(100%) contrast(145%) brightness(105%)';
      case 'warm-paper':
        return 'sepia(18%) contrast(104%) brightness(99%)';
      default:
        return 'none';
    }
  };

  return (
    <div
      className="relative select-none border border-slate-300 shadow-sm transition-transform duration-150 overflow-hidden"
      style={{
        width: `${sheetW}px`,
        height: `${sheetH}px`,
        backgroundColor: config.pageBackground,
      }}
    >
      {/* Optional Margin Guides */}
      {showMarginGuides && layout.marginMm > 0 && (
        <div
          className="pointer-events-none absolute border border-dashed border-blue-400/60 z-20"
          style={{
            left: `${marginHorizPct}%`,
            right: `${marginHorizPct}%`,
            top: `${marginVertPct}%`,
            bottom: `${marginVertPct}%`,
          }}
        />
      )}

      {/* Header Document Title */}
      {config.showHeaderTitle && config.documentTitle.trim() && (
        <div
          className="pointer-events-none absolute truncate text-slate-500 font-sans z-10"
          style={{
            left: `${Math.max(4, marginHorizPct)}%`,
            right: `${Math.max(4, marginHorizPct)}%`,
            top: `${Math.max(2.2, marginVertPct * 0.55)}%`,
            fontSize: `${Math.max(8, Math.round(10 * scale))}px`,
          }}
        >
          {config.documentTitle}
        </div>
      )}

      {/* Placed Image Box */}
      <div
        className="absolute overflow-hidden flex items-center justify-center"
        style={{
          left: `${imgLeftPct}%`,
          top: `${imgTopPct}%`,
          width: `${imgWidthPct}%`,
          height: `${imgHeightPct}%`,
        }}
      >
        <img
          src={page.dataUrl}
          alt={page.caption || page.name}
          referrerPolicy="no-referrer"
          className="max-w-none transition-transform duration-150"
          style={{
            width: isSideways ? `${(layout.imgH / layout.imgW) * 100}%` : '100%',
            height: isSideways ? `${(layout.imgW / layout.imgH) * 100}%` : '100%',
            objectFit: (page.fitModeOverride || config.imageFit) === 'cover' ? 'cover' : 'contain',
            transform: `rotate(${page.rotation}deg)`,
            filter: getCssFilter(),
          }}
        />
      </div>

      {/* Footer Caption & Page Number */}
      {(config.showImageCaptions || config.showPageNumbers) && (
        <div
          className="pointer-events-none absolute flex items-center justify-between gap-2 text-slate-500 z-10"
          style={{
            left: `${Math.max(4, marginHorizPct)}%`,
            right: `${Math.max(4, marginHorizPct)}%`,
            bottom: `${Math.max(2, marginVertPct * 0.45)}%`,
            fontSize: `${Math.max(8, Math.round(10 * scale))}px`,
          }}
        >
          <span className="truncate">
            {config.showImageCaptions ? page.caption : ''}
          </span>
          {config.showPageNumbers && (
            <span className="font-mono tabular-nums shrink-0">
              Page {String(pageIndex + 1).padStart(2, '0')} of {String(totalPages).padStart(2, '0')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
