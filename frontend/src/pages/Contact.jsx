import React, { useState } from 'react';
import { Mail, Clock, Send, CheckCircle, ArrowLeft } from 'lucide-react';

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
    <div className="mx-auto max-w-3xl px-6 py-8 md:py-12 animate-fade-in-up">
      {/* Back */}
      <button
        onClick={() => setCurrentPage('home')}
        className="text-sm font-medium text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors flex items-center gap-1.5 mb-8 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Info */}
        <div className="md:col-span-5 bg-neutral-900 dark:bg-neutral-100 rounded-2xl p-8 text-white dark:text-neutral-900 flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-3">Get in touch</h1>
            <p className="text-neutral-400 dark:text-neutral-500 text-sm leading-relaxed mb-8">
              Questions about file limits, deployments, or technical support? We're here to help.
            </p>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 dark:bg-neutral-900/10 flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium">Email</p>
                  <a href="mailto:santoshsanthu466@gmail.com" className="text-sm font-medium hover:underline">
                    santoshsanthu466@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 dark:bg-neutral-900/10 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium">Response time</p>
                  <p className="text-sm font-medium">Within 24–48 hours</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-10 pt-5 border-t border-white/10 dark:border-neutral-900/10 text-xs text-neutral-500 dark:text-neutral-400">
            PDF Tool is hosted globally.
          </p>
        </div>

        {/* Form */}
        <div className="md:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-pop-in">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400 rounded-full mb-4">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Message sent</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
                We'll get back to you within 24–48 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Send a message</h2>

              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 px-4 py-2.5 text-sm bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 px-4 py-2.5 text-sm bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  placeholder="How can we help?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 px-4 py-2.5 text-sm bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl py-3 text-sm font-medium shadow-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white dark:border-neutral-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send message
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
