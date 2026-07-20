import React, { useState } from 'react';
import { Mail, Clock, Send, CheckCircle, ArrowLeft, HelpCircle } from 'lucide-react';

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
    }, 1000);
  };

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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Contact Info Card */}
        <div className="md:col-span-5 bg-slate-900 dark:bg-slate-950/80 border border-slate-800 rounded-3xl p-8 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 text-indigo-400 mb-6">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-3">Get in touch</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Have questions about file processing limits, need custom features, or found an issue? Our team is happy to assist.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Email Support</p>
                  <a href="mailto:santoshsanthu466@gmail.com" className="text-sm font-semibold hover:text-indigo-300 transition-colors">
                    santoshsanthu466@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Response time</p>
                  <p className="text-sm font-semibold text-slate-200">Within 24–48 hours</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-12 pt-5 border-t border-white/5 text-xs text-slate-500 relative z-10">
            Global server metrics and service updates are posted regularly.
          </p>
        </div>

        {/* Contact Form Card */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-xl shadow-slate-100/50 dark:shadow-none backdrop-blur-xl">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-pop-in">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 mb-6 shadow-sm">
                <CheckCircle className="h-10 w-10 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Message Received</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Thank you for reaching out. We will get back to you within 24 to 48 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-850 px-4 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Send us a message</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Please fill in your details below and we will reply as soon as possible.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2" htmlFor="name">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-650 focus:border-indigo-500 dark:focus:border-indigo-450 focus:ring-1 focus:ring-indigo-550/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-650 focus:border-indigo-500 dark:focus:border-indigo-450 focus:ring-1 focus:ring-indigo-550/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2" htmlFor="message">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    placeholder="How can we help you?"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-650 focus:border-indigo-500 dark:focus:border-indigo-450 focus:ring-1 focus:ring-indigo-550/20 focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-xl py-3.5 px-6 text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
