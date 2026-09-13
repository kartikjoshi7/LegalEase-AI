import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText } from 'lucide-react';
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
      
      {!isLoading ? (
        <div className="flex flex-col gap-6 w-full max-w-3xl">
          {/* Context Input */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full rounded-[2rem] border border-white/40 bg-white/40 backdrop-blur-xl p-8 shadow-xl"
          >
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Representation Context <span className="text-slate-400 font-medium normal-case">(Optional)</span>
            </h3>
            <textarea
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              placeholder="e.g., I am representing the College. We have zero budget for indemnification payouts and need strict data privacy."
              className="w-full h-24 bg-white/50 border border-white/60 rounded-xl p-4 text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none transition-all shadow-inner"
            />
          </motion.div>

          {/* Dropzone */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full h-[280px] rounded-[2rem] border-2 border-dashed border-slate-300 bg-white/40 backdrop-blur-xl flex flex-col items-center justify-center transition-colors hover:bg-white/60 hover:border-blue-400 group relative shadow-2xl"
          >
            <div className="w-20 h-20 bg-blue-50/80 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg border border-blue-100">
              <UploadCloud className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Drop your contract here</h2>
            <p className="text-slate-500 font-medium text-sm">PDF documents up to 50MB are supported.</p>
            
            <label className="absolute inset-0 w-full h-full cursor-pointer">
              <input 
                type="file" 
                className="sr-only" 
                accept="application/pdf"
                onChange={handleFileUpload}
              />
            </label>
          </motion.div>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl flex flex-col items-center relative overflow-hidden border border-white"
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
            
            <div className="h-6 relative w-full flex items-center justify-center overflow-hidden mb-2">
              <AnimatePresence mode="popLayout">
                <motion.p
                  key={messageIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-blue-600 text-sm font-bold tracking-wider uppercase absolute text-center w-full"
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
