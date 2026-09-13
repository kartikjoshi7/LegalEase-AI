import { useState } from 'react';
import KeepAlive from './components/KeepAlive';
import PDFViewer from './components/PDFViewer';
import RiskSidebar from './components/RiskSidebar';
import { UploadCloud } from 'lucide-react';

function App() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Mock data to demonstrate the UI before connecting to FastAPI
  const mockRiskData = {
    fairnessScore: 42,
    executiveSummary: "This document contains significant asymmetrical liabilities heavily favoring the landlord. We recommend reviewing the arbitration and indemnification clauses before signing.",
    flaggedClauses: [
      {
        clause_type: "Indemnification",
        severity: "Critical" as const,
        exact_quote: "Tenant agrees to indemnify and hold Landlord harmless...",
        plain_english: "You take full financial responsibility for any lawsuits on the property, even if it's the landlord's fault.",
        counter_draft: "Tenant indemnifies Landlord only for gross negligence or intentional misconduct."
      },
      {
        clause_type: "Termination",
        severity: "High" as const,
        exact_quote: "Landlord may terminate this agreement with 24 hours notice.",
        plain_english: "The landlord can kick you out with almost no warning.",
        counter_draft: "Landlord may terminate this agreement with 30 days written notice."
      }
    ]
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50">
      <KeepAlive />
      
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
            ⚖️
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">LegalEase AI</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            Upload Contract
            <input 
              type="file" 
              className="hidden" 
              accept="application/pdf"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </nav>

      {/* Main Dual-Canvas Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Canvas: PDF Document Viewer */}
        <PDFViewer pdfFile={pdfFile} />

        {/* Right Canvas: Risk Analysis Sidebar */}
        <RiskSidebar 
          fairnessScore={pdfFile ? mockRiskData.fairnessScore : null}
          executiveSummary={pdfFile ? mockRiskData.executiveSummary : ''}
          flaggedClauses={pdfFile ? mockRiskData.flaggedClauses : []}
        />
      </main>
    </div>
  );
}

export default App;
