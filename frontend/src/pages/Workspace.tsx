import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import PDFViewer from '../components/PDFViewer';
import RiskPanel from '../components/RiskPanel';
import { AlertTriangle } from 'lucide-react';

export default function Workspace() {
  const { pdfFile, riskData, error, hoveredClauseId, setHoveredClauseId } = useAppContext();
  const navigate = useNavigate();

  // Guardrail: if user manually refreshes the workspace or accesses it directly without uploading
  useEffect(() => {
    if (!pdfFile) {
      navigate('/');
    }
  }, [pdfFile, navigate]);

  if (!pdfFile) return null; // Avoid rendering if redirecting

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Canvas: PDF Document Viewer */}
      <div className="flex-1 overflow-hidden bg-slate-900/5 flex flex-col relative">
        <PDFViewer pdfFile={pdfFile} hoveredClauseId={hoveredClauseId} />
      </div>

      {/* Right Canvas: Risk Analysis Panel */}
      <div className="w-2/5 min-w-[500px] relative h-full bg-white/60 backdrop-blur-md border-l border-white/80 shadow-2xl z-10 flex flex-col">
        {error ? (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Analysis Failed</h3>
            <p className="text-slate-500">{error}</p>
          </div>
        ) : null}
        
        <RiskPanel 
          fairnessScore={riskData ? riskData.fairnessScore : null}
          executiveSummary={riskData ? riskData.executiveSummary : ''}
          flaggedClauses={riskData ? riskData.flaggedClauses : []}
          hoveredClauseId={hoveredClauseId}
          setHoveredClauseId={setHoveredClauseId}
        />
      </div>
    </div>
  );
}
