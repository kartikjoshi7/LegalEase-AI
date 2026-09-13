import { useState } from 'react';
import KeepAlive from './components/KeepAlive';
import PDFViewer from './components/PDFViewer';
import RiskSidebar from './components/RiskSidebar';
import { UploadCloud, Loader2 } from 'lucide-react';
import { apiClient } from './api/client';
import { scrubPII } from './utils/piiScrubber';
import { extractTextFromPDF } from './utils/pdfExtractor';

function App() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskData, setRiskData] = useState<{
    fairnessScore: number | null;
    executiveSummary: string;
    flaggedClauses: any[];
  } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setIsLoading(true);
      setError(null);
      setRiskData(null);
      
      try {
        // 1. Read file text natively using pdf.js to satisfy REQ-EVAL-001
        const text = await extractTextFromPDF(file);
        
        // 2. Client-Side Scrubbing (REQ-EVAL-001)
        const scrubbedText = scrubPII(text);
        
        // 3. Call FastAPI Backend
        const response = await apiClient.post('/analyze/risk', {
          document_id: file.name,
          document_text: scrubbedText,
          contract_type: 'generic_contract'
        });
        
        setRiskData({
          fairnessScore: response.fairness_score,
          executiveSummary: response.executive_summary,
          flaggedClauses: response.flagged_clauses
        });
        
      } catch (err: any) {
        console.error("API Error:", err);
        setError(err.message || "Failed to analyze document.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50">
      <KeepAlive />
      
      {/* Top Navigation Bar */}
      <nav aria-label="Main Navigation" className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md" aria-hidden="true">
            ⚖️
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">LegalEase AI</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <label 
            className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
            aria-label="Upload Contract Document"
          >
            <UploadCloud className="w-4 h-4" aria-hidden="true" />
            Upload Contract
            <input 
              type="file" 
              className="sr-only" 
              accept="application/pdf"
              onChange={handleFileUpload}
              aria-hidden="true"
            />
          </label>
        </div>
      </nav>

      {/* Main Dual-Canvas Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Canvas: PDF Document Viewer */}
        <PDFViewer pdfFile={pdfFile} />

        {/* Right Canvas: Risk Analysis Sidebar */}
        <div className="w-1/3 min-w-[400px] relative h-full">
          {isLoading ? (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
              <p className="text-slate-600 font-medium animate-pulse">Running AI Audit...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 bg-white z-20 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-red-600 font-bold text-xl">!</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Analysis Failed</h3>
              <p className="text-slate-500 text-sm">{error}</p>
            </div>
          ) : null}
          
          <RiskSidebar 
            fairnessScore={riskData ? riskData.fairnessScore : null}
            executiveSummary={riskData ? riskData.executiveSummary : ''}
            flaggedClauses={riskData ? riskData.flaggedClauses : []}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
