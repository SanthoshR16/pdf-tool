import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

export default function Terms({ setCurrentPage }) {
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
          <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <FileText className="h-4.5 w-4.5 text-neutral-500 dark:text-neutral-400" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">Terms & Conditions</h1>
        </div>
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-8 ml-12">Last updated: July 2026</p>

        <div className="space-y-8 text-[15px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">1. Description of service</h2>
            <p>
              PDF Tool is a free web-based utility for combining and compressing PDF documents using server-side processing. The service requires no registration, adds no watermarks, and is completely free.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">2. "As is" provision</h2>
            <p>
              This service is provided <strong>"as is"</strong> and <strong>"as available"</strong> without warranties of any kind. We do not warrant uninterrupted, secure, or error-free operation. Use at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">3. File storage & deletion</h2>
            <p className="mb-2">All uploaded and output PDF documents are:</p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-500 dark:text-neutral-400">
              <li>Temporarily saved only during processing</li>
              <li>Auto-deleted immediately after download</li>
              <li>Purged within 1 hour if left unclaimed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">4. User responsibility</h2>
            <p className="mb-2">You are responsible for the content you upload. Do not upload:</p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-500 dark:text-neutral-400">
              <li>Copyright-infringing material</li>
              <li>Illegal, offensive, or malicious documents</li>
              <li>Software, viruses, or exploits targeting our infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">5. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, PDF Tool and its contributors shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from use or inability to use this service.
            </p>
          </section>

          <section className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              By using PDF Tool, you acknowledge that you have read, understood, and agreed to these terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
