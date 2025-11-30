import React, { useState } from 'react';
import { Claim, VoteType } from '../types';
import { Send, FileText, Tag, AlertCircle } from 'lucide-react';

interface SubmitClaimProps {
  onSubmit: (newClaim: Claim) => void;
  onCancel: () => void;
  currentUser: any;
}

export const SubmitClaim: React.FC<SubmitClaimProps> = ({ onSubmit, onCancel, currentUser }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Politique');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

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
      comments: [],
      bountyAmount: 0,
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
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="block w-full p-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Copiez le texte complet, ajoutez des détails sur la source ou le contexte..."
              required
            />
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