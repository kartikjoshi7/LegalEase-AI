import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  pdfFile: File | string | null;
}

export default function PDFViewer({ pdfFile }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <div className="flex-1 h-full bg-slate-200/50 flex flex-col items-center overflow-y-auto pt-8 pb-12 relative">
      {pdfFile ? (
        <div className="shadow-2xl bg-white rounded-lg overflow-hidden relative">
          <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="max-w-full"
            />
          </Document>
          
          {/* Mock Geometry Overlay Scaffold */}
          {/* In a real implementation, absolute positioned divs would map PyMuPDF quads to the DOM here */}
          
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <div className="w-24 h-24 mb-6 rounded-2xl bg-slate-200/50 flex items-center justify-center border-2 border-dashed border-slate-300">
            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-500">No document selected</p>
          <p className="text-sm mt-2">Upload a legal contract to begin auditing</p>
        </div>
      )}

      {pdfFile && numPages && (
        <div className="fixed bottom-6 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 text-sm font-medium z-50">
          <button 
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(p => p - 1)}
            className="disabled:opacity-50 hover:text-blue-400 transition-colors"
          >
            Previous
          </button>
          <span>
            Page {pageNumber} of {numPages}
          </span>
          <button 
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber(p => p + 1)}
            className="disabled:opacity-50 hover:text-blue-400 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
