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
  ArrowRight
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
    <div className="mx-auto max-w-3xl px-6 py-8 md:py-12 animate-fade-in-up">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Process your PDFs
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
          Combine multiple files or compress to reduce size. No signup, no watermarks.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
          {['combine', 'compress'].map(tab => (
            <button
              key={tab}
              onClick={() => !loading && setActiveTab(tab)}
              disabled={loading}
              className={`px-5 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === tab
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {tab === 'combine' ? 'Combine PDFs' : 'Compress PDF'}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl flex items-start gap-3 animate-fade-in-up">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">{error}</p>
        </div>
      )}

      {/* Main workspace — single column, centered, focused */}
      <div className="space-y-6">

        {/* Upload zone — always visible when no success and not loading */}
        {!success && !loading && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseFiles}
            className={`relative border-2 border-dashed rounded-2xl py-12 px-6 text-center cursor-pointer transition-all duration-200 group ${
              isDragging
                ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-900/50'
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
            <div className="inline-flex p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 mb-4 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-200 animate-breathe">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Drop {activeTab === 'combine' ? 'PDF files' : 'a PDF file'} here, or{' '}
              <span className="text-indigo-600 dark:text-indigo-400">browse</span>
            </p>
            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
              Up to 200 MB per file{activeTab === 'combine' ? ', max 30 files' : ''}
            </p>
          </div>
        )}

        {/* File list */}
        {files.length > 0 && !success && !loading && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
                {activeTab === 'combine' ? ` / 30` : ''}
              </span>
              {activeTab === 'combine' && (
                <button
                  onClick={handleBrowseFiles}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add more
                </button>
              )}
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
              {files.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  draggable={activeTab === 'combine' && !loading}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleItemDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors select-none animate-fade-in-left"
                >
                  {activeTab === 'combine' && (
                    <div className="cursor-grab active:cursor-grabbing text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400">
                      <GripVertical className="h-4 w-4" />
                    </div>
                  )}
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{file.name}</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">{formatBytes(file.size)}</p>
                  </div>
                  {!loading && (
                    <button
                      onClick={() => removeFile(idx)}
                      className="p-2 text-neutral-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview grid */}
        {files.length > 0 && !success && !loading && (
          <div className="animate-fade-in-up">
            <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
              Preview
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {files.map((file, idx) => {
                const key = `${file.name}-${file.size}-${file.lastModified}`;
                const previewState = previews[key];
                return (
                  <div key={key} className="aspect-[3/4] rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 overflow-hidden relative group hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                    <span className="absolute top-1.5 left-1.5 bg-neutral-900/70 dark:bg-neutral-100/80 text-white dark:text-neutral-900 text-[10px] font-medium px-1.5 py-0.5 rounded-md z-10">
                      {idx + 1}
                    </span>
                    <div className="w-full h-full flex items-center justify-center p-1">
                      {previewState === 'loading' || !previewState ? (
                        <div className="w-full h-full rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                      ) : previewState === 'error' ? (
                        <div className="flex flex-col items-center gap-1 text-neutral-300 dark:text-neutral-600">
                          <FileText className="h-6 w-6" />
                          <span className="text-[10px]">No preview</span>
                        </div>
                      ) : (
                        <img src={previewState} alt={file.name} className="object-contain max-h-full max-w-full rounded-lg" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Compression settings */}
        {activeTab === 'compress' && files.length > 0 && !success && !loading && (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Compression level</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: 'Low', desc: 'Best quality' },
                { id: 'medium', label: 'Medium', desc: 'Balanced' },
                { id: 'high', label: 'High', desc: 'Smallest size' }
              ].map(level => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setCompressionLevel(level.id)}
                  className={`py-3 px-4 border rounded-xl flex flex-col items-center transition-all duration-150 cursor-pointer ${
                    compressionLevel === level.id
                      ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <span className="text-sm font-medium">{level.label}</span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{level.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Large file warning */}
        {activeTab === 'compress' && files.length > 0 && files[0].size > 50 * 1024 * 1024 && !success && !loading && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl flex items-center gap-2.5 text-amber-700 dark:text-amber-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Large files may take 1–3 minutes on free hosting.</span>
          </div>
        )}

        {/* Action button */}
        {files.length > 0 && !success && !loading && (
          <div className="flex gap-3 animate-fade-in-up">
            <button
              onClick={handleProcess}
              disabled={isButtonDisabled}
              className={`flex-1 rounded-xl py-3 px-6 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                isButtonDisabled
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                  : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-[0.99] shadow-sm'
              }`}
            >
              <span>{activeTab === 'combine' ? 'Combine PDFs' : 'Compress PDF'}</span>
              {!isButtonDisabled && <ArrowRight className="h-4 w-4" />}
            </button>
            <button
              onClick={startOver}
              className="px-4 py-3 rounded-xl text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <div className="w-full max-w-sm space-y-5">
              {isFastPath ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 border-[3px] border-neutral-200 dark:border-neutral-700 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin" />
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Processing...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                      <span className="h-3.5 w-3.5 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin" />
                      Processing...
                    </span>
                    <span className="text-neutral-400 dark:text-neutral-500 tabular-nums">{progress}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
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

        {/* Success state */}
        {success && (
          <div className="py-12 flex flex-col items-center text-center animate-pop-in">
            <div className="w-full max-w-sm space-y-6">
              <div className="inline-flex p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Ready to download</h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Your {activeTab === 'combine' ? 'combined' : 'compressed'} PDF has been processed.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={async () => {
                    setHasDownloaded(true);
                    setShowToast(true);
                    await handleDownload(success.downloadUrl, success.filename);
                  }}
                  className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl py-3.5 px-6 text-sm font-medium shadow-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer animate-pulse-ring"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
                {!('showSaveFilePicker' in window) && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    File will save to your default Downloads folder.
                  </p>
                )}
                <button
                  onClick={startOver}
                  className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  Process another file
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-in-up z-50">
          <CheckCircle className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          Download started
        </div>
      )}
    </div>
  );
}
