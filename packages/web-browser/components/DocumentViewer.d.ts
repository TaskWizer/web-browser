import React from 'react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
interface DocumentViewerProps {
    url: string;
    title?: string;
}
/**
 * DocumentViewer Component
 *
 * Renders PDF files and eBook formats (EPUB) directly in the browser.
 *
 * Features:
 * - PDF rendering using react-pdf (Mozilla's PDF.js)
 * - EPUB rendering using epubjs
 * - Page navigation controls
 * - Zoom controls for PDFs
 * - Table of contents for eBooks
 */
export declare const DocumentViewer: React.FC<DocumentViewerProps>;
export {};
//# sourceMappingURL=DocumentViewer.d.ts.map