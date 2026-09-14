import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  ShieldAlert, 
  AlertCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  CheckCircle2,
  Download
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer
} from 'recharts';

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
  hoveredClauseId: string | null;
  setHoveredClauseId: (id: string | null) => void;
}

export default function RiskSidebar({ fairnessScore, executiveSummary, flaggedClauses, hoveredClauseId, setHoveredClauseId }: RiskSidebarProps) {
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const toggleCard = (idx: number) => {
    setExpandedCards(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  // Compute Radar Chart Data dynamically based on flagged clauses
  const getRadarData = () => {
    if (!flaggedClauses.length) return [];
    
    const counts: Record<string, number> = {
      'Indemnification': 0,
      'Arbitration': 0,
      'Liability': 0,
      'IP': 0,
      'Other': 0
    };

    flaggedClauses.forEach(clause => {
      const type = counts[clause.clause_type] !== undefined ? clause.clause_type : 'Other';
      const weight = clause.severity === 'Critical' ? 3 : clause.severity === 'High' ? 2 : 1;
      counts[type] += weight;
    });

    return Object.keys(counts).map(key => ({
      subject: key,
      A: counts[key] + 1, // Add baseline so empty radar still shows shape
      fullMark: 10,
    }));
  };

  const handleExport = async () => {
    alert("Export Dossier endpoint triggered! (Simulated download)");
    // Real implementation would hit /api/v1/export/dossier
  };

  return (
    <div className="h-full flex flex-col bg-white/40">
      
      {/* Header & Metrics */}
      <div className="p-6 border-b border-slate-200/50 bg-white/60 backdrop-blur-md shrink-0">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
          <ShieldAlert className="text-blue-600" /> Diagnostic Dashboard
        </h2>
        
        {fairnessScore !== null ? (
          <div className="flex flex-col gap-6">
            {/* Topline Score */}
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Fairness Score</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black tracking-tighter ${fairnessScore > 70 ? 'text-emerald-500' : fairnessScore > 40 ? 'text-amber-500' : 'text-rose-600'}`}>
                  {fairnessScore}
                </span>
                <span className="text-lg font-bold text-slate-400">/100</span>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="h-48 w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData()}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                  <Radar name="Risks" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-slate-400 text-sm italic">
            Awaiting document analysis...
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        
        {/* Executive Summary */}
        {executiveSummary && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-l-xl" />
            <div className="bg-white/80 p-5 rounded-xl rounded-l-none border border-l-0 border-slate-200/50 shadow-sm">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Executive Brief</h3>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {executiveSummary}
              </p>
            </div>
          </motion.div>
        )}

        {/* Clauses List */}
        {flaggedClauses.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Identified Liabilities</h3>
              <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{flaggedClauses.length}</span>
            </div>
            
            <div className="space-y-4">
              {flaggedClauses.map((clause, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onMouseEnter={() => setHoveredClauseId(idx.toString())}
                  onMouseLeave={() => setHoveredClauseId(null)}
                  className={`rounded-2xl border transition-all duration-300 ${getSeverityColor(clause.severity)} ${hoveredClauseId === idx.toString() ? 'ring-2 ring-blue-400 ring-offset-2 shadow-lg -translate-y-1' : 'shadow-sm hover:shadow-md'}`}
                >
                  {/* Card Header (Clickable) */}
                  <div 
                    className="p-4 cursor-pointer flex items-start gap-3"
                    onClick={() => toggleCard(idx)}
                  >
                    <div className="mt-0.5 shrink-0 bg-white p-1.5 rounded-lg shadow-sm">
                      {getSeverityIcon(clause.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-white/80 text-slate-700 shadow-sm">
                          {clause.clause_type}
                        </span>
                        {expandedCards[idx] ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{clause.severity} Risk Detected</h4>
                    </div>
                  </div>
                  
                  {/* Expandable Content */}
                  <AnimatePresence>
                    {expandedCards[idx] && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 ml-11">
                          <p className="text-sm text-slate-800 leading-relaxed font-medium mb-4">
                            "{clause.plain_english}"
                          </p>
                          
                          {clause.counter_draft && (
                            <div className="bg-white/80 p-4 rounded-xl border border-blue-100 shadow-sm relative group">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                                  <ShieldAlert className="w-3 h-3" /> Auto-Draft Solution
                                </span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); copyToClipboard(clause.counter_draft!, idx); }}
                                  className="text-slate-400 hover:text-blue-600 transition-colors bg-white shadow-sm border border-slate-100 p-1.5 rounded-lg"
                                  title="Copy counter-draft"
                                >
                                  {copiedId === idx ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed font-medium font-mono">
                                {clause.counter_draft}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Export Action */}
      {fairnessScore !== null && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200/50">
          <button 
            onClick={handleExport}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            Export Attorney Dossier
          </button>
        </div>
      )}
    </div>
  );
}
