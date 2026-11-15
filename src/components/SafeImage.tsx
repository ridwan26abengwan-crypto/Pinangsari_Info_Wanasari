import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function SafeImage({ src, alt, className = 'w-full h-full object-cover', fallbackLabel }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950/10 via-slate-100 to-amber-500/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-amber-900/20 text-slate-500 dark:text-slate-400 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <ImageIcon className="w-7 h-7 mb-2 text-emerald-700/60 dark:text-emerald-400/60" aria-hidden="true" />
        <span className="text-xs font-medium line-clamp-2 max-w-[200px]">
          {fallbackLabel || alt || 'Dokumentasi Desa Pinangsari'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
