import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  GripVertical,
  Settings,
  CheckCircle,
  AlertCircle,
  Download,
  Plus,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Layers,
  Minimize2,
  Zap,
  Copy,
  Check,
  BarChart3,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Lazy-load pdf.js only when needed
const loadPdfJs = () => {
  return new Promise((resolve, reject) => {
    if (window['pdfjs-dist/build/pdf']) {
      resolve(window['pdfjs-dist/build/pdf']);
      return;
    }
    let script = document.querySelector('script[id="pdfjs-cdn-script"]');
    if (!script) {
      script = document.createElement('script');
      script.id = 'pdfjs-cdn-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
    const checkInterval = setInterval(() => {
      if (window['pdfjs-dist/build/pdf']) {
        clearInterval(checkInterval);
        resolve(window['pdfjs-dist/build/pdf']);
      }
    }, 50);
    script.onerror = (err) => {
      clearInterval(checkInterval);
      reject(err);
    };
  });
};

export default function Home({ setIsProcessing }) {
  const [activeTab, setActiveTab] = useState('combine');
  const [files, setFiles] = useState([]);
  const [compressionLevel, setCompressionLevel] = useState('medium');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFastPath, setIsFastPath] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [previews, setPreviews] = useState({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setFiles([]);
    setError(null);
    setSuccess(null);
  }, [activeTab]);

  useEffect(() => {
    if (setIsProcessing) setIsProcessing(loading);
  }, [loading, setIsProcessing]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Thumbnail & page count generation using pdf.js
  useEffect(() => {
    if (files.length === 0) return;
    loadPdfJs().then(pdfjsLib => {
      files.forEach(file => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (previews[key]) return;
        setPreviews(prev => ({ ...prev, [key]: { status: 'loading' } }));
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const typedarray = new Uint8Array(reader.result);
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            const numPages = pdf.numPages;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.4 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport }).promise;
            setPreviews(prev => ({
              ...prev,
              [key]: { status: 'ready', url: canvas.toDataURL(), numPages }
            }));
          } catch {
            setPreviews(prev => ({ ...prev, [key]: { status: 'error', numPages: '?' } }));
          }
        };
        reader.readAsArrayBuffer(file);
      });
    }).catch(() => {});
  }, [files, previews]);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validateAndAddFiles = (selectedFiles) => {
    setError(null);
    const pdfs = [];
    const errors = [];
    const MAX_SIZE = 200 * 1024 * 1024;
    loadPdfJs().catch(() => {});
    for (let f of selectedFiles) {
      if (!f.name.toLowerCase().endsWith('.pdf') && f.type !== 'application/pdf') {
        errors.push(`"${f.name}" is not a PDF document.`);
        continue;
      }
      if (f.size > MAX_SIZE) {
        errors.push(`"${f.name}" exceeds the maximum 200 MB limit.`);
        continue;
      }
      pdfs.push(f);
    }
    if (errors.length > 0) setError(errors.join(' '));
    if (pdfs.length > 0) {
      if (success) {
        setSuccess(null);
        setFiles(activeTab === 'compress' ? [pdfs[0]] : pdfs.slice(0, 30));
      } else {
        if (activeTab === 'compress') {
          setFiles([pdfs[0]]);
        } else {
          setFiles(prev => {
            const next = [...prev, ...pdfs];
            if (next.length > 30) {
              setError('Maximum of 30 files allowed at once.');
              return next.slice(0, 30);
            }
            return next;
          });
        }
      }
    }
  };

  const handleFileChange = (e) => { if (e.target.files) validateAndAddFiles(Array.from(e.target.files)); };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) validateAndAddFiles(Array.from(e.dataTransfer.files)); };
  const removeFile = (index) => { setFiles(prev => prev.filter((_, i) => i !== index)); setError(null); };
  const handleBrowseFiles = () => { if (fileInputRef.current) fileInputRef.current.click(); };

  const handleDragStart = (e, index) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = 'move'; };
  const handleItemDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setFiles(prev => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(draggedIndex, 1);
      updated.splice(index, 0, draggedItem);
      return updated;
    });
    setDraggedIndex(index);
  };
  const handleDragEnd = () => setDraggedIndex(null);

  // Process PDF request
  const handleProcess = async () => {
    if (files.length === 0) return;
    if (activeTab === 'combine' && files.length < 2) {
      setError('Please select at least 2 PDF files to combine.');
      return;
    }
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const isFast = totalSize < 5 * 1024 * 1024;
    setIsFastPath(isFast);
    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress(15);
    const startTime = Date.now();

    const formData = new FormData();
    const endpoint = activeTab === 'combine' ? '/api/combine' : '/api/compress';
    if (activeTab === 'combine') {
      files.forEach(file => formData.append('files', file));
    } else {
      formData.append('file', files[0]);
      formData.append('level', compressionLevel);
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', body: formData });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned status ${response.status}`);
      }
      const resData = await response.json();

      // Fast path (<5MB)
      if (resData.download_url) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 800 - elapsed);
        if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
        setProgress(100);
        setSuccess({
          downloadUrl: `${API_BASE}${resData.download_url}`,
          filename: activeTab === 'combine' ? 'combined.pdf' : `compressed-${compressionLevel}.pdf`,
          originalSize: resData.original_size || files[0]?.size,
          compressedSize: resData.compressed_size,
          savedBytes: resData.saved_bytes,
          savingsPercent: resData.savings_percent
        });
        return;
      }

      const jobId = resData.job_id;
      if (!jobId) throw new Error('No job ID received from server.');
      setProgress(30);

      let isDone = false;
      let statusData = null;
      while (!isDone) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const statusResponse = await fetch(`${API_BASE}/api/status/${jobId}`);
        if (!statusResponse.ok) {
          const errData = await statusResponse.json().catch(() => ({}));
          throw new Error(errData.detail || `Failed to check job status: ${statusResponse.status}`);
        }
        statusData = await statusResponse.json();
        if (statusData.status === 'done') {
          isDone = true;
          setProgress(100);
        } else if (statusData.status === 'error') {
          throw new Error(statusData.error_message || 'PDF processing failed.');
        } else {
          setProgress(statusData.progress || 40);
        }
      }
      setSuccess({
        downloadUrl: `${API_BASE}${statusData.download_url}`,
        filename: activeTab === 'combine' ? 'combined.pdf' : `compressed-${compressionLevel}.pdf`,
        originalSize: statusData.original_size || files[0]?.size,
        compressedSize: statusData.compressed_size,
        savedBytes: statusData.saved_bytes,
        savingsPercent: statusData.savings_percent
      });
    } catch (err) {
      setError(err.message || 'An unexpected processing error occurred.');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileUrl, suggestedName) => {
    if ('showSaveFilePicker' in window) {
      try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch (err) {
        if (err.name !== 'AbortError') {
          const a = document.createElement('a');
          a.href = fileUrl;
          a.download = suggestedName;
          a.click();
        }
      }
    } else {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = suggestedName;
      a.click();
    }
  };

  const copyDownloadLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const startOver = () => {
    setFiles([]);
    setSuccess(null);
    setError(null);
    setProgress(0);
  };

  const isButtonDisabled = activeTab === 'combine' ? files.length < 2 : files.length < 1;
  const totalFilesSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      {/* Hero Header */}
      <div className="text-center mb-10 flex flex-col items-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide uppercase bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 mb-5 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
          <span>Ghostscript Powered Engine · 100% Free · No Watermarks</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-slate-50 mb-4 max-w-3xl leading-[1.12]">
          Optimize & Combine <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-violet-400">PDF Files</span> Cleanly
        </h1>
        <p className="text-base md:text-lg font-normal text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
          High-precision PDF compression with mode options (Extreme, Recommended, High Quality) and instant file merging.
        </p>
      </div>

      {/* Main Workspace Card */}
      <div className="glass-panel rounded-3xl shadow-2xl shadow-indigo-500/5 dark:shadow-none p-6 md:p-8 backdrop-blur-2xl transition-all duration-300">
        {/* Tabs Switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-200/60 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-300/40 dark:border-slate-800/80 w-full sm:w-auto shadow-inner">
            <button
              onClick={() => !loading && setActiveTab('combine')}
              disabled={loading}
              className={`flex items-center justify-center gap-2.5 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 w-full sm:w-auto cursor-pointer ${
                activeTab === 'combine'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="h-4.5 w-4.5" />
              <span>Combine PDFs</span>
            </button>
            <button
              onClick={() => !loading && setActiveTab('compress')}
              disabled={loading}
              className={`flex items-center justify-center gap-2.5 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 w-full sm:w-auto cursor-pointer ${
                activeTab === 'compress'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Zap className="h-4.5 w-4.5" />
              <span>Compress PDF</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-2xl flex items-start gap-3 animate-fade-in-up">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Compression Level Modes (Shown in Compress Mode before/after file selection) */}
          {activeTab === 'compress' && !success && !loading && (
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Select Compression Mode</span>
                </div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Tuned DPI & JPEG encoding</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {[
                  {
                    id: 'high',
                    name: 'Extreme Compression',
                    badge: 'Smallest File Size',
                    dpi: '~72 DPI',
                    est: 'Up to -70%',
                    desc: 'Maximum compression ratio. Best for email attachments and strict web uploads.'
                  },
                  {
                    id: 'medium',
                    name: 'Recommended',
                    badge: 'Best Balance',
                    tag: 'POPULAR',
                    dpi: '~150 DPI',
                    est: 'Up to -50%',
                    desc: 'Optimal size reduction with high visual clarity for text and color graphics.'
                  },
                  {
                    id: 'low',
                    name: 'Less Compression',
                    badge: 'High Quality',
                    dpi: '~220 DPI',
                    est: 'Up to -25%',
                    desc: 'Light compression preserving high image resolution for presentation and print.'
                  }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setCompressionLevel(mode.id)}
                    className={`p-5 border text-left rounded-2xl flex flex-col justify-between transition-all duration-300 cursor-pointer relative group ${
                      compressionLevel === mode.id
                        ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30 ring-2 ring-indigo-500/30 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {mode.tag && (
                      <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs">
                        {mode.tag}
                      </span>
                    )}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-base font-bold ${compressionLevel === mode.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-slate-100'}`}>
                          {mode.name}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {mode.dpi}
                        </span>
                      </div>
                      <span className="inline-block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                        {mode.est} Reduction
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {mode.desc}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400">{mode.badge}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${compressionLevel === mode.id ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-400 dark:bg-indigo-400' : 'border-slate-300 dark:border-slate-700'}`}>
                        {compressionLevel === mode.id && <div className="w-1.5 h-1.5 bg-white dark:bg-slate-950 rounded-full" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upload Zone */}
          {!success && !loading && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseFiles}
              className={`relative border-2 border-dashed rounded-3xl py-14 px-6 text-center cursor-pointer transition-all duration-300 group ${
                isDragging
                  ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/30 scale-[1.01] shadow-inner'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-900/30'
              } ${loading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple={activeTab === 'combine'}
                accept=".pdf"
                className="hidden"
              />
              <div className="inline-flex p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <Upload className="h-7 w-7" />
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Drag & drop {activeTab === 'combine' ? 'PDF files' : 'a PDF document'} here, or{' '}
                <span className="text-indigo-600 dark:text-indigo-400 group-hover:underline">browse</span>
              </p>
              <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                Maximum file size 200 MB {activeTab === 'combine' ? '· Up to 30 files' : ''}
              </p>
            </div>
          )}

          {/* Selected File List & Reordering */}
          {files.length > 0 && !success && !loading && (
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {files.length} File{files.length !== 1 ? 's' : ''} Selected ({formatBytes(totalFilesSize)})
                  </span>
                </div>
                {activeTab === 'combine' && (
                  <button
                    onClick={handleBrowseFiles}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add More Files
                  </button>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-850 bg-white/80 dark:bg-slate-950/60 shadow-sm">
                {files.map((file, idx) => {
                  const key = `${file.name}-${file.size}-${file.lastModified}`;
                  const previewData = previews[key];
                  return (
                    <div
                      key={key}
                      draggable={activeTab === 'combine' && !loading}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleItemDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors select-none group"
                    >
                      {activeTab === 'combine' && (
                        <div className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-700 group-hover:text-slate-500">
                          <GripVertical className="h-5 w-5" />
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{file.name}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          <span>{formatBytes(file.size)}</span>
                          {previewData && previewData.numPages && (
                            <>
                              <span>·</span>
                              <span className="font-semibold text-slate-600 dark:text-slate-400">{previewData.numPages} Page{previewData.numPages !== 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {!loading && (
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Page Layout Preview Visualizer */}
          {files.length > 0 && !success && !loading && (
            <div className="animate-fade-in-up">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 block">
                Visual Page Grid Preview
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
                {files.map((file, idx) => {
                  const key = `${file.name}-${file.size}-${file.lastModified}`;
                  const previewState = previews[key];
                  return (
                    <div key={key} className="aspect-[3/4] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/60 overflow-hidden relative group hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xs transition-all duration-300">
                      <span className="absolute top-2 left-2 bg-slate-900/80 dark:bg-slate-100/90 text-white dark:text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md z-10 shadow-xs">
                        #{idx + 1}
                      </span>
                      <div className="w-full h-full flex items-center justify-center p-2">
                        {!previewState || previewState.status === 'loading' ? (
                          <div className="w-full h-full rounded-xl bg-slate-200/50 dark:bg-slate-900 animate-pulse flex items-center justify-center">
                            <RefreshCw className="h-5 w-5 text-slate-400 animate-spin" />
                          </div>
                        ) : previewState.status === 'error' ? (
                          <div className="flex flex-col items-center gap-1 text-slate-400">
                            <FileText className="h-6 w-6" />
                            <span className="text-[10px] font-bold">PDF Ready</span>
                          </div>
                        ) : (
                          <img src={previewState.url} alt={file.name} className="object-contain max-h-full max-w-full rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-300" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Bar */}
          {files.length > 0 && !success && !loading && (
            <div className="flex flex-col sm:flex-row gap-3.5 pt-4 border-t border-slate-200/60 dark:border-slate-800 animate-fade-in-up">
              <button
                onClick={handleProcess}
                disabled={isButtonDisabled}
                className={`flex-1 rounded-2xl py-4 px-6 text-base font-extrabold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  isButtonDisabled
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white hover:-translate-y-0.5 shadow-indigo-500/25 glow-indigo'
                }`}
              >
                <span>{activeTab === 'combine' ? 'Combine PDF Documents' : 'Compress PDF Now'}</span>
                {!isButtonDisabled && <ArrowRight className="h-5 w-5" />}
              </button>
              <button
                onClick={startOver}
                className="px-6 py-4 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Clear Workspace
              </button>
            </div>
          )}

          {/* Loading Processing State */}
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-center animate-fade-in-up">
              <div className="w-full max-w-md space-y-6">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="h-7 w-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    {activeTab === 'combine' ? 'Combining PDF Documents...' : 'Executing Ghostscript Compression...'}
                  </h4>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                    {progress < 30 ? 'Analyzing page structure...' : progress < 70 ? 'Downsampling image streams & content streams...' : 'Building output PDF artifact...'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-extrabold text-slate-600 dark:text-slate-400 px-1">
                    <span>Processing Pipeline</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-300/30 dark:border-slate-800">
                    <div
                      className="animate-shimmer h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Download Screen with Stats */}
          {success && (
            <div className="py-10 flex flex-col items-center text-center animate-pop-in">
              <div className="w-full max-w-md space-y-6">
                <div className="inline-flex p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 border border-emerald-200 dark:border-emerald-800 shadow-md glow-emerald animate-breathe">
                  <CheckCircle className="h-10 w-10" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50">Operation Complete!</h3>
                  <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Your PDF has been processed and optimized cleanly.
                  </p>
                </div>

                {/* Compression Metrics Visualizer */}
                {activeTab === 'compress' && (success.originalSize || success.compressedSize) && (
                  <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left space-y-3 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Compression Summary</span>
                      {success.savingsPercent !== undefined && success.savingsPercent > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-xs">
                          -{success.savingsPercent}% Saved
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block">Original Size</span>
                        <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300 line-through">
                          {formatBytes(success.originalSize)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block">Optimized Size</span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          {formatBytes(success.compressedSize || success.originalSize)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Download Actions */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setShowToast(true);
                      await handleDownload(success.downloadUrl, success.filename);
                    }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl py-4 px-6 text-base font-extrabold shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer glow-indigo animate-pulse-ring"
                  >
                    <Download className="h-5 w-5" />
                    Download Optimized PDF
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyDownloadLink(success.downloadUrl)}
                      className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Link'}</span>
                    </button>
                    <button
                      onClick={startOver}
                      className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      Process Another PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-sm font-extrabold animate-fade-in-up z-50 border border-slate-800 dark:border-slate-200">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-400 dark:text-emerald-600" />
          Download Starting...
        </div>
      )}
    </div>
  );
}
