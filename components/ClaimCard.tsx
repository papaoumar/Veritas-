import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Claim, VoteType, User, Comment, ExpertLevel, Transaction } from '../types';
import { MessageSquare, ThumbsUp, ThumbsDown, AlertTriangle, ShieldCheck, Share2, Check, ArrowDownUp, Send, User as UserIcon, Coins, Image as ImageIcon, Video, Cpu, Eye, X, Sparkles, Loader2, Bell, Shield, History, HelpCircle, Flag, ArrowRight, ArrowUpRight, ArrowDownLeft, AlertCircle, Filter, Wallet, List, ArrowUp, ArrowDown, CalendarClock, TrendingUp, CreditCard, ExternalLink } from 'lucide-react';
import { analyzeClaimWithGemini } from '../geminiService';
import { VideoPlayer } from './VideoPlayer';

interface ClaimCardProps {
  claim: Claim;
  onClick: () => void;
  currentUser: User;
  onUpdate: (updatedClaim: Claim) => void;
  onVote: (claimId: string, voteType: VoteType) => void;
}

const STANDARD_VOTE_COST = 5;
const UNCERTAIN_VOTE_COST = 3;
const VOTE_EXPIRATION_DAYS = 30;
const VOTE_EXPIRATION_MS = VOTE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
const VXT_EXCHANGE_RATE = 0.01; // 1 VXT = 0.01 $
const MIN_BALANCE_RESERVE = 20; // Solde minimum à conserver

