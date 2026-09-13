import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import KeepAlive from './components/KeepAlive';
import LandingHub from './pages/LandingHub';
import Workspace from './pages/Workspace';
import DossierPreview from './pages/DossierPreview';
import { useAppContext } from './context/AppContext';
import { UploadCloud } from 'lucide-react';
import { apiClient } from './api/client';
import { scrubPII } from './utils/piiScrubber';
import { extractTextFromPDF } from './utils/pdfExtractor';

function App() {
  const { setPdfFile, setIsLoading, setRiskData, setError } = useAppContext();
  const navigate = useNavigate();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setIsLoading(true);
      setError(null);
      setRiskData(null);
      
      try {
        const text = await extractTextFromPDF(file);
        const scrubbedText = scrubPII(text);
        
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
        
        navigate('/workspace/latest');
        
      } catch (err: any) {
        console.error("API Error:", err);
        setError(err.message || "Failed to analyze document.");
        navigate('/workspace/latest');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="h-screen w-screen print:h-auto print:w-auto flex flex-col overflow-hidden print:overflow-visible bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-200">
      <KeepAlive />
      
      {/* Edge-to-Edge Glass Navigation */}
      <nav aria-label="Main Navigation" className="print:hidden h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-8 shrink-0 z-20 relative">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg border border-white/20" aria-hidden="true">
            <ShieldIcon />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            LegalEase <span className="font-light">AI</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <label 
            className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 border border-slate-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 group"
            aria-label="Upload Contract Document"
          >
            <UploadCloud className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
            Upload New Contract
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

      {/* Main Workspace Router */}
      <main className="flex-1 flex overflow-hidden print:overflow-visible print:block">
        <Routes>
          <Route path="/" element={<LandingHub />} />
          <Route path="/workspace/:id" element={<Workspace />} />
          <Route path="/dossier/:id" element={<DossierPreview />} />
        </Routes>
      </main>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default App;
