import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ClauseRisk {
  clause_type: string;
  exact_quote: string;
  plain_english: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  counter_draft?: string;
}

interface RiskData {
  fairnessScore: number | null;
  executiveSummary: string;
  flaggedClauses: ClauseRisk[];
}

interface AppContextType {
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  riskData: RiskData | null;
  setRiskData: (data: RiskData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  hoveredClauseId: string | null;
  setHoveredClauseId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  const [riskData, setRiskData] = useState<RiskData | null>(() => {
    const saved = sessionStorage.getItem('legalease_riskdata');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredClauseId, setHoveredClauseId] = useState<string | null>(null);

  useEffect(() => {
    if (riskData) {
      sessionStorage.setItem('legalease_riskdata', JSON.stringify(riskData));
    } else {
      sessionStorage.removeItem('legalease_riskdata');
    }
  }, [riskData]);

  return (
    <AppContext.Provider 
      value={{
        pdfFile, setPdfFile,
        riskData, setRiskData,
        isLoading, setIsLoading,
        error, setError,
        hoveredClauseId, setHoveredClauseId
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