export const ClaimCard: React.FC<ClaimCardProps> = ({ claim, onClick, currentUser, onUpdate, onVote }) => {
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [filterVoteType, setFilterVoteType] = useState<VoteType | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState(claim.imageUrl || '');
  const [videoUrlInput, setVideoUrlInput] = useState(claim.videoUrl || '');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showSources, setShowSources] = useState(false);
  
  // Vote History Modal State
  const [showVoteHistoryDetails, setShowVoteHistoryDetails] = useState(false);
  const [voteHistorySort, setVoteHistorySort] = useState<'desc' | 'asc'>('desc');

  // Media Analysis State
  const [analyzingMedia, setAnalyzingMedia] = useState<'image' | 'video' | null>(null);
  const [mediaCheck, setMediaCheck] = useState<{ type: 'image' | 'video', confidence: number, verdict: VoteType } | null>(null);

  // General Claim Analysis State
  const [isAnalyzingClaim, setIsAnalyzingClaim] = useState(false);

  // Vote Confirmation State
  const [showVoteConfirmation, setShowVoteConfirmation] = useState(false);
  const [pendingVoteType, setPendingVoteType] = useState<VoteType | null>(null);
  
  // Transaction Success Animation State
  const [animatingVote, setAnimatingVote] = useState<VoteType | null>(null);

  // Balance History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    setImageUrlInput(claim.imageUrl || '');
    setVideoUrlInput(claim.videoUrl || '');
  }, [claim.imageUrl, claim.videoUrl]);

  // Determine if the current user is the author to show live balance
  const isAuthor = currentUser.id === claim.author.id;
  const displayBalance = isAuthor ? currentUser.walletBalance : claim.author.walletBalance;
  const dollarBalance = (displayBalance * VXT_EXCHANGE_RATE).toFixed(2);

  const getVoteCost = (type: VoteType) => {
    return type === VoteType.UNCERTAIN ? UNCERTAIN_VOTE_COST : STANDARD_VOTE_COST;
  };

  // Calculate Active Votes based on history and expiration time (TTL)
  const getActiveVoteCounts = (): { [key in VoteType]: number } => {
    const now = Date.now();
    const counts = {
      [VoteType.TRUE]: 0,
      [VoteType.FALSE]: 0,
      [VoteType.MANIPULATED]: 0,
      [VoteType.UNCERTAIN]: 0
    };

    if (claim.voteHistory && claim.voteHistory.length > 0) {
      claim.voteHistory.forEach(vote => {
        // Only count votes that are within the expiration period
        if (now - vote.timestamp < VOTE_EXPIRATION_MS) {
           counts[vote.voteType] = (counts[vote.voteType] || 0) + 1;
        }
      });
      return counts;
    } else {
       // Fallback logic for legacy claims without history: use the static counters
       return claim.votes;
    }
  };

  const activeVoteCounts = getActiveVoteCounts();
  
  // Determine counts to display based on toggle (Active vs All Time)
  const countsToDisplay = showAllHistory ? claim.votes : activeVoteCounts;
  const totalDisplayVotes = (Object.values(countsToDisplay) as number[]).reduce((a, b) => a + b, 0);

  // Sorted Vote History for Modal
  const sortedVoteHistory = [...(claim.voteHistory || [])].sort((a, b) => {
    return voteHistorySort === 'desc' 
      ? b.timestamp - a.timestamp 
      : a.timestamp - b.timestamp;
  });

  const getVerdictColor = (verdict?: VoteType) => {
    switch (verdict) {
      case VoteType.TRUE: return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800';
      case VoteType.FALSE: return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800';
      case VoteType.MANIPULATED: return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
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

  const getAuthorBadgeColor = (level: ExpertLevel) => {
    switch (level) {
      case ExpertLevel.MASTER: return 'text-purple-600 bg-purple-50 border-purple-100 dark:text-purple-300 dark:bg-purple-900/30 dark:border-purple-800';
      case ExpertLevel.EXPERT: return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-800';
      case ExpertLevel.ANALYST: return 'text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-800';
      default: return 'text-slate-500 bg-slate-50 border-slate-100 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700';
    }
  };

  const formatVoteDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `le ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}`;
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Use hash router format for sharing
    const url = `${window.location.origin}/#/claim/${claim.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubscribe = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !claim.isSubscribed;
    onUpdate({ ...claim, isSubscribed: newState });
    
    setNotificationMsg(newState ? "Notifications activées" : "Notifications désactivées");
    setTimeout(() => setNotificationMsg(null), 2000);
  };

  const handleFilterClick = (e: React.MouseEvent, type: VoteType | null) => {
    e.stopPropagation();
    setFilterVoteType(prev => prev === type ? null : type);
  };

  const handleVoteClick = (e: React.MouseEvent, type: VoteType) => {
    e.stopPropagation();
    
    // Check reserve logic before opening modal
    const voteCost = getVoteCost(type);
    
    // 1. Check if user has enough absolute balance
    if (currentUser.walletBalance < voteCost) {
      alert(`Solde insuffisant ! Il vous faut ${voteCost} VXT pour voter.`);
      return;
    }

    // 2. Check if user maintains reserve (unless simply changing vote, but simplistic check for now)
    // Note: If user is changing vote, they technically get refunded then pay again, but let's be strict for safety
    if (currentUser.walletBalance - voteCost < MIN_BALANCE_RESERVE && claim.userVote !== type) {
       alert(`Action refusée : Vous devez conserver un solde minimum de ${MIN_BALANCE_RESERVE} VXT après avoir voté.`);
       return;
    }

    if (claim.userVote === type) {
       return;
    }

    setPendingVoteType(type);
    setShowVoteConfirmation(true);
  };

  const confirmVote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pendingVoteType) {
      // Trigger Flying Coin Animation
      setAnimatingVote(pendingVoteType);
      
      // Delay to allow animation to start visible
      setTimeout(() => {
        onVote(claim.id, pendingVoteType);
        setShowVoteConfirmation(false);
        setPendingVoteType(null);
      }, 700);

      // Reset animation state
      setTimeout(() => setAnimatingVote(null), 1500);
    } else {
      setShowVoteConfirmation(false);
    }
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

  const handleReportComment = (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation();
    if (window.confirm("Voulez-vous signaler ce commentaire comme inapproprié ?")) {
       setNotificationMsg("Commentaire signalé aux modérateurs.");
       setTimeout(() => setNotificationMsg(null), 3000);
    }
  };

  const handleImagePreview = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onUpdate({ ...claim, imageUrl: imageUrlInput });
  };

  const handleVideoPreview = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onUpdate({ ...claim, videoUrl: videoUrlInput });
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ ...claim, imageUrl: undefined });
  };

  const handleRemoveVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ ...claim, videoUrl: undefined });
  };

  const handleAnalyzeClaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnalyzingClaim(true);
    setNotificationMsg("Analyse IA en cours...");
    
    try {
      const fullText = `${claim.title}\n\n${claim.content}`;
      const analysis = await analyzeClaimWithGemini(fullText);
      
      onUpdate({
        ...claim,
        aiAnalysis: analysis
      });
      setNotificationMsg("Analyse terminée !");
    } catch (error) {
      console.error("Failed to analyze claim", error);
      alert("L'analyse a échoué. Veuillez réessayer.");
    } finally {
      setIsAnalyzingClaim(false);
      setTimeout(() => setNotificationMsg(null), 3000);
    }
  };

  const handleAiVerifyUrl = async (e: React.MouseEvent, type: 'image' | 'video') => {
    e.stopPropagation();
    const url = type === 'image' ? imageUrlInput : videoUrlInput;
    if (!url) return;

    setAnalyzingMedia(type);
    try {
      // Save the URL first
      const updatedClaim = { 
        ...claim, 
        [type === 'image' ? 'imageUrl' : 'videoUrl']: url 
      };
      onUpdate(updatedClaim);

      // Perform Analysis
      const prompt = `Analyse la crédibilité de ce média (${type}) : ${url} en relation avec l'affirmation suivante : "${claim.title}".\nContenu de l'affirmation : ${claim.content}`;
      const analysis = await analyzeClaimWithGemini(prompt);
      
      onUpdate({
        ...updatedClaim,
        aiAnalysis: analysis
      });

      // Update local feedback state
      setMediaCheck({
        type,
        confidence: analysis.confidence,
        verdict: analysis.verdict
      });

    } catch (error) {
      console.error("AI Verify failed", error);
      alert("L'analyse du lien a échoué. Vérifiez l'URL ou réessayez plus tard.");
    } finally {
      setAnalyzingMedia(null);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent, type: 'image' | 'video') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'image') handleImagePreview(e);
      else handleVideoPreview(e);
    }
  };

  const handleBalanceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAuthor) {
      setShowHistoryModal(true);
    }
  };

  const getTxDetails = (tx: Transaction) => {
    switch(tx.type) {
      case 'DEPOSIT': return { icon: ArrowDownLeft, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Dépôt' };
      case 'WITHDRAWAL': return { icon: ArrowUpRight, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Retrait' };
      case 'VOTE': return { icon: Check, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Vote' };
      case 'EARNING': return { icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Gain' };
      default: return { icon: Coins, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Transaction' };
    }
  };

  const getConfidenceColorClass = (confidence: number) => {
    if (confidence >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (confidence >= 50) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  // Flying Coin Component (Internal)
  const FlyingCoin = ({ amount }: { amount: number }) => (
    <div className="absolute -top-6 left-1/2 pointer-events-none z-[9999]">
      <div className="flex items-center font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap animate-[fly-to-wallet_1.2s_cubic-bezier(0.25,1,0.5,1)_forwards]">
         <div className="relative">
            <Coins className="w-8 h-8 text-amber-500 drop-shadow-lg" />
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
         </div>
         <span className="ml-1 text-xl drop-shadow-md">-{amount}</span>
      </div>
      <style>{`
        @keyframes fly-to-wallet {
          0% { 
            opacity: 0; 
            transform: translate(-50%, 0) scale(0.5); 
          }
          15% { 
            opacity: 1; 
            transform: translate(-50%, -40px) scale(1.2); 
          }
          100% { 
            opacity: 0; 
            transform: translate(150px, -600px) scale(0.2); 
          }
        }
      `}</style>
    </div>
  );

  // Define vote items data for rendering and sorting
  const voteItems = [
    { 
      type: VoteType.TRUE, 
      icon: ThumbsUp, 
      count: countsToDisplay[VoteType.TRUE], 
      color: 'text-emerald-800 dark:text-emerald-400', 
      selectedColor: 'text-emerald-900 dark:text-emerald-200',
      hoverBg: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:scale-105', 
      label: 'Vrai', 
      borderColor: 'border-emerald-600 dark:border-emerald-500', 
      bgSelected: 'bg-emerald-200 dark:bg-emerald-900/60',
      ringColor: 'ring-emerald-300 dark:ring-emerald-700'
    },
    { 
      type: VoteType.FALSE, 
      icon: ThumbsDown, 
      count: countsToDisplay[VoteType.FALSE], 
      color: 'text-red-800 dark:text-red-400', 
      selectedColor: 'text-red-900 dark:text-red-200',
      hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/30', 
      label: 'Faux', 
      borderColor: 'border-red-600 dark:border-red-500', 
      bgSelected: 'bg-red-200 dark:bg-red-900/60',
      ringColor: 'ring-red-300 dark:ring-red-700'
    },
    { 
      type: VoteType.MANIPULATED, 
      icon: AlertTriangle, 
      count: countsToDisplay[VoteType.MANIPULATED], 
      color: 'text-amber-800 dark:text-amber-400', 
      selectedColor: 'text-amber-900 dark:text-amber-200',
      hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-900/30', 
      label: 'Manipulé', 
      borderColor: 'border-amber-600 dark:border-amber-500', 
      bgSelected: 'bg-amber-200 dark:bg-amber-900/60',
      ringColor: 'ring-amber-300 dark:ring-amber-700'
    },
    { 
      type: VoteType.UNCERTAIN, 
      icon: HelpCircle, 
      count: countsToDisplay[VoteType.UNCERTAIN], 
      color: 'text-slate-800 dark:text-slate-300', 
      selectedColor: 'text-slate-900 dark:text-white',
      hoverBg: 'hover:bg-slate-100 dark:hover:bg-slate-700', 
      label: 'Non vérifié', 
      borderColor: 'border-slate-500 dark:border-slate-400', 
      bgSelected: 'bg-slate-300 dark:bg-slate-600',
      ringColor: 'ring-slate-400 dark:ring-slate-500'
    },
  ];

  // Filter items: selected type only if filter active, else all
  const visibleVotes = filterVoteType 
    ? voteItems.filter(item => item.type === filterVoteType)
    : voteItems;

  // Calculate earnings for this claim for current user
  const userEarnings = currentUser.transactions?.filter(t => 
    t.type === 'EARNING' && t.description.includes(claim.title.substring(0, 10))
  ).reduce((sum, t) => sum + t.amount, 0) || 0;

  const hasMultipleMedia = claim.imageUrl && claim.videoUrl;
  const pendingCost = pendingVoteType ? getVoteCost(pendingVoteType) : 0;

  // Check if any vote would trigger a low balance warning (for the UI)
  const isBalanceCritical = currentUser.walletBalance < MIN_BALANCE_RESERVE + STANDARD_VOTE_COST;

  return (
    <div 
      onClick={onClick}
      className="bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 bg-[length:200%_200%] animate-gradient-subtle rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:scale-[1.02] hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 ease-out cursor-pointer flex flex-col relative group"
    >
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-subtle {
          animation: gradient-shift 15s ease infinite;
        }
      `}</style>
      
      {/* Notification Toast */}
      {notificationMsg && (
        <div className="absolute top-4 right-4 z-20 bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 px-3 py-1.5 rounded-full text-xs font-medium animate-in fade-in slide-in-from-top-2">
          {notificationMsg}
        </div>
      )}

      {/* Vote History Modal */}
      {showVoteHistoryDetails && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
             e.stopPropagation();
             setShowVoteHistoryDetails(false);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
                <CalendarClock className="w-5 h-5 mr-2 text-indigo-500" />
                Journal des votes
              </h3>
              <button 
                onClick={() => setShowVoteHistoryDetails(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700 flex justify-end">
               <button 
                 onClick={() => setVoteHistorySort(prev => prev === 'desc' ? 'asc' : 'desc')}
                 className="flex items-center text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
               >
                 Trier par date
                 {voteHistorySort === 'desc' ? <ArrowDown className="w-3.5 h-3.5 ml-1" /> : <ArrowUp className="w-3.5 h-3.5 ml-1" />}
               </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar flex-1">
              {!claim.voteHistory || claim.voteHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <p>Aucun vote enregistré dans l'historique.</p>
                </div>
              ) : (
                sortedVoteHistory.map((vote, idx) => {
                  const voteItemConfig = voteItems.find(v => v.type === vote.voteType);
                  const Icon = voteItemConfig ? voteItemConfig.icon : HelpCircle;
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${voteItemConfig?.bgSelected.replace('200', '100').replace('900/60', '900/30')} ${voteItemConfig?.color}`}>
                           <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-200">
                            {voteItemConfig?.label || 'Vote'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(vote.timestamp).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'})} à {new Date(vote.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        {vote.userId ? `ID: ${vote.userId.substring(0, 4)}...` : 'Anonyme'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 text-center border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total des votes enregistrés : <strong className="text-slate-900 dark:text-white">{claim.voteHistory ? claim.voteHistory.length : 0}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Transactions History Modal */}
      {showHistoryModal && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
             e.stopPropagation();
             setShowHistoryModal(false);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
                <History className="w-5 h-5 mr-2 text-indigo-500" />
                Historique VXT
              </h3>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {!currentUser.transactions || currentUser.transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <p>Aucune transaction récente.</p>
                </div>
              ) : (
                currentUser.transactions.slice(0, 20).map((tx) => {
                  const details = getTxDetails(tx);
                  const Icon = details.icon;
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${details.bg} ${details.color} bg-opacity-50`}>
                           <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-200 line-clamp-1">{tx.description}</p>
                          <div className="flex items-center space-x-2">
                             <span className="text-[10px] uppercase font-bold text-slate-400">{details.label}</span>
                             <span className="text-[10px] text-slate-300">•</span>
                             <p className="text-xs text-slate-500 dark:text-slate-400">
                               {new Date(tx.timestamp).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}
                             </p>
                          </div>
                        </div>
                      </div>
                      <span className={`font-bold text-sm whitespace-nowrap ${tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} VXT
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Solde actuel : <strong className="text-slate-900 dark:text-white">{currentUser.walletBalance} VXT</strong>
                <span className="font-normal text-slate-400 ml-1">(${(currentUser.walletBalance * VXT_EXCHANGE_RATE).toFixed(2)})</span>
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHistoryModal(false);
                  navigate('/profile');
                }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center transition-colors px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 w-full justify-center"
                title="Voir mon historique de transactions (Dépôts, Votes, Retraits)"
              >
                Voir tout l'historique <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Overlay */}
      {showVoteConfirmation && (
        <div 
          className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-500">
              <Coins className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Confirmer le vote</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Voter "<span className="font-bold">{voteItems.find(v => v.type === pendingVoteType)?.label}</span>" coûtera <span className="font-bold text-amber-600 dark:text-amber-500">{pendingCost} VXT</span>.
              <br/>
              Souhaitez-vous procéder ?
            </p>
            
            {/* Low Balance Warning */}
            {currentUser.walletBalance - pendingCost < MIN_BALANCE_RESERVE && (
               <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-400 text-left animate-pulse">
                  <p className="font-bold flex items-center mb-1"><AlertTriangle className="w-3 h-3 mr-1" /> Attention : Réserve insuffisante</p>
                  Votre solde ({currentUser.walletBalance - pendingCost} VXT) sera inférieur au minimum requis de {MIN_BALANCE_RESERVE} VXT.
               </div>
            )}

            <div className="flex space-x-3">
              <button 
                onClick={cancelVote}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
                {claim.author.name}
                <UserIcon className="w-3.5 h-3.5 ml-1.5 text-slate-400 dark:text-slate-500" />
                
                {/* Author Balance - Clickable for Current User if Author */}
                <button 
                   onClick={handleBalanceClick}
                   disabled={!isAuthor}
                   className={`ml-2 flex items-center text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700 transition-colors ${isAuthor ? 'hover:bg-amber-50 dark:hover:bg-slate-700 cursor-pointer group/balance' : 'cursor-default'}`}
                   title={isAuthor ? `Voir mon historique de transactions` : `Solde VXT de l'auteur (~$${dollarBalance})`}
                >
                  <Coins className="w-3 h-3 mr-1 text-amber-500" />
                  <span className="font-bold text-amber-700 dark:text-amber-500 mr-1">{displayBalance}</span>
                  <span className="text-slate-400 font-normal">(${dollarBalance})</span>
                  {isAuthor && <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover/balance:opacity-100 transition-opacity text-slate-400" />}
                </button>

                {claim.author.isExpert && (
                   <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] flex items-center border ${getAuthorBadgeColor(claim.author.expertLevel)}`}>
                     <ShieldCheck className="w-3 h-3 mr-0.5" />
                     {claim.author.expertLevel || 'Expert'}
                   </span>
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(claim.timestamp).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {claim.bountyAmount > 0 && (
              <span className="flex items-center px-2 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full" title="Récompense de participation">
                <Coins className="w-3 h-3 mr-1" />
                +{claim.bountyAmount}
              </span>
            )}
            <span className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
              {claim.category}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">{claim.title}</h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-4">{claim.content}</p>

        {/* Claim Media Carousel */}
        {(claim.imageUrl || claim.videoUrl) && (
          <div className="mb-4 group/carousel relative">
             <div className={`flex overflow-x-auto snap-x snap-mandatory gap-4 custom-scrollbar pb-1 -mx-5 px-5 ${hasMultipleMedia ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                {/* Image Slide */}
                {claim.imageUrl && (
                  <div className={`flex-shrink-0 snap-center ${hasMultipleMedia ? 'w-[85%]' : 'w-full'}`}>
                    <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 relative group/media h-full shadow-sm border border-slate-100 dark:border-slate-800">
                      <button 
                         onClick={handleRemoveImage} 
                         className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors z-20 opacity-0 group-hover/media:opacity-100"
                         title="Supprimer l'image"
                      >
                         <X className="w-4 h-4" />
                      </button>
                      <img 
                        src={claim.imageUrl} 
                        alt={claim.title} 
                        className="w-full h-48 sm:h-64 object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>
                )}

                {/* Video Slide */}
                {claim.videoUrl && (
                   <div className={`flex-shrink-0 snap-center ${hasMultipleMedia ? 'w-[85%]' : 'w-full'}`}>
                      <VideoPlayer url={claim.videoUrl} onRemove={handleRemoveVideo} canRemove={true} />
                   </div>
                )}
             </div>
          </div>
        )}

        {/* Earnings for this claim */}
        {userEarnings > 0 && (
          <div className="mb-4 p-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-lg flex items-center justify-between animate-in fade-in">
             <div className="flex items-center text-xs font-medium text-emerald-800 dark:text-emerald-400">
               <TrophyIcon className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-500" />
               Vos gains sur cette info
             </div>
             <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center">
               +{userEarnings} VXT
             </span>
          </div>
        )}

        {/* AI Verdict Badge or Analysis Button */}
        <div className="mb-4">
          {claim.aiAnalysis ? (
            <div>
               <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getVerdictColor(claim.aiAnalysis.verdict)}`}>
                 <Cpu className="w-3 h-3 mr-1.5" />
                 IA: {getVerdictLabel(claim.aiAnalysis.verdict)} ({claim.aiAnalysis.confidence}%)
               </div>
               {claim.aiAnalysis.sources && claim.aiAnalysis.sources.length > 0 && (
                 <div className="mt-2">
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       setShowSources(!showSources);
                     }}
                     className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center font-medium transition-colors"
                   >
                     {showSources ? (
                        <>
                          Masquer les sources <ArrowUp className="w-3 h-3 ml-1" />
                        </>
                     ) : (
                        <>
                          Voir les sources ({claim.aiAnalysis.sources.length}) <ArrowDown className="w-3 h-3 ml-1" />
                        </>
                     )}
                   </button>
                   {showSources && (
                     <div className="mt-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-1">
                       <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                         {claim.aiAnalysis.sources.map((source, idx) => (
                           <li key={idx} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                             <a 
                               href={source.uri} 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="flex items-center justify-between p-2 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 group/link" 
                               onClick={(e) => e.stopPropagation()}
                               title={source.title}
                             >
                               <span className="truncate mr-2 flex-1 flex items-center">
                                 <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2 shrink-0"></span>
                                 {source.title}
                               </span>
                               <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:text-blue-500 transition-colors shrink-0" />
                             </a>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}
                 </div>
               )}
            </div>
          ) : (
             <button
                onClick={handleAnalyzeClaim}
                disabled={isAnalyzingClaim}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
             >
                {isAnalyzingClaim ? (
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                )}
                {isAnalyzingClaim ? "Analyse en cours..." : "Lancer l'analyse IA"}
             </button>
          )}
        </div>

        {/* Media URL Inputs */}
        <div className="mb-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
            Médias (Image / Vidéo)
          </label>
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                 <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => {
                    setImageUrlInput(e.target.value);
                    if (mediaCheck?.type === 'image') setMediaCheck(null);
                  }}
                  onKeyDown={(e) => handleInputKeyDown(e, 'image')}
                  placeholder="URL de l'image"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <button
                onClick={handleImagePreview}
                className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center whitespace-nowrap border border-indigo-100 dark:border-indigo-800"
                title="Afficher l'image"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                Aperçu
              </button>
              <button
                onClick={(e) => handleAiVerifyUrl(e, 'image')}
                disabled={analyzingMedia === 'image'}
                className="px-3 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium rounded-md hover:bg-violet-200 dark:hover:bg-violet-900/50 disabled:opacity-50 transition-colors flex items-center whitespace-nowrap border border-violet-100 dark:border-violet-800"
                title="Vérifier cette image avec l'IA"
              >
                {analyzingMedia === 'image' ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                Vérifier
              </button>
            </div>
            {/* Visual Indicator for Image Verification */}
            {mediaCheck && mediaCheck.type === 'image' && (
               <div className={`ml-1 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center border animate-in zoom-in ${getConfidenceColorClass(mediaCheck.confidence)}`}>
                  <Shield className="w-3 h-3 mr-1.5 fill-current" />
                  Crédibilité Image : {mediaCheck.confidence}%
               </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={videoUrlInput}
                onChange={(e) => {
                   setVideoUrlInput(e.target.value);
                   if (mediaCheck?.type === 'video') setMediaCheck(null);
                }}
                onKeyDown={(e) => handleInputKeyDown(e, 'video')}
                placeholder="URL Vidéo (YouTube, Vimeo, MP4)"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={handleVideoPreview}
                className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center whitespace-nowrap border border-indigo-100 dark:border-indigo-800"
                title="Afficher la vidéo"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                Aperçu
              </button>
               <button
                onClick={(e) => handleAiVerifyUrl(e, 'video')}
                disabled={analyzingMedia === 'video'}
                className="px-3 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium rounded-md hover:bg-violet-200 dark:hover:bg-violet-900/50 disabled:opacity-50 transition-colors flex items-center whitespace-nowrap border border-violet-100 dark:border-violet-800"
                title="Vérifier cette vidéo avec l'IA"
              >
                {analyzingMedia === 'video' ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                Vérifier
              </button>
            </div>
             {/* Visual Indicator for Video Verification */}
            {mediaCheck && mediaCheck.type === 'video' && (
               <div className={`ml-1 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center border animate-in zoom-in ${getConfidenceColorClass(mediaCheck.confidence)}`}>
                  <Shield className="w-3 h-3 mr-1.5 fill-current" />
                  Crédibilité Vidéo : {mediaCheck.confidence}%
               </div>
            )}
          </div>
        </div>

        {/* Low Balance Warning Alert */}
        {isBalanceCritical && !claim.userVote && (
           <div className="mb-4 mx-1 p-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg flex items-center text-xs text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>
                Attention : Votre solde est bas. Il est nécessaire de conserver une réserve de <strong>{MIN_BALANCE_RESERVE} VXT</strong> après chaque vote.
              </span>
           </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${claim.userVote ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {claim.userVote ? 'Votre vote' : 'Voter sur cette affirmation'}
          </h4>

          {/* Vote Filters & History Toggle */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-xs overflow-x-auto pb-1 hide-scrollbar">
              <span className="text-slate-400 flex items-center whitespace-nowrap"><Filter className="w-3 h-3 mr-1" /> Filtrer:</span>
              {[
                { type: VoteType.TRUE, label: 'Vrai', activeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800' },
                { type: VoteType.FALSE, label: 'Faux', activeClass: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800' },
                { type: VoteType.MANIPULATED, label: 'Manipulé', activeClass: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800' },
                { type: VoteType.UNCERTAIN, label: 'Non vérifié', activeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' }
              ].map((filter) => (
                <button
                  key={filter.type}
                  onClick={(e) => handleFilterClick(e, filter.type)}
                  className={`px-2 py-0.5 rounded-md border transition-colors whitespace-nowrap ${
                    filterVoteType === filter.type 
                      ? `${filter.activeClass} border-2 border-indigo-600 dark:border-indigo-600`
                      : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
              {filterVoteType && (
                <button 
                  onClick={(e) => handleFilterClick(e, null)}
                  className="text-slate-400 hover:text-slate-600 px-1"
                  title="Réinitialiser"
                >
                  ✕
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVoteHistoryDetails(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Voir le journal détaillé des votes"
                >
                  <List className="w-4 h-4" />
                </button>

                {/* Toggle History */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllHistory(!showAllHistory);
                  }}
                  className={`flex-shrink-0 flex items-center px-2 py-1 text-[10px] font-medium rounded-full border transition-colors ${
                    showAllHistory 
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' 
                      : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:hover:text-slate-300'
                  }`}
                  title={showAllHistory ? "Afficher seulement les votes récents" : "Afficher tout l'historique"}
                >
                  <History className="w-3 h-3 mr-1" />
                  {showAllHistory ? "Historique complet" : "Votes actifs (30j)"}
                </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm flex-wrap gap-y-2">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 hide-scrollbar max-w-full">
              {visibleVotes.map((item) => {
                const isSelected = claim.userVote === item.type;
                const itemCost = getVoteCost(item.type);
                const canAfford = currentUser.walletBalance >= itemCost;
                
                // New logic: Check if reserve is met after this potential vote
                const reserveMet = (currentUser.walletBalance - itemCost) >= MIN_BALANCE_RESERVE;
                
                // Disable if: not selected AND (cant afford OR reserve not met)
                const isDisabled = !isSelected && (!canAfford || !reserveMet);
                
                const percentage = totalDisplayVotes > 0 ? Math.round((item.count / totalDisplayVotes) * 100) : 0;

                // Determine tooltip message
                let tooltip = `Voter (Coût: ${itemCost} VXT)`;
                if (isDisabled) {
                   if (!canAfford) tooltip = `Solde insuffisant (${currentUser.walletBalance} VXT) - Requis: ${itemCost} VXT`;
                   else if (!reserveMet) tooltip = `Solde après vote < ${MIN_BALANCE_RESERVE} VXT (Réserve requise)`;
                }

                return (
                  <div key={item.type} className="flex items-center relative flex-shrink-0 group/vote-btn">
                    {/* Render Flying Coin if this button triggered animation */}
                    {animatingVote === item.type && <FlyingCoin amount={itemCost} />}
                    
                    <button 
                      onClick={(e) => handleVoteClick(e, item.type)}
                      disabled={isDisabled}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
                        isSelected 
                          ? `border-2 ring-2 ring-offset-1 ${item.ringColor} ${item.borderColor} ${item.selectedColor.replace('text', 'bg').replace('900', '100').replace('200', '900')} shadow-md font-bold transform scale-105 z-10 dark:ring-offset-slate-900` 
                          : isDisabled
                            ? 'bg-slate-50 border border-slate-100 text-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-600 cursor-not-allowed'
                            : `border border-transparent ${filterVoteType === item.type ? item.color + ' bg-opacity-10 ' + item.color.replace('text', 'bg') : item.hoverBg} text-slate-500 dark:text-slate-400 hover:${item.color.replace('text-', 'text-')}`
                      } ${isSelected ? item.selectedColor : ''}`}
                      title={tooltip}
                    >
                      <item.icon className={`w-4 h-4 ${isSelected ? 'fill-current' : ''}`} />
                      
                      {/* Added Label text */}
                      <span className="ml-1.5 text-sm font-medium hidden sm:inline">{item.label}</span>
                      
                      {/* Added Check Icon if Selected */}
                      {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}

                      <span className="ml-1.5">{item.count}</span>
                      {totalDisplayVotes > 0 && (
                        <span className="text-[10px] opacity-75 ml-1.5 font-medium">
                          ({percentage}%)
                        </span>
                      )}
                      
                      {/* Integrated Timestamp */}
                      {isSelected && claim.userVoteTimestamp && (
                        <span className="ml-2 pl-2 border-l border-current/20 text-[10px] font-normal opacity-90 hidden sm:inline-block">
                           {formatVoteDate(claim.userVoteTimestamp)}
                        </span>
                      )}
                    </button>
                    {!isSelected && (
                       <div className="ml-1 flex flex-col justify-center">
                         <span className={`flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border transition-colors ${
                           isDisabled 
                             ? 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800' 
                             : 'text-amber-600/60 dark:text-amber-400/60 bg-amber-50/50 dark:bg-amber-900/20 border-amber-100/50 dark:border-amber-800/30 opacity-80'
                         }`} title={tooltip}>
                           {isDisabled ? <AlertCircle className="w-3 h-3 mr-0.5" /> : <Coins className="w-3 h-3 mr-0.5 opacity-80" />}
                           -{itemCost}
                         </span>
                       </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center space-x-4 ml-auto">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHistoryModal(true);
                }}
                className="flex items-center space-x-1 px-2 py-1 rounded-full transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                title="Voir mon historique de transactions (Dépôts, Votes, Retraits)"
              >
                <Wallet className="w-4 h-4" />
                <span className="text-xs font-bold">{currentUser.walletBalance}</span>
              </button>

              <button 
                onClick={toggleComments}
                className={`flex items-center space-x-1 transition-colors ${showComments ? 'text-indigo-600 dark:text-indigo-400' : 'hover:text-indigo-600 dark:hover:text-indigo-400'}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{claim.comments.length}</span>
              </button>
              
              {/* Subscribe Button */}
              <button 
                onClick={handleSubscribe}
                className={`flex items-center space-x-1 transition-colors ${claim.isSubscribed ? 'text-indigo-600 font-medium dark:text-indigo-400' : 'hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500 dark:text-slate-400'}`}
                title={claim.isSubscribed ? "Désactiver les notifications" : "M'alerter des mises à jour"}
              >
                <Bell className={`w-4 h-4 ${claim.isSubscribed ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline text-xs">{claim.isSubscribed ? 'Suivi' : 'Suivre'}</span>
              </button>

              {/* Simplified Share Button */}
              <button 
                onClick={handleShare}
                className={`flex items-center space-x-1 transition-colors ${isCopied ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                title={isCopied ? "Lien copié !" : "Copier le lien"}
              >
                {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                <span className="text-xs hidden sm:inline">{isCopied ? 'Copié !' : 'Partager'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Comments Section */}
      {showComments && (
        <div 
          className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-5 cursor-default"
          onClick={handleCommentClick}
        >
          <div className="space-y-4 mb-4 max-h-64 overflow-y-auto custom-scrollbar">
            {claim.comments.length === 0 ? (
              <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-2">Aucun commentaire pour le moment. Soyez le premier à donner votre avis !</p>
            ) : (
              claim.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3 group">
                  <div className="bg-slate-200 dark:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                  </div>
                  <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">{comment.userName}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(comment.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          onClick={(e) => handleReportComment(e, comment.id)}
                          className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                          title="Signaler ce commentaire"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{comment.text}</p>
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
              placeholder="Ajouter un commentaire constructif..."
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400"
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
const TrophyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
)