import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadGarment, getWardrobe } from '../services/api';
import { LockedNotice } from '../components/LockedNotice';
import { 
  Upload, CheckCircle, ArrowRight, Loader2, Sparkles, Image as ImageIcon, 
  FileText, X, AlertCircle, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function UploadTab({ setActiveTab }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (user) {
      getWardrobe().then(items => setRecentItems(items?.slice(0, 6) || []));
    }
  }, [user, result]);

  // Support clipboard paste (Ctrl+V) anywhere on the intake tab
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const pastedFile = item.getAsFile();
          if (pastedFile) {
            handleSelectedFile(pastedFile);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  if (!user) {
    return <LockedNotice tabName="clothing piece intake & neural vision tagging" />;
  }

  const handleSelectedFile = (selected) => {
    if (!selected) return;

    // Validate type
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
    const fileName = selected.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext)) || selected.type.startsWith('image/');
    
    if (!isValid) {
      setError('Please provide a valid clothing image (JPG, PNG, WEBP, HEIC)');
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  };

  // Drag & Drop handlers with precision counter to avoid child-element flickering
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleSelectedFile(droppedFiles[0]);
    }
  };

  const handleClearSelected = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setUploadStage('Uploading clothing photo to neural intake pipeline...');
    
    try {
      setTimeout(() => setUploadStage('Removing background & isolating garment...'), 1200);
      setTimeout(() => setUploadStage('Qwen AI Vision extracting 14 fashion attributes...'), 2600);

      const data = await uploadGarment(file);
      setResult(data);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch (err) {
      setError(err.message || 'Garment intake failed. Please verify the image file.');
    } finally {
      setUploading(false);
      setUploadStage('');
    }
  };

  return (
    <div className="space-y-6 py-2 max-w-6xl mx-auto">
      
      {/* Title */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] text-[#7C3AED] dark:text-[#A78BFA] block mb-1">
            MULTIMODAL INTAKE
          </span>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#09090B] dark:text-white tracking-tight">
            Add a Clothing Piece
          </h2>
          <p className="text-base sm:text-lg text-[#52525B] dark:text-[#A1A1AA] mt-1.5 max-w-2xl font-medium">
            Upload any clothing photo via drag &amp; drop, file browser, or paste. Our AI removes the background and extracts all fashion attributes automatically.
          </p>
        </div>


      </div>

      {/* Main Grid: Upload Dropzone (2 Cols) + "What We Detect" (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Drag & Drop Box */}
        <div 
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!preview && fileInputRef.current) fileInputRef.current.click();
          }}
          className={`lg:col-span-2 p-6 rounded-3xl transition-all relative flex flex-col items-center justify-center text-center min-h-[260px] cursor-pointer ${
            isDragging
              ? 'bg-[#F5F3FF] dark:bg-[#18181B] border-2 border-dashed border-[#7C3AED] ring-8 ring-[#7C3AED]/15 scale-[1.01]'
              : preview
              ? 'bg-white dark:bg-[#0F0F12] border-2 border-solid border-[#DDD6FE] dark:border-[#27272A]'
              : 'bg-white dark:bg-[#0F0F12] border-2 border-dashed border-[#DDD6FE] dark:border-[#27272A] hover:border-[#7C3AED] hover:bg-[#FAFAF8] dark:hover:bg-[#121214]'
          }`}
        >
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={(e) => {
              if (e.target.files?.[0]) handleSelectedFile(e.target.files[0]);
            }}
            className="hidden"
          />

          {/* Active Drag Over Indicator */}
          {isDragging && (
            <div className="absolute inset-0 bg-[#7C3AED]/10 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center pointer-events-none z-10 space-y-2 animate-in fade-in duration-150">
              <div className="w-16 h-16 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-lg animate-bounce">
                <Upload className="w-8 h-8" />
              </div>
              <p className="font-serif-luxury text-xl font-bold text-[#17151F] dark:text-white">
                Release to Drop Clothing Photo!
              </p>
              <p className="text-xs font-semibold text-[#7C3AED] dark:text-[#C4B5FD]">
                AI will immediately isolate and tag your garment
              </p>
            </div>
          )}

          {/* Selected Preview Mode */}
          {preview ? (
            <div className="space-y-4 w-full max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative rounded-2xl bg-[#FAFAF8] dark:bg-[#121214] p-4 border border-[#E9E7EF] dark:border-[#27272A] flex items-center justify-center">
                <img
                  src={preview}
                  alt="Selected garment preview"
                  className="max-h-64 rounded-xl object-contain drop-shadow-sm"
                />
                <button
                  onClick={handleClearSelected}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white dark:bg-[#18181B] text-[#6B6875] dark:text-[#A1A1AA] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-[#E9E7EF] dark:border-[#27272A] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs px-2 text-[#6B6875] dark:text-[#A1A1AA]">
                <span className="truncate max-w-[200px] font-medium text-[#17151F] dark:text-white">
                  {file?.name}
                </span>
                <span>{(file?.size ? (file.size / 1024 / 1024).toFixed(2) : '0')} MB</span>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-semibold rounded-full border border-[#E9E7EF] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#17151F] dark:text-white hover:bg-[#FAFAF8] dark:hover:bg-[#121214] shadow-2xs cursor-pointer"
                >
                  Change Image
                </button>
              </div>
            </div>
          ) : (
            /* Empty State Prompting Drag & Drop */
            <div className="space-y-4 pointer-events-none">
              <div className="w-18 h-18 mx-auto rounded-3xl bg-gradient-to-tr from-[#F5F3FF] to-[#EDE9FE] dark:from-[#18181B] dark:to-[#121214] text-[#7C3AED] dark:text-[#C4B5FD] flex items-center justify-center shadow-xs">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="font-serif-luxury text-lg font-bold text-[#17151F] dark:text-white">
                  Drag & drop your clothing photo here
                </p>
                <p className="text-xs text-[#7C3AED] dark:text-[#C4B5FD] font-semibold mt-1">
                  or click to browse files from your device
                </p>
                <p className="text-[11px] text-[#6B6875] dark:text-[#A1A1AA] mt-1">
                  Tip: You can also press <kbd className="px-1.5 py-0.5 rounded bg-[#F3F4F6] dark:bg-[#18181B] border dark:border-[#27272A] text-[10px] font-mono-code">Ctrl+V</kbd> to paste an image!
                </p>
                
                <div className="flex items-center justify-center gap-2 mt-4 text-[10px] font-bold text-[#9CA3AF]">
                  <span className="px-2.5 py-1 rounded-md bg-[#F8F7FC] dark:bg-[#18181B] border border-[#E9E7EF] dark:border-[#27272A]">JPG</span>
                  <span className="px-2.5 py-1 rounded-md bg-[#F8F7FC] dark:bg-[#18181B] border border-[#E9E7EF] dark:border-[#27272A]">PNG</span>
                  <span className="px-2.5 py-1 rounded-md bg-[#F8F7FC] dark:bg-[#18181B] border border-[#E9E7EF] dark:border-[#27272A]">WEBP</span>
                  <span className="px-2.5 py-1 rounded-md bg-[#F8F7FC] dark:bg-[#18181B] border border-[#E9E7EF] dark:border-[#27272A]">HEIC</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* What We Detect (1 Col) Matching Reference */}
        <div className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs space-y-6 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F5F3FF] to-[#EDE9FE] dark:from-[#261E38] dark:to-[#1C1629] flex items-center justify-center text-[#7C3AED] dark:text-[#C4B5FD] shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#17151F] dark:text-white tracking-tight">
                What we detect
              </h4>
              <p className="text-xs text-[#6B6875] dark:text-[#A1A1AA] font-medium">Instant AI vision analysis</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5 group">
              <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-[#7C3AED] shrink-0 ring-4 ring-[#F5F3FF] dark:ring-[#7C3AED]/20 transition-transform group-hover:scale-125" />
              <span className="text-sm sm:text-[15px] font-medium text-[#2D2A38] dark:text-[#E4E4E7] leading-snug">
                <span className="font-bold text-[#17151F] dark:text-white">Category</span> (top, bottom, dress, hijab, footwear, etc.)
              </span>
            </div>

            <div className="flex items-start gap-3.5 group">
              <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-[#7C3AED] shrink-0 ring-4 ring-[#F5F3FF] dark:ring-[#7C3AED]/20 transition-transform group-hover:scale-125" />
              <span className="text-sm sm:text-[15px] font-medium text-[#2D2A38] dark:text-[#E4E4E7] leading-snug">
                <span className="font-bold text-[#17151F] dark:text-white">Dominant color</span> & visual pattern
              </span>
            </div>

            <div className="flex items-start gap-3.5 group">
              <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-[#7C3AED] shrink-0 ring-4 ring-[#F5F3FF] dark:ring-[#7C3AED]/20 transition-transform group-hover:scale-125" />
              <span className="text-sm sm:text-[15px] font-medium text-[#2D2A38] dark:text-[#E4E4E7] leading-snug">
                <span className="font-bold text-[#17151F] dark:text-white">Fabric type</span> & weave (Cotton, Silk, Denim...)
              </span>
            </div>

            <div className="flex items-start gap-3.5 group">
              <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-[#7C3AED] shrink-0 ring-4 ring-[#F5F3FF] dark:ring-[#7C3AED]/20 transition-transform group-hover:scale-125" />
              <span className="text-sm sm:text-[15px] font-medium text-[#2D2A38] dark:text-[#E4E4E7] leading-snug">
                <span className="font-bold text-[#17151F] dark:text-white">Style vibe</span> & formality level
              </span>
            </div>

            <div className="flex items-start gap-3.5 group">
              <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-[#7C3AED] shrink-0 ring-4 ring-[#F5F3FF] dark:ring-[#7C3AED]/20 transition-transform group-hover:scale-125" />
              <span className="text-sm sm:text-[15px] font-medium text-[#2D2A38] dark:text-[#E4E4E7] leading-snug">
                <span className="font-bold text-[#17151F] dark:text-white">Season suitability</span> matrix
              </span>
            </div>

            <div className="flex items-start gap-3.5 group">
              <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-[#7C3AED] shrink-0 ring-4 ring-[#F5F3FF] dark:ring-[#7C3AED]/20 transition-transform group-hover:scale-125" />
              <span className="text-sm sm:text-[15px] font-medium text-[#2D2A38] dark:text-[#E4E4E7] leading-snug">
                <span className="font-bold text-[#17151F] dark:text-white">Complementary</span> color harmonies
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Upload CTA */}
      {file && !result && (
        <div className="text-center pt-2 space-y-3">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="inline-flex items-center gap-2.5 px-10 py-4 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-md shadow-purple-200 transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploadStage || 'Processing Garment...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Process & Add to Sanctuary Closet</span>
              </>
            )}
          </button>

          {uploading && (
            <p className="text-xs text-[#7C3AED] font-medium animate-pulse">
              {uploadStage}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs flex flex-col sm:flex-row items-center gap-6 animate-in fade-in duration-300">
          <div className="w-44 h-44 rounded-2xl bg-[#FAFAF8] dark:bg-[#121214] p-3 flex items-center justify-center border border-[#E9E7EF] dark:border-[#27272A] shadow-inner">
            <img
              src={result.image_url}
              alt="Processed piece"
              className="max-h-full max-w-full object-contain drop-shadow-sm"
            />
          </div>
          <div className="flex-1 space-y-2.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/40">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Garment Segmented & 14 Attributes Cataloged</span>
            </div>
            <h4 className="font-serif-luxury text-2xl font-bold text-[#09090B] dark:text-white capitalize">
              {result.color || ''} {result.subcategory || result.category || 'Garment Piece'}
            </h4>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {result.category && <span className="px-2.5 py-0.5 rounded-md bg-[#F5F3FF] dark:bg-[#18181B] text-[#7C3AED] dark:text-[#C4B5FD] text-xs font-semibold border border-transparent dark:border-[#27272A]">{result.category}</span>}
              {result.subcategory && <span className="px-2.5 py-0.5 rounded-md bg-[#FDF2F8] dark:bg-[#18181B] text-[#EC4899] dark:text-pink-300 text-xs font-semibold border border-transparent dark:border-[#27272A]">{result.subcategory}</span>}
              {result.fabric && <span className="px-2.5 py-0.5 rounded-md bg-[#F3F4F6] dark:bg-[#18181B] text-[#4B5563] dark:text-[#A1A1AA] text-xs font-medium border border-transparent dark:border-[#27272A]">{result.fabric}</span>}
              {result.color && <span className="px-2.5 py-0.5 rounded-md bg-[#EFF6FF] dark:bg-[#18181B] text-[#3B82F6] dark:text-blue-300 text-xs font-semibold border border-transparent dark:border-[#27272A]">{result.color}</span>}
              {result.formality && <span className="px-2.5 py-0.5 rounded-md bg-[#FAFAF8] dark:bg-[#18181B] border border-[#E9E7EF] dark:border-[#27272A] text-[#17151F] dark:text-[#E4E4E7] text-xs font-medium">{result.formality}</span>}
            </div>
            <div className="pt-2 flex items-center gap-3 justify-center sm:justify-start">
              <button
                onClick={handleClearSelected}
                className="px-4 py-2 text-xs font-semibold rounded-full border border-[#E9E7EF] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#6B6875] dark:text-[#A1A1AA] hover:bg-[#FAFAF8] dark:hover:bg-[#121214] cursor-pointer"
              >
                Upload Another Piece
              </button>
              <button
                onClick={() => setActiveTab('wardrobe')}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs cursor-pointer"
              >
                <span>View in Sanctuary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Uploads Gallery */}
      {recentItems.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif-luxury text-lg font-bold text-[#09090B] dark:text-white">
              Recent Uploads
            </h4>
            <button
              onClick={() => setActiveTab('wardrobe')}
              className="text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA] hover:underline cursor-pointer"
            >
              View All in Closet →
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {recentItems.map((it) => (
              <div
                key={it.id}
                onClick={() => setActiveTab('wardrobe')}
                className="aspect-square rounded-2xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] p-2 flex items-center justify-center relative cursor-pointer hover:border-[#7C3AED] hover:shadow-xs transition-all group"
                title={`${it.color || ''} ${it.subcategory || it.category}`}
              >
                <img
                  src={it.image_url}
                  alt={it.category}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
