import React, { useState } from 'react';
import { Card, Button, Chip, Alert } from '@heroui/react';
import { Mail, Clock, Send, CheckCircle, ArrowLeft, HelpCircle, MessageSquare } from 'lucide-react';

export default function Contact({ setCurrentPage }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });
    }, 800);
  };

  return (
    <div className="relative min-h-[85vh] editorial-mesh py-8 md:py-12 animate-fade-in-up">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Contact Info Card */}
          <Card.Root className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 space-y-6">
              <div>
                <Chip.Root className="inline-flex p-3 rounded-2xl bg-white/10 border border-white/15 text-indigo-300 mb-4 shadow-xs">
                  <HelpCircle className="h-6 w-6" />
                </Chip.Root>
                <h1 className="text-3xl font-extrabold tracking-tight mb-2">Get in touch</h1>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                  Have questions about file size limits, image formats, custom tools, or platform integration? We are happy to help.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-400 shrink-0">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">Email Support</p>
                    <a href="mailto:santoshsanthu466@gmail.com" className="text-xs font-bold text-amber-300 hover:underline truncate block">
                      santoshsanthu466@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-emerald-400 shrink-0">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">Response Time</p>
                    <p className="text-xs font-bold text-slate-200">Within 24–48 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-8 pt-4 border-t border-white/10 text-[11px] font-medium text-slate-400 relative z-10">
              All PDF & Image conversion operations execute locally in secure isolated containers.
            </p>
          </Card.Root>

          {/* Form Card */}
          <Card.Root className="lg:col-span-7 glass-panel border border-slate-200 dark:border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-2xl flex flex-col justify-between">
            {submitted ? (
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center py-8 animate-pop-in">
                <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-3xl border border-emerald-500/30 mb-5 shadow-xs animate-check-pulse">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Message Delivered</h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs leading-relaxed mb-6">
                  Thank you for reaching out. Our support team will respond to your message within 24 hours.
                </p>
                <Button
                  variant="primary"
                  onClick={() => setSubmitted(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-amber-300" />
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Send us a message</h2>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Fill in your details below and we will get back to you promptly.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="name">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/15 px-4 py-3 text-xs md:text-sm bg-white/80 dark:bg-slate-950/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-600 dark:focus:border-amber-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/15 px-4 py-3 text-xs md:text-sm bg-white/80 dark:bg-slate-950/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-600 dark:focus:border-amber-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="message">
                      Message
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      placeholder="How can we assist you with PDF or image tools?"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/15 px-4 py-3 text-xs md:text-sm bg-white/80 dark:bg-slate-950/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-600 dark:focus:border-amber-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white dark:from-amber-400 dark:to-amber-500 dark:text-slate-950 rounded-xl py-3.5 px-6 text-xs md:text-sm font-extrabold shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="h-4 w-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Support Message</span>
                    </>
                  )}
                </Button>
              </form>
            )}
          </Card.Root>
        </div>
      </div>
    </div>
  );
}
