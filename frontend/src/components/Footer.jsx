import React from 'react';
import AdSlot from './AdSlot';
import { FileText, Sparkles } from 'lucide-react';

export default function Footer({ currentPage, setCurrentPage }) {
  const links = [
    { id: 'terms', label: 'Terms of Service' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'contact', label: 'Contact Support' },
  ];

  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#060a12] backdrop-blur-xl mt-auto">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-amber-300 transition-colors cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-white">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <span>EZ PDF</span>
            </button>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-800">·</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              High-speed, private PDF & image processing
            </span>
          </div>

          <nav className="flex items-center gap-6">
            {links.map(link => (
              <button
                key={link.id}
                onClick={() => setCurrentPage(link.id)}
                className={`text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer hover:text-indigo-600 dark:hover:text-amber-300 ${
                  currentPage === link.id
                    ? 'text-indigo-600 dark:text-amber-300'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} EZ PDF Tool. All processed files are permanently purged within 1 hour.
          </p>
          <div className="overflow-hidden opacity-90 hover:opacity-100 transition-opacity duration-200">
            <AdSlot slot="1234567890" />
          </div>
        </div>
      </div>
    </footer>
  );
}
