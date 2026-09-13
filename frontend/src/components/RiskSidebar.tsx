
import { AlertTriangle, ShieldAlert, AlertCircle, FileText } from 'lucide-react';

interface ClauseRisk {
  clause_type: string;
  exact_quote: string;
  plain_english: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  counter_draft?: string;
}

interface RiskSidebarProps {
  fairnessScore: number | null;
  executiveSummary: string;
  flaggedClauses: ClauseRisk[];
}

export default function RiskSidebar({ fairnessScore, executiveSummary, flaggedClauses }: RiskSidebarProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical': return <ShieldAlert className="w-5 h-5 text-red-600" />;
      case 'High': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'Medium': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-50 border-red-200';
      case 'High': return 'bg-orange-50 border-orange-200';
      case 'Medium': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="w-1/3 min-w-[400px] h-full bg-white border-l border-slate-200 flex flex-col shadow-xl z-10 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="text-blue-600" /> Legal Risk Analysis
        </h2>
        
        {fairnessScore !== null && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Fairness Score</span>
            <div className={`text-2xl font-black ${fairnessScore > 70 ? 'text-green-600' : fairnessScore > 40 ? 'text-orange-500' : 'text-red-600'}`}>
              {fairnessScore}/100
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* Executive Summary */}
        {executiveSummary && (
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Executive Summary</h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {executiveSummary}
            </p>
          </div>
        )}

        {/* Clauses List */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Flagged Liabilities ({flaggedClauses.length})</h3>
          
          {flaggedClauses.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No risks identified in this document.
            </div>
          ) : (
            <div className="space-y-4">
              {flaggedClauses.map((clause, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${getSeverityColor(clause.severity)} transition-all hover:shadow-md cursor-pointer`}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="mt-0.5">{getSeverityIcon(clause.severity)}</div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-white bg-opacity-60 text-slate-700 mb-1">
                        {clause.clause_type}
                      </span>
                      <h4 className="font-semibold text-slate-900 text-sm">{clause.severity} Risk</h4>
                    </div>
                  </div>
                  
                  <div className="ml-8 space-y-3">
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                      "{clause.plain_english}"
                    </p>
                    
                    {clause.counter_draft && (
                      <div className="mt-3 bg-white bg-opacity-60 p-3 rounded-lg border border-slate-200/50">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Suggested Counter-Draft</span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {clause.counter_draft}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
