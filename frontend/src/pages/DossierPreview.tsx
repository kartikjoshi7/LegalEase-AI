import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Download, ShieldCheck } from 'lucide-react';

const DossierPreview = () => {
  const { pdfFile, riskData } = useAppContext();
  const navigate = useNavigate();

  // Guardrail
  useEffect(() => {
    if (!riskData) {
      navigate('/');
    }
  }, [riskData, navigate]);

  if (!riskData) return null;

  const handleDownload = () => {
    // Leverage the browser's native print-to-PDF engine
    window.print();
  };

  return (
    <div role="region" aria-label="Dossier Preview" className="w-full h-full bg-slate-50 print:bg-white overflow-y-auto print:overflow-visible relative">
      
      {/* Floating Action Bar */}
      <div className="print:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => navigate('/workspace/latest')}
          aria-label="Back to Workspace"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" /> Back to Workspace
        </button>
        <button 
          onClick={handleDownload}
          aria-label="Download PDF Dossier"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
        >
          <Download className="w-4 h-4" aria-hidden="true" /> Download PDF Dossier
        </button>
      </div>

      {/* A4 Print Layout Container */}
      <div className="max-w-4xl w-full mx-auto my-12 print:my-0 bg-white shadow-2xl print:shadow-none ring-1 ring-slate-200 print:ring-0 p-16 print:p-0 min-h-[1056px] h-fit print:min-h-0">
        
        {/* Dossier Header */}
        <div className="border-b-4 border-slate-900 pb-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">LegalEase AI</h1>
          </div>
          <h2 className="text-2xl font-bold text-slate-700">Attorney Intake Dossier</h2>
          <p className="text-slate-500 mt-2 font-medium">Document ID: <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{pdfFile?.name ?? 'Restored Session'}</span></p>
          
          <div className="mt-8 flex items-center gap-6">
            <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Fairness Score</span>
              <span className={`text-3xl font-black tracking-tight ${riskData.fairnessScore! > 70 ? 'text-emerald-500' : riskData.fairnessScore! > 40 ? 'text-amber-500' : 'text-rose-600'}`}>
                {riskData.fairnessScore}<span className="text-xl text-slate-400 font-bold">/100</span>
              </span>
            </div>
            <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Flagged Liabilities</span>
              <span className="text-3xl font-black text-slate-700 tracking-tight">
                {riskData.flaggedClauses.length}
              </span>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <section className="mb-12">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-6">Executive Brief</h3>
          <p className="text-slate-700 leading-relaxed font-medium">
            {riskData.executiveSummary}
          </p>
        </section>

        {/* Risk Breakdown */}
        <section>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-6">Flagged Clause Log</h3>
          <div className="space-y-8">
            {riskData.flaggedClauses.map((clause, idx) => (
              <div key={idx} className={`bg-slate-50 border p-6 rounded-xl shadow-sm ${clause.severity === 'Critical' ? 'border-l-4 border-l-red-500 border-slate-200' : clause.severity === 'High' ? 'border-l-4 border-l-orange-500 border-slate-200' : 'border-l-4 border-l-yellow-500 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                    {clause.clause_type}
                  </span>
                  <span className={`text-xs font-black uppercase tracking-wider ${clause.severity === 'Critical' ? 'text-red-600' : clause.severity === 'High' ? 'text-orange-600' : 'text-yellow-600'}`}>
                    {clause.severity} Risk
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Plain English Interpretation</h4>
                    <p className="text-slate-800 text-sm font-medium leading-relaxed">{clause.plain_english}</p>
                  </div>
                  {clause.counter_draft && (
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Suggested Counter-Draft</h4>
                      <p className="text-slate-700 font-mono text-sm leading-relaxed">{clause.counter_draft}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Footer */}
        <div className="mt-24 pt-8 border-t border-slate-200 text-center text-xs text-slate-400 font-bold tracking-widest uppercase">
          Generated by LegalEase AI. This document does not constitute formal legal advice.
        </div>
      </div>
    </div>
  );
};

export default React.memo(DossierPreview);
