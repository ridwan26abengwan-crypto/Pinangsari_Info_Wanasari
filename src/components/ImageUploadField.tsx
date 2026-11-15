import React, { useState } from 'react';
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { SafeImage } from './SafeImage';

export interface GalleryOption {
  label: string;
  url: string;
}

interface ImageUploadFieldProps {
  inputId: string;
  label?: string;
  value: string;
  altText?: string;
  uploading: boolean;
  onFileSelect: (file: File) => Promise<void> | void;
  onChangeUrl: (url: string) => void;
  galleryOptions?: GalleryOption[];
  onPickGallery?: (option: GalleryOption) => void;
}

export function ImageUploadField({
  inputId,
  label = 'Upload Foto Berita (JPG, JPEG, PNG, WEBP, Maks 5MB)',
  value,
  altText = 'Pratinjau foto berita',
  uploading,
  onFileSelect,
  onChangeUrl,
  galleryOptions = [],
  onPickGallery,
}: ImageUploadFieldProps) {
  const [selectedFileName, setSelectedFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    await onFileSelect(file);
  };

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 transition-colors ${
        dragActive
          ? 'border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/30'
          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (!uploading) {
          void handleFiles(e.dataTransfer.files);
        }
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="font-semibold text-slate-800 dark:text-slate-200">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => {
              setSelectedFileName('');
              onChangeUrl('');
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Hapus Foto
          </button>
        )}
      </div>

      <div className="aspect-[16/9] max-h-52 w-full rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
        <SafeImage src={value} alt={altText} className="w-full h-full object-cover" />
      </div>

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            disabled={uploading}
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = '';
            }}
            className="block w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-800 file:text-white hover:file:bg-emerald-900 cursor-pointer disabled:opacity-60"
          />

          {galleryOptions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowGallery((prev) => !prev)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <ImageIcon className="w-4 h-4" aria-hidden="true" />
              {showGallery ? 'Tutup Pilihan Galeri' : 'Pilih dari Galeri'}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Upload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {uploading ? (
            <span className="font-medium text-emerald-800 dark:text-emerald-400">
              Sedang mengunggah {selectedFileName || 'gambar'}...
            </span>
          ) : selectedFileName && value ? (
            <span>
              Berkas terunggah: <strong className="text-slate-700 dark:text-slate-200">{selectedFileName}</strong>
            </span>
          ) : (
            <span>Pilih berkas dari komputer/HP atau seret gambar ke area ini.</span>
          )}
        </div>
      </div>

      {showGallery && galleryOptions.length > 0 && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
            Klik salah satu foto desa/galeri di bawah untuk langsung mengganti foto berita:
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto">
            {galleryOptions.map((option) => (
              <button
                key={option.url}
                type="button"
                onClick={() => {
                  setSelectedFileName('');
                  onChangeUrl(option.url);
                  setShowGallery(false);
                  onPickGallery?.(option);
                }}
                className={`group rounded-lg overflow-hidden border-2 text-left transition-all ${
                  value === option.url
                    ? 'border-emerald-700 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-600'
                }`}
              >
                <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800">
                  <SafeImage src={option.url} alt={option.label} className="w-full h-full object-cover" />
                </div>
                <div className="p-1 text-[10px] truncate text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900">
                  {option.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label htmlFor={`${inputId}-url`} className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
          Path / URL Foto Tersimpan
        </label>
        <input
          id={`${inputId}-url`}
          type="text"
          value={value}
          onChange={(e) => onChangeUrl(e.target.value)}
          placeholder="/uploads/... atau /src/assets/images/..."
          className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
        />
      </div>
    </div>
  );
}
