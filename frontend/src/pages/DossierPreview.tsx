import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Download, ShieldCheck } from 'lucide-react';

export default function DossierPreview() {
  const { pdfFile, riskData } = useAppContext();
  const navigate = useNavigate();

  // Guardrail
  useEffect(() => {
    if (!pdfFile || !riskData) {
      navigate('/');
    }
  }, [pdfFile, riskData, navigate]);

  if (!pdfFile || !riskData) return null;

  const handleDownload = () => {
    // Leverage the browser's native print-to-PDF engine
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 print:bg-white overflow-y-auto print:overflow-visible relative">
      
      {/* Floating Action Bar */}
      <div className="print:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => navigate('/workspace/latest')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Workspace
        </button>
        <button 
          onClick={handleDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg"
        >
          <Download className="w-4 h-4" /> Download PDF Dossier
        </button>
      </div>

      {/* A4 Print Layout Container */}
      <div className="max-w-4xl w-full mx-auto my-12 print:my-0 bg-white shadow-2xl print:shadow-none ring-1 ring-slate-200 print:ring-0 p-16 print:p-0 min-h-[1056px] print:min-h-0">
        {/* Dossier Header */}
        <div className="border-b-4 border-slate-900 pb-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-10 h-10 text-slate-900" />
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">LegalEase AI</h1>
          </div>
          <h2 className="text-2xl font-bold text-slate-700">Attorney Intake Dossier</h2>
          <p className="text-slate-500 mt-2">Document ID: <span className="font-mono text-slate-700">{pdfFile.name}</span></p>
          <div className="mt-6 flex items-center gap-4">
            <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Fairness Score</span>
              <span className={`text-2xl font-black ${riskData.fairnessScore! > 70 ? 'text-emerald-600' : riskData.fairnessScore! > 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                {riskData.fairnessScore}/100
              </span>
            </div>
            <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Flagged Liabilities</span>
              <span className="text-2xl font-black text-slate-700">
                {riskData.flaggedClauses.length}
              </span>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <section className="mb-12">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-6">Executive Brief</h3>
          <p className="text-slate-700 leading-relaxed font-medium">
            {riskData.executiveSummary}
          </p>
        </section>

        {/* Risk Breakdown */}
        <section>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-6">Flagged Clause Log</h3>
          <div className="space-y-8">
            {riskData.flaggedClauses.map((clause, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {clause.clause_type}
                  </span>
                  <span className={`text-sm font-black uppercase ${clause.severity === 'Critical' ? 'text-red-600' : clause.severity === 'High' ? 'text-orange-500' : 'text-yellow-600'}`}>
                    {clause.severity} Risk
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Plain English Interpretation</h4>
                    <p className="text-slate-800 font-medium">{clause.plain_english}</p>
                  </div>
                  {clause.counter_draft && (
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                      <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Suggested Counter-Draft</h4>
                      <p className="text-slate-700 font-mono text-sm">{clause.counter_draft}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-slate-200 text-center text-sm text-slate-400 font-medium">
          Generated by LegalEase AI. This document does not constitute formal legal advice.
        </div>
      </div>
    </div>
  );
}
