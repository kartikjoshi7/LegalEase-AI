import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useAppContext } from '../context/AppContext';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  pdfFile: File | null;
  hoveredClauseId: string | null;
}

export default React.memo(function PDFViewer({ pdfFile, hoveredClauseId }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const { riskData } = useAppContext();
  
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);
  
  // Dedicated ref for the scrollable viewport container
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  // Dedicated ref for the inner PDF wrapper (used for absolute positioning)
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  const hoveredClause = hoveredClauseId && riskData?.flaggedClauses ? riskData.flaggedClauses[parseInt(hoveredClauseId)] : null;
  const searchText = hoveredClause?.exact_quote;

  // DOM Search and Semantic Word Clustering Logic
  useEffect(() => {
    if (!hoveredClauseId || !searchText || !pdfContainerRef.current || !scrollWrapperRef.current) {
      setHighlightStyle(null);
      return;
    }

    const timer = setTimeout(() => {
      const textSpans = Array.from(document.querySelectorAll('.react-pdf__Page__textContent span'));
      if (!textSpans.length) return;

      // Aggressive Stop-Word Filter
      const stopWords = new Set([
        'the', 'and', 'is', 'in', 'to', 'of', 'for', 'a', 'an', 'or', 'with', 'as', 'by', 'on', 
        'at', 'from', 'this', 'that', 'are', 'be', 'will', 'shall', 'hereto', 'party', 'parties', 
        'whereas', 'any', 'all', 'such', 'not', 'no', 'it', 'its', 'under', 'agrees', 'agreement'
      ]);

      const normalizeAndFilter = (str: string) => {
        return str.replace(/[^a-zA-Z0-9\s]/g, '')
          .toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 2 && !stopWords.has(w));
      };

      const searchWords = normalizeAndFilter(searchText);
      if (searchWords.length === 0) {
        setHighlightStyle(null);
        return;
      }

      // Map physical spans into an array of significant words
      const pdfWords: { word: string, span: Element }[] = [];
      textSpans.forEach(span => {
        const text = span.textContent || "";
        const words = text.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().split(/\s+/);
        words.forEach(w => {
           if (w.length > 2 && !stopWords.has(w)) {
              pdfWords.push({ word: w, span });
           }
        });
      });

      // Sliding Window Clustering
      const uniqueSearchWords = new Set(searchWords);
      const windowSize = Math.min(uniqueSearchWords.size * 3 + 10, 80); // Expand window to handle dense legal paragraphs
      let maxDensity = 0;
      let bestWindow: { start: number, end: number } | null = null;
      
      for (let i = 0; i < pdfWords.length; i++) {
         const endIdx = Math.min(i + windowSize, pdfWords.length);
         const windowSlice = pdfWords.slice(i, endIdx);
         
         const matchedWords = new Set<string>();
         
         for (const item of windowSlice) {
            if (uniqueSearchWords.has(item.word)) {
               matchedWords.add(item.word);
            }
         }
         
         // Density is the ratio of unique search words found in this window
         const density = matchedWords.size / uniqueSearchWords.size;
         
         if (density > maxDensity) {
            maxDensity = density;
            bestWindow = { start: i, end: endIdx - 1 };
         }
         
         if (density >= 1.0) break; // Perfect match found
      }

      // Confidence Threshold Guardrail (Lowered slightly to 25% for extreme LLM hallucinations)
      if (maxDensity >= 0.25 && bestWindow) {
         const spansInWindow = new Set<Element>();
         for (let i = bestWindow.start; i <= bestWindow.end; i++) {
             spansInWindow.add(pdfWords[i].span);
         }
         
         let minTop = Infinity, minLeft = Infinity, maxBottom = -Infinity, maxRight = -Infinity;
         
         spansInWindow.forEach(span => {
            const rect = span.getBoundingClientRect();
            // Ensure span is visible
            if (rect.width > 0 && rect.height > 0) {
               if (minTop === Infinity) {
                   minTop = rect.top;
                   maxBottom = rect.bottom;
                   minLeft = rect.left;
                   maxRight = rect.right;
               } else if (Math.abs(rect.top - minTop) < 400) { // Cluster constraint: max 400px height for a clause
                   minTop = Math.min(minTop, rect.top);
                   minLeft = Math.min(minLeft, rect.left);
                   maxBottom = Math.max(maxBottom, rect.bottom);
                   maxRight = Math.max(maxRight, rect.right);
               }
            }
         });
         
         const innerWrapper = pdfContainerRef.current;
         const scrollWrapper = scrollWrapperRef.current;
         
         if (innerWrapper && scrollWrapper && minTop !== Infinity) {
            const innerRect = innerWrapper.getBoundingClientRect();
            
            // Calculate absolute position inside the inner relative wrapper
            const top = minTop - innerRect.top;
            const left = minLeft - innerRect.left;
            const width = maxRight - minLeft;
            const height = maxBottom - minTop;
            
            setHighlightStyle({
              top: `${top - 8}px`,
              left: `${left - 8}px`,
              width: `${width + 16}px`,
              height: `${height + 16}px`,
            });
            
            // Calculate exact scroll target for the outer overflow container
            const scrollRect = scrollWrapper.getBoundingClientRect();
            const absoluteScrollTop = (minTop - scrollRect.top) + scrollWrapper.scrollTop;
            const viewportHeight = scrollWrapper.clientHeight;
            
            const targetScrollTop = absoluteScrollTop - (viewportHeight / 2) + (height / 2);
            
            scrollWrapper.scrollTo({
               top: targetScrollTop,
               behavior: 'smooth'
            });
         } else {
           setHighlightStyle(null);
         }
      } else {
         // Fail gracefully if threshold not met
         setHighlightStyle(null);
      }
    }, 400); // 400ms delay ensures react-pdf text layer rendering

    return () => clearTimeout(timer);
  }, [hoveredClauseId, searchText]);

  if (!pdfFile) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-10 flex flex-col items-center text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-200">
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Session Restored</h3>
          <p className="text-slate-500 font-medium leading-relaxed">
            Your risk analytics have been restored. To view the semantic highlighting again, please re-upload your PDF document.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div 
      ref={scrollWrapperRef}
      className="flex-1 h-full flex flex-col items-center overflow-y-auto pt-6 pb-20 relative scroll-smooth bg-slate-100"
    >
      <div 
        ref={pdfContainerRef}
        className="shadow-xl bg-slate-100 p-4 relative transition-all duration-500 ease-out"
        style={{ 
          borderRadius: '12px',
          boxShadow: hoveredClauseId ? '0 25px 50px -12px rgba(59, 130, 246, 0.25)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          transform: hoveredClauseId ? 'scale(1.01)' : 'scale(1)'
        }}
      >
        <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
          {Array.from(new Array(numPages || 0), (_, index) => (
            <div key={`page_${index + 1}`} className="mb-6 bg-white shadow-sm border border-slate-200">
              <Page 
                pageNumber={index + 1} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="max-w-full"
                width={600}
              />
            </div>
          ))}
        </Document>

        {/* Dynamic Highlighting Box */}
        <AnimatePresence>
          {highlightStyle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute pointer-events-none z-50 transition-all duration-300 ease-out"
              style={highlightStyle}
            >
              <div className="absolute inset-0 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400 rounded" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
