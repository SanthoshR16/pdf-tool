import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import Footer from './components/Footer';
import AdSlot from './components/AdSlot';
import { FileText, Sun, Moon } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'terms' | 'privacy' | 'contact'
  const [isProcessing, setIsProcessing] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setIsProcessing={setIsProcessing} />;
      case 'terms':
        return <Terms setCurrentPage={setCurrentPage} />;
      case 'privacy':
        return <Privacy setCurrentPage={setCurrentPage} />;
      case 'contact':
        return <Contact setCurrentPage={setCurrentPage} />;
      default:
        return <Home setIsProcessing={setIsProcessing} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2 group text-left"
          >
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100 dark:shadow-none group-hover:bg-indigo-700 transition">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white block leading-none font-display">
                PDF Tool
              </span>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wider">
                100% Free & Secure
              </span>
            </div>
          </button>

          <nav className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage('home')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition duration-150 ${
                currentPage === 'home'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
              }`}
            >
              Tools
            </button>
            <button
              onClick={() => setCurrentPage('contact')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition duration-150 ${
                currentPage === 'contact'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
              }`}
            >
              Support
            </button>
            
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-0.5"></div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition duration-150"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          </nav>
        </div>
      </header>

      {/* Top Banner Ad - only when not actively processing */}
      {!isProcessing && (
        <div className="mx-auto max-w-5xl w-full px-4 pt-4 animate-fade-in-up">
          <AdSlot slotId="top-banner-ad" />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow">
        {renderPage()}
      </main>

      {/* Bottom Footer Ad - only when not actively processing */}
      {!isProcessing && (
        <div className="mx-auto max-w-5xl w-full px-4 pb-4 animate-fade-in-up">
          <AdSlot slotId="bottom-footer-ad" />
        </div>
      )}

      {/* Footer */}
      {!isProcessing && <Footer currentPage={currentPage} setCurrentPage={setCurrentPage} />}
    </div>
  );
}
