import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Bolt,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  Lock
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'];

const isSupportedFile = (file) => {
  const name = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some(ext => name.endsWith(ext)) || file.type === 'application/pdf' || file.type.startsWith('image/');
};

// Lazy-load pdf.js only when needed for PDF rendering
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

  // Revoke object URLs on unmount or file reset for Memory Optimization
  const cleanupPreviews = useCallback((previewMap) => {
    Object.values(previewMap).forEach(item => {
      if (item.isImage && item.url && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });
  }, []);

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

  // Thumbnail & page count generation with automatic memory cleanup
  useEffect(() => {
    if (files.length === 0) return;
    
    files.forEach(file => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (previews[key]) return;
      
      const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|tiff)$/i.test(file.name);
      if (isImg) {
        const url = URL.createObjectURL(file);
        setPreviews(prev => ({
          ...prev,
          [key]: { status: 'ready', url, numPages: 1, isImage: true }
        }));
        return;
      }
      
      setPreviews(prev => ({ ...prev, [key]: { status: 'loading' } }));
      loadPdfJs().then(pdfjsLib => {
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
              [key]: { status: 'ready', url: canvas.toDataURL(), numPages, isImage: false }
            }));
          } catch {
            setPreviews(prev => ({ ...prev, [key]: { status: 'error', numPages: '?' } }));
          }
        };
        reader.readAsArrayBuffer(file);
      }).catch(() => {
        setPreviews(prev => ({ ...prev, [key]: { status: 'error', numPages: '?' } }));
      });
    });
  }, [files, previews]);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getExtensionBadge = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf':
        return { label: 'PDF', style: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40' };
      case 'jpg':
      case 'jpeg':
        return { label: 'JPG', style: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40' };
      case 'png':
        return { label: 'PNG', style: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40' };
      case 'webp':
        return { label: 'WEBP', style: 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/40' };
      case 'bmp':
        return { label: 'BMP', style: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/40' };
      case 'tiff':
        return { label: 'TIFF', style: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40' };
      default:
        return { label: ext.toUpperCase(), style: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500/40' };
    }
  };

  const validateAndAddFiles = (selectedFiles) => {
    setError(null);
    const validFiles = [];
    const errors = [];
    const MAX_SIZE = 200 * 1024 * 1024;

    for (let f of selectedFiles) {
      if (!isSupportedFile(f)) {
        errors.push(`"${f.name}" is not a supported format (PDF, JPG, PNG, WEBP, BMP, TIFF).`);
        continue;
      }
      if (f.size > MAX_SIZE) {
        errors.push(`"${f.name}" exceeds the maximum 200 MB limit.`);
        continue;
      }
      validFiles.push(f);
    }
    if (errors.length > 0) setError(errors.join(' '));
    if (validFiles.length > 0) {
      if (success) {
        setSuccess(null);
        setFiles(activeTab === 'compress' ? [validFiles[0]] : validFiles.slice(0, 30));
      } else {
        if (activeTab === 'compress') {
          setFiles([validFiles[0]]);
        } else {
          setFiles(prev => {
            const next = [...prev, ...validFiles];
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
  
  const removeFile = (index) => {
    setFiles(prev => {
      const removed = prev[index];
      if (removed) {
        const key = `${removed.name}-${removed.size}-${removed.lastModified}`;
        const p = previews[key];
        if (p && p.isImage && p.url && p.url.startsWith('blob:')) {
          URL.revokeObjectURL(p.url);
        }
      }
      return prev.filter((_, i) => i !== index);
    });
    setError(null);
  };

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

  // Process PDF / Image request
  const handleProcess = async () => {
    if (files.length === 0) return;
    if (activeTab === 'combine' && files.length < 2) {
      setError('Please select at least 2 files to combine.');
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
          throw new Error(statusData.error_message || 'Processing failed.');
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
    cleanupPreviews(previews);
    setPreviews({});
    setFiles([]);
    setSuccess(null);
    setError(null);
    setProgress(0);
  };

  const isButtonDisabled = activeTab === 'combine' ? files.length < 2 : files.length < 1;
  const totalFilesSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="relative min-h-screen editorial-mesh overflow-hidden py-4 md:py-8">
      
      {/* Dynamic Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-amber-500/10 dark:bg-amber-400/15 rounded-full blur-[100px] pointer-events-none animate-float-slow" />

      {/* Main Container */}
      <div className="relative z-10 mx-auto max-w-4xl px-4">
        
        {/* Hero Header */}
        <header className="text-center mb-6 flex flex-col items-center animate-fade-in-up">
          <Chip.Root className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border border-indigo-200/60 dark:border-white/15 text-[11px] font-bold text-indigo-700 dark:text-amber-300 shadow-xs mb-3 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <Chip.Label>Fast · Local Ghostscript Engine · 100% Free · No Watermarks</Chip.Label>
          </Chip.Root>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 leading-tight">
            Combine & Compress <span className="font-editorial italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500 dark:from-amber-300 dark:via-amber-400 dark:to-indigo-300">PDF & Images</span>
          </h1>

          <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300/80 max-w-lg leading-relaxed">
            Ultra-fast, private browser PDF suite. Convert, merge, and optimize PDFs, JPGs, PNGs, WEBP, BMP, and TIFF files instantly.
          </p>

          {/* Extension Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3.5">
            {['PDF', 'JPG', 'PNG', 'WEBP', 'BMP', 'TIFF'].map(ext => (
              <span key={ext} className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-xs">
                .{ext.toLowerCase()}
              </span>
            ))}
          </div>
        </header>

        {/* Main Workspace Card */}
        <Card.Root className="glass-panel rounded-3xl p-5 md:p-7 border border-slate-200 dark:border-white/15 shadow-2xl transition-all relative overflow-hidden">
          
          {/* Top Segmented Tool Switcher */}
          <Card.Header className="flex justify-center mb-6 p-0 border-none bg-transparent">
            <div className="inline-flex p-1.5 bg-slate-100/90 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
              <Button
                variant={activeTab === 'combine' ? 'primary' : 'tertiary'}
                onClick={() => !loading && setActiveTab('combine')}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-7 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'combine'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white dark:from-amber-400 dark:to-amber-500 dark:text-slate-950 shadow-md scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Combine Files</span>
              </Button>
              <Button
                variant={activeTab === 'compress' ? 'primary' : 'tertiary'}
                onClick={() => !loading && setActiveTab('compress')}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-7 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'compress'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white dark:from-amber-400 dark:to-amber-500 dark:text-slate-950 shadow-md scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>Compress File</span>
              </Button>
            </div>
          </Card.Header>

          {/* Error Notice */}
          {error && (
            <Alert.Root variant="secondary" className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-2xl flex items-start gap-3 animate-fade-in-up">
              <Alert.Indicator>
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              </Alert.Indicator>
              <Alert.Content>
                <Alert.Title className="text-xs font-extrabold">Notice</Alert.Title>
                <Alert.Description className="text-xs font-medium">{error}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}

          <Card.Content className="space-y-6 p-0">
            {/* Compression Profiles */}
            {activeTab === 'compress' && !success && !loading && (
              <div className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-indigo-600 dark:text-amber-300" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Compression Profile</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Ghostscript Vector & JPEG Optimization</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {[
                    {
                      id: 'high',
                      name: 'Extreme',
                      badge: 'Smallest File',
                      dpi: '72 DPI',
                      est: '-70% Size',
                      desc: 'Maximum reduction for email attachments & strict upload limits.'
                    },
                    {
                      id: 'medium',
                      name: 'Recommended',
                      badge: 'Best Balance',
                      tag: 'POPULAR',
                      dpi: '150 DPI',
                      est: '-50% Size',
                      desc: 'Optimal balance of crystal clear text quality & smaller size.'
                    },
                    {
                      id: 'low',
                      name: 'High Quality',
                      badge: 'High Detail',
                      dpi: '220 DPI',
                      est: '-25% Size',
                      desc: 'Preserves high image detail for print & digital presentations.'
                    }
                  ].map(mode => (
                    <Card.Root
                      key={mode.id}
                      onClick={() => setCompressionLevel(mode.id)}
                      className={`p-4 border text-left rounded-2xl flex flex-col justify-between transition-all cursor-pointer relative hover:scale-[1.01] ${
                        compressionLevel === mode.id
                          ? 'border-indigo-600 dark:border-amber-400 bg-indigo-500/10 dark:bg-amber-400/10 ring-2 ring-indigo-500/40 dark:ring-amber-400/40 shadow-md'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      {mode.tag && (
                        <Badge.Root className="absolute -top-2.5 right-3">
                          <Badge.Label className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs">
                            {mode.tag}
                          </Badge.Label>
                        </Badge.Root>
                      )}
                      <Card.Header className="p-0 mb-1 border-none bg-transparent">
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <Card.Title className="text-xs font-bold text-slate-900 dark:text-white">
                            {mode.name}
                          </Card.Title>
                          <Chip.Root className="text-[9px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                            <Chip.Label>{mode.dpi}</Chip.Label>
                          </Chip.Root>
                        </div>
                        <span className="inline-block text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {mode.est}
                        </span>
                      </Card.Header>
                      <Card.Description className="text-[11px] text-slate-600 dark:text-slate-300/80 leading-normal mb-3">
                        {mode.desc}
                      </Card.Description>
                      <Card.Footer className="pt-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between p-0 bg-transparent">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{mode.badge}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${compressionLevel === mode.id ? 'border-indigo-600 bg-indigo-600 dark:border-amber-400 dark:bg-amber-400' : 'border-slate-300 dark:border-white/20'}`}>
                          {compressionLevel === mode.id && <div className="w-1.5 h-1.5 bg-white dark:bg-slate-950 rounded-full" />}
                        </div>
                      </Card.Footer>
                    </Card.Root>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Dropzone */}
            {!success && !loading && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseFiles}
                className={`relative border-2 border-dashed rounded-3xl py-7 md:py-9 px-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-500/10 dark:border-amber-400 dark:bg-amber-400/10 scale-[1.01]'
                    : 'border-slate-300 dark:border-white/15 hover:border-indigo-500 dark:hover:border-amber-400 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-indigo-50/30 dark:hover:bg-white/[0.02]'
                } ${loading ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple={activeTab === 'combine'}
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,.tiff"
                  className="hidden"
                />

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 shadow-md text-indigo-600 dark:text-amber-300 transition-transform duration-200 group-hover:scale-110">
                  <Upload className="h-7 w-7" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white">
                    Drop your files here
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300/80">
                    Drag & drop {activeTab === 'combine' ? 'PDFs or Images (JPG, PNG, WEBP, BMP, TIFF)' : 'a PDF or Image file'} here, or <span className="text-indigo-600 dark:text-amber-300 underline font-extrabold">browse computer</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-1 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Private Processing</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-indigo-400" /> Max 200MB</span>
                </div>
              </div>
            )}

            {/* Selected File List */}
            {files.length > 0 && !success && !loading && (
              <div className="animate-fade-in-up space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {files.length} File{files.length !== 1 ? 's' : ''} Selected ({formatBytes(totalFilesSize)})
                    </span>
                  </div>
                  {activeTab === 'combine' && (
                    <Button
                      variant="tertiary"
                      onClick={handleBrowseFiles}
                      className="text-xs font-bold text-indigo-600 dark:text-amber-300 hover:underline flex items-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-amber-400/30 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-amber-500/10 hover:scale-[1.02] transition-transform"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add More Files
                    </Button>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-white/5 bg-slate-50/80 dark:bg-slate-950/60 shadow-xs">
                  {files.map((file, idx) => {
                    const key = `${file.name}-${file.size}-${file.lastModified}`;
                    const previewData = previews[key];
                    const badge = getExtensionBadge(file.name);
                    const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|tiff)$/i.test(file.name);

                    return (
                      <div
                        key={key}
                        draggable={activeTab === 'combine' && !loading}
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleItemDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        className="flex items-center gap-3.5 px-4 py-3 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-colors select-none group"
                      >
                        {activeTab === 'combine' && (
                          <div className="cursor-grab text-slate-400 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                            <GripVertical className="h-4 w-4" />
                          </div>
                        )}
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-amber-500/10 border border-indigo-100 dark:border-amber-400/20 flex items-center justify-center shrink-0 shadow-xs">
                          {isImg ? (
                            <ImageIcon className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <FileText className="h-4.5 w-4.5 text-indigo-600 dark:text-amber-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                              <span>{formatBytes(file.size)}</span>
                              {previewData && previewData.numPages && !isImg && (
                                <>
                                  <span>·</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{previewData.numPages} Page{previewData.numPages !== 1 ? 's' : ''}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${badge.style} shrink-0 shadow-2xs`}>
                            {badge.label}
                          </span>
                        </div>
                        {!loading && (
                          <Button
                            variant="tertiary"
                            onClick={() => removeFile(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
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
              <div className="animate-fade-in-up space-y-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                  Visual Page Grid Preview
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {files.map((file, idx) => {
                    const key = `${file.name}-${file.size}-${file.lastModified}`;
                    const previewState = previews[key];
                    const badge = getExtensionBadge(file.name);

                    return (
                      <Card.Root key={key} className="aspect-[3/4] rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-slate-950/70 overflow-hidden relative shadow-xs hover:border-indigo-400 dark:hover:border-amber-400 transition-all">
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                          <Chip.Root className="bg-slate-900/90 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                            <Chip.Label>#{idx + 1}</Chip.Label>
                          </Chip.Root>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border ${badge.style} shadow-2xs`}>
                            {badge.label}
                          </span>
                        </div>
                        <Card.Content className="w-full h-full flex items-center justify-center p-2">
                          {!previewState || previewState.status === 'loading' ? (
                            <div className="w-full h-full rounded-xl bg-slate-200/50 dark:bg-white/5 animate-pulse flex items-center justify-center">
                              <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
                            </div>
                          ) : previewState.status === 'error' ? (
                            <div className="flex flex-col items-center gap-1 text-slate-400">
                              <FileText className="h-5 w-5" />
                              <span className="text-[9px] font-bold">Ready</span>
                            </div>
                          ) : (
                            <img src={previewState.url} alt={file.name} className="object-contain max-h-full max-w-full rounded-lg shadow-xs" />
                          )}
                        </Card.Content>
                      </Card.Root>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main Action Bar */}
            {files.length > 0 && !success && !loading && (
              <Card.Footer className="flex flex-col sm:flex-row gap-3.5 pt-5 border-t border-slate-200 dark:border-white/10 animate-fade-in-up p-0 bg-transparent">
                <Button
                  variant="primary"
                  onClick={handleProcess}
                  disabled={isButtonDisabled}
                  className={`flex-1 rounded-2xl py-3.5 px-6 text-sm font-extrabold transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg hover:scale-[1.01] active:scale-[0.99] ${
                    isButtonDisabled
                      ? 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white dark:from-amber-400 dark:to-amber-500 dark:text-slate-950 shadow-indigo-500/25 dark:shadow-amber-500/20'
                  }`}
                >
                  <span>{activeTab === 'combine' ? 'Combine Files into PDF' : 'Compress File Now'}</span>
                  {!isButtonDisabled && <ArrowRight className="h-4.5 w-4.5" />}
                </Button>
                <Button
                  variant="tertiary"
                  onClick={startOver}
                  className="px-6 py-3.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                >
                  Clear Workspace
                </Button>
              </Card.Footer>
            )}

            {/* Processing State */}
            {loading && (
              <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in-up">
                <div className="w-full max-w-md space-y-5">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-white/10" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 dark:border-t-amber-400 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-indigo-600 dark:text-amber-400 animate-pulse" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {activeTab === 'combine' ? 'Combining & Converting Files...' : 'Executing Ghostscript Optimization...'}
                    </h4>
                    <p className="text-xs font-bold text-indigo-600 dark:text-amber-300 mt-1">
                      {progress < 30 ? 'Converting formats & vector streams...' : progress < 70 ? 'Downsampling image & content streams...' : 'Building optimized output PDF...'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-extrabold text-slate-800 dark:text-slate-200 px-1">
                      <span>Processing Pipeline</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-white/5 rounded-full h-3 overflow-hidden border border-slate-300 dark:border-white/10 relative">
                      <div
                        className="bg-gradient-to-r from-indigo-600 to-amber-400 h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Celebration View */}
            {success && (
              <div className="py-7 flex flex-col items-center text-center animate-pop-in">
                <div className="relative mb-6">
                  <div className="relative w-22 h-22 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 animate-check-pulse">
                    <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>

                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1.5 tracking-tight">
                  Processing Complete!
                </h2>
                <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300 max-w-sm mb-7">
                  Your PDF has been processed, vector-optimized, and saved cleanly.
                </p>

                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl mb-7">
                  <Card.Root className="bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 p-4.5 rounded-2xl text-left shadow-xs">
                    <div className="flex items-center gap-2 mb-2.5">
                      <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-amber-300" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Compression Summary</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block">Original</span>
                        <span className="text-sm font-bold text-slate-400 line-through">{formatBytes(success.originalSize)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-amber-300 block">Optimized</span>
                        <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{formatBytes(success.compressedSize || success.originalSize)}</span>
                      </div>
                    </div>
                  </Card.Root>

                  <Card.Root className="bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-white/10 p-4.5 rounded-2xl text-left shadow-xs">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Bolt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Storage Saved</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">-{success.savingsPercent || 0}%</span>
                      {success.savedBytes > 0 && (
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{formatBytes(success.savedBytes)} saved</span>
                      )}
                    </div>
                  </Card.Root>
                </div>

                {/* Actions */}
                <div className="w-full max-w-xl flex flex-col gap-3.5">
                  <Button
                    variant="primary"
                    onClick={async () => {
                      setShowToast(true);
                      await handleDownload(success.downloadUrl, success.filename);
                    }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white dark:from-amber-400 dark:to-amber-500 dark:text-slate-950 text-sm font-extrabold flex items-center justify-center gap-2.5 cursor-pointer shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download Optimized PDF</span>
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => copyDownloadLink(success.downloadUrl)}
                      className="flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
                    >
                      {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
                    </Button>
                    <Button
                      variant="tertiary"
                      onClick={startOver}
                      className="flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4 text-indigo-600 dark:text-amber-300" />
                      <span>Process Another</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card.Content>
        </Card.Root>

        {/* Floating Toast Notification */}
        {showToast && (
          <div className="fixed bottom-6 right-6 bg-slate-900/95 dark:bg-slate-950/95 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-extrabold animate-fade-in-up z-50 border border-slate-700 backdrop-blur-xl">
            <CheckCircle className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
            <span>Download Starting...</span>
          </div>
        )}
      </div>
    </div>
  );
}
