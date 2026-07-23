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
      {/* Stitch Editorial Premium Floating Atmospheric Orbs */}
      <div className="floating-orb w-[550px] h-[550px] bg-amber-500/10 top-[-5%] left-[-5%]" />
      <div className="floating-orb w-[480px] h-[480px] bg-indigo-500/15 bottom-[-5%] right-[-5%]" />
      <div className="floating-orb w-[360px] h-[360px] bg-emerald-500/10 top-[35%] right-[12%]" />

      {/* Main Container */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-12 pb-20 md:pt-16 md:pb-24">
        
        {/* Stitch Editorial Premium Hero Header */}
        <header className="text-center mb-10 flex flex-col items-center animate-fade-in-up">
          <Chip.Root className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-amber-500/20 text-xs font-semibold text-amber-300 backdrop-blur-md mb-5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <Chip.Label>Ghostscript Engine v12.0 · 100% Free · No Watermarks</Chip.Label>
          </Chip.Root>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-[1.1]">
            Combine & Compress <span className="font-editorial italic font-normal text-amber-300">PDF Files</span> Cleanly
          </h1>

          <p className="text-base md:text-lg font-normal text-slate-300/70 max-w-xl leading-relaxed">
            Editorial precision document processing, reimagined for high-performance web workflows. Fast, private, and browser-based.
          </p>
        </header>

        {/* Screen 1: Stitch PDF Tool - Workspace */}
        <Card.Root className="glass-panel rounded-[38px] p-6 md:p-10 border border-white/10 shadow-2xl transition-all duration-300">
          
          {/* Tool Switcher Tabs */}
          <Card.Header className="flex justify-center mb-8 p-0 border-none bg-transparent">
            <div className="inline-flex p-1.5 bg-slate-950/80 rounded-2xl border border-white/10">
              <Button
                variant={activeTab === 'combine' ? 'primary' : 'tertiary'}
                onClick={() => !loading && setActiveTab('combine')}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                  activeTab === 'combine'
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                    : 'text-slate-300/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Combine PDFs</span>
              </Button>
              <Button
                variant={activeTab === 'compress' ? 'primary' : 'tertiary'}
                onClick={() => !loading && setActiveTab('compress')}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                  activeTab === 'compress'
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                    : 'text-slate-300/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>Compress PDF</span>
              </Button>
            </div>
          </Card.Header>

          {/* Error Notice */}
          {error && (
            <Alert.Root variant="secondary" className="mb-6 p-4 bg-rose-950/40 border border-rose-800/50 text-rose-300 rounded-2xl flex items-start gap-3 animate-fade-in-up">
              <Alert.Indicator>
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              </Alert.Indicator>
              <Alert.Content>
                <Alert.Title className="text-sm font-bold">Notice</Alert.Title>
                <Alert.Description className="text-sm font-medium leading-relaxed">{error}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}

          <Card.Content className="space-y-8 p-0">
            {/* Compression Mode Selector Profiles */}
            {activeTab === 'compress' && !success && !loading && (
              <div className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-amber-300" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300/70">Compression Profile</span>
                  </div>
                  <span className="text-xs text-slate-400">Tuned DPI & JPEG encoding</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'high',
                      name: 'Extreme',
                      badge: 'Smallest File',
                      dpi: '72 DPI',
                      est: '-70% Size',
                      desc: 'Maximum size reduction for quick web sharing & email limits.'
                    },
                    {
                      id: 'medium',
                      name: 'Recommended',
                      badge: 'Best Balance',
                      tag: 'POPULAR',
                      dpi: '150 DPI',
                      est: '-50% Size',
                      desc: 'The sweet spot. Crystal clear text with significantly smaller size.'
                    },
                    {
                      id: 'low',
                      name: 'High Quality',
                      badge: 'High Detail',
                      dpi: '220 DPI',
                      est: '-25% Size',
                      desc: 'Preserve professional detail. Ideal for printing & presentation.'
                    }
                  ].map(mode => (
                    <Card.Root
                      key={mode.id}
                      onClick={() => setCompressionLevel(mode.id)}
                      className={`p-5 border text-left rounded-3xl flex flex-col justify-between transition-all duration-300 cursor-pointer relative group ${
                        compressionLevel === mode.id
                          ? 'border-amber-400/80 bg-amber-500/10 ring-1 ring-amber-400/30 shadow-lg'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      {mode.tag && (
                        <Badge.Root className="absolute -top-3 right-4">
                          <Badge.Label className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md">
                            {mode.tag}
                          </Badge.Label>
                        </Badge.Root>
                      )}
                      <Card.Header className="p-0 mb-2 border-none bg-transparent">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Card.Title className="text-base font-bold text-white">
                            {mode.name}
                          </Card.Title>
                          <Chip.Root className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                            <Chip.Label>{mode.dpi}</Chip.Label>
                          </Chip.Root>
                        </div>
                        <span className="inline-block text-xs font-extrabold text-amber-300">
                          {mode.est}
                        </span>
                      </Card.Header>
                      <Card.Description className="text-xs text-slate-300/70 leading-relaxed mb-4">
                        {mode.desc}
                      </Card.Description>
                      <Card.Footer className="pt-3 border-t border-white/5 flex items-center justify-between p-0 bg-transparent">
                        <span className="text-[11px] font-medium text-slate-400">{mode.badge}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${compressionLevel === mode.id ? 'border-amber-400 bg-amber-400' : 'border-white/20'}`}>
                          {compressionLevel === mode.id && <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                        </div>
                      </Card.Footer>
                    </Card.Root>
                  ))}
                </div>
              </div>
            )}

            {/* Stitch Editorial Workspace Upload Dropzone */}
            {!success && !loading && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseFiles}
                className={`relative border border-white/10 hover:border-white/20 bg-slate-950/50 rounded-[32px] p-10 md:p-16 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 group ${
                  isDragging ? 'border-amber-400 bg-amber-950/30 scale-[1.005]' : ''
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

                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/10 to-indigo-500/10 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-md">
                  <Upload className="h-9 w-9 text-amber-300" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">Upload your documents</h3>
                <p className="text-sm text-slate-300/60 mb-8 max-w-xs">
                  Drag & drop your {activeTab === 'combine' ? 'PDF files' : 'PDF document'} anywhere or click to browse
                </p>

                <Button
                  variant="primary"
                  onClick={(e) => { e.stopPropagation(); handleBrowseFiles(); }}
                  className="px-10 py-3.5 rounded-2xl bg-amber-400 text-slate-950 font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer hover:bg-amber-300"
                >
                  Select Files
                </Button>

                <p className="mt-6 text-[11px] font-extrabold text-slate-400/50 tracking-widest uppercase">
                  Max size 200MB • No Watermark
                </p>
              </div>
            )}

            {/* Selected File List & Reordering Queue */}
            {files.length > 0 && !success && !loading && (
              <div className="animate-fade-in-up space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300/70">
                      {files.length} File{files.length !== 1 ? 's' : ''} Selected ({formatBytes(totalFilesSize)})
                    </span>
                  </div>
                  {activeTab === 'combine' && (
                    <Button
                      variant="tertiary"
                      onClick={handleBrowseFiles}
                      className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1.5 cursor-pointer border border-amber-400/30 px-3.5 py-1.5 rounded-xl bg-amber-500/10 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Files
                    </Button>
                  )}
                </div>

                <div className="border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 bg-slate-950/60">
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
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition-colors select-none group"
                      >
                        {activeTab === 'combine' && (
                          <div className="cursor-grab active:cursor-grabbing text-slate-500 group-hover:text-slate-300">
                            <GripVertical className="h-4.5 w-4.5" />
                          </div>
                        )}
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-amber-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{file.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{formatBytes(file.size)}</span>
                            {previewData && previewData.numPages && (
                              <>
                                <span>·</span>
                                <span className="font-medium text-slate-300">{previewData.numPages} Page{previewData.numPages !== 1 ? 's' : ''}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {!loading && (
                          <Button
                            variant="tertiary"
                            onClick={() => removeFile(idx)}
                            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-all cursor-pointer"
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
              <div className="animate-fade-in-up space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300/70 block">
                  Visual Page Grid Preview
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {files.map((file, idx) => {
                    const key = `${file.name}-${file.size}-${file.lastModified}`;
                    const previewState = previews[key];
                    return (
                      <Card.Root key={key} className="aspect-[3/4] rounded-2xl border border-white/10 bg-slate-950/70 overflow-hidden relative group hover:border-amber-400 transition-all shadow-md">
                        <Chip.Root className="absolute top-2 left-2 bg-slate-950/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md z-10">
                          <Chip.Label>#{idx + 1}</Chip.Label>
                        </Chip.Root>
                        <Card.Content className="w-full h-full flex items-center justify-center p-2">
                          {!previewState || previewState.status === 'loading' ? (
                            <div className="w-full h-full rounded-xl bg-white/5 animate-pulse flex items-center justify-center">
                              <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
                            </div>
                          ) : previewState.status === 'error' ? (
                            <div className="flex flex-col items-center gap-1 text-slate-400">
                              <FileText className="h-5 w-5" />
                              <span className="text-[10px] font-semibold">PDF Ready</span>
                            </div>
                          ) : (
                            <img src={previewState.url} alt={file.name} className="object-contain max-h-full max-w-full rounded-md group-hover:scale-105 transition-transform duration-200" />
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
              <Card.Footer className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10 animate-fade-in-up p-0 bg-transparent">
                <Button
                  variant="primary"
                  onClick={handleProcess}
                  disabled={isButtonDisabled}
                  className={`flex-1 rounded-2xl py-4 px-6 text-base font-extrabold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                    isButtonDisabled
                      ? 'bg-white/10 text-slate-500 cursor-not-allowed shadow-none'
                      : 'download-btn-glow text-slate-950 hover:scale-[1.01]'
                  }`}
                >
                  <span>{activeTab === 'combine' ? 'Combine PDF Documents' : 'Compress PDF Now'}</span>
                  {!isButtonDisabled && <ArrowRight className="h-5 w-5" />}
                </Button>
                <Button
                  variant="tertiary"
                  onClick={startOver}
                  className="px-6 py-4 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                >
                  Clear Workspace
                </Button>
              </Card.Footer>
            )}

            {/* Loading Processing Pipeline */}
            {loading && (
              <div className="py-14 flex flex-col items-center justify-center text-center animate-fade-in-up">
                <div className="w-full max-w-md space-y-6">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-amber-400 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw className="h-7 w-7 text-amber-400 animate-pulse" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-white">
                      {activeTab === 'combine' ? 'Combining PDF Documents...' : 'Executing Ghostscript Optimization...'}
                    </h4>
                    <p className="text-xs font-semibold text-amber-300 mt-1">
                      {progress < 30 ? 'Analyzing page streams...' : progress < 70 ? 'Downsampling image & content streams...' : 'Building optimized output PDF...'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-300 px-1">
                      <span>Processing Pipeline</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/10">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Screen 2: Stitch Processing Complete View */}
            {success && (
              <div className="py-10 flex flex-col items-center text-center animate-pop-in">
                {/* Check Pulse Halo Ring */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-emerald-400/20 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="relative w-28 h-28 rounded-full glass-panel flex items-center justify-center border border-emerald-400/30 animate-check-pulse">
                    <CheckCircle className="h-16 w-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(78,222,163,0.6)]" />
                  </div>
                </div>

                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
                  Processing Complete
                </h2>
                <p className="text-sm md:text-base text-slate-300/70 max-w-md mb-10 leading-relaxed">
                  We've optimized your document using our Ghostscript engine, maintaining pixel-perfect clarity.
                </p>

                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-10">
                  {/* File Size Metric Card */}
                  <Card.Root className="glass-panel p-6 rounded-[28px] border border-white/10 text-left relative overflow-hidden group">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-2 bg-amber-500/10 rounded-xl">
                        <BarChart3 className="h-5 w-5 text-amber-300" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-300/70">Compression Ratio</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-400 mb-0.5">Original</span>
                        <span className="text-lg font-semibold text-slate-400/60 line-through">
                          {formatBytes(success.originalSize)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ArrowRight className="h-5 w-5 text-amber-400/40" />
                        <div className="flex flex-col items-end">
                          <span className="text-[11px] font-semibold text-amber-300 mb-0.5">Optimized</span>
                          <span className="text-3xl font-extrabold text-white">
                            {formatBytes(success.compressedSize || success.originalSize)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card.Root>

                  {/* Savings Metric Card */}
                  <Card.Root className="glass-panel p-6 rounded-[28px] border border-emerald-400/20 text-left relative overflow-hidden group">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <Bolt className="h-5 w-5 text-emerald-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-300/70">Storage Saved</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-extrabold text-emerald-400">
                        -{success.savingsPercent || 0}%
                      </span>
                      <div className="flex flex-col items-end gap-1">
                        <Chip.Root className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                          <Chip.Label>Storage Recovered</Chip.Label>
                        </Chip.Root>
                        {success.savedBytes > 0 && (
                          <span className="text-[11px] text-slate-400">
                            {formatBytes(success.savedBytes)} saved
                          </span>
                        )}
                      </div>
                    </div>
                  </Card.Root>
                </div>

                {/* Actions Grid */}
                <div className="w-full max-w-2xl flex flex-col gap-4">
                  <Button
                    variant="primary"
                    onClick={async () => {
                      setShowToast(true);
                      await handleDownload(success.downloadUrl, success.filename);
                    }}
                    className="download-btn-glow group relative w-full py-5 rounded-[24px] overflow-hidden flex items-center justify-center gap-3 text-slate-950 text-lg font-extrabold cursor-pointer"
                  >
                    <Download className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    <span>Download Optimized PDF</span>
                  </Button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => copyDownloadLink(success.downloadUrl)}
                      className="flex items-center justify-center gap-2 py-4 glass-panel rounded-2xl text-xs font-bold text-slate-200 hover:bg-white/10 transition-all cursor-pointer"
                    >
                      {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
                    </Button>
                    <Button
                      variant="tertiary"
                      onClick={startOver}
                      className="flex items-center justify-center gap-2 py-4 glass-panel rounded-2xl text-xs font-bold text-slate-200 hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4 text-amber-300" />
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
          <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-extrabold animate-fade-in-up z-50 border border-white/10 glass-panel">
            <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
            <span>Download Starting...</span>
          </div>
        )}
      </div>
    </div>
  );
}
