import React from 'react';
import { Card, Button, Chip } from '@heroui/react';
import { FileText, ArrowLeft, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';

export default function Terms({ setCurrentPage }) {
  return (
    <div className="relative min-h-[85vh] editorial-mesh py-8 md:py-12 animate-fade-in-up">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-4xl px-4">
        {/* Back Link */}
        <Button
          variant="tertiary"
          onClick={() => setCurrentPage('home')}
          className="text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-amber-300 transition-colors flex items-center gap-2 mb-6 cursor-pointer border border-slate-200 dark:border-white/10 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-slate-950/60 shadow-2xs hover:scale-[1.02]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to PDF Tools</span>
        </Button>

        <Card.Root className="glass-panel border border-slate-200 dark:border-white/15 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-2xl">
          <Card.Header className="p-0 mb-6 border-none bg-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-amber-300 shrink-0 shadow-xs">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <Card.Title className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Terms & Conditions
                </Card.Title>
                <Card.Description className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Service Terms & Usage Agreements
                </Card.Description>
              </div>
            </div>
            <Chip.Root className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-amber-300 border border-indigo-500/30 self-start md:self-auto">
              <Chip.Label>TERMS OF SERVICE</Chip.Label>
            </Chip.Root>
          </Card.Header>

          <Card.Content className="space-y-8 text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed p-0">
            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-amber-300" /> 1. Description of Service
              </h2>
              <p>
                PDF Tool provides free web-based utilities for combining, converting, and compressing PDF and image files. The service requires no account registration, places no watermarks, and is completely free for personal and commercial use.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="h-4 w-4 text-amber-500 dark:text-amber-400" /> 2. "As Is" Provision
              </h2>
              <p>
                This utility is provided on an <strong>"as is"</strong> and <strong>"as available"</strong> basis without warranties of any kind. We do not warrant uninterrupted, error-free, or lossless processing for corrupted documents.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-400" /> 3. User Responsibility
              </h2>
              <p className="mb-2">Users remain strictly responsible for the files they upload. Users agree not to upload:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-500 dark:text-slate-400">
                <li>Copyright-infringing or illegal material</li>
                <li>Malicious payloads or scripts targeting system memory</li>
                <li>Executable code masked as PDF or image extensions</li>
              </ul>
            </section>

            <section className="pt-4 border-t border-slate-200 dark:border-white/10">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                By uploading files to PDF Tool, you acknowledge and agree to these terms of service.
              </p>
            </section>
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  );
}
