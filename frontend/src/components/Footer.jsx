import React from 'react';

export default function Footer({ currentPage, setCurrentPage }) {
  const links = [
    { id: 'terms', label: 'Terms & Conditions' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'contact', label: 'Contact Us' },
  ];

  return (
    <footer className="w-full border-t border-slate-200 bg-white py-8 mt-auto">
      <div className="mx-auto max-w-5xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage('home')}
            className="text-lg font-bold tracking-tight text-indigo-600 hover:text-indigo-700 transition"
          >
            PDF Tool
          </button>
          <span className="text-slate-400 text-sm">| Free PDF Utilities</span>
        </div>
        
        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => setCurrentPage(link.id)}
              className={`text-sm font-medium transition duration-200 hover:text-indigo-600 ${
                currentPage === link.id ? 'text-indigo-600' : 'text-slate-500'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>
        
        <div className="text-sm text-slate-400 text-center md:text-right">
          &copy; {new Date().getFullYear()} PDF Tool. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
