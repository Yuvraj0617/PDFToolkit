import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';

export interface DocxParseResult {
  fileName: string;
  sizeBytes: number;
  htmlContent: string;
  rawText: string;
  paragraphs: string[];
  wordCount: number;
}

export interface WordToPdfConfig {
  pageSize: 'a4' | 'letter';
  marginsMm: number;
  fontSizePt: number;
  lineHeight: number;
  showPageNumbers: boolean;
  documentTitle: string;
}

/**
 * Parses a .docx Word document using mammoth in the browser
 */
export async function parseDocxFile(file: File): Promise<DocxParseResult> {
  const arrayBuffer = await file.arrayBuffer();

  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ arrayBuffer }),
    mammoth.extractRawText({ arrayBuffer }),
  ]);

  const rawText = textResult.value.trim();
  const paragraphs = rawText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const wordCount = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;

  return {
    fileName: file.name,
    sizeBytes: file.size,
    htmlContent: htmlResult.value,
    rawText,
    paragraphs,
    wordCount,
  };
}

/**
 * Converts parsed DOCX content to a styled PDF using jsPDF
 */
export async function convertDocxToPdf(
  parsed: DocxParseResult,
  config: WordToPdfConfig
): Promise<{ blob: Blob; blobUrl: string; pageCount: number; sizeBytes: number; fileName: string }> {
  const isA4 = config.pageSize === 'a4';
  const pageW = isA4 ? 210 : 215.9;
  const pageH = isA4 ? 297 : 279.4;

  const margin = config.marginsMm;
  const printableW = pageW - margin * 2;
  const printableH = pageH - margin * 2;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageW, pageH],
  });

  const lineHeightMm = (config.fontSizePt * 0.352778) * config.lineHeight;
  let currentY = margin + 10;
  let pageIndex = 1;

  const addHeaderAndFooter = (doc: jsPDF, pageNum: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 160);

    // Header Title
    if (config.documentTitle.trim()) {
      doc.text(config.documentTitle.trim(), margin, margin - 4);
    }

    // Footer Page Number
    if (config.showPageNumbers) {
      doc.text(`Page ${pageNum}`, pageW - margin, pageH - margin + 6, { align: 'right' });
    }
  };

  // Optional Document Heading on First Page
  if (config.documentTitle.trim()) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(config.fontSizePt + 8);
    pdf.setTextColor(24, 32, 48);
    const titleLines = pdf.splitTextToSize(config.documentTitle.trim(), printableW);
    pdf.text(titleLines, margin, currentY);
    currentY += titleLines.length * (config.fontSizePt * 0.45) + 6;

    pdf.setDrawColor(220, 226, 235);
    pdf.setLineWidth(0.4);
    pdf.line(margin, currentY, margin + printableW, currentY);
    currentY += 8;
  }

  addHeaderAndFooter(pdf, pageIndex);

  // Render paragraphs
  for (const para of parsed.paragraphs) {
    // Check if paragraph looks like a heading
    const isHeading = para.length < 75 && !para.endsWith('.') && para.length > 3;

    if (isHeading) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(config.fontSizePt + 2);
      pdf.setTextColor(30, 41, 59);
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(config.fontSizePt);
      pdf.setTextColor(51, 65, 85);
    }

    const lines = pdf.splitTextToSize(para, printableW);

    for (const line of lines) {
      if (currentY + lineHeightMm > pageH - margin - 10) {
        pdf.addPage([pageW, pageH], 'portrait');
        pageIndex++;
        currentY = margin + 10;
        addHeaderAndFooter(pdf, pageIndex);

        // Restore font settings for current text
        if (isHeading) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(config.fontSizePt + 2);
          pdf.setTextColor(30, 41, 59);
        } else {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(config.fontSizePt);
          pdf.setTextColor(51, 65, 85);
        }
      }

      pdf.text(line, margin, currentY);
      currentY += lineHeightMm;
    }

    // Space after paragraph
    currentY += isHeading ? 4 : 3;
  }

  const pdfOutputName = parsed.fileName.replace(/\.docx?$/i, '') + '.pdf';
  const blob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return {
    blob,
    blobUrl,
    pageCount: pdf.getNumberOfPages(),
    sizeBytes: blob.size,
    fileName: pdfOutputName,
  };
}
