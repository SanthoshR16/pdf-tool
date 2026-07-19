import React from 'react';
import { ShieldAlert, ShieldCheck, HelpCircle } from 'lucide-react';

export default function Privacy({ setCurrentPage }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <button
          onClick={() => setCurrentPage('home')}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition flex items-center gap-1"
        >
          &larr; Back to Home
        </button>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">Privacy Policy</h1>
        </div>

        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Last Updated: July 2026</p>

        <div className="space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3 font-display">1. No Permanent Storage</h2>
            <p>
              Your trust is our priority. We do not store your files permanently. Any PDF file you upload is kept only in temporary storage memory/disk space on our server during the merge or compression operation. Once your file is processed and downloaded, it is immediately deleted. Unclaimed files are purged within one hour.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3 font-display">2. No AI Training</h2>
            <p>
              We guarantee that <strong>none</strong> of the files you upload are ever analyzed, parsed, read, shared, or used to train artificial intelligence models or machine learning algorithms. Your documents remain completely confidential and are only accessed by automated processing utilities (`pypdf` and Ghostscript).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3 font-display">3. No Third-Party APIs or Cloud AI</h2>
            <p>
              All file processing is executed locally on our backend servers. We do not transmit your documents to external web services, paid APIs, cloud services, or third-party AI companies. Everything is done inside our container runtime, guaranteeing data sovereignty.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3 font-display">4. Zero Account Tracking</h2>
            <p>
              You do not need to register, create an account, or log in to use PDF Tool. We do not collect personal identifiers, emails, names, or addresses unless you explicitly contact us. We may collect basic, anonymous server log stats (like request counts and error rates) to maintain service uptime.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3 font-display">5. Data Deletion Guarantee</h2>
            <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/60 rounded-xl flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                Our servers run an automated cron-like task every 10 minutes that wipes out files older than 1 hour. Even if you close the tab before downloading, your documents will be permanently removed.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
