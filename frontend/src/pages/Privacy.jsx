import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function Privacy({ setCurrentPage }) {
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
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Privacy Policy</h1>
        </div>
        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-8 ml-13">Last updated: July 2026</p>

        <div className="space-y-8 text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed ml-0 md:ml-13">
          <section>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">1. No permanent storage</h2>
            <p>
              We do not store your files permanently. Any PDF you upload exists only in temporary memory during processing. Once downloaded, it is immediately deleted. Unclaimed files are purged within one hour.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">2. No AI training</h2>
            <p>
              <strong>None</strong> of your uploaded files are analyzed, parsed, shared, or used to train AI models. Documents remain confidential and are only accessed by automated processing utilities (pypdf and Ghostscript).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">3. No third-party APIs</h2>
            <p>
              All processing runs locally on our servers. We do not transmit your documents to external services, cloud APIs, or third-party companies. Everything stays inside our container runtime.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">4. Zero account tracking</h2>
            <p>
              No registration, login, or account is needed. We do not collect personal identifiers unless you explicitly contact us. We may collect anonymous server metrics to maintain uptime.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">5. Data deletion guarantee</h2>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                An automated task runs every 10 minutes to permanently delete files older than 1 hour — even if you close the tab before downloading.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
