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
  RefreshCw,
  Layers,
  Zap,
  Copy,
  Check,
  FileCheck,
  BarChart3,
  Bolt
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
    <div className="relative min-h-screen editorial-mesh overflow-hidden">
      {/* Main Container - Compact Spacing */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 pt-4 pb-10 md:pt-6 md:pb-12">
        
        {/* Compact Hero Header */}
        <header className="text-center mb-4 flex flex-col items-center animate-fade-in-up">
          <Chip.Root className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 dark:bg-white/5 border border-indigo-200 dark:border-amber-500/20 text-[11px] font-semibold text-indigo-700 dark:text-amber-300 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-amber-400 animate-pulse" />
            <Chip.Label>Ghostscript Engine · 100% Free · No Watermarks</Chip.Label>
          </Chip.Root>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5">
            Combine & Compress <span className="font-editorial italic font-normal text-indigo-600 dark:text-amber-300">PDF Files</span>
          </h1>

          <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300/70 max-w-md">
            Fast, private, browser-based PDF processing. No signups, no quality loss.
          </p>
        </header>

        {/* Workspace Elevated Glass Card - Compact Padding */}
        <Card.Root className="glass-panel rounded-3xl p-4 md:p-6 border border-slate-200 dark:border-white/10 shadow-lg transition-all">
          
          {/* Tool Switcher Tabs */}
          <Card.Header className="flex justify-center mb-5 p-0 border-none bg-transparent">
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-white/10">
              <Button
                variant={activeTab === 'combine' ? 'primary' : 'tertiary'}
                onClick={() => !loading && setActiveTab('combine')}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-6 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'combine'
                    ? 'bg-indigo-600 text-white dark:bg-amber-400 dark:text-slate-950 shadow-md'
                    : 'text-slate-600 dark:text-slate-300/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Combine PDFs</span>
              </Button>
              <Button
                variant={activeTab === 'compress' ? 'primary' : 'tertiary'}
                onClick={() => !loading && setActiveTab('compress')}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-6 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'compress'
                    ? 'bg-indigo-600 text-white dark:bg-amber-400 dark:text-slate-950 shadow-md'
                    : 'text-slate-600 dark:text-slate-300/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Compress PDF</span>
              </Button>
            </div>
          </Card.Header>

          {/* Error Notice */}
          {error && (
            <Alert.Root variant="secondary" className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 rounded-xl flex items-start gap-2.5 animate-fade-in-up">
              <Alert.Indicator>
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              </Alert.Indicator>
              <Alert.Content>
                <Alert.Title className="text-xs font-bold">Notice</Alert.Title>
                <Alert.Description className="text-xs font-medium">{error}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}

          <Card.Content className="space-y-5 p-0">
            {/* Compression Profiles */}
            {activeTab === 'compress' && !success && !loading && (
              <div className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Settings className="h-3.5 w-3.5 text-indigo-600 dark:text-amber-300" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Compression Profile</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Tuned DPI & JPEG encoding</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'high',
                      name: 'Extreme',
                      badge: 'Smallest File',
                      dpi: '72 DPI',
                      est: '-70% Size',
                      desc: 'Maximum reduction for email & strict upload limits.'
                    },
                    {
                      id: 'medium',
                      name: 'Recommended',
                      badge: 'Best Balance',
                      tag: 'POPULAR',
                      dpi: '150 DPI',
                      est: '-50% Size',
                      desc: 'Optimal balance of crystal clear text & smaller size.'
                    },
                    {
                      id: 'low',
                      name: 'High Quality',
                      badge: 'High Detail',
                      dpi: '220 DPI',
                      est: '-25% Size',
                      desc: 'Preserves high image detail for print & presentations.'
                    }
                  ].map(mode => (
                    <Card.Root
                      key={mode.id}
                      onClick={() => setCompressionLevel(mode.id)}
                      className={`p-3.5 border text-left rounded-2xl flex flex-col justify-between transition-all cursor-pointer relative ${
                        compressionLevel === mode.id
                          ? 'border-indigo-600 dark:border-amber-400 bg-indigo-50/70 dark:bg-amber-500/10 ring-1 ring-indigo-500/30 dark:ring-amber-400/30'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      {mode.tag && (
                        <Badge.Root className="absolute -top-2.5 right-3">
                          <Badge.Label className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white dark:bg-amber-400 dark:text-slate-950">
                            {mode.tag}
                          </Badge.Label>
                        </Badge.Root>
                      )}
                      <Card.Header className="p-0 mb-1 border-none bg-transparent">
                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                          <Card.Title className="text-xs font-bold text-slate-900 dark:text-white">
                            {mode.name}
                          </Card.Title>
                          <Chip.Root className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                            <Chip.Label>{mode.dpi}</Chip.Label>
                          </Chip.Root>
                        </div>
                        <span className="inline-block text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                          {mode.est}
                        </span>
                      </Card.Header>
                      <Card.Description className="text-[11px] text-slate-600 dark:text-slate-300/70 leading-normal mb-2">
                        {mode.desc}
                      </Card.Description>
                      <Card.Footer className="pt-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between p-0 bg-transparent">
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{mode.badge}</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${compressionLevel === mode.id ? 'border-indigo-600 bg-indigo-600 dark:border-amber-400 dark:bg-amber-400' : 'border-slate-300 dark:border-white/20'}`}>
                          {compressionLevel === mode.id && <div className="w-1 h-1 bg-white dark:bg-slate-950 rounded-full" />}
                        </div>
                      </Card.Footer>
                    </Card.Root>
                  ))}
                </div>
              </div>
            )}

            {/* Compact Dropzone Unit */}
            {!success && !loading && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseFiles}
                className={`relative border-2 border-dashed rounded-2xl py-6 md:py-8 px-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50 dark:border-amber-400 dark:bg-amber-950/30'
                    : 'border-slate-300 dark:border-white/10 hover:border-indigo-500 dark:hover:border-amber-400 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-indigo-50/40 dark:hover:bg-white/[0.02]'
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

                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs text-indigo-600 dark:text-amber-300">
                  <Upload className="h-6 w-6" />
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload your documents</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300/70">
                    Drag & drop {activeTab === 'combine' ? 'PDF files' : 'a PDF document'} here, or <span className="text-indigo-600 dark:text-amber-300 underline font-semibold">browse</span>
                  </p>
                </div>

                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase pt-1">
                  Max size 200MB • No Watermarks
                </p>
              </div>
            )}

            {/* Selected File List */}
            {files.length > 0 && !success && !loading && (
              <div className="animate-fade-in-up space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {files.length} File{files.length !== 1 ? 's' : ''} Selected ({formatBytes(totalFilesSize)})
                    </span>
                  </div>
                  {activeTab === 'combine' && (
                    <Button
                      variant="tertiary"
                      onClick={handleBrowseFiles}
                      className="text-xs font-semibold text-indigo-600 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer border border-indigo-200 dark:border-amber-400/30 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-amber-500/10"
                    >
                      <Plus className="h-3 w-3" /> Add Files
                    </Button>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-white/5 bg-slate-50/80 dark:bg-slate-950/60">
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
                        className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors select-none"
                      >
                        {activeTab === 'combine' && (
                          <div className="cursor-grab text-slate-400 dark:text-slate-600">
                            <GripVertical className="h-4 w-4" />
                          </div>
                        )}
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-amber-500/10 border border-indigo-100 dark:border-amber-400/20 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-indigo-600 dark:text-amber-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                            <span>{formatBytes(file.size)}</span>
                            {previewData && previewData.numPages && (
                              <>
                                <span>·</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{previewData.numPages} Page{previewData.numPages !== 1 ? 's' : ''}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {!loading && (
                          <Button
                            variant="tertiary"
                            onClick={() => removeFile(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Visual Page Grid
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {files.map((file, idx) => {
                    const key = `${file.name}-${file.size}-${file.lastModified}`;
                    const previewState = previews[key];
                    return (
                      <Card.Root key={key} className="aspect-[3/4] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-950/70 overflow-hidden relative shadow-xs">
                        <Chip.Root className="absolute top-1.5 left-1.5 bg-slate-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
                          <Chip.Label>#{idx + 1}</Chip.Label>
                        </Chip.Root>
                        <Card.Content className="w-full h-full flex items-center justify-center p-1.5">
                          {!previewState || previewState.status === 'loading' ? (
                            <div className="w-full h-full rounded bg-slate-200/50 dark:bg-white/5 animate-pulse flex items-center justify-center">
                              <RefreshCw className="h-3.5 w-3.5 text-slate-400 animate-spin" />
                            </div>
                          ) : previewState.status === 'error' ? (
                            <div className="flex flex-col items-center gap-0.5 text-slate-400">
                              <FileText className="h-4 w-4" />
                              <span className="text-[9px] font-semibold">PDF Ready</span>
                            </div>
                          ) : (
                            <img src={previewState.url} alt={file.name} className="object-contain max-h-full max-w-full rounded shadow-xs" />
                          )}
                        </Card.Content>
                      </Card.Root>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Bar */}
            {files.length > 0 && !success && !loading && (
              <Card.Footer className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-white/10 animate-fade-in-up p-0 bg-transparent">
                <Button
                  variant="primary"
                  onClick={handleProcess}
                  disabled={isButtonDisabled}
                  className={`flex-1 rounded-xl py-3 px-5 text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    isButtonDisabled
                      ? 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-slate-950'
                  }`}
                >
                  <span>{activeTab === 'combine' ? 'Combine PDF Documents' : 'Compress PDF Now'}</span>
                  {!isButtonDisabled && <ArrowRight className="h-4 w-4" />}
                </Button>
                <Button
                  variant="tertiary"
                  onClick={startOver}
                  className="px-5 py-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                >
                  Clear Workspace
                </Button>
              </Card.Footer>
            )}

            {/* Loading Processing State */}
            {loading && (
              <div className="py-10 flex flex-col items-center justify-center text-center animate-fade-in-up">
                <div className="w-full max-w-sm space-y-4">
                  <div className="relative w-14 h-14 mx-auto">
                    <div className="absolute inset-0 rounded-full border-3 border-slate-200 dark:border-white/10" />
                    <div className="absolute inset-0 rounded-full border-3 border-t-indigo-600 dark:border-t-amber-400 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-indigo-600 dark:text-amber-400 animate-pulse" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {activeTab === 'combine' ? 'Combining PDF Documents...' : 'Executing Ghostscript Optimization...'}
                    </h4>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-amber-300 mt-0.5">
                      {progress < 30 ? 'Analyzing page streams...' : progress < 70 ? 'Downsampling image & content streams...' : 'Building optimized output PDF...'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                      <span>Processing Pipeline</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-white/5 rounded-full h-2.5 overflow-hidden border border-slate-300 dark:border-white/10">
                      <div
                        className="bg-indigo-600 dark:bg-amber-400 h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success View */}
            {success && (
              <div className="py-6 flex flex-col items-center text-center animate-pop-in">
                <div className="relative mb-6">
                  <div className="relative w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-300 dark:border-emerald-400/30 animate-check-pulse">
                    <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight">
                  Processing Complete
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mb-6">
                  Your PDF has been processed and optimized cleanly.
                </p>

                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg mb-6">
                  <Card.Root className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 p-4 rounded-2xl text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-amber-300" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Compression Ratio</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Original</span>
                        <span className="text-sm font-semibold text-slate-400 line-through">{formatBytes(success.originalSize)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-indigo-600 dark:text-amber-300 block font-semibold">Optimized</span>
                        <span className="text-xl font-extrabold text-slate-900 dark:text-white">{formatBytes(success.compressedSize || success.originalSize)}</span>
                      </div>
                    </div>
                  </Card.Root>

                  <Card.Root className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 p-4 rounded-2xl text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <Bolt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Storage Saved</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">-{success.savingsPercent || 0}%</span>
                      {success.savedBytes > 0 && (
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{formatBytes(success.savedBytes)} saved</span>
                      )}
                    </div>
                  </Card.Root>
                </div>

                {/* Actions Grid */}
                <div className="w-full max-w-lg flex flex-col gap-3">
                  <Button
                    variant="primary"
                    onClick={async () => {
                      setShowToast(true);
                      await handleDownload(success.downloadUrl, success.filename);
                    }}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-slate-950 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Download className="h-4.5 w-4.5" />
                    <span>Download Optimized PDF</span>
                  </Button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      variant="secondary"
                      onClick={() => copyDownloadLink(success.downloadUrl)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
                    </Button>
                    <Button
                      variant="tertiary"
                      onClick={startOver}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-indigo-600 dark:text-amber-300" />
                      <span>Optimize Another</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card.Content>
        </Card.Root>

        {/* Floating Toast Notification */}
        {showToast && (
          <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fade-in-up z-50 border border-slate-800">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span>Download Starting...</span>
          </div>
        )}
      </div>
    </div>
  );
}
