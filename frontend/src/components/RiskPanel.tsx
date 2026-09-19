import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  AlertTriangle, 
  ShieldAlert, 
  AlertCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  CheckCircle2,
  Download,
  BarChart3,
  List,
  MessageSquare,
  Send,
  Loader2,
  Zap
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';
import ReactMarkdown from 'react-markdown';

interface ClauseRisk {
  clause_type: string;
  exact_quote: string;
  plain_english: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  counter_draft?: string;
}

interface RiskPanelProps {
  fairnessScore: number | null;
  executiveSummary: string;
  flaggedClauses: ClauseRisk[];
  hoveredClauseId: string | null;
  setHoveredClauseId: (id: string | null) => void;
}

import React from 'react';

export default React.memo(function RiskPanel({ fairnessScore, executiveSummary, flaggedClauses, hoveredClauseId, setHoveredClauseId }: RiskPanelProps) {
  const [activeTab, setActiveTab] = useState<'risks' | 'analytics' | 'ask'>('risks');
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  // Q&A State
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [askMessageIndex, setAskMessageIndex] = useState(0);
  const { documentText, error } = useAppContext();
  
  const navigate = useNavigate();

  const chatLoadingMessages = [
    "Analyzing document context...",
    "Querying legal knowledge base...",
    "High traffic detected, optimizing request...",
    "Retrying AI synthesis (Google Gemini API)...",
    "Hold tight, formulating answer...",
    "Navigating API rate limits..."
  ];

  // Rotate messages when asking
  React.useEffect(() => {
    if (isAsking) {
      const interval = setInterval(() => {
        setAskMessageIndex(prev => (prev + 1) % chatLoadingMessages.length);
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setAskMessageIndex(0);
    }
  }, [isAsking]);

  const handleAskQuestion = async () => {
    if (!question.trim() || !documentText) return;
    
    const userMessage = question;
    setQuestion("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAsking(true);
    
    try {
      const response = await import('../api/client').then(m => m.apiClient.askQuestion("doc_id", documentText, userMessage));
      setMessages(prev => [...prev, { role: 'ai', content: response.answer }]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Sorry, I encountered an error while analyzing the document.";
      setMessages(prev => [...prev, { role: 'ai', content: errorMessage }]);
    } finally {
      setIsAsking(false);
    }
  };

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

  const getRadarData = () => {
    if (!flaggedClauses.length) return [];
    const counts: Record<string, number> = {
      'Indemnification': 0, 'Arbitration': 0, 'Liability': 0, 'IP': 0, 'Other': 0
    };
    flaggedClauses.forEach(clause => {
      const type = counts[clause.clause_type] !== undefined ? clause.clause_type : 'Other';
      const weight = clause.severity === 'Critical' ? 3 : clause.severity === 'High' ? 2 : 1;
      counts[type] += weight;
    });
    return Object.keys(counts).map(key => ({
      subject: key,
      A: counts[key] + 1, // baseline
      fullMark: 10,
    }));
  };

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white/40">
        <div className="bg-amber-50/80 backdrop-blur text-amber-800 p-8 rounded-3xl w-full shadow-lg border border-amber-200/60 max-w-sm">
          <AlertCircle className="w-14 h-14 mx-auto mb-5 text-amber-500 opacity-90" />
          <h2 className="text-xl font-black tracking-tight mb-3 uppercase text-amber-900">System Busy</h2>
          <p className="font-medium text-sm text-amber-700/90 leading-relaxed mb-8">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-md hover:shadow-lg active:scale-95"
          >
            Go Back & Try Again
          </button>
        </div>
      </div>
    );
  }

  if (fairnessScore === null) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
        Awaiting document analysis...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white/40">
      
      {/* Header Tabs */}
      <div className="p-4 border-b border-slate-200/50 bg-white/60 backdrop-blur-md shrink-0 flex gap-2">
        <button 
          onClick={() => setActiveTab('risks')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all ${activeTab === 'risks' ? 'bg-white shadow-sm text-blue-600 border border-blue-100' : 'text-slate-500 hover:bg-white/50'}`}
        >
          <List className="w-3.5 h-3.5" /> Heatmap
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all ${activeTab === 'analytics' ? 'bg-white shadow-sm text-blue-600 border border-blue-100' : 'text-slate-500 hover:bg-white/50'}`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Analytics
        </button>
        <button 
          onClick={() => setActiveTab('ask')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all ${activeTab === 'ask' ? 'bg-white shadow-sm text-indigo-600 border border-indigo-100' : 'text-slate-500 hover:bg-white/50'}`}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Ask AI
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            {/* Topline Score */}
            <div className="flex items-center justify-between bg-white/80 p-6 rounded-2xl border border-slate-200/50 shadow-sm">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Fairness Score</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-5xl font-black tracking-tighter ${fairnessScore > 70 ? 'text-emerald-500' : fairnessScore > 40 ? 'text-amber-500' : 'text-rose-600'}`}>
                  {fairnessScore}
                </span>
                <span className="text-xl font-bold text-slate-400">/100</span>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="h-64 w-full bg-white/80 rounded-2xl border border-slate-200/50 shadow-sm p-4">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Liability Vector Mapping</h3>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData()}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                  <Radar name="Risks" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Executive Summary */}
            {executiveSummary && (
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-l-xl" />
                <div className="bg-white/80 p-5 rounded-xl rounded-l-none border border-l-0 border-slate-200/50 shadow-sm">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Executive Brief</h3>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {executiveSummary}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'risks' && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Flagged Clauses</h3>
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
                  whileHover={{ y: -4 }}
                  className={`rounded-2xl border ${getSeverityColor(clause.severity)} ${hoveredClauseId === idx.toString() ? 'ring-2 ring-blue-400 ring-offset-2 shadow-lg' : 'shadow-sm'}`}
                >
                  <div role="button" tabIndex={0} aria-expanded={!!expandedCards[idx]} aria-label={`Toggle details for ${clause.severity} risk`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCard(idx); } }} className="p-4 cursor-pointer flex items-start gap-3" onClick={() => toggleCard(idx)}>
                    <div className="mt-0.5 shrink-0 bg-white p-1.5 rounded-lg shadow-sm">
                      {getSeverityIcon(clause.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-white/80 text-slate-700 shadow-sm">
                          {clause.clause_type}
                        </span>
                        {expandedCards[idx] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{clause.severity} Risk Detected</h4>
                    </div>
                  </div>
                  
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
                            <div className="bg-white/80 p-4 rounded-xl border border-blue-100 shadow-sm group">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                                  <ShieldAlert className="w-3 h-3" /> Auto-Draft Solution
                                </span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); copyToClipboard(clause.counter_draft!, idx); }}
                                  className="text-slate-400 hover:text-blue-600 transition-colors bg-white shadow-sm border border-slate-100 p-1.5 rounded-lg"
                                  title="Copy counter-draft"
                                  aria-label="Copy counter-draft to clipboard"
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
          </motion.div>
        )}
        
        {activeTab === 'ask' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col -mt-4">
            
            {/* Minimal Header */}
            <div className="bg-white/60 p-4 rounded-xl border border-slate-200/50 shadow-sm mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" /> Document Q&A
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Strictly scoped to the uploaded document.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <Zap className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto mb-4 min-h-[250px] space-y-4 pr-2 custom-scrollbar flex flex-col">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-60">
                  <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-500">Ask a question about the contract</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">e.g., "Can the landlord evict me without notice?"</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      {msg.role === 'ai' && (
                        <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                          <Zap className="w-3 h-3 text-indigo-500" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">LegalEase AI</span>
                        </div>
                      )}
                      
                      <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-sm' 
                          : 'bg-white border border-slate-200/60 text-slate-700 rounded-tl-sm'
                      }`}>
                        {msg.role === 'ai' ? (
                          <div className="prose prose-sm prose-slate max-w-none 
                            prose-p:leading-relaxed prose-p:mb-2 last:prose-p:mb-0 
                            prose-ul:my-2 prose-ul:pl-4 
                            prose-li:my-0.5 
                            prose-strong:font-bold prose-strong:text-slate-800">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isAsking && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="self-start max-w-[85%] flex flex-col items-start"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                        <Zap className="w-3 h-3 text-indigo-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">LegalEase AI</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-slate-200/60 rounded-tl-sm shadow-sm flex items-center gap-3 overflow-hidden">
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                        <div className="h-4 relative w-48 flex items-center overflow-hidden">
                          <AnimatePresence mode="popLayout">
                            <motion.span
                              key={askMessageIndex}
                              initial={{ y: 15, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -15, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="text-[11px] text-slate-500 font-bold absolute w-full"
                            >
                              {chatLoadingMessages[askMessageIndex]}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
            
            {/* Input Area */}
            <div className="shrink-0 pt-4 bg-transparent mt-2">
              <div className="relative shadow-sm rounded-2xl group border border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAskQuestion();
                    }
                  }}
                  placeholder="Ask a question..."
                  className="w-full bg-white rounded-2xl py-3.5 pl-4 pr-12 text-sm text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none resize-none h-[52px] leading-tight"
                  disabled={isAsking}
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={isAsking || !question.trim()}
                  aria-label="Send question"
                  className="absolute right-1.5 top-1.5 bottom-1.5 w-[40px] bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer Export Action */}
      <div className="shrink-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200/50">
        <button 
          onClick={() => navigate('/dossier/latest')}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          <Download className="w-5 h-5" />
          Preview Attorney Dossier
        </button>
      </div>
    </div>
  );
});
