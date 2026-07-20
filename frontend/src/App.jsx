import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import Footer from './components/Footer';
import AdSlot from './components/AdSlot';
import { FileText, Sun, Moon } from 'lucide-react';

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
    <div className="flex flex-col min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 bg-neutral-900 dark:bg-white rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white dark:text-neutral-900" />
            </div>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              PDF Tool
            </span>
          </button>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage('home')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-150 cursor-pointer ${
                currentPage === 'home'
                  ? 'text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Tools
            </button>
            <button
              onClick={() => setCurrentPage('contact')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-150 cursor-pointer ${
                currentPage === 'contact'
                  ? 'text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              Support
            </button>

            <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-800 mx-1"></div>

            {/* Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-150 cursor-pointer"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Top Ad — only when not processing */}
      {!isProcessing && (
        <div className="mx-auto max-w-3xl w-full px-6 pt-4">
          <AdSlot slot="1234567890" />
        </div>
      )}

      {/* Main */}
      <main className="flex-grow">
        {renderPage()}
      </main>

      {/* Footer */}
      {!isProcessing && <Footer currentPage={currentPage} setCurrentPage={setCurrentPage} />}
    </div>
  );
}
