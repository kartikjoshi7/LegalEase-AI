import { useState, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import KeepAlive from './components/KeepAlive';
import LandingHub from './pages/LandingHub';

const Workspace = lazy(() => import('./pages/Workspace'));
const DossierPreview = lazy(() => import('./pages/DossierPreview'));
import { Menu, X, UploadCloud } from 'lucide-react';

function App() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden print:h-auto print:w-auto print:overflow-visible bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-200">
      <KeepAlive />
      
      {/* Premium Top Navbar */}
      <header role="banner" className="print:hidden h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-6 lg:px-12 shrink-0 z-50 relative shadow-sm">
        
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.jpg" alt="LegalEase AI Logo" className="w-10 h-10 rounded-xl shadow-lg border border-blue-100" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              LegalEase <span className="font-light">AI</span>
            </h1>
          </div>
        </div>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            aria-label="Upload New Document"
            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold transition-colors border border-blue-200 shadow-sm"
          >
            <UploadCloud className="w-4 h-4" aria-hidden="true" />
            New Document
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button aria-label="Toggle navigation menu" className="lg:hidden p-2 text-slate-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
        </button>
      </header>

      {/* Main Workspace Router */}
      <main role="main" className="flex-1 flex overflow-hidden print:overflow-visible print:block relative">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<LandingHub />} />
            <Route path="/workspace/:id" element={<Workspace />} />
            <Route path="/dossier/:id" element={<DossierPreview />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
