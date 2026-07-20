import React from 'react';
import AdSlot from './AdSlot';

export default function Footer({ currentPage, setCurrentPage }) {
  const links = [
    { id: 'terms', label: 'Terms of Service' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'contact', label: 'Contact Support' },
  ];

  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-900 bg-white dark:bg-slate-950 mt-auto">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage('home')}
              className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              PDF Tool
            </button>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-800">·</span>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              Secure, server-side document processing
            </span>
          </div>

          <nav className="flex items-center gap-6">
            {links.map(link => (
              <button
                key={link.id}
                onClick={() => setCurrentPage(link.id)}
                className={`text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 ${
                  currentPage === link.id
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} PDF Tool. All files are permanently deleted after processing.
          </p>
          <div className="overflow-hidden opacity-80 hover:opacity-100 transition-opacity duration-200">
            <AdSlot slot="1234567890" />
          </div>
        </div>
      </div>
    </footer>
  );
}
