import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import ePub, { Book, Rendition } from 'epubjs';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentViewerProps {
  url: string;
  title?: string;
}

type DocumentType = 'pdf' | 'epub' | 'unknown';

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
export const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, title }) => {
  const [documentType, setDocumentType] = useState<DocumentType>('unknown');
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // EPUB specific state
  const [epubBook, setEpubBook] = useState<Book | null>(null);
  const [epubRendition, setEpubRendition] = useState<Rendition | null>(null);
  const [epubToc, setEpubToc] = useState<any[]>([]);
  const [showToc, setShowToc] = useState<boolean>(false);
  const epubViewerRef = useRef<HTMLDivElement>(null);

  // Detect document type from URL
  useEffect(() => {
    const urlLower = url.toLowerCase();
    if (urlLower.endsWith('.pdf')) {
      setDocumentType('pdf');
    } else if (urlLower.endsWith('.epub')) {
      setDocumentType('epub');
    } else {
      setDocumentType('unknown');
      setError('Unsupported document format. Only PDF and EPUB files are supported.');
    }
  }, [url]);

  // Load EPUB book
  useEffect(() => {
    if (documentType !== 'epub' || !epubViewerRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const book = ePub(url);
      setEpubBook(book);

      const rendition = book.renderTo(epubViewerRef.current, {
        width: '100%',
        height: '100%',
        spread: 'none',
      });

      rendition.display();
      setEpubRendition(rendition);

      // Load table of contents
      book.loaded.navigation.then((navigation: any) => {
        setEpubToc(navigation.toc);
      });

      setLoading(false);
    } catch (err) {
      console.error('Error loading EPUB:', err);
      setError('Failed to load EPUB file. The file may be corrupted or inaccessible.');
      setLoading(false);
    }

    return () => {
      if (epubRendition) {
        epubRendition.destroy();
      }
    };
  }, [documentType, url]);

  // PDF handlers
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF file. The file may be corrupted or inaccessible.');
    setLoading(false);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      return Math.max(1, Math.min(newPage, numPages));
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1.0);

  // EPUB navigation
  const epubPrevPage = () => {
    if (epubRendition) {
      epubRendition.prev();
    }
  };

  const epubNextPage = () => {
    if (epubRendition) {
      epubRendition.next();
    }
  };

  const goToTocItem = (href: string) => {
    if (epubRendition) {
      epubRendition.display(href);
      setShowToc(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading document...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-900">
        <div className="text-center max-w-md p-8">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Document</h3>
          <p className="text-zinc-400 mb-4">{error}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Download File
          </a>
        </div>
      </div>
    );
  }

  // Render PDF viewer
  if (documentType === 'pdf') {
    return (
      <div className="flex flex-col h-full bg-zinc-900">
        {/* PDF Toolbar */}
        <div className="flex items-center justify-between bg-zinc-800 px-4 py-2 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <button
              onClick={previousPage}
              disabled={pageNumber <= 1}
              className="px-3 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="text-white text-sm">
              Page {pageNumber} of {numPages}
            </span>
            <button
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              className="px-3 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              className="px-3 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-600"
              title="Zoom Out"
            >
              −
            </button>
            <span className="text-white text-sm min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="px-3 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-600"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={resetZoom}
              className="px-3 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-600"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Download
          </a>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-zinc-800 flex items-center justify-center p-4">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="text-white">Loading PDF...</div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>
    );
  }

  // Render EPUB viewer
  if (documentType === 'epub') {
    return (
      <div className="flex flex-col h-full bg-zinc-900">
        {/* EPUB Toolbar */}
        <div className="flex items-center justify-between bg-zinc-800 px-4 py-2 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <button
              onClick={epubPrevPage}
              className="px-3 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-600"
            >
              ← Previous
            </button>
            <button
              onClick={epubNextPage}
              className="px-3 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-600"
            >
              Next →
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowToc(!showToc)}
              className="px-3 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-600"
            >
              {showToc ? 'Hide' : 'Show'} Contents
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Download
            </a>
          </div>
        </div>

        {/* EPUB Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Table of Contents Sidebar */}
          {showToc && epubToc.length > 0 && (
            <div className="w-64 bg-zinc-800 border-r border-zinc-700 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-white font-semibold mb-4">Table of Contents</h3>
                <ul className="space-y-2">
                  {epubToc.map((item, index) => (
                    <li key={index}>
                      <button
                        onClick={() => goToTocItem(item.href)}
                        className="text-left text-zinc-300 hover:text-white hover:bg-zinc-700 w-full px-2 py-1 rounded text-sm"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* EPUB Viewer */}
          <div ref={epubViewerRef} className="flex-1 bg-white" />
        </div>
      </div>
    );
  }

  return null;
};

