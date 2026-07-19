import React from 'react';
import AdSlot from './AdSlot';

export default function Footer({ currentPage, setCurrentPage }) {
  const links = [
    { id: 'terms', label: 'Terms & Conditions' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'contact', label: 'Contact Us' },
  ];

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 mt-auto transition-colors duration-200">
      <div className="mx-auto max-w-5xl px-4 flex flex-col items-center gap-6">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage('home')}
              className="text-lg font-bold tracking-tight text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
            >
              PDF Tool
            </button>
            <span className="text-slate-400 dark:text-slate-500 text-sm">| Free PDF Utilities</span>
          </div>
          
          <nav className="flex items-center gap-6">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => setCurrentPage(link.id)}
                className={`text-sm font-medium transition duration-200 hover:text-indigo-600 dark:hover:text-indigo-400 ${
                  currentPage === link.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
          
          <div className="text-sm text-slate-400 dark:text-slate-500 text-center md:text-right">
            &copy; {new Date().getFullYear()} PDF Tool. All rights reserved.
          </div>
        </div>

        {/* Ad slot below the links */}
        <div className="w-full flex justify-center mt-2 overflow-hidden">
          <AdSlot slot="1234567890" />
        </div>
      </div>
    </footer>
  );
}
