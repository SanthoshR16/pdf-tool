import React, { useState } from 'react';
import { Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';

export default function Contact({ setCurrentPage }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    
    setLoading(true);
    // Simulate sending contact message
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <button
          onClick={() => setCurrentPage('home')}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition flex items-center gap-1"
        >
          &larr; Back to Home
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Info Card */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-700 dark:to-violet-850 rounded-2xl p-8 text-white shadow-lg flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-4 font-display">Get in Touch</h1>
            <p className="text-indigo-100 text-sm leading-relaxed mb-8">
              Have questions about file limits, custom deployments, or technical support? Reach out and we'll help.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider">Call or WhatsApp</p>
                  <a href="tel:+917760969517" className="text-lg font-bold hover:underline">
                    +91 7760969517
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider">Email support</p>
                  <a href="mailto:support@pdftool.com" className="text-sm font-semibold hover:underline">
                    support@pdftool.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider">Response Time</p>
                  <p className="text-sm font-semibold">Within 24-48 hours</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-xs text-indigo-200">
            PDF Tool is hosted globally. Standard carrier rates may apply for calls.
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-7 bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md rounded-2xl p-8 shadow-lg">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full mb-4">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 font-display">Message Sent!</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                Thank you for contacting us. We will get back to you within 24-48 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-6 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 font-display">Send a Message</h2>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 px-4 py-2.5 text-sm bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition duration-150"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 px-4 py-2.5 text-sm bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition duration-150"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="message">
                  Your Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  placeholder="How can we help you?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 px-4 py-2.5 text-sm bg-white/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none transition duration-150 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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
