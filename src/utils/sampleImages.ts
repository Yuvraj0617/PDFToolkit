import { ImagePageItem } from '../types/pdf';

/**
 * Generates 3 crisp, domain-authentic sample images (JPG, PNG, WEBP) via HTML5 Canvas
 * so users immediately experience a populated workspace with real multi-format assets.
 */
export async function generateDefaultSamplePages(): Promise<ImagePageItem[]> {
  const specs: Array<{
    name: string;
    format: 'JPG' | 'PNG' | 'WEBP';
    mime: string;
    width: number;
    height: number;
    caption: string;
    draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  }> = [
    {
      name: 'nordic-pavilion-elevation.jpg',
      format: 'JPG',
      mime: 'image/jpeg',
      width: 1600,
      height: 1120,
      caption: 'Sheet 01 — South Structural Elevation & Timber Grid (Scale 1:100)',
      draw: (ctx, w, h) => {
        // Crisp architectural blueprint / studio sheet on warm paper
        ctx.fillStyle = '#f8f6f0';
        ctx.fillRect(0, 0, w, h);

        // Outer border frame
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4;
        ctx.strokeRect(48, 48, w - 96, h - 96);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        for (let x = 120; x < w - 120; x += 80) {
          ctx.beginPath();
          ctx.moveTo(x, 80);
          ctx.lineTo(x, h - 180);
          ctx.stroke();
        }
        for (let y = 120; y < h - 180; y += 80) {
          ctx.beginPath();
          ctx.moveTo(80, y);
          ctx.lineTo(w - 80, y);
          ctx.stroke();
        }

        // Horizon ground line
        const groundY = h - 280;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(120, groundY);
        ctx.lineTo(w - 120, groundY);
        ctx.stroke();

        // Pavilion roof cantilevers and columns
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(280, groundY - 360, w - 560, 360);

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.strokeRect(280, groundY - 360, w - 560, 360);

        // Pitched modern roof overhang
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(200, groundY - 360);
        ctx.lineTo(w / 2, groundY - 490);
        ctx.lineTo(w - 200, groundY - 360);
        ctx.closePath();
        ctx.fill();

        // Structural timber bays
        const bayCount = 6;
        const bayWidth = (w - 560) / bayCount;
        for (let i = 0; i <= bayCount; i++) {
          const bx = 280 + i * bayWidth;
          ctx.fillStyle = '#334155';
          ctx.fillRect(bx - 6, groundY - 360, 12, 360);

          // Glazing mullion diagonals
          if (i < bayCount) {
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(bx + 14, groundY - 330, bayWidth - 28, 300);
          }
        }

        // Dimension callouts
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 22px "JetBrains Mono", monospace';
        ctx.fillText('24,800 mm OVERALL SPAN', w / 2 - 150, groundY - 520);
        ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('A4 / ARCHIVAL ARCHITECTURAL PLATE — REV 4.2', 90, h - 105);
        ctx.fillText('DWG NO. ARC-2026-01', w - 340, h - 105);
      },
    },
    {
      name: 'material-specification-matrix.png',
      format: 'PNG',
      mime: 'image/png',
      width: 1240,
      height: 1754,
      caption: 'Sheet 02 — Acoustic & Glazing Assembly Specification Schedule',
      draw: (ctx, w, h) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        // Top editorial header bar
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(80, 80, w - 160, 140);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 36px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('MATERIAL & GLAZING SCHEDULE', 120, 145);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 20px "JetBrains Mono", monospace';
        ctx.fillText('PROJECT REF: FP-904 · ISO 128 COMPLIANT', 120, 185);

        // Spec blocks
        const rows = [
          ['GL-01', 'Triple Low-E Insulated Unit', '44.2 mm', 'U = 0.62 W/m²K'],
          ['TM-02', 'Cross-Laminated Nordic Spruce', '240.0 mm', 'Grade C24 Kiln'],
          ['AL-03', 'Anodized Architectural Mullion', '65.0 mm', 'AA-25 Matte Bronze'],
          ['AC-04', 'Perforated Gypsum Baffle Core', '18.5 mm', 'NRC 0.85 Class A'],
          ['ST-05', 'Honed Limestone Plinth Slab', '80.0 mm', 'Slip Rating R11'],
        ];

        let y = 310;
        rows.forEach((row, idx) => {
          ctx.fillStyle = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
          ctx.fillRect(80, y, w - 160, 120);
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;
          ctx.strokeRect(80, y, w - 160, 120);

          ctx.fillStyle = '#2563eb';
          ctx.font = '700 24px "JetBrains Mono", monospace';
          ctx.fillText(row[0], 115, y + 70);

          ctx.fillStyle = '#0f172a';
          ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(row[1], 240, y + 55);

          ctx.fillStyle = '#64748b';
          ctx.font = '400 20px "JetBrains Mono", monospace';
          ctx.fillText(`Thickness: ${row[2]}  ·  Performance: ${row[3]}`, 240, y + 92);

          y += 145;
        });

        // Cross-section diagram box at bottom
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(80, 1080, w - 160, 480);
        ctx.strokeStyle = '#cbd5e1';
        ctx.strokeRect(80, 1080, w - 160, 480);

        // Concentric thermal circles
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        for (let r = 60; r <= 180; r += 40) {
          ctx.beginPath();
          ctx.arc(360, 1320, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = '#0f172a';
        ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Thermal Bridge & Vapor Barrier Verification', 600, 1260);
        ctx.fillStyle = '#475569';
        ctx.font = '400 21px "Public Sans", sans-serif';
        ctx.fillText('Continuous EPDM gasket seal tested to 600 Pa wind load.', 600, 1310);
        ctx.fillText('Verified condensation resistance index CRF >= 72.', 600, 1350);
      },
    },
    {
      name: 'site-topography-survey.webp',
      format: 'WEBP',
      mime: 'image/webp',
      width: 1500,
      height: 1200,
      caption: 'Sheet 03 — Topographic Contour & Solar Exposure Survey',
      draw: (ctx, w, h) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Topographic contour rings
        ctx.strokeStyle = '#38bdf8';
        for (let i = 1; i <= 11; i++) {
          ctx.lineWidth = i % 3 === 0 ? 2.5 : 1;
          ctx.globalAlpha = i % 3 === 0 ? 0.65 : 0.3;
          ctx.beginPath();
          ctx.ellipse(
            w * 0.52,
            h * 0.48,
            i * 58,
            i * 38,
            (i * 0.08),
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Building footprint on site
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(w * 0.42, h * 0.41, 260, 140);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.strokeRect(w * 0.42, h * 0.41, 260, 140);

        // Compass rose
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(180, 180, 64, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.font = '700 24px "JetBrains Mono", monospace';
        ctx.fillText('N', 171, 105);

        // Legend bar at bottom
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(60, h - 160, w - 120, 100);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('TOPOGRAPHIC SURVEY — ELEVATION DATUM +42.50m ASL', 100, h - 102);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '500 20px "JetBrains Mono", monospace';
        ctx.fillText('59.3293° N, 18.0686° E', w - 360, h - 102);
      },
    },
  ];

  const items: ImagePageItem[] = [];

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const canvas = document.createElement('canvas');
    canvas.width = spec.width;
    canvas.height = spec.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      spec.draw(ctx, spec.width, spec.height);
    }
    const dataUrl = canvas.toDataURL(spec.mime, 0.92);
    // Estimate real byte size from base64 length
    const base64Length = dataUrl.split(',')[1]?.length || 0;
    const sizeBytes = Math.round((base64Length * 3) / 4);

    items.push({
      id: `sample-page-${i + 1}-${Date.now() + i}`,
      name: spec.name,
      originalFormat: spec.format,
      mimeType: spec.mime,
      sizeBytes,
      width: spec.width,
      height: spec.height,
      dataUrl,
      rotation: 0,
      colorFilter: 'none',
      caption: spec.caption,
      included: true,
      addedAt: Date.now() + i,
    });
  }

  return items;
}
