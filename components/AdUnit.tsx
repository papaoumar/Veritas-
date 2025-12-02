import React, { useEffect } from 'react';

interface AdUnitProps {
  slot?: string; // L'ID du slot publicitaire fourni par AdSense
  format?: 'auto' | 'fluid' | 'rectangle';
  layoutKey?: string; // Pour les annonces In-Feed
  className?: string;
  label?: string; // Texte affiché en mode démo
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const AdUnit: React.FC<AdUnitProps> = ({ 
  slot = "1234567890", // ID par défaut factice pour la démo
  format = "auto", 
  layoutKey,
  className = "",
  label = "Publicité"
}) => {
  // Mode Développement : Mettre à false pour la production avec un vrai compte AdSense
  const isDevMode = true; 

  useEffect(() => {
    if (!isDevMode) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, []);

  if (isDevMode) {
    return (
      <div className={`w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center text-center p-4 min-h-[120px] animate-in fade-in ${className}`}>
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Sponsorisé</span>
        <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700/50 rounded border border-dashed border-slate-300 dark:border-slate-600 p-4">
           <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">{label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden my-4 ${className}`}>
      <span className="block text-[9px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-600 text-center mb-1">Publicité</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Remplacez par votre ID éditeur réel
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        data-ad-layout-key={layoutKey}
      />
    </div>
  );
};
