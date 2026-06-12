import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { compressImage } from '../lib/image';

interface ImageUploaderProps {
  /**
   * Controlled or initial value (Base64 data URL or external URL).
   */
  value?: string;
  /**
   * Callback triggered when a new image is parsed as a Base64 data URL.
   */
  onChange?: (base64: string) => void;
  /**
   * Optional callback triggered when the image is removed.
   */
  onClear?: () => void;
  /**
   * Optional custom id for the hidden native input. Defaults to "image-upload".
   */
  id?: string;
  /**
   * Optional extra CSS classes for parent spacing or customization.
   */
  className?: string;
}

export function ImageUploader({
  value = '',
  onChange,
  onClear,
  id = 'image-upload',
  className = '',
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string>(value);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep internal preview state synchronized with incoming values
  useEffect(() => {
    setPreview(value);
  }, [value]);

  const handleFile = (file: File) => {
    if (file) {
      compressImage(file, 500, 0.7)
        .then((base64Url) => {
          setPreview(base64Url);
          if (onChange) {
            onChange(base64Url);
          }
        })
        .catch((err) => {
          console.error("Compression failed, falling back to raw reader:", err);
          const reader = new FileReader();
          reader.onload = (event) => {
            const fallbackBase64 = event.target?.result as string;
            setPreview(fallbackBase64);
            if (onChange) {
              onChange(fallbackBase64);
            }
          };
          reader.readAsDataURL(file);
        });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleInputChange}
      />

      <motion.div
        layout
        onClick={triggerFileInput}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative aspect-video w-full rounded-[2rem] cursor-pointer overflow-hidden transition-all duration-300 flex flex-col items-center justify-center select-none
          ${
            preview
              ? 'border border-[#E5E5E5]'
              : 'bg-[#F8F7F4] border-2 border-dashed border-[#E5E5E5]'
          }
          ${isDragOver ? 'ring-2 ring-amber-600 border-transparent scale-[0.99] shadow-inner' : 'hover:border-amber-600'}
        `}
      >
        <AnimatePresence mode="wait">
          {!preview ? (
            /* Empty / Initial State */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center gap-4 text-center px-6"
            >
              {/* White circular icon badge holding Plus */}
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-[#1A1A1A] transition-transform duration-300 hover:scale-110">
                <Plus size={20} className="stroke-[2.5]" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]">
                DRAG PHOTO HERE OR CLICK
              </p>
            </motion.div>
          ) : (
            /* Active Preview State */
            <motion.div
              key="preview-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full group"
            >
              <img
                src={preview}
                alt="Upload Preview"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />

              {/* Subtly Animated Dark Overlay on Hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-300">
                <span className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 text-white text-xs font-black uppercase tracking-[0.25em] transition-all duration-300">
                  CHANGE PHOTO
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
