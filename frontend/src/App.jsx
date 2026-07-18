import React, { useState } from 'react';
import Home from './pages/Home';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import Footer from './components/Footer';
import { FileText } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'terms' | 'privacy' | 'contact'

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'terms':
        return <Terms setCurrentPage={setCurrentPage} />;
      case 'privacy':
        return <Privacy setCurrentPage={setCurrentPage} />;
      case 'contact':
        return <Contact setCurrentPage={setCurrentPage} />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2 group text-left"
          >
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100 group-hover:bg-indigo-700 transition">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 block leading-none">
                PDF Tool
              </span>
              <span className="text-[10px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wider">
                100% Free & Secure
              </span>
            </div>
          </button>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage('home')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition duration-150 ${
                currentPage === 'home'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              Tools
            </button>
            <button
              onClick={() => setCurrentPage('contact')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition duration-150 ${
                currentPage === 'contact'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              Support
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {renderPage()}
      </main>

      {/* Footer */}
      <Footer currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  );
}
