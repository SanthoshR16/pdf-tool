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
  Plus
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Home({ setIsProcessing }) {
  const [activeTab, setActiveTab] = useState('combine'); // 'combine' | 'compress'
  const [files, setFiles] = useState([]);
  const [compressionLevel, setCompressionLevel] = useState('medium'); // 'low' | 'medium' | 'high'
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // { downloadUrl: '', filename: '' }
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [previews, setPreviews] = useState({}); // key -> dataUrl or 'loading' or 'error'
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  const fileInputRef = useRef(null);

  // Reset file selection when active tab changes
  useEffect(() => {
    setFiles([]);
    setError(null);
    setSuccess(null);
    setHasDownloaded(false);
  }, [activeTab]);

  // Set processing state for footer visibility
  useEffect(() => {
    if (setIsProcessing) {
      setIsProcessing(files.length > 0 || loading || success !== null);
    }
  }, [files, loading, success, setIsProcessing]);

  // Toast auto-hide
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Generate PDF thumbnails using pdf.js client-side
  useEffect(() => {
    files.forEach(file => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (previews[key]) return;

      // Mark as loading
      setPreviews(prev => ({ ...prev, [key]: 'loading' }));

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const typedarray = new Uint8Array(reader.result);
          const pdfjsLib = window['pdfjs-dist/build/pdf'];
          if (!pdfjsLib) {
            throw new Error("pdf.js library not loaded yet");
          }
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          const page = await pdf.getPage(1);
          
          // Render page to an offscreen canvas
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;

          const dataUrl = canvas.toDataURL();
          setPreviews(prev => ({ ...prev, [key]: dataUrl }));
        } catch (err) {
          console.error("PDF thumbnail generation failed:", err);
          setPreviews(prev => ({ ...prev, [key]: 'error' }));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }, [files, previews]);

  // Format bytes to human readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const validateAndAddFiles = (selectedFiles) => {
    setError(null);
    const pdfs = [];
    const errors = [];
    const MAX_SIZE = 200 * 1024 * 1024; // 200MB

    for (let f of selectedFiles) {
      if (!f.name.toLowerCase().endsWith('.pdf') && f.type !== 'application/pdf') {
        errors.push(`"${f.name}" is not a PDF file.`);
        continue;
      }
      if (f.size > MAX_SIZE) {
        errors.push(`"${f.name}" exceeds the 200MB file size limit.`);
        continue;
      }
      pdfs.push(f);
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    if (pdfs.length > 0) {
      // If we are showing a completed job state, clear it and start fresh with the new uploads!
      if (success) {
        setSuccess(null);
        setHasDownloaded(false);
        if (activeTab === 'compress') {
          setFiles([pdfs[0]]);
        } else {
          setFiles(pdfs.slice(0, 30));
        }
      } else {
        if (activeTab === 'compress') {
          // Compress only accepts 1 file at a time
          setFiles([pdfs[0]]);
        } else {
          // Combine accepts multiple files (limit to 30 files for UI safety)
          setFiles(prev => {
            const next = [...prev, ...pdfs];
            if (next.length > 30) {
              setError('Maximum of 30 files allowed in a single merge.');
              return next.slice(0, 30);
            }
            return next;
          });
        }
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      validateAndAddFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleBrowseFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Reorder logic for drag and drop sorting
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

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

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Submit flow
  const handleProcess = async () => {
    if (files.length === 0) return;
    if (activeTab === 'combine' && files.length < 2) {
      setError('Please add at least 2 PDF files to combine.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress(10);

    const formData = new FormData();
    const endpoint = activeTab === 'combine' ? '/api/combine' : '/api/compress';

    if (activeTab === 'combine') {
      files.forEach(file => {
        formData.append('files', file);
      });
    } else {
      formData.append('file', files[0]);
      formData.append('level', compressionLevel);
    }

    try {
      // Step 1: Submit job
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned status ${response.status}`);
      }

      const resData = await response.json();
      const jobId = resData.job_id;
      if (!jobId) {
        throw new Error('No job ID received from server.');
      }

      setProgress(20);

      // Step 2: Poll status endpoint
      let isDone = false;
      let statusData = null;

      while (!isDone) {
        // Wait 1.5 seconds
        await new Promise(resolve => setTimeout(resolve, 1500));

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
          throw new Error(statusData.error_message || 'An error occurred during PDF processing.');
        } else {
          // Update progress dynamically from the backend!
          setProgress(statusData.progress || 20);
        }
      }

      // Handle success state without auto-downloading
      setSuccess({
        downloadUrl: `${API_BASE}${statusData.download_url}`,
        filename: activeTab === 'combine' ? 'combined.pdf' : 'compressed.pdf'
      });

    } catch (err) {
      setError(err.message || 'An unexpected error occurred during processing.');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const startOver = () => {
    setFiles([]);
    setSuccess(null);
    setError(null);
    setProgress(0);
    setHasDownloaded(false);
  };

  const isButtonDisabled = activeTab === 'combine' ? files.length < 2 : files.length < 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 animate-fade-in-up">
      {/* Header Description */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl font-display">
          Quick & Free PDF Processing
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Merge multiple PDFs or reduce PDF file sizes instantly. No signups, no watermarks, completely secure.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-slate-200/80 dark:bg-slate-800/80 p-1.5 rounded-2xl w-full max-w-md border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md">
          <button
            onClick={() => !loading && setActiveTab('combine')}
            disabled={loading}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
              activeTab === 'combine'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-md transform scale-[1.01]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            Combine PDFs
          </button>
          <button
            onClick={() => !loading && setActiveTab('compress')}
            disabled={loading}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
              activeTab === 'compress'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-md transform scale-[1.01]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
            }`}
          >
            Compress PDF
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/60 text-red-800 dark:text-red-400 rounded-2xl flex items-start gap-3 animate-fade-in-up shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold">{error}</div>
        </div>
      )}

      {/* Two Column Layout container */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Column (30%) */}
        <div className="w-full md:w-[32%] md:sticky md:top-20 self-start space-y-4">
          <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md rounded-2xl p-4 shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/80 pb-2 font-display">
              {activeTab === 'combine' ? 'Combine PDFs' : 'Compress PDF'}
            </h2>
            
            {/* Drag & Drop Area */}
            {(activeTab === 'combine' || files.length === 0) && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseFiles}
                className={`border-2 border-dashed rounded-2xl py-8 px-4 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center group ${
                  isDragging
                    ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20 scale-[1.02] shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/5'
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
                
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-md text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition duration-300 mb-3 animate-breathe">
                  <Upload className="h-6 w-6" />
                </div>
                
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Drag & Drop {activeTab === 'combine' ? 'PDF files' : 'your PDF file'} here
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                  or <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">browse files</span>
                </p>
              </div>
            )}

            {/* Selected File List */}
            {files.length > 0 && (
              <div className="space-y-2 animate-fade-in-up">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Selected ({files.length}{activeTab === 'combine' ? '/30' : ''})</span>
                  {activeTab === 'combine' && !loading && (
                    <button
                      onClick={handleBrowseFiles}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-0.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto bg-white/50 dark:bg-slate-900/50">
                  {files.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      draggable={activeTab === 'combine' && !loading}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleItemDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-between p-2.5 bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition select-none animate-fade-in-left`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {activeTab === 'combine' && (
                          <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1">
                            <GripVertical className="h-4 w-4" />
                          </div>
                        )}
                        <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0 animate-pop-in">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                      </div>
                      
                      {!loading && (
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                          title="Remove file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (70%) */}
        <div className="w-full md:w-[68%] bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md rounded-3xl p-6 shadow-lg flex flex-col justify-between min-h-[450px] transition-all duration-200">
          
          {/* Main workspace displays */}
          <div className="flex-grow flex flex-col">
            {files.length === 0 && !loading && !success && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200/80 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 animate-fade-in-up">
                <div className="animate-breathe mb-4 p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 rounded-full">
                  <Upload className="h-10 w-10" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 font-display">Live Preview Area</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                  Upload PDF files to view their first page thumbnail previews before processing.
                </p>
              </div>
            )}

            {/* Thumbnail preview grid */}
            {files.length > 0 && !success && !loading && (
              <div className="space-y-3 flex-1 animate-fade-in-up">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  First Page Preview Grid
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[320px] overflow-y-auto pr-1">
                  {files.map((file, idx) => {
                    const key = `${file.name}-${file.size}-${file.lastModified}`;
                    const previewState = previews[key];

                    return (
                      <div key={key} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950/30 flex flex-col justify-between aspect-[3/4] p-1.5 shadow-sm relative group hover:shadow-md hover:scale-[1.02] transition-all duration-300 animate-fade-in-left">
                        <span className="absolute top-2 left-2 bg-slate-900/60 dark:bg-slate-800/80 backdrop-blur-sm text-white dark:text-slate-200 font-bold text-[9px] px-1.5 py-0.5 rounded-full z-10">
                          {idx + 1}
                        </span>

                        <div className="flex-1 flex items-center justify-center overflow-hidden rounded bg-white dark:bg-slate-900 relative">
                          {previewState === 'loading' || !previewState ? (
                            /* Skeleton Loader */
                            <div className="w-full h-full flex flex-col items-center justify-center space-y-2 animate-pulse bg-slate-100 dark:bg-slate-800">
                              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                              <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            </div>
                          ) : previewState === 'error' ? (
                            /* Fallback Icon */
                            <div className="text-slate-400 dark:text-slate-600 flex flex-col items-center justify-center">
                              <FileText className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                              <span className="text-[9px] font-semibold text-slate-400 mt-1 text-center">No Preview</span>
                            </div>
                          ) : (
                            <img src={previewState} alt={file.name} className="object-contain max-h-full max-w-full transition-transform duration-300 group-hover:scale-105" />
                          )}
                        </div>

                        <div className="mt-1.5 bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-100 dark:border-slate-800/80 shrink-0">
                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate" title={file.name}>
                            {file.name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Loading & Processing State */}
            {loading && (
              <div className="flex-grow flex flex-col items-center justify-center py-10 text-center animate-fade-in-up">
                <div className="w-full max-w-md space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                      <span>Processing files...</span>
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div 
                      className="animate-shimmer h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Success State */}
            {success && (
              <div className="flex-grow flex flex-col items-center justify-center py-6 text-center animate-fade-in-up">
                <div className="w-full max-w-md space-y-4">
                  <div className="space-y-4 p-5 border border-emerald-100 dark:border-emerald-950 bg-emerald-50/30 dark:bg-emerald-950/20 backdrop-blur-sm rounded-2xl shadow-sm">
                    <div className="inline-flex p-3 bg-emerald-100/50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full animate-breathe">
                      <CheckCircle className="h-10 w-10" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 font-display">Processing Complete!</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Your {activeTab === 'combine' ? 'merged' : 'compressed'} PDF is ready. Click below to download it.
                    </p>
                    
                    <div className="space-y-2">
                      <a
                        href={success.downloadUrl}
                        download
                        onClick={() => {
                          setHasDownloaded(true);
                          setShowToast(true);
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-xl py-3 px-6 text-sm font-bold shadow-md hover:from-purple-700 hover:to-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 animate-pop-in animate-pulse-subtle cursor-pointer"
                      >
                        <Download className="h-4 w-4 animate-bounce" />
                        <span>Download File</span>
                      </a>
                      
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal text-left px-2.5 mt-1 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                        To choose where to save, enable 'Ask where to save each file' in your browser's download settings.
                      </p>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        onClick={startOver}
                        className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 rounded-xl py-2.5 px-4 text-xs font-bold hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                      >
                        Go to Home (Reset Workspace)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Zone (Settings, Size warning, & Combine/Compress button) */}
          {!success && !loading && (
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4 space-y-4 animate-fade-in-up">
              
              {/* Inline warning for large compression files */}
              {activeTab === 'compress' && files.length > 0 && files[0].size > 50 * 1024 * 1024 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/60 text-amber-800 dark:text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in-up">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
                  <span>Large files may take 1-3 minutes on free hosting.</span>
                </div>
              )}

              {/* Compression Levels */}
              {activeTab === 'compress' && files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-xs">
                    <Settings className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span>Compression Level</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'low', label: 'Low', desc: 'Best Quality' },
                      { id: 'medium', label: 'Medium', desc: 'Balanced' },
                      { id: 'high', label: 'High', desc: 'Minimum Size' }
                    ].map((level) => (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setCompressionLevel(level.id)}
                        className={`py-2 px-3 border rounded-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                          compressionLevel === level.id
                            ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <span className="text-xs font-bold">{level.label}</span>
                        <span className="text-[9px] font-medium opacity-80 mt-0.5">{level.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {files.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={handleProcess}
                    disabled={isButtonDisabled}
                    className={`flex-1 text-white rounded-xl py-3 px-6 text-sm font-bold shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${
                      isButtonDisabled
                        ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                    }`}
                  >
                    <span>
                      {activeTab === 'combine' ? 'Combine PDFs' : 'Compress PDF'}
                    </span>
                  </button>
                  <button
                    onClick={startOver}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-5 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-white/10 dark:border-slate-200/20 text-xs font-bold animate-fade-in-up z-50">
          <span>✅ Last file downloaded</span>
        </div>
      )}
    </div>
  );
}
