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

export default function Home() {
  const [activeTab, setActiveTab] = useState('combine'); // 'combine' | 'compress'
  const [files, setFiles] = useState([]);
  const [compressionLevel, setCompressionLevel] = useState('medium'); // 'low' | 'medium' | 'high'
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // { downloadUrl: '', filename: '' }
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  const fileInputRef = useRef(null);

  // Reset file selection when active tab changes
  useEffect(() => {
    setFiles([]);
    setError(null);
    setSuccess(null);
  }, [activeTab]);

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

    // Simulate progress while uploading and processing
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 5;
      });
    }, 400);

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
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned status ${response.status}`);
      }

      const data = await response.json();
      setProgress(100);
      clearInterval(progressInterval);

      // Handle download success
      setSuccess({
        downloadUrl: `${API_BASE}${data.download_url}`,
        filename: data.filename
      });

      // Automatically trigger the download
      setTimeout(() => {
        triggerDownload(`${API_BASE}${data.download_url}`);
      }, 500);

    } catch (err) {
      clearInterval(progressInterval);
      setError(err.message || 'An unexpected error occurred during processing.');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (url) => {
    const link = document.createElement('a');
    link.href = url;
    // Set target to empty or iframe to download without window swap
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startOver = () => {
    setFiles([]);
    setSuccess(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header Description */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Quick & Free PDF Processing
        </h1>
        <p className="mt-3 text-lg text-slate-500 max-w-xl mx-auto">
          Merge multiple PDFs or reduce PDF file sizes instantly. No signups, no watermarks, completely secure.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl w-full max-w-md border border-slate-200">
          <button
            onClick={() => !loading && setActiveTab('combine')}
            disabled={loading}
            className={`flex-1 text-center py-3 text-sm font-bold rounded-xl transition duration-200 ${
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
            className={`flex-1 text-center py-3 text-sm font-bold rounded-xl transition duration-200 ${
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
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        {success ? (
          /* SUCCESS STATE */
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-6">
              <CheckCircle className="h-16 w-16" />
            </div>
            
            <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Processing Complete!</h2>
            <p className="text-slate-500 max-w-sm mb-8">
              Your {activeTab === 'combine' ? 'merged' : 'compressed'} PDF is ready. Your download should start automatically.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
              <button
                onClick={() => triggerDownload(success.downloadUrl)}
                className="flex-1 bg-indigo-600 text-white rounded-xl py-3 px-6 text-sm font-bold shadow-md hover:bg-indigo-700 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
              
              <button
                onClick={startOver}
                className="flex-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl py-3 px-6 text-sm font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Start Over</span>
              </button>
            </div>
          </div>
        ) : (
          /* UPLOAD & PROCESS STATE */
          <div className="space-y-6">
            
            {/* Drag & Drop Area */}
            {(activeTab === 'combine' || files.length === 0) && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseFiles}
                className={`border-2 border-dashed rounded-2xl py-12 px-6 text-center cursor-pointer transition duration-200 flex flex-col items-center justify-center group ${
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
                
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-indigo-500 group-hover:scale-105 transition duration-200 mb-4">
                  <Upload className="h-8 w-8" />
                </div>
                
                <p className="text-base font-bold text-slate-800">
                  Drag & Drop {activeTab === 'combine' ? 'PDF files' : 'your PDF file'} here
                </p>
                <p className="text-xs text-slate-400 mt-1.5">
                  or <span className="text-indigo-600 font-semibold group-hover:underline">browse files</span> from your device
                </p>
                <p className="text-xs text-slate-400 mt-3 font-medium">
                  PDF format only. Maximum 200MB per file.
                </p>
              </div>
            )}

            {/* Selected File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">
                    Selected Files ({files.length}{activeTab === 'combine' ? '/30' : ''})
                  </h3>
                  {activeTab === 'combine' && !loading && (
                    <button
                      onClick={handleBrowseFiles}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add More
                    </button>
                  )}
                </div>

                {/* Info Text for sorting */}
                {activeTab === 'combine' && files.length > 1 && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <GripVertical className="h-3.5 w-3.5 shrink-0" />
                    Drag files by the grip indicator to reorder them before merging.
                  </p>
                )}

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {files.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      draggable={activeTab === 'combine' && !loading}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleItemDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-between p-4 bg-white transition select-none ${
                        draggedIndex === idx ? 'bg-slate-50 opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {activeTab === 'combine' && (
                          <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 py-1">
                            <GripVertical className="h-4 w-4" />
                          </div>
                        )}
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                      </div>
                      
                      {!loading && (
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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

            {/* Compression Settings (Compress Only) */}
            {activeTab === 'compress' && files.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <Settings className="h-4 w-4 text-indigo-500" />
                  <span>Compression Settings</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'low', label: 'Low', desc: 'Best Quality' },
                    { id: 'medium', label: 'Medium', desc: 'Balanced' },
                    { id: 'high', label: 'High', desc: 'Minimum Size' }
                  ].map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      disabled={loading}
                      onClick={() => setCompressionLevel(level.id)}
                      className={`p-3.5 border rounded-xl flex flex-col items-center justify-center transition duration-200 ${
                        compressionLevel === level.id
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 font-bold shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm font-bold">{level.label}</span>
                      <span className="text-[10px] font-medium opacity-80 mt-0.5">{level.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Bar / Spinner */}
            {loading && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                    <span>Processing files...</span>
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {files.length > 0 && !loading && (
              <div className="flex gap-4">
                <button
                  onClick={handleProcess}
                  className="flex-1 bg-indigo-600 text-white rounded-xl py-3 px-6 text-sm font-bold shadow-md hover:bg-indigo-700 active:scale-[0.98] transition flex items-center justify-center gap-2"
                >
                  <span>
                    {activeTab === 'combine' ? 'Combine PDFs' : 'Compress PDF'}
                  </span>
                </button>
                <button
                  onClick={startOver}
                  className="bg-slate-100 text-slate-700 border border-slate-200 rounded-xl py-3 px-6 text-sm font-bold hover:bg-slate-200 transition"
                >
                  Clear
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
