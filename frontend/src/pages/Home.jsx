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
  RefreshCw,
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

  const triggerDownload = (url) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualDownload = () => {
    if (success && success.downloadUrl) {
      triggerDownload(success.downloadUrl);
      setHasDownloaded(true);
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
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header Description */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Quick & Free PDF Processing
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Merge multiple PDFs or reduce PDF file sizes instantly. No signups, no watermarks, completely secure.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl w-full max-w-md border border-slate-200">
          <button
            onClick={() => !loading && setActiveTab('combine')}
            disabled={loading}
            className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition duration-200 ${
              activeTab === 'combine'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Combine PDFs
          </button>
          <button
            onClick={() => !loading && setActiveTab('compress')}
            disabled={loading}
            className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition duration-200 ${
              activeTab === 'compress'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Compress PDF
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold">{error}</div>
        </div>
      )}

      {/* Two Column Layout container */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Column (30%) */}
        <div className="w-full md:w-[32%] md:sticky md:top-24 self-start space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              {activeTab === 'combine' ? 'Combine PDFs' : 'Compress PDF'}
            </h2>
            
            {/* Drag & Drop Area */}
            {(activeTab === 'combine' || files.length === 0) && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseFiles}
                className={`border-2 border-dashed rounded-2xl py-8 px-4 text-center cursor-pointer transition duration-200 flex flex-col items-center justify-center group ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/10'
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
                
                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-indigo-500 group-hover:scale-105 transition duration-200 mb-3">
                  <Upload className="h-6 w-6" />
                </div>
                
                <p className="text-xs font-bold text-slate-800">
                  Drag & Drop {activeTab === 'combine' ? 'PDF files' : 'your PDF file'} here
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  or <span className="text-indigo-600 font-semibold group-hover:underline">browse files</span>
                </p>
              </div>
            )}

            {/* Selected File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Selected ({files.length}{activeTab === 'combine' ? '/30' : ''})</span>
                  {activeTab === 'combine' && !loading && (
                    <button
                      onClick={handleBrowseFiles}
                      className="text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {files.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      draggable={activeTab === 'combine' && !loading}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleItemDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-between p-2.5 bg-white transition select-none ${
                        draggedIndex === idx ? 'bg-slate-50 opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {activeTab === 'combine' && (
                          <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 py-1">
                            <GripVertical className="h-4 w-4" />
                          </div>
                        )}
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                      </div>
                      
                      {!loading && (
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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
        <div className="w-full md:w-[68%] bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between min-h-[450px]">
          
          {/* Main workspace displays */}
          <div className="flex-1 flex flex-col">
            {files.length === 0 && !loading && !success && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <FileText className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-500">Live Preview Area</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Upload PDF files to view their first page thumbnail previews before processing.
                </p>
              </div>
            )}

            {/* Thumbnail preview grid */}
            {files.length > 0 && !success && !loading && (
              <div className="space-y-3 flex-1">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2">
                  First Page Preview Grid
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {files.map((file, idx) => {
                    const key = `${file.name}-${file.size}-${file.lastModified}`;
                    const previewState = previews[key];

                    return (
                      <div key={key} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col justify-between aspect-[3/4] p-1.5 shadow-sm relative group">
                        <span className="absolute top-2 left-2 bg-slate-900/60 backdrop-blur-sm text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full z-10">
                          {idx + 1}
                        </span>

                        <div className="flex-1 flex items-center justify-center overflow-hidden rounded bg-white relative">
                          {previewState === 'loading' || !previewState ? (
                            /* Skeleton Loader */
                            <div className="w-full h-full flex flex-col items-center justify-center space-y-2 animate-pulse bg-slate-100">
                              <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                              <div className="h-2 w-16 bg-slate-200 rounded"></div>
                            </div>
                          ) : previewState === 'error' ? (
                            /* Fallback Icon */
                            <div className="text-slate-400 flex flex-col items-center justify-center">
                              <FileText className="h-8 w-8 text-slate-300" />
                              <span className="text-[9px] font-semibold text-slate-400 mt-1 text-center">No Preview</span>
                            </div>
                          ) : (
                            <img src={previewState} alt={file.name} className="object-contain max-h-full max-w-full" />
                          )}
                        </div>

                        <div className="mt-1.5 bg-white p-1 rounded border border-slate-100 shrink-0">
                          <p className="text-[10px] font-bold text-slate-700 truncate" title={file.name}>
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
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                <div className="w-full max-w-md space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                      <span>Processing files...</span>
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Success State */}
            {success && (
              <div className="flex-grow flex flex-col items-center justify-center py-6 text-center">
                <div className="w-full max-w-md space-y-4">
                  {!hasDownloaded ? (
                    /* Manual Download Button state */
                    <div className="space-y-4 p-5 border border-emerald-100 bg-emerald-50/50 rounded-2xl">
                      <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-full">
                        <CheckCircle className="h-12 w-12" />
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-800">Processing Complete!</h3>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Your {activeTab === 'combine' ? 'merged' : 'compressed'} PDF is ready. Click below to download it.
                      </p>
                      <button
                        onClick={handleManualDownload}
                        className="w-full bg-indigo-600 text-white rounded-xl py-3 px-6 text-sm font-bold shadow-md hover:bg-indigo-700 active:scale-[0.98] transition flex items-center justify-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download File</span>
                      </button>
                    </div>
                  ) : (
                    /* Post-Download Confirmation state */
                    <div className="space-y-5 p-6 border border-slate-200 bg-slate-50/50 rounded-2xl">
                      <div className="inline-flex p-2.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-xs">
                        ✅ Done — file downloaded
                      </div>
                      <p className="text-xs text-slate-500">
                        What would you like to do next?
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={startOver}
                          className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 px-4 text-xs font-bold shadow-sm hover:bg-indigo-700 transition"
                        >
                          Process Another File
                        </button>
                        <button
                          onClick={() => window.location.href = '/'}
                          className="flex-1 bg-white text-slate-700 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold hover:bg-slate-50 transition"
                        >
                          Go to Home
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Zone (Settings, Size warning, & Combine/Compress button) */}
          {!success && !loading && (
            <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
              
              {/* Inline warning for large compression files */}
              {activeTab === 'compress' && files.length > 0 && files[0].size > 50 * 1024 * 1024 && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Large files may take 1-3 minutes on free hosting.</span>
                </div>
              )}

              {/* Compression Levels */}
              {activeTab === 'compress' && files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                    <Settings className="h-3.5 w-3.5 text-indigo-500" />
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
                        className={`py-2 px-3 border rounded-lg flex flex-col items-center justify-center transition duration-200 ${
                          compressionLevel === level.id
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 font-bold shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
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
                    className={`flex-1 text-white rounded-xl py-3 px-6 text-sm font-bold shadow-md transition flex items-center justify-center gap-2 ${
                      isButtonDisabled
                        ? 'bg-slate-300 cursor-not-allowed shadow-none'
                        : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                    }`}
                  >
                    <span>
                      {activeTab === 'combine' ? 'Combine PDFs' : 'Compress PDF'}
                    </span>
                  </button>
                  <button
                    onClick={startOver}
                    className="bg-slate-100 text-slate-700 border border-slate-200 rounded-xl py-3 px-5 text-sm font-bold hover:bg-slate-200 transition"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
