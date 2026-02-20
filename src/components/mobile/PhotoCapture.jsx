/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  X, 
  Upload, 
  CheckCircle2, 
  Loader2,
  Image,
  Trash2,
  ZoomIn,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

// Compress image on device before upload
const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Single photo capture component
export function PhotoCapture({ 
  label, 
  value, 
  onChange, 
  required = false, 
  description,
  showPreview = true
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const inputRef = useRef(null);

  const handleCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      // Compress image
      setProgress(30);
      const compressedFile = await compressImage(file);
      
      // Show compression savings
      const savings = Math.round((1 - compressedFile.size / file.size) * 100);
      console.log(`Compressed: ${savings}% smaller`);
      
      setProgress(60);
      
      // Upload to server
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressedFile });
      
      setProgress(100);
      onChange(file_url);
      
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Photo saved locally.');
      // Save locally for offline sync
      const reader = new FileReader();
      reader.onload = () => {
        onChange(reader.result); // Save as base64 for offline
      };
      reader.readAsDataURL(file);
    }
    
    setUploading(false);
    setProgress(0);
  };

  const handleRemove = () => {
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center gap-2">
          <label className="text-white text-sm font-medium">{label}</label>
          {required && <Badge className="bg-red-500/20 text-red-400 text-xs">Required</Badge>}
        </div>
      )}
      {description && <p className="text-slate-400 text-xs">{description}</p>}
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
        disabled={uploading}
      />

      {value ? (
        <div className="relative">
          <div 
            className="h-32 rounded-xl overflow-hidden border border-slate-700 cursor-pointer"
            onClick={() => setPreviewOpen(true)}
          >
            <img 
              src={value} 
              alt={label || 'Captured photo'} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <ZoomIn className="w-8 h-8 text-white" />
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={(e) => { e.stopPropagation(); handleRemove(); }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Badge className="absolute bottom-2 left-2 bg-emerald-500/80 text-white gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Captured
          </Badge>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`
            w-full h-32 rounded-xl border-2 border-dashed transition-all
            flex flex-col items-center justify-center gap-2
            ${required 
              ? 'border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10' 
              : 'border-slate-600 bg-slate-800/50 hover:bg-slate-700/50'
            }
          `}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-slate-400 text-sm">Compressing & uploading...</span>
              <div className="w-32">
                <Progress value={progress} className="h-1.5 bg-slate-700" />
              </div>
            </>
          ) : (
            <>
              <Camera className={`w-8 h-8 ${required ? 'text-amber-400' : 'text-slate-400'}`} />
              <span className={`text-sm ${required ? 'text-amber-400' : 'text-slate-400'}`}>
                Tap to capture
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="flex items-center gap-2 text-amber-400 text-xs">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      {/* Full Preview Modal */}
      <AnimatePresence>
        {previewOpen && value && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setPreviewOpen(false)}
          >
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 text-white"
              onClick={() => setPreviewOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
            <img 
              src={value} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Batch photo upload component
export function BatchPhotoUpload({ photos = [], onChange, maxPhotos = 10, label }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const inputRef = useRef(null);

  const handleBatchCapture = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    const filesToProcess = files.slice(0, remainingSlots);

    setUploading(true);
    setUploadProgress({ current: 0, total: filesToProcess.length });

    const newPhotos = [...photos];

    for (let i = 0; i < filesToProcess.length; i++) {
      try {
        const compressedFile = await compressImage(filesToProcess[i]);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: compressedFile });
        newPhotos.push({
          url: file_url,
          timestamp: Date.now(),
          fileName: filesToProcess[i].name
        });
        setUploadProgress({ current: i + 1, total: filesToProcess.length });
      } catch (err) {
        console.error('Upload failed for:', filesToProcess[i].name);
        // Save locally
        const reader = new FileReader();
        reader.onload = () => {
          newPhotos.push({
            url: reader.result,
            timestamp: Date.now(),
            fileName: filesToProcess[i].name,
            pendingUpload: true
          });
        };
        reader.readAsDataURL(filesToProcess[i]);
      }
    }

    onChange(newPhotos);
    setUploading(false);
    setUploadProgress({ current: 0, total: 0 });
    if (inputRef.current) inputRef.current.value = '';
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-white text-sm font-medium">{label}</label>
          <Badge className="bg-slate-700 text-slate-300">
            {photos.length} / {maxPhotos}
          </Badge>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative aspect-square">
            <img 
              src={photo.url} 
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover rounded-lg border border-slate-700"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={() => removePhoto(index)}
            >
              <X className="w-3 h-3" />
            </Button>
            {photo.pendingUpload && (
              <Badge className="absolute bottom-1 left-1 bg-amber-500/80 text-white text-xs">
                Pending
              </Badge>
            )}
          </div>
        ))}

        {/* Add More Button */}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center justify-center gap-1 transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                <span className="text-slate-400 text-xs">
                  {uploadProgress.current}/{uploadProgress.total}
                </span>
              </>
            ) : (
              <>
                <Camera className="w-6 h-6 text-slate-400" />
                <span className="text-slate-400 text-xs">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleBatchCapture}
        className="hidden"
        disabled={uploading}
      />

      {uploading && (
        <div className="space-y-2">
          <Progress 
            value={(uploadProgress.current / uploadProgress.total) * 100} 
            className="h-2 bg-slate-700" 
          />
          <p className="text-slate-400 text-xs text-center">
            Uploading {uploadProgress.current} of {uploadProgress.total} photos...
          </p>
        </div>
      )}
    </div>
  );
}