import React from 'react';
import AdSlot from './AdSlot';

export default function Footer({ currentPage, setCurrentPage }) {
  const links = [
    { id: 'terms', label: 'Terms' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <footer className="w-full border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-950 mt-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage('home')}
              className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer"
            >
              PDF Tool
            </button>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">·</span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              Free & secure PDF processing
            </span>
          </div>

          <nav className="flex items-center gap-4">
            {links.map(link => (
              <button
                key={link.id}
                onClick={() => setCurrentPage(link.id)}
                className={`text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  currentPage === link.id
                    ? 'text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            &copy; {new Date().getFullYear()} PDF Tool
          </p>
          <div className="overflow-hidden">
            <AdSlot slot="1234567890" />
          </div>
        </div>
      </div>
    </footer>
  );
}
