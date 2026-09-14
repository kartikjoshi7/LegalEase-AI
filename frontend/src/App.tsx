import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import KeepAlive from './components/KeepAlive';
import LandingHub from './pages/LandingHub';
import Workspace from './pages/Workspace';
import DossierPreview from './pages/DossierPreview';
import { useAppContext } from './context/AppContext';
import { ShieldCheck, Menu, X } from 'lucide-react';
import { apiClient } from './api/client';
import { scrubPII } from './utils/piiScrubber';
import { extractTextFromPDF } from './utils/pdfExtractor';

function App() {
  const { setPdfFile, setIsLoading, setRiskData, setError } = useAppContext();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setIsLoading(true);
      setError(null);
      setRiskData(null);
      setMobileMenuOpen(false);
      
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
    <div className="flex flex-col h-screen w-screen overflow-hidden print:h-auto print:w-auto print:overflow-visible bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-200">
      <KeepAlive />
      
      {/* Premium Top Navbar */}
      <header className="print:hidden h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-6 lg:px-12 shrink-0 z-50 relative shadow-sm">
        
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 border border-white/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              LegalEase <span className="font-light">AI</span>
            </h1>
          </div>
        </div>

        {/* Right Actions - Removed unused buttons */}
        <div className="hidden lg:flex items-center gap-4">
        </div>

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden p-2 text-slate-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Main Workspace Router */}
      <main className="flex-1 flex overflow-hidden print:overflow-visible print:block relative">
        <Routes>
          <Route path="/" element={<LandingHub />} />
          <Route path="/workspace/:id" element={<Workspace />} />
          <Route path="/dossier/:id" element={<DossierPreview />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
