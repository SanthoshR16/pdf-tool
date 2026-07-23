import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Chip, Alert, Badge } from '@heroui/react';
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
  Zap,
  Copy,
  Check,
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
    <div className="mx-auto max-w-4xl px-4 pt-10 pb-16 md:pt-14 md:pb-20">
      {/* Hero Header with Proper Top Padding & Tightened Spacing */}
      <header className="text-center mb-6 flex flex-col items-center animate-fade-in-up">
        <Chip.Root className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 mb-4 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
          <Chip.Label>Ghostscript Powered Engine · 100% Free · No Watermarks</Chip.Label>
        </Chip.Root>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-3 max-w-3xl leading-tight">
          Combine & Compress <span className="text-indigo-600 dark:text-indigo-400">PDF Files</span> Cleanly
        </h1>

        <p className="text-sm md:text-base font-medium text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
          High-precision Ghostscript compression and instant multi-file merging in your browser.
        </p>
      </header>

      {/* Main Workspace Tool Card — Elevated Surface with Depth */}
      <Card.Root className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xl dark:shadow-2xl shadow-indigo-500/5 p-6 md:p-8 transition-all duration-300">
        
        {/* Tab Toggle with High Active Contrast using HeroUI Semantic Variants */}
        <Card.Header className="flex justify-center mb-6 p-0 border-none bg-transparent">
          <div className="inline-flex bg-slate-100 dark:bg-slate-950/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
            <Button
              variant={activeTab === 'combine' ? 'primary' : 'tertiary'}
              onClick={() => !loading && setActiveTab('combine')}
              disabled={loading}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 w-full sm:w-auto cursor-pointer ${
                activeTab === 'combine'
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Combine PDFs</span>
            </Button>
            <Button
              variant={activeTab === 'compress' ? 'primary' : 'tertiary'}
              onClick={() => !loading && setActiveTab('compress')}
              disabled={loading}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 w-full sm:w-auto cursor-pointer ${
                activeTab === 'compress'
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>Compress PDF</span>
            </Button>
          </div>
        </Card.Header>

        {/* Error Alert using HeroUI Alert Compound Pattern */}
        {error && (
          <Alert.Root variant="secondary" className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 rounded-2xl flex items-start gap-3 animate-fade-in-up">
            <Alert.Indicator>
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title className="text-sm font-bold">Notice</Alert.Title>
              <Alert.Description className="text-sm font-medium leading-relaxed">{error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        <Card.Content className="space-y-6 p-0">
          {/* Compression Level Selector */}
          {activeTab === 'compress' && !success && !loading && (
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Compression Mode</span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">Tuned DPI & encoding</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    id: 'high',
                    name: 'Extreme Compression',
                    badge: 'Smallest File',
                    dpi: '~72 DPI',
                    est: 'Up to -70%',
                    desc: 'Maximum compression for email & tight web upload limits.'
                  },
                  {
                    id: 'medium',
                    name: 'Recommended',
                    badge: 'Best Balance',
                    tag: 'POPULAR',
                    dpi: '~150 DPI',
                    est: 'Up to -50%',
                    desc: 'Optimal size reduction with high text & graphics clarity.'
                  },
                  {
                    id: 'low',
                    name: 'Less Compression',
                    badge: 'High Quality',
                    dpi: '~220 DPI',
                    est: 'Up to -25%',
                    desc: 'Light compression preserving maximum image detail.'
                  }
                ].map(mode => (
                  <Card.Root
                    key={mode.id}
                    onClick={() => setCompressionLevel(mode.id)}
                    className={`p-4 border text-left rounded-2xl flex flex-col justify-between transition-all duration-200 cursor-pointer relative group ${
                      compressionLevel === mode.id
                        ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {mode.tag && (
                      <Badge.Root className="absolute -top-2.5 right-4">
                        <Badge.Label className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                          {mode.tag}
                        </Badge.Label>
                      </Badge.Root>
                    )}
                    <Card.Header className="p-0 mb-1 border-none bg-transparent">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Card.Title className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {mode.name}
                        </Card.Title>
                        <Chip.Root className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <Chip.Label>{mode.dpi}</Chip.Label>
                        </Chip.Root>
                      </div>
                      <span className="inline-block text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {mode.est} Reduction
                      </span>
                    </Card.Header>
                    <Card.Description className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                      {mode.desc}
                    </Card.Description>
                    <Card.Footer className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between p-0 bg-transparent">
                      <span className="text-[11px] font-medium text-slate-400">{mode.badge}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${compressionLevel === mode.id ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-400 dark:bg-indigo-400' : 'border-slate-300 dark:border-slate-700'}`}>
                        {compressionLevel === mode.id && <div className="w-1.5 h-1.5 bg-white dark:bg-slate-950 rounded-full" />}
                      </div>
                    </Card.Footer>
                  </Card.Root>
                ))}
              </div>
            </div>
          )}

          {/* Upload Zone — Composed Unit, Reduced Height & Subtle Hover Tint */}
          {!success && !loading && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseFiles}
              className={`relative border-2 border-dashed rounded-2xl py-8 px-6 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center space-y-3 ${
                isDragging
                  ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 scale-[1.005]'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20'
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

              {/* Composed Dropzone Unit */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-indigo-600 dark:text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
                <Upload className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Drag & drop {activeTab === 'combine' ? 'PDF files' : 'a PDF document'} here, or{' '}
                  <span className="text-indigo-600 dark:text-indigo-400 group-hover:underline">browse</span>
                </p>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  PDF format up to 200 MB {activeTab === 'combine' ? '· Max 30 files' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Selected File List & Reordering */}
          {files.length > 0 && !success && !loading && (
            <div className="animate-fade-in-up space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {files.length} File{files.length !== 1 ? 's' : ''} Selected ({formatBytes(totalFilesSize)})
                  </span>
                </div>
                {activeTab === 'combine' && (
                  <Button
                    variant="tertiary"
                    onClick={handleBrowseFiles}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800/80 px-3 py-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Files
                  </Button>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/30 dark:bg-slate-950/40">
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
                      className="flex items-center gap-3.5 px-4 py-3 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 transition-colors select-none group"
                    >
                      {activeTab === 'combine' && (
                        <div className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-700 group-hover:text-slate-400">
                          <GripVertical className="h-4.5 w-4.5" />
                        </div>
                      )}
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center shrink-0">
                        <FileText className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          <span>{formatBytes(file.size)}</span>
                          {previewData && previewData.numPages && (
                            <>
                              <span>·</span>
                              <span className="font-medium text-slate-600 dark:text-slate-400">{previewData.numPages} Page{previewData.numPages !== 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {!loading && (
                        <Button
                          variant="tertiary"
                          onClick={() => removeFile(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Page Grid Preview */}
          {files.length > 0 && !success && !loading && (
            <div className="animate-fade-in-up space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Visual Page Grid
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {files.map((file, idx) => {
                  const key = `${file.name}-${file.size}-${file.lastModified}`;
                  const previewState = previews[key];
                  return (
                    <Card.Root key={key} className="aspect-[3/4] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden relative group hover:border-indigo-500 dark:hover:border-indigo-400 shadow-2xs transition-all">
                      <Chip.Root className="absolute top-2 left-2 bg-slate-900/90 dark:bg-slate-100 text-white dark:text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-md z-10 shadow-xs">
                        <Chip.Label>#{idx + 1}</Chip.Label>
                      </Chip.Root>
                      <Card.Content className="w-full h-full flex items-center justify-center p-2">
                        {!previewState || previewState.status === 'loading' ? (
                          <div className="w-full h-full rounded-xl bg-slate-200/50 dark:bg-slate-900 animate-pulse flex items-center justify-center">
                            <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
                          </div>
                        ) : previewState.status === 'error' ? (
                          <div className="flex flex-col items-center gap-1 text-slate-400">
                            <FileText className="h-5 w-5" />
                            <span className="text-[10px] font-semibold">PDF Ready</span>
                          </div>
                        ) : (
                          <img src={previewState.url} alt={file.name} className="object-contain max-h-full max-w-full rounded-md shadow-xs group-hover:scale-102 transition-transform duration-200" />
                        )}
                      </Card.Content>
                    </Card.Root>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Bar — Unmistakable Dominant Primary Action */}
          {files.length > 0 && !success && !loading && (
            <Card.Footer className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 animate-fade-in-up p-0 bg-transparent">
              <Button
                variant="primary"
                onClick={handleProcess}
                disabled={isButtonDisabled}
                className={`flex-1 rounded-2xl py-3.5 px-6 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  isButtonDisabled
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-indigo-500/20'
                }`}
              >
                <span>{activeTab === 'combine' ? 'Combine PDF Documents' : 'Compress PDF Now'}</span>
                {!isButtonDisabled && <ArrowRight className="h-4 w-4" />}
              </Button>
              <Button
                variant="tertiary"
                onClick={startOver}
                className="px-5 py-3.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
              >
                Clear Workspace
              </Button>
            </Card.Footer>
          )}

          {/* Loading Processing State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in-up">
              <div className="w-full max-w-md space-y-5">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {activeTab === 'combine' ? 'Combining PDF Documents...' : 'Executing Ghostscript Compression...'}
                  </h4>
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                    {progress < 30 ? 'Analyzing page structure...' : progress < 70 ? 'Downsampling image streams & content streams...' : 'Building output PDF artifact...'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
                    <span>Processing Pipeline</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Download Screen */}
          {success && (
            <div className="py-8 flex flex-col items-center text-center animate-pop-in space-y-6">
              <div className="w-full max-w-md space-y-5">
                <div className="inline-flex p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 shadow-xs">
                  <CheckCircle className="h-8 w-8" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Operation Complete</h3>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Your PDF has been processed and optimized cleanly.
                  </p>
                </div>

                {/* Compression Metrics Summary */}
                {activeTab === 'compress' && (success.originalSize || success.compressedSize) && (
                  <Card.Root className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-left space-y-3">
                    <Card.Header className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2 p-0 bg-transparent">
                      <Card.Title className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Compression Summary</Card.Title>
                      {success.savingsPercent !== undefined && success.savingsPercent > 0 && (
                        <Chip.Root className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                          <Chip.Label>-{success.savingsPercent}% Saved</Chip.Label>
                        </Chip.Root>
                      )}
                    </Card.Header>
                    <Card.Content className="grid grid-cols-2 gap-4 p-0">
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">Original Size</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 line-through">
                          {formatBytes(success.originalSize)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">Optimized Size</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatBytes(success.compressedSize || success.originalSize)}
                        </span>
                      </div>
                    </Card.Content>
                  </Card.Root>
                )}

                {/* Download Actions */}
                <div className="space-y-2.5 pt-1">
                  <Button
                    variant="primary"
                    onClick={async () => {
                      setShowToast(true);
                      await handleDownload(success.downloadUrl, success.filename);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-2xl py-3.5 px-6 text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="h-4.5 w-4.5" />
                    <span>Download Optimized PDF</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => copyDownloadLink(success.downloadUrl)}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Link'}</span>
                    </Button>
                    <Button
                      variant="tertiary"
                      onClick={startOver}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <span>Process Another PDF</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card.Content>
      </Card.Root>

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in-up z-50 border border-slate-800 dark:border-slate-200">
          <CheckCircle className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>Download Starting...</span>
        </div>
      )}
    </div>
  );
}
