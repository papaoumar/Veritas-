
import React, { useState } from 'react';
import { Claim, VoteType } from '../types';
import { Send, FileText, Tag, AlertCircle, Image as ImageIcon, Video, Eye, X } from 'lucide-react';

interface SubmitClaimProps {
  onSubmit: (newClaim: Claim) => void;
  onCancel: () => void;
  currentUser: any;
}

export const SubmitClaim: React.FC<SubmitClaimProps> = ({ onSubmit, onCancel, currentUser }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Politique');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [previewMedia, setPreviewMedia] = useState<{type: 'image' | 'video', url: string} | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handlePreview = (type: 'image' | 'video') => {
    const url = type === 'image' ? imageUrl : videoUrl;
    if (!url) return;
    setPreviewMedia({ type, url });
  };

  const clearPreview = () => {
    setPreviewMedia(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
       setFormError("Le titre est obligatoire.");
       return;
    }
    
    if (!content.trim()) {
       setFormError("Le détail du contenu est obligatoire.");
       return;
    }

    if (content.trim().length < 20) {
      setFormError("Le contenu doit contenir au moins 20 caractères pour être suffisamment détaillé.");
      return;
    }

    const newClaim: Claim = {
      id: Date.now().toString(),
      title,
      content,
      category,
      author: currentUser,
      timestamp: Date.now(),
      votes: {
        [VoteType.TRUE]: 0,
        [VoteType.FALSE]: 0,
        [VoteType.MANIPULATED]: 0,
        [VoteType.UNCERTAIN]: 0,
      },
      voteHistory: [],
      comments: [],
      bountyAmount: 0,
      imageUrl: imageUrl || undefined,
      videoUrl: videoUrl || undefined,
    };

    onSubmit(newClaim);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 p-6">
          <h2 className="text-2xl font-bold text-white">Soumettre une info à vérifier</h2>
          <p className="text-indigo-200 text-sm mt-1">La communauté et l'IA analyseront votre soumission.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Titre de l'information (Court & clair)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Ex: Le gouvernement annonce une nouvelle taxe sur..."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Détails & Contexte
            </label>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (formError) setFormError(null);
              }}
              rows={6}
              className={`block w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                content.length > 0 && content.length < 20 
                  ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-200' 
                  : 'border-slate-300'
              }`}
              placeholder="Copiez le texte complet, ajoutez des détails sur la source ou le contexte... (Min. 20 caractères)"
              required
            />
            <div className="flex justify-between mt-1">
               <span className={`text-xs ${content.length > 0 && content.length < 20 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                 {content.length} / 20 caractères min.
               </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Catégorie
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-5 w-5 text-slate-400" />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option>Politique</option>
                <option>Science</option>
                <option>Économie</option>
                <option>Santé</option>
                <option>International</option>
                <option>Tech</option>
                <option>Rumeur / Réseaux Sociaux</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Médias (Optionnel)</h3>
            
            <div className="space-y-4">
              {/* Image Input */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Image URL</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ImageIcon className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePreview('image')}
                    disabled={!imageUrl}
                    className="px-3 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors flex items-center disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    Aperçu
                  </button>
                </div>
              </div>

              {/* Video Input */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Vidéo URL (YouTube / Vimeo / MP4)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Video className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePreview('video')}
                    disabled={!videoUrl}
                    className="px-3 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors flex items-center disabled:opacity-50"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    Aperçu
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Area */}
            {previewMedia && (
              <div className="mt-4 relative rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                <button 
                  onClick={clearPreview}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                
                {previewMedia.type === 'image' ? (
                  <img src={previewMedia.url} alt="Aperçu" className="w-full h-48 object-cover" />
                ) : (
                  <>
                    {getYoutubeId(previewMedia.url) ? (
                      <div className="aspect-video">
                        <iframe 
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${getYoutubeId(previewMedia.url)}`}
                          title="Video preview"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      <video controls className="w-full h-48 bg-black">
                        <source src={previewMedia.url} />
                        Votre navigateur ne supporte pas la lecture de vidéos.
                      </video>
                    )}
                  </>
                )}
                <div className="bg-slate-900/80 text-white text-xs px-2 py-1 absolute bottom-2 left-2 rounded">
                  Aperçu {previewMedia.type === 'image' ? 'Image' : 'Vidéo'}
                </div>
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
             <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
             <p className="text-xs text-amber-800">
               En soumettant, vous acceptez que cette information soit analysée par notre IA et soumise au vote public. Les fausses informations délibérées peuvent affecter votre score de crédibilité.
             </p>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md transition-all transform hover:scale-105"
            >
              <Send className="w-4 h-4 mr-2" />
              Publier pour vérification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
