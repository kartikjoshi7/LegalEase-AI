import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import PDFViewer from '../components/PDFViewer';
import RiskPanel from '../components/RiskPanel';

export default function Workspace() {
  const { pdfFile, riskData, isLoading } = useAppContext();
  const navigate = useNavigate();
  const [hoveredClauseId, setHoveredClauseId] = useState<string | null>(null);

  // Guardrail
  useEffect(() => {
    if (!pdfFile && !isLoading) {
      navigate('/');
    }
  }, [pdfFile, isLoading, navigate]);

  if (!pdfFile && !isLoading) return null;

  return (
    <div role="region" aria-label="Analysis Workspace" className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden p-2 gap-2 relative">
      {/* Background glowing effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />

      {/* PDF Viewer Pane */}
      <div role="region" aria-label="PDF Document Viewer" className="flex-1 h-full min-h-0 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl overflow-hidden relative z-10 flex flex-col">
        <div className="h-12 bg-white/40 border-b border-slate-200/50 flex items-center px-4 shrink-0 backdrop-blur-md" aria-hidden="true">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Document Context</span>
          <span className="ml-auto text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">{pdfFile?.name}</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <PDFViewer 
            pdfFile={pdfFile} 
            hoveredClauseId={hoveredClauseId}
          />
        </div>
      </div>

      {/* Risk Panel Pane */}
      <div role="region" aria-label="AI Risk Analysis Results" className="lg:w-[450px] xl:w-[500px] shrink-0 h-full min-h-0 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative z-10 flex flex-col">
        <div className="h-12 bg-white/60 border-b border-slate-200/50 flex items-center px-4 shrink-0" aria-hidden="true">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">AI Risk Analysis</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <RiskPanel 
            fairnessScore={riskData?.fairnessScore ?? null}
            executiveSummary={riskData?.executiveSummary ?? ''}
            flaggedClauses={riskData?.flaggedClauses ?? []}
            hoveredClauseId={hoveredClauseId}
            setHoveredClauseId={setHoveredClauseId}
          />
        </div>
      </div>
    </div>
  );
}
