import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Claim, VoteType } from '../types';
import { analyzeClaimWithGemini } from '../geminiService';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Cpu, Globe, Share2, Shield, Calendar } from 'lucide-react';

interface ClaimDetailProps {
  claims: Claim[];
  onUpdateClaim: (updatedClaim: Claim) => void;
  currentUser: any;
}

export const ClaimDetail: React.FC<ClaimDetailProps> = ({ claims, onUpdateClaim, currentUser }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claim = claims.find(c => c.id === id);

  // Redirect or show error if claim not found
  if (!claim) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-slate-700">Information introuvable</h2>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 text-indigo-600 hover:underline"
        >
          Retour au flux
        </button>
      </div>
    );
  }

  const handleAiCheck = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeClaimWithGemini(`${claim.title}\n${claim.content}`);
      onUpdateClaim({
        ...claim,
        aiAnalysis: analysis
      });
    } catch (err) {
      setError("Impossible de vérifier cette info pour le moment.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVote = (type: VoteType) => {
    // In a real app, this would call an API
    const updatedVotes = { ...claim.votes };
    updatedVotes[type] += 1;
    onUpdateClaim({
      ...claim,
      votes: updatedVotes
    });
  };

  const getVerdictIcon = (verdict: VoteType) => {
    switch (verdict) {
      case VoteType.TRUE: return <CheckCircle className="w-12 h-12 text-emerald-500" />;
      case VoteType.FALSE: return <XCircle className="w-12 h-12 text-red-500" />;
      case VoteType.MANIPULATED: return <AlertTriangle className="w-12 h-12 text-amber-500" />;
      default: return <Cpu className="w-12 h-12 text-slate-400" />;
    }
  };

  const getVerdictText = (verdict: VoteType) => {
    switch (verdict) {
      case VoteType.TRUE: return { text: "VRAI", color: "text-emerald-700" };
      case VoteType.FALSE: return { text: "FAUX", color: "text-red-700" };
      case VoteType.MANIPULATED: return { text: "MANIPULÉ", color: "text-amber-700" };
      default: return { text: "INCERTAIN", color: "text-slate-600" };
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button 
        onClick={() => navigate('/')}
        className="mb-6 flex items-center text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour au flux
      </button>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <span className="px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-blue-50 text-blue-700 rounded-full">
              {claim.category}
            </span>
            <span className="text-slate-400 text-sm flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(claim.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 mb-6 leading-tight">
            {claim.title}
          </h1>

          <div className="prose prose-slate max-w-none text-lg text-slate-700 leading-relaxed mb-8">
            {claim.content}
          </div>

          {/* Image Detail View */}
          {claim.imageUrl && (
            <div className="mb-8 rounded-xl overflow-hidden shadow-sm">
              <img 
                src={claim.imageUrl} 
                alt={claim.title} 
                className="w-full max-h-[500px] object-cover"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <div className="flex items-center space-x-3">
              <img 
                src={claim.author.avatar} 
                alt={claim.author.name} 
                className="w-10 h-10 rounded-full border border-slate-200"
              />
              <div>
                <p className="text-sm font-bold text-slate-900">{claim.author.name}</p>
                <div className="flex items-center text-xs text-slate-500">
                  <Shield className="w-3 h-3 mr-1 text-emerald-500" />
                  Score Crédibilité: {claim.author.credibilityScore}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
               <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                 <Share2 className="w-5 h-5" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action / Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Community Votes */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Vote Communautaire</h3>
            <div className="space-y-3">
              <button onClick={() => handleVote(VoteType.TRUE)} className="w-full flex items-center justify-between p-3 rounded-lg border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 transition-colors">
                <span className="flex items-center font-medium"><CheckCircle className="w-4 h-4 mr-2" /> Vrai</span>
                <span className="bg-white px-2 py-0.5 rounded text-xs font-bold shadow-sm">{claim.votes.TRUE}</span>
              </button>
              <button onClick={() => handleVote(VoteType.FALSE)} className="w-full flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50/50 hover:bg-red-100 text-red-800 transition-colors">
                <span className="flex items-center font-medium"><XCircle className="w-4 h-4 mr-2" /> Faux</span>
                <span className="bg-white px-2 py-0.5 rounded text-xs font-bold shadow-sm">{claim.votes.FALSE}</span>
              </button>
              <button onClick={() => handleVote(VoteType.MANIPULATED)} className="w-full flex items-center justify-between p-3 rounded-lg border border-amber-100 bg-amber-50/50 hover:bg-amber-100 text-amber-800 transition-colors">
                <span className="flex items-center font-medium"><AlertTriangle className="w-4 h-4 mr-2" /> Manipulé</span>
                <span className="bg-white px-2 py-0.5 rounded text-xs font-bold shadow-sm">{claim.votes.MANIPULATED}</span>
              </button>
            </div>
            <p className="mt-4 text-xs text-center text-slate-400">
              Votre vote impacte la note de fiabilité finale.
            </p>
          </div>
        </div>

        {/* Right Column: AI Analysis */}
        <div className="lg:col-span-2">
          {!claim.aiAnalysis ? (
             <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl shadow-lg p-8 text-white flex flex-col items-center text-center">
               <Cpu className="w-16 h-16 mb-4 opacity-90" />
               <h3 className="text-2xl font-bold mb-2">Lancer l'analyse IA</h3>
               <p className="text-indigo-100 mb-6 max-w-md">
                 Notre IA va croiser cette affirmation avec des milliers de sources vérifiées via Google Search pour déterminer sa véracité.
               </p>
               <button 
                onClick={handleAiCheck}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-full shadow hover:shadow-xl hover:scale-105 transition-all disabled:opacity-70 disabled:hover:scale-100"
               >
                 {isAnalyzing ? (
                   <span className="flex items-center">
                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Analyse en cours...
                   </span>
                 ) : "Vérifier maintenant"}
               </button>
               {error && <p className="mt-4 text-red-200 bg-red-900/20 px-4 py-2 rounded">{error}</p>}
             </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-indigo-900 font-bold">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  <span>Rapport Veritas AI</span>
                </div>
                <span className="text-xs text-slate-400">
                  Analysé le {new Date(claim.aiAnalysis.analyzedAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8 mb-8">
                  <div className="flex flex-col items-center mb-6 md:mb-0 min-w-[120px]">
                    {getVerdictIcon(claim.aiAnalysis.verdict)}
                    <h2 className={`mt-3 text-2xl font-black tracking-tight ${getVerdictText(claim.aiAnalysis.verdict).color}`}>
                      {getVerdictText(claim.aiAnalysis.verdict).text}
                    </h2>
                    <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                      Confiance: {claim.aiAnalysis.confidence}%
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-2">Résumé de l'analyse</h4>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm">
                      {claim.aiAnalysis.summary}
                    </p>
                  </div>
                </div>

                {claim.aiAnalysis.sources.length > 0 && (
                  <div className="bg-blue-50/50 rounded-lg p-5 border border-blue-100">
                    <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      Sources vérifiées
                    </h4>
                    <ul className="space-y-2">
                      {claim.aiAnalysis.sources.slice(0, 4).map((source, idx) => (
                        <li key={idx}>
                          <a 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-start truncate"
                          >
                            <span className="mr-2 text-blue-300">•</span>
                            <span className="truncate">{source.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};