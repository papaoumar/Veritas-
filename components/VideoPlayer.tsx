
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, VideoOff } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  onRemove?: (e: React.MouseEvent) => void;
  canRemove?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, onRemove, canRemove = false }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error when URL changes
    setHasError(false);
    
    // Immediate basic validation
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      setHasError(true);
    }
  }, [url]);

  const getYoutubeId = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } catch (e) {
      return null;
    }
  };

  const getVimeoId = (url: string) => {
    try {
      const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
      const match = url.match(regExp);
      return match ? match[1] : null;
    } catch (e) {
      return null;
    }
  };

  const youtubeId = getYoutubeId(url);
  const vimeoId = getVimeoId(url);

  const RemoveButton = () => (
    canRemove && onRemove ? (
      <button 
           onClick={onRemove} 
           className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors z-20 opacity-0 group-hover/media:opacity-100"
           title="Supprimer la vidéo"
      >
           <X className="w-4 h-4" />
      </button>
    ) : null
  );

  if (hasError) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center relative group/media transition-all min-h-[200px]">
        {canRemove && onRemove && (
          <button 
             onClick={onRemove} 
             className="absolute top-2 right-2 bg-slate-200 dark:bg-slate-700 text-slate-500 p-1.5 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
             title="Supprimer le lien invalide"
          >
             <X className="w-4 h-4" />
          </button>
        )}
        <VideoOff className="w-10 h-10 text-slate-400 mb-2" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Lien vidéo invalide ou inaccessible</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Le format de l'URL n'est pas reconnu ou la vidéo a été supprimée.
        </p>
        <p className="text-[10px] text-slate-400 mt-2 max-w-xs truncate font-mono bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
          {url || "URL vide"}
        </p>
      </div>
    );
  }

  if (youtubeId) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden bg-black aspect-video relative group/media shadow-sm">
        <RemoveButton />
        <iframe 
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden bg-black aspect-video relative group/media shadow-sm">
        <RemoveButton />
        <iframe 
          src={`https://player.vimeo.com/video/${vimeoId}`} 
          className="absolute top-0 left-0 w-full h-full" 
          frameBorder="0" 
          allow="autoplay; fullscreen; picture-in-picture" 
          allowFullScreen
          title="Vimeo video player"
        ></iframe>
      </div>
    );
  }

  // Fallback HTML5 Video
  return (
    <div className="mb-4 rounded-lg overflow-hidden bg-black relative group/media shadow-sm min-h-[200px] flex items-center justify-center bg-slate-900">
      <RemoveButton />
      <video 
        controls 
        className="w-full max-h-[500px]"
        onError={() => setHasError(true)}
      >
        <source src={url} />
        <div className="text-white p-6 text-center">
           <AlertCircle className="w-8 h-8 mx-auto mb-2 text-white/50" />
           <p>Votre navigateur ne supporte pas la lecture de vidéos HTML5 ou le format est incorrect.</p>
        </div>
      </video>
    </div>
  );
};
