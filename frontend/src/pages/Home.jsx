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
  Minimize2
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
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setFiles([]);
    setError(null);
    setSuccess(null);
    setHasDownloaded(false);
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

  // Thumbnail generation
  useEffect(() => {
    if (files.length === 0) return;
    loadPdfJs().then(pdfjsLib => {
      files.forEach(file => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (previews[key]) return;
        setPreviews(prev => ({ ...prev, [key]: 'loading' }));
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const typedarray = new Uint8Array(reader.result);
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.35 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport }).promise;
            setPreviews(prev => ({ ...prev, [key]: canvas.toDataURL() }));
          } catch {
            setPreviews(prev => ({ ...prev, [key]: 'error' }));
          }
        };
        reader.readAsArrayBuffer(file);
      });
    }).catch(() => {});
  }, [files, previews]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
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
        errors.push(`"${f.name}" is not a PDF file.`);
        continue;
      }
      if (f.size > MAX_SIZE) {
        errors.push(`"${f.name}" exceeds the 200 MB limit.`);
        continue;
      }
      pdfs.push(f);
    }
    if (errors.length > 0) setError(errors.join(' '));
    if (pdfs.length > 0) {
      if (success) {
        setSuccess(null);
        setHasDownloaded(false);
        setFiles(activeTab === 'compress' ? [pdfs[0]] : pdfs.slice(0, 30));
      } else {
        if (activeTab === 'compress') {
          setFiles([pdfs[0]]);
        } else {
          setFiles(prev => {
            const next = [...prev, ...pdfs];
            if (next.length > 30) {
              setError('Maximum of 30 files allowed.');
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

  // Process
  const handleProcess = async () => {
    if (files.length === 0) return;
    if (activeTab === 'combine' && files.length < 2) {
      setError('Please add at least 2 PDF files to combine.');
      return;
    }
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const isFast = totalSize < 5 * 1024 * 1024;
    setIsFastPath(isFast);
    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress(10);
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

      // Fast path
      if (resData.download_url) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1000 - elapsed);
        if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
        setProgress(100);
        setSuccess({
          downloadUrl: `${API_BASE}${resData.download_url}`,
          filename: activeTab === 'combine' ? 'combined.pdf' : `compressed-${compressionLevel}.pdf`
        });
        return;
      }

      const jobId = resData.job_id;
      if (!jobId) throw new Error('No job ID received from server.');
      setProgress(20);

      let isDone = false;
      let statusData = null;
      while (!isDone) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await fetch(`${API_BASE}/api/status/${jobId}`);
        if (!statusResponse.ok) {
          const errData = await statusResponse.json().catch(() => ({}));
          throw new Error(errData.detail || `Failed to check status: ${statusResponse.status}`);
        }
        statusData = await statusResponse.json();
        if (statusData.status === 'done') { isDone = true; setProgress(100); }
        else if (statusData.status === 'error') throw new Error(statusData.error_message || 'Processing failed.');
        else setProgress(statusData.progress || 20);
      }
      setSuccess({
        downloadUrl: `${API_BASE}${statusData.download_url}`,
        filename: activeTab === 'combine' ? 'combined.pdf' : `compressed-${compressionLevel}.pdf`
      });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
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
          types: [{ description: 'PDF file', accept: { 'application/pdf': ['.pdf'] } }],
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

  const startOver = () => { setFiles([]); setSuccess(null); setError(null); setProgress(0); setHasDownloaded(false); };
  const isButtonDisabled = activeTab === 'combine' ? files.length < 2 : files.length < 1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
      {/* Hero Header */}
      <div className="text-center mb-12 flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-800/40 mb-4 animate-fade-in-up">
          <Sparkles className="h-3 w-3 animate-pulse" />
          <span>No Limits · Completely Free</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-3 max-w-2xl leading-[1.15]">
          Manage and Optimize your <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">PDFs</span> Instantly
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
          Secure, lighting-fast server-side PDF processing. Combine files or compress to reduce size without losing quality.
        </p>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xl shadow-slate-100/50 dark:shadow-none p-6 md:p-8 backdrop-blur-xl">
        {/* Tabs Control */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-100/80 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 w-full sm:w-auto">
            <button
              onClick={() => !loading && setActiveTab('combine')}
              disabled={loading}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 w-full sm:w-auto cursor-pointer ${
                activeTab === 'combine'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Combine PDFs</span>
            </button>
            <button
              onClick={() => !loading && setActiveTab('compress')}
              disabled={loading}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 w-full sm:w-auto cursor-pointer ${
                activeTab === 'compress'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Minimize2 className="h-4 w-4" />
              <span>Compress PDF</span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 rounded-2xl flex items-start gap-3 animate-fade-in-up">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Upload Zone */}
          {!success && !loading && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseFiles}
              className={`relative border-2 border-dashed rounded-2xl py-14 px-6 text-center cursor-pointer transition-all duration-300 group ${
                isDragging
                  ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-inner'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400/80 dark:hover:border-indigo-500/80 bg-slate-50/40 dark:bg-slate-900/40'
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
              <div className="inline-flex p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 shadow-sm text-slate-400 dark:text-slate-500 mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-300">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Drag & drop {activeTab === 'combine' ? 'PDF files' : 'a PDF file'} here, or{' '}
                <span className="text-indigo-600 dark:text-indigo-400 group-hover:underline">browse</span>
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                Supports documents up to 200 MB {activeTab === 'combine' ? '· Max 30 files' : ''}
              </p>
            </div>
          )}

          {/* File list section */}
          {files.length > 0 && !success && !loading && (
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {files.length} file{files.length !== 1 ? 's' : ''} Selected
                  {activeTab === 'combine' ? ` / 30` : ''}
                </span>
                {activeTab === 'combine' && (
                  <button
                    onClick={handleBrowseFiles}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors border border-indigo-200/60 dark:border-indigo-850 px-2.5 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add files
                  </button>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-950 shadow-sm">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    draggable={activeTab === 'combine' && !loading}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleItemDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors select-none animate-fade-in-left group"
                  >
                    {activeTab === 'combine' && (
                      <div className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-700 hover:text-slate-500 dark:hover:text-slate-500">
                        <GripVertical className="h-4 w-4" />
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatBytes(file.size)}</p>
                    </div>
                    {!loading && (
                      <button
                        onClick={() => removeFile(idx)}
                        className="p-2 text-slate-400 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-450 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Remove file"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previews grid */}
          {files.length > 0 && !success && !loading && (
            <div className="animate-fade-in-up">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                Pages layout visualizer
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {files.map((file, idx) => {
                  const key = `${file.name}-${file.size}-${file.lastModified}`;
                  const previewState = previews[key];
                  return (
                    <div key={key} className="aspect-[3/4] rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden relative group hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-300">
                      <span className="absolute top-2 left-2 bg-slate-900/80 dark:bg-slate-100/90 text-white dark:text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-lg z-10 shadow-sm">
                        {idx + 1}
                      </span>
                      <div className="w-full h-full flex items-center justify-center p-2">
                        {previewState === 'loading' || !previewState ? (
                          <div className="w-full h-full rounded-xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
                        ) : previewState === 'error' ? (
                          <div className="flex flex-col items-center gap-1.5 text-slate-300 dark:text-slate-700">
                            <FileText className="h-7 w-7" />
                            <span className="text-[10px] font-medium uppercase tracking-wider">No Preview</span>
                          </div>
                        ) : (
                          <img src={previewState} alt={file.name} className="object-contain max-h-full max-w-full rounded-lg shadow-sm group-hover:scale-[1.02] transition-transform duration-300" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compression Level Selector */}
          {activeTab === 'compress' && files.length > 0 && !success && !loading && (
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Compression Strength</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'low', label: 'Low Compression', desc: 'Maximum print quality, standard file size reduction.' },
                  { id: 'medium', label: 'Medium Compression', desc: 'Balanced option. Excellent quality for daily usage.' },
                  { id: 'high', label: 'High Compression', desc: 'Smallest file size. Optimal quality for web/email delivery.' }
                ].map(level => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setCompressionLevel(level.id)}
                    className={`p-5 border text-left rounded-2xl flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                      compressionLevel === level.id
                        ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className={`text-sm font-bold block ${compressionLevel === level.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>{level.label}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 mt-2 block leading-relaxed">{level.desc}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-end w-full">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${compressionLevel === level.id ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 dark:border-slate-700'}`}>
                        {compressionLevel === level.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Warnings info */}
          {activeTab === 'compress' && files.length > 0 && files[0].size > 50 * 1024 * 1024 && !success && !loading && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl flex items-center gap-3 text-amber-700 dark:text-amber-400 text-sm font-medium">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>Large files may take 1–3 minutes to process. Please keep the window open.</span>
            </div>
          )}

          {/* Workspace Footer Action Buttons */}
          {files.length > 0 && !success && !loading && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fade-in-up">
              <button
                onClick={handleProcess}
                disabled={isButtonDisabled}
                className={`flex-1 rounded-2xl py-3.5 px-6 text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  isButtonDisabled
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white hover:-translate-y-0.5 hover:shadow-indigo-500/20'
                }`}
              >
                <span>{activeTab === 'combine' ? 'Combine Documents' : 'Optimize File Size'}</span>
                {!isButtonDisabled && <ArrowRight className="h-4 w-4" />}
              </button>
              <button
                onClick={startOver}
                className="px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/80 dark:hover:bg-slate-950 transition-colors cursor-pointer"
              >
                Clear Workspace
              </button>
            </div>
          )}

          {/* Loading Processing State */}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-center animate-fade-in-up">
              <div className="w-full max-w-md space-y-6">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-[3px] border-slate-100 dark:border-slate-900" />
                  <div className="absolute inset-0 rounded-full border-[3px] border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-indigo-500 animate-pulse" />
                  </div>
                </div>

                {isFastPath ? (
                  <div>
                    <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">Analyzing layout structures</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Merging PDF nodes in the local environment...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm px-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-350">
                        Running optimization pipelines...
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-200/20">
                      <div
                        className="animate-shimmer h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Download Screen */}
          {success && (
            <div className="py-16 flex flex-col items-center text-center animate-pop-in">
              <div className="w-full max-w-sm space-y-6">
                <div className="inline-flex p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 shadow-sm animate-breathe">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Operation Successful</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Your files are ready. The processed PDF has been saved and optimized for your download.
                  </p>
                </div>
                <div className="space-y-4 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setHasDownloaded(true);
                      setShowToast(true);
                      await handleDownload(success.downloadUrl, success.filename);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white rounded-2xl py-4 px-6 text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer animate-pulse-ring"
                  >
                    <Download className="h-4.5 w-4.5" />
                    Download Optimized PDF
                  </button>
                  {!('showSaveFilePicker' in window) && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      This browser will save the file directly to your system's default Downloads.
                    </p>
                  )}
                  <button
                    onClick={startOver}
                    className="text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-450 transition-colors cursor-pointer block mx-auto"
                  >
                    Process another file
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-bold animate-fade-in-up z-50 border border-slate-800 dark:border-slate-200">
          <CheckCircle className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          Download request dispatched
        </div>
      )}
    </div>
  );
}
