import React from 'react';
import { Shield, CheckCircle, FileText } from 'lucide-react';

export default function Terms({ setCurrentPage }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <button
          onClick={() => setCurrentPage('home')}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1"
        >
          &larr; Back to Home
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms & Conditions</h1>
        </div>

        <p className="text-slate-500 text-sm mb-8">Last Updated: July 2026</p>

        <div className="space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">1. Description of Service</h2>
            <p>
              PDF Tool is a free web-based utility that allows users to combine multiple PDF documents and compress existing PDF documents using server-side processing. The service is provided completely free of charge, without watermarks, and does not require registration or user accounts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">2. "As Is" Provision & Warranty</h2>
            <p>
              This service is provided <strong>"as is"</strong> and <strong>"as available"</strong>, without any warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, secure, error-free, or that the processing results will be perfect. You use the service at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. File Storage & Deletion Policy</h2>
            <p>
              We value your storage limits and privacy. All uploaded and output PDF documents are:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Temporarily saved only during processing.</li>
              <li>Auto-deleted immediately after download completion.</li>
              <li>Automatically purged by an automated background script within 1 hour if left undownloaded.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. User Responsibility</h2>
            <p>
              You are solely responsible for the content of the PDF files you upload. You agree not to upload:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Any copyright-infringing content or material you do not own the rights to.</li>
              <li>Any illegal, offensive, harassing, or malicious documents.</li>
              <li>Malicious software, viruses, or code designed to harm or exploit our infrastructure.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, PDF Tool, its developers, and contributors shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages, including but not limited to damages for loss of profits, goodwill, data, or other intangible losses resulting from the use or inability to use this service.
            </p>
          </section>

          <section className="pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              By using PDF Tool, you acknowledge that you have read, understood, and agreed to be bound by these Terms & Conditions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
