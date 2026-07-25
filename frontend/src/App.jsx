import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import Footer from './components/Footer';
import AdSlot from './components/AdSlot';
import { FileText, Sun, Moon, Sparkles } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isProcessing, setIsProcessing] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
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
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#060a12]/80 backdrop-blur-2xl transition-all">
        <div className="mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-amber-300 transition-colors flex items-center gap-1">
                EZ PDF <Sparkles className="w-3 h-3 text-amber-500 inline" />
              </span>
            </div>
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage('home')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                currentPage === 'home'
                  ? 'text-indigo-600 dark:text-amber-300 bg-indigo-50 dark:bg-amber-400/10 border border-indigo-200 dark:border-amber-400/30 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              Tools
            </button>
            <button
              onClick={() => setCurrentPage('contact')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                currentPage === 'contact'
                  ? 'text-indigo-600 dark:text-amber-300 bg-indigo-50 dark:bg-amber-400/10 border border-indigo-200 dark:border-amber-400/30 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              Support
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1"></div>

            {/* Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200 cursor-pointer active:scale-95"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-4.5 w-4.5 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
              ) : (
                <Moon className="h-4.5 w-4.5 text-indigo-600" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Top Ad — only when not processing */}
      {!isProcessing && (
        <div className="mx-auto max-w-4xl w-full px-4 pt-6">
          <AdSlot slot="1234567890" />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        {renderPage()}
      </main>

      {/* Footer */}
      {!isProcessing && <Footer currentPage={currentPage} setCurrentPage={setCurrentPage} />}
    </div>
  );
}
