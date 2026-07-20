import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

export default function Terms({ setCurrentPage }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-16 animate-fade-in-up">
      {/* Back Link */}
      <button
        onClick={() => setCurrentPage('home')}
        className="text-sm font-semibold text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 mb-8 cursor-pointer group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Tools</span>
      </button>

      <div className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-100/50 dark:shadow-none backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-slate-105 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-850 flex items-center justify-center text-slate-550 shrink-0">
            <FileText className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Terms & Conditions</h1>
        </div>
        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-8 ml-13">Last updated: July 2026</p>

        <div className="space-y-8 text-[15px] text-slate-650 dark:text-slate-300 leading-relaxed ml-0 md:ml-13">
          <section>
            <h2 className="text-base font-bold text-slate-850 dark:text-slate-200 mb-2">1. Description of service</h2>
            <p>
              PDF Tool is a free web-based utility for combining and compressing PDF documents using server-side processing. The service requires no registration, adds no watermarks, and is completely free.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-850 dark:text-slate-200 mb-2">2. "As is" provision</h2>
            <p>
              This service is provided <strong>"as is"</strong> and <strong>"as available"</strong> without warranties of any kind. We do not warrant uninterrupted, secure, or error-free operation. Use at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-850 dark:text-slate-200 mb-2">3. File storage & deletion</h2>
            <p className="mb-2">All uploaded and output PDF documents are:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-405">
              <li>Temporarily saved only during processing</li>
              <li>Auto-deleted immediately after download</li>
              <li>Purged within 1 hour if left unclaimed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-850 dark:text-slate-200 mb-2">4. User responsibility</h2>
            <p className="mb-2">You are responsible for the content you upload. Do not upload:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-405">
              <li>Copyright-infringing material</li>
              <li>Illegal, offensive, or malicious documents</li>
              <li>Software, viruses, or exploits targeting our infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-850 dark:text-slate-200 mb-2">5. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, PDF Tool and its contributors shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from use or inability to use this service.
            </p>
          </section>

          <section className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
              By using PDF Tool, you acknowledge that you have read, understood, and agreed to these terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
