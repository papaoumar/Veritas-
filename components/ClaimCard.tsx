import React, { useState, useEffect } from 'react';
import { Claim, VoteType, User, Comment } from '../types';
import { MessageSquare, ThumbsUp, ThumbsDown, AlertTriangle, ShieldCheck, Share2, Check, ArrowDownUp, Send, User as UserIcon, Coins, Image as ImageIcon, Video, Cpu, Eye, X } from 'lucide-react';

interface ClaimCardProps {
  claim: Claim;
  onClick: () => void;
  currentUser: User;
  onUpdate: (updatedClaim: Claim) => void;
  onVote: (claimId: string, voteType: VoteType) => void;
}

const VOTE_COST = 5;

export const ClaimCard: React.FC<ClaimCardProps> = ({ claim, onClick, currentUser, onUpdate, onVote }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [sortVoteType, setSortVoteType] = useState<VoteType | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState(claim.imageUrl || '');
  const [videoUrlInput, setVideoUrlInput] = useState(claim.videoUrl || '');

  // Vote Confirmation State
  const [showVoteConfirmation, setShowVoteConfirmation] = useState(false);
  const [pendingVoteType, setPendingVoteType] = useState<VoteType | null>(null);

  useEffect(() => {
    setImageUrlInput(claim.imageUrl || '');
    setVideoUrlInput(claim.videoUrl || '');
  }, [claim.imageUrl, claim.videoUrl]);
  
  const getVerdictColor = (verdict?: VoteType) => {
    switch (verdict) {
      case VoteType.TRUE: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case VoteType.FALSE: return 'bg-red-100 text-red-800 border-red-200';
      case VoteType.MANIPULATED: return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getVerdictLabel = (verdict?: VoteType) => {
    switch (verdict) {
      case VoteType.TRUE: return 'Vrai';
      case VoteType.FALSE: return 'Faux';
      case VoteType.MANIPULATED: return 'Manipulé';
      default: return 'Non vérifié';
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}?claimId=${claim.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSortClick = (e: React.MouseEvent, type: VoteType | null) => {
    e.stopPropagation();
    setSortVoteType(prev => prev === type ? null : type);
  };

  const handleVoteClick = (e: React.MouseEvent, type: VoteType) => {
    e.stopPropagation();
    
    const isPaidVote = type === VoteType.TRUE || type === VoteType.FALSE || type === VoteType.MANIPULATED;

    // Si c'est un vote payant et que l'utilisateur a assez de fonds, on demande confirmation
    if (isPaidVote && currentUser.walletBalance >= VOTE_COST) {
      setPendingVoteType(type);
      setShowVoteConfirmation(true);
    } else {
      // Sinon (vote gratuit ou fonds insuffisants - géré par App.tsx), on passe directement
      onVote(claim.id, type);
    }
  };

  const confirmVote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pendingVoteType) {
      onVote(claim.id, pendingVoteType);
    }
    setShowVoteConfirmation(false);
    setPendingVoteType(null);
  };

  const cancelVote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowVoteConfirmation(false);
    setPendingVoteType(null);
  };

  const toggleComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(!showComments);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      text: newComment,
      timestamp: Date.now()
    };

    const updatedClaim = {
      ...claim,
      comments: [...claim.comments, comment]
    };

    onUpdate(updatedClaim);
    setNewComment('');
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleImagePreview = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onUpdate({ ...claim, imageUrl: imageUrlInput });
  };

  const handleVideoPreview = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onUpdate({ ...claim, videoUrl: videoUrlInput });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent, type: 'image' | 'video') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'image') handleImagePreview(e);
      else handleVideoPreview(e);
    }
  };

  const renderVideo = (url: string) => {
    const getYoutubeId = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = getYoutubeId(url);

    if (youtubeId) {
      return (
        <div className="mb-4 rounded-lg overflow-hidden bg-black aspect-video relative">
          <iframe 
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="Video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    }

    return (
      <div className="mb-4 rounded-lg overflow-hidden bg-black">
        <video controls className="w-full max-h-[400px]">
          <source src={url} />
          Votre navigateur ne supporte pas la lecture de vidéos.
        </video>
      </div>
    );
  };

  // Define vote items data for rendering and sorting
  const voteItems = [
    { 
      type: VoteType.TRUE, 
      icon: ThumbsUp, 
      count: claim.votes[VoteType.TRUE], 
      color: 'text-emerald-600', 
      hoverBg: 'hover:bg-emerald-50', 
      label: 'Vrai', 
      borderColor: 'border-emerald-600', 
      bgSelected: 'bg-emerald-100'
    },
    { 
      type: VoteType.FALSE, 
      icon: ThumbsDown, 
      count: claim.votes[VoteType.FALSE], 
      color: 'text-red-600', 
      hoverBg: 'hover:bg-red-50', 
      label: 'Faux', 
      borderColor: 'border-red-600', 
      bgSelected: 'bg-red-100'
    },
    { 
      type: VoteType.MANIPULATED, 
      icon: AlertTriangle, 
      count: claim.votes[VoteType.MANIPULATED], 
      color: 'text-amber-600', 
      hoverBg: 'hover:bg-amber-50', 
      label: 'Manipulé', 
      borderColor: 'border-amber-600', 
      bgSelected: 'bg-amber-100'
    },
  ];

  // Sort items: selected type comes first, others keep original relative order
  const sortedVotes = [...voteItems].sort((a, b) => {
    if (!sortVoteType) return 0;
    if (a.type === sortVoteType) return -1;
    if (b.type === sortVoteType) return 1;
    return 0;
  });

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex flex-col relative"
    >
      {/* Confirmation Modal Overlay */}
      {showVoteConfirmation && (
        <div 
          className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white border border-slate-200 shadow-xl rounded-xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
              <Coins className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Confirmer le vote</h4>
            <p className="text-sm text-slate-600 mb-4">
              Voter "{voteItems.find(v => v.type === pendingVoteType)?.label}" coûtera <span className="font-bold text-amber-600">{VOTE_COST} VXT</span>.
            </p>
            
            {/* Low Balance Warning */}
            {currentUser.walletBalance - VOTE_COST < 20 && (
               <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 text-left">
                  <p className="font-bold flex items-center mb-1"><AlertTriangle className="w-3 h-3 mr-1" /> Attention</p>
                  Il ne vous restera que <b>{currentUser.walletBalance - VOTE_COST} VXT</b> après cette action.
               </div>
            )}

            <div className="flex space-x-3">
              <button 
                onClick={cancelVote}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmVote}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <img 
              src={claim.author.avatar} 
              alt={claim.author.name} 
              className="w-8 h-8 rounded-full border border-slate-200"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900 flex items-center">
                {claim.author.name}
                {claim.author.isExpert && <ShieldCheck className="w-3 h-3 ml-1 text-blue-500" />}
              </p>
              <p className="text-xs text-slate-500">{new Date(claim.timestamp).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {claim.bountyAmount > 0 && (
              <span className="flex items-center px-2 py-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full" title="Récompense de participation">
                <Coins className="w-3 h-3 mr-1" />
                +{claim.bountyAmount}
              </span>
            )}
            <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
              {claim.category}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">{claim.title}</h3>
        <p className="text-slate-600 text-sm line-clamp-3 mb-4">{claim.content}</p>

        {/* Claim Media */}
        {claim.imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden bg-slate-100">
            <img 
              src={claim.imageUrl} 
              alt={claim.title} 
              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        {claim.videoUrl && renderVideo(claim.videoUrl)}

        {/* AI Verdict Badge if available */}
        {claim.aiAnalysis && (
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getVerdictColor(claim.aiAnalysis.verdict)} mb-4`}>
            <Cpu className="w-3 h-3 mr-1.5" />
            IA: {getVerdictLabel(claim.aiAnalysis.verdict)} ({claim.aiAnalysis.confidence}%)
          </div>
        )}

        {/* Media URL Inputs */}
        <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
            Médias (Image / Vidéo)
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => handleInputKeyDown(e, 'image')}
                placeholder="URL de l'image"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={handleImagePreview}
                className="px-3 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-200 transition-colors flex items-center whitespace-nowrap"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                Aperçu
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                onKeyDown={(e) => handleInputKeyDown(e, 'video')}
                placeholder="URL Vidéo (YouTube ou MP4)"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={handleVideoPreview}
                className="px-3 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-200 transition-colors flex items-center whitespace-nowrap"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                Aperçu
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          {/* Vote Filters */}
          <div className="flex items-center space-x-2 mb-2 text-xs">
            <span className="text-slate-400 flex items-center"><ArrowDownUp className="w-3 h-3 mr-1" /> Trier:</span>
            {[
              { type: VoteType.TRUE, label: 'Vrai', activeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
              { type: VoteType.FALSE, label: 'Faux', activeClass: 'bg-red-100 text-red-700 border-red-200' },
              { type: VoteType.MANIPULATED, label: 'Manipulé', activeClass: 'bg-amber-100 text-amber-700 border-amber-200' }
            ].map((filter) => (
              <button
                key={filter.type}
                onClick={(e) => handleSortClick(e, filter.type)}
                className={`px-2 py-0.5 rounded-md border transition-colors ${
                  sortVoteType === filter.type 
                    ? filter.activeClass 
                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
            {sortVoteType && (
              <button 
                onClick={(e) => handleSortClick(e, null)}
                className="text-slate-400 hover:text-slate-600 px-1"
                title="Réinitialiser"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-slate-500 text-sm">
            <div className="flex items-center space-x-2">
              {sortedVotes.map((item) => {
                const isSelected = claim.userVote === item.type;
                const isPayToVote = (item.type === VoteType.TRUE || item.type === VoteType.FALSE || item.type === VoteType.MANIPULATED);
                const canVote = currentUser.walletBalance >= VOTE_COST;
                const showCost = isPayToVote && canVote && !isSelected;

                return (
                  <div key={item.type} className="flex items-center">
                    <button 
                      onClick={(e) => handleVoteClick(e, item.type)}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                        isSelected 
                          ? `border-2 ${item.borderColor} ${item.bgSelected} shadow-sm font-bold transform scale-105` 
                          : `border border-transparent ${sortVoteType === item.type ? item.color + ' bg-opacity-10 ' + item.color.replace('text', 'bg') : item.hoverBg} text-slate-500 hover:${item.color.replace('text-', 'text-')}`
                      } ${isSelected ? item.color : ''}`}
                      title={isPayToVote ? `Voter (Coût: ${VOTE_COST} VXT)` : "Voter"}
                    >
                      <item.icon className={`w-4 h-4 ${isSelected ? 'fill-current' : ''}`} />
                      <span>{item.count}</span>
                    </button>
                    {showCost && (
                       <span className="ml-1.5 flex items-center text-[10px] font-medium text-slate-500 bg-slate-100/50 px-1.5 py-0.5 rounded-full" title={`Coût: ${VOTE_COST} VXT`}>
                         <Coins className="w-3 h-3 mr-1 text-amber-500" />
                         -{VOTE_COST}
                       </span>
                    )}
                    {isSelected && claim.userVoteTimestamp && (
                      <span className="ml-2 text-[10px] text-slate-500 font-medium whitespace-nowrap tracking-tight">
                         le {new Date(claim.userVoteTimestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à {new Date(claim.userVoteTimestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleComments}
                className={`flex items-center space-x-1 transition-colors ${showComments ? 'text-indigo-600' : 'hover:text-indigo-600'}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{claim.comments.length}</span>
              </button>
              <button 
                onClick={handleShare}
                className={`flex items-center space-x-1 transition-colors ${isCopied ? 'text-emerald-600' : 'hover:text-indigo-600'}`}
                title="Copier le lien"
              >
                {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                <span className="text-xs font-medium hidden sm:inline">{isCopied ? 'Copié !' : 'Partager'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Comments Section */}
      {showComments && (
        <div 
          className="bg-slate-50 border-t border-slate-100 p-5 cursor-default"
          onClick={handleCommentClick}
        >
          <div className="space-y-4 mb-4 max-h-64 overflow-y-auto custom-scrollbar">
            {claim.comments.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-2">Aucun commentaire pour le moment.</p>
            ) : (
              claim.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-xs text-slate-900">{comment.userName}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comment.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* New Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};