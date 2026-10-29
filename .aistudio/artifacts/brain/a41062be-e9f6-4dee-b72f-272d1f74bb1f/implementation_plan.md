# Unified Paper-Sheet Document Preview Architecture

Standardize the entire FolioPress PDF Toolkit on the Photo-to-PDF simulated paper-sheet preview format, replacing iframe embeds with pure, client-side paper sheet rendering across all 5 tools (Image to PDF, Merge PDF, Split PDF, Word to PDF, and Edit PDF).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Summary of Confirmed Choices from User Clarification:**
> - **Unified Photo-to-PDF Visual Architecture**: All toolkit features (Merge, Split, Word to PDF, Edit PDF, and Image to PDF) will use the exact same simulated paper sheet preview that was designed for the Photo-to-PDF converter.
> - **Default Reading Layout**: Continuous vertical scroll with an interactive left-hand thumbnail sidebar (allowing instant jumping to any page in the document).
> - **Zero-Iframe Reliability**: Replaces browser iframe embeds with direct DOM/canvas paper sheets with tactile drop-shadows, true paper aspect ratios, zoom controls (50% to 150%), and one-click direct download.

---

## 1. Overview & Core Concept

The user experienced blank/non-functional previews in the Merge tool because browser `<iframe src="blob:...">` embeds are frequently blocked by sandboxed environments and browser PDF plugin restrictions. Conversely, the **Photo-to-PDF** preview worked with 100% reliability because it renders simulated paper sheets directly in the DOM.

By standardizing all 5 tools on this unified paper sheet architecture:
1. **Consistency**: Every tool looks, behaves, and previews in the exact same clean, professional studio environment.
2. **Reliability**: No blank screens or browser plugin dependency. Pages render directly in the DOM on clean paper backdrops.
3. **Inspection Before Download**:
   - In **Merge PDF**: See all pages from all merged files stacked in sequential sheets before exporting.
   - In **Split PDF**: See only the extracted/filtered pages stacked in order before downloading.
   - In **Word to PDF**: See the exact paper pages with typography, margins, and page numbers formatted before saving.
   - In **Edit PDF**: See real-time rotated pages, diagonal watermarks, header annotations, and page numbers visually applied to paper sheets.
   - In **Image to PDF**: Retains the existing, verified paper sheet preview.

---

## 2. User Experience & Visual Design

### The Universal Document Inspector Interface

1. **Top Application Bar**:
   - Document file name (e.g. `merged-document.pdf` or `contract-edited.pdf`).
   - Clean metadata: `Page Count · Paper Size · Orientation · Total Size`.
   - Layout mode switcher: **Continuous Scroll** (Default) or **Single Page**.
   - Zoom controls (`-`, `%`, `+`, `Fit`).
   - Primary action: **Download PDF** button directly inside the header.
   - Close button (`ESC` or `✕`).
2. **Left Thumbnail Drawer**:
   - Stack of mini page previews (`Page 01`, `Page 02`, etc.) with active page highlight.
   - Clicking any thumbnail immediately scrolls to or focuses on that sheet.
3. **Center Drafting Canvas (`bg-slate-950`)**:
   - Clean slate background making white paper sheets pop with realistic drop shadows.
   - In Continuous Mode: Stack of paper sheets separated by comfortable spacing with clean unboxed page badges (`Page 1 of 4 · nordic-pavilion.jpg`).

---

## 3. Tool-by-Tool Sheet Adaptation Plan

| Tool | How Pages are Formatted for the Sheet Viewer | Visual Verification Provided |
| :--- | :--- | :--- |
| **Image to PDF** | Existing `PageSheetPreview` engine with image fit, rotation, margins, and numbering. | Verify image scale, margins, rotation, page numbers. |
| **Word to PDF** | DOCX parsed into structured pages formatted on true A4/Letter sheets with typography, headers, and margins. | Verify heading hierarchy, paragraphs, page breaks, margins, document header. |
| **Edit PDF** | Pages formatted on sheets reflecting rotation angles (90°/180°/270°), diagonal watermark stamps, and running headers/footers. | Verify excluded pages removed, rotations applied, watermark opacity and text visible. |
| **Merge PDF** | Client-side page sheet rendering of each combined document's pages in sequential order. | Verify file order, page count, document flow before downloading merged PDF. |
| **Split PDF** | Extracted page selection rendered as a cohesive multi-sheet preview. | Verify only intended pages are included in the extracted PDF. |

---

## 4. Technical Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FolioPress PDF Toolkit                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    │                               │                               │
┌───▼─────────────────┐   ┌─────────▼───────────┐   ┌───────────────▼──┐
│   Merge PDF Tool    │   │   Split PDF Tool    │   │  Edit PDF Tool   │
└───┬─────────────────┘   └─────────┬───────────┘   └───────────────┬──┘
    │                               │                               │
    └───────────────────────┬───────┴───────────────────────────────┘
                            ▼
     ┌─────────────────────────────────────────────────────────────┐
     │          UniversalSheetDocumentModal.tsx                    │
     │                                                             │
     │  ┌─────────────────────────┐   ┌─────────────────────────┐  │
     │  │ Left Thumbnail Sidebar  │   │ Center Drafting Canvas  │  │
     │  │ - Mini Page Thumbnails  │   │ - Continuous Scroll     │  │
     │  │ - Quick Page Jump       │   │ - Simulated Paper Sheet │  │
     │  └─────────────────────────┘   │ - Tactile Drop Shadows  │  │
     │                                │ - Zoom (50% - 150%)     │  │
     │                                └─────────────────────────┘  │
     │  ┌───────────────────────────────────────────────────────┐  │
     │  │ Top Bar: Zoom Controls + One-Click Download Button    │  │
     │  └───────────────────────────────────────────────────────┘  │
     └─────────────────────────────────────────────────────────────┘
```

### Files & Components to Implement

1. **`src/components/UniversalSheetDocumentModal.tsx`**:
   - Universal paper sheet preview modal supporting all tools.
   - Continuous scroll (default) with smooth thumbnail sidebar navigation.
   - Zoom controls and direct PDF download button.
2. **`src/components/tools/WordToPdfTool.tsx`**:
   - Replace old iframe preview with `UniversalSheetDocumentModal`.
3. **`src/components/tools/MergePdfTool.tsx`**:
   - Replace old iframe preview with `UniversalSheetDocumentModal` showing combined pages.
4. **`src/components/tools/SplitPdfTool.tsx`**:
   - Replace old iframe preview with `UniversalSheetDocumentModal` showing extracted pages.
5. **`src/components/tools/EditPdfTool.tsx`**:
   - Replace old iframe preview with `UniversalSheetDocumentModal` showing watermarked, rotated, annotated pages.

---

## 5. Verification Plan

1. **Merge PDF**: Add 2 sample PDFs, click *Preview Merged PDF*, verify paper sheets render continuously with left thumbnails, and click download.
2. **Split PDF**: Upload PDF, select pages 1 and 3, click *Preview Extracted PDF*, verify exactly those 2 paper sheets appear, and download.
3. **Word to PDF**: Upload `.docx`, click *Preview Formatted PDF*, verify paper sheets with typography, headers, and margins appear, and download.
4. **Edit PDF**: Upload PDF, rotate page 1, add "CONFIDENTIAL" watermark, click *Preview Edited PDF*, verify watermark and rotation on paper sheets, and download.
5. **Image to PDF**: Verify existing Photo-to-PDF preview continues working flawlessly.
6. **Build & Lint**: Verify `compile_applet` and `lint_applet` pass with 0 errors.
