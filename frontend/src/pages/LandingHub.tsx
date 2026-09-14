import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { apiClient } from '../api/client';
import { scrubPII } from '../utils/piiScrubber';
import { extractTextFromPDF } from '../utils/pdfExtractor';

const loadingMessages = [
  "Extracting raw text via PyMuPDF...",
  "Scrubbing PII securely on edge...",
  "Auditing clauses against legal baselines...",
  "Drafting balanced counter-proposals...",
  "Generating Attorney Dossier..."
];

export default function LandingHub() {
  const { setPdfFile, setIsLoading, setRiskData, setError, isLoading } = useAppContext();
  const navigate = useNavigate();
  const [messageIndex, setMessageIndex] = useState(0);
  const [userContext, setUserContext] = useState("");

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setIsLoading(true);
      setError(null);
      setRiskData(null);
      setMessageIndex(0);
      
      try {
        const text = await extractTextFromPDF(file);
        const scrubbedText = scrubPII(text);
        
        const response = await apiClient.post('/analyze/risk', {
          document_id: file.name,
          document_text: scrubbedText,
          contract_type: 'generic_contract',
          user_context: userContext
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
        navigate('/workspace/latest'); // navigate anyway to show the error state in the workspace
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center relative p-8">
      {/* Background glowing effects */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
      
      {!isLoading ? (
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          {/* Left Side: Copy and Features */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col z-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-sm">
                <Zap className="w-3 h-3 fill-blue-600" /> LegalEase AI
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-slate-500 mb-2 uppercase tracking-widest">
              Make Sense of the Fine Print
            </h2>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
              Instant Legal <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Document Review</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 font-medium max-w-md">
              Unsure about the fine print? Upload your contract and let our AI instantly identify hidden risks, unfair clauses, and draft counter-proposals.
            </p>
            
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Platform Highlights</h3>
              {[
                "Context-aware AI legal analysis",
                "Detailed feedback and counter-drafts",
                "On-device PII scrubbing",
                "Semantic PDF highlight mapping"
              ].map((highlight, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-700 font-medium">{highlight}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side: Upload Card */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full z-10"
          >
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-[0_20px_50px_-12px_rgba(37,99,235,0.15)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
              
              <h2 className="text-2xl font-black text-slate-900 mb-6">Review My Document</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    Representation Context <span className="text-slate-400 font-medium normal-case">(Optional)</span>
                  </h3>
                  <textarea
                    value={userContext}
                    onChange={(e) => setUserContext(e.target.value)}
                    placeholder="e.g., I am the Tenant. We have zero budget for hidden fees."
                    className="w-full h-24 bg-white/50 border border-slate-200 rounded-xl p-4 text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all shadow-inner"
                  />
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Upload Files</h3>
                  <label className="w-full h-40 rounded-xl border-2 border-dashed border-slate-300 bg-white/40 hover:bg-white/80 flex flex-col items-center justify-center transition-all hover:border-blue-500 cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-slate-700 font-bold">Click to upload PDF</p>
                    <p className="text-slate-400 text-xs mt-1 font-medium">Max file size 50MB</p>
                    <input 
                      type="file" 
                      className="sr-only" 
                      accept="application/pdf"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
          
        </div>
      ) : (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl flex flex-col items-center relative overflow-hidden border border-white z-20"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent">
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="w-full h-full bg-blue-400"
              />
            </div>
            
            <motion.div 
              animate={{ rotateY: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-inner"
            >
              <FileText className="w-10 h-10 text-blue-600" />
            </motion.div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Analyzing Contract...</h3>
            
            <div className="h-16 relative w-full flex items-center justify-center overflow-hidden mb-2 px-4">
              <AnimatePresence mode="popLayout">
                <motion.p
                  key={messageIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-blue-600 text-sm font-bold tracking-wider uppercase absolute text-center w-full px-4"
                >
                  {loadingMessages[messageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
            
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
