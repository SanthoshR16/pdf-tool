import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function Privacy({ setCurrentPage }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:py-12 animate-fade-in-up">
      <button
        onClick={() => setCurrentPage('home')}
        className="text-sm font-medium text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors flex items-center gap-1.5 mb-8 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 md:p-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">Privacy Policy</h1>
        </div>
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-8 ml-12">Last updated: July 2026</p>

        <div className="space-y-8 text-[15px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">1. No permanent storage</h2>
            <p>
              We do not store your files permanently. Any PDF you upload exists only in temporary memory during processing. Once downloaded, it is immediately deleted. Unclaimed files are purged within one hour.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">2. No AI training</h2>
            <p>
              <strong>None</strong> of your uploaded files are analyzed, parsed, shared, or used to train AI models. Documents remain confidential and are only accessed by automated processing utilities (pypdf and Ghostscript).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">3. No third-party APIs</h2>
            <p>
              All processing runs locally on our servers. We do not transmit your documents to external services, cloud APIs, or third-party companies. Everything stays inside our container runtime.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">4. Zero account tracking</h2>
            <p>
              No registration, login, or account is needed. We do not collect personal identifiers unless you explicitly contact us. We may collect anonymous server metrics to maintain uptime.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">5. Data deletion guarantee</h2>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl flex items-start gap-3">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                An automated task runs every 10 minutes to permanently delete files older than 1 hour — even if you close the tab before downloading.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
