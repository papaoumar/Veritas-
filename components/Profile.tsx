
import React, { useState, useMemo } from 'react';
import { User, Claim, VoteType, PaymentMethod, ExpertLevel, Transaction } from '../types';
import { ClaimCard } from './ClaimCard';
import { SocialCard } from './SocialCard';
import { Shield, Award, Activity, Clock, Wallet, CheckCircle, XCircle, AlertTriangle, FileText, CreditCard, Landmark, Save, TrendingUp, Target, Star, X, TrendingDown, Calendar, Zap, Users, Copy, Share2, DollarSign, Link, Eye, Filter, ArrowUp, ArrowDown, ArrowUpRight, ArrowDownLeft, Download, Search, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileProps {
  user: User;
  claims: Claim[];
  onUpdate: (updatedClaim: Claim) => void;
  onVote: (claimId: string, voteType: VoteType) => void;
  onUpdateUser: (updatedUser: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, claims, onUpdate, onVote, onUpdateUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'posts' | 'votes' | 'stats' | 'badges' | 'transactions' | 'payment' | 'affiliation'>('posts');
  const [showChartModal, setShowChartModal] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [accuracyFilter, setAccuracyFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  
  // Transaction History State
  const [txSort, setTxSort] = useState<'desc' | 'asc'>('desc');
  const [txFilter, setTxFilter] = useState<string>('');

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(user.paymentConfig?.method || PaymentMethod.NONE);
  const [paypalEmail, setPaypalEmail] = useState(user.paymentConfig?.paypalEmail || '');
  const [iban, setIban] = useState(user.paymentConfig?.bankDetails?.iban || '');
  const [bic, setBic] = useState(user.paymentConfig?.bankDetails?.bic || '');
  const [ownerName, setOwnerName] = useState(user.paymentConfig?.bankDetails?.ownerName || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const myClaims = claims.filter(c => c.author.id === user.id);
  const myVotedClaims = claims.filter(c => c.userVote !== undefined);

  // Filtered Claims for Stats Tab
  const filteredStatsClaims = useMemo(() => {
    if (accuracyFilter === 'all') return myClaims;
    return myClaims.filter(claim => {
      const score = claim.aiAnalysis?.confidence || 0;
      if (accuracyFilter === 'high') return score >= 80;
      if (accuracyFilter === 'medium') return score >= 50 && score < 80;
      if (accuracyFilter === 'low') return score < 50;
      return false;
    });
  }, [myClaims, accuracyFilter]);

  // Transaction Sorting & Filtering
  const filteredTransactions = useMemo(() => {
    let txs = user.transactions || [];
    
    // Filter by search text
    if (txFilter) {
      const lowerFilter = txFilter.toLowerCase();
      txs = txs.filter(t => t.description.toLowerCase().includes(lowerFilter) || t.type.toLowerCase().includes(lowerFilter));
    }

    // Sort
    return [...txs].sort((a, b) => {
      return txSort === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });
  }, [user.transactions, txSort, txFilter]);

  // Financial Stats
  const financialStats = useMemo(() => {
    const txs = user.transactions || [];
    const totalEarned = txs.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = txs.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { totalEarned, totalSpent };
  }, [user.transactions]);

  // Referral Info
  const referralCode = user.referralStats?.code || (user.name.substring(0, 3).toUpperCase() + '-' + user.id.slice(-4).toUpperCase());
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
  const referralStats = user.referralStats || { totalReferred: 0, totalEarnings: 0, pendingEarnings: 0 };

  // Logic for next level calculation
  const getNextLevelInfo = () => {
    switch(user.expertLevel) {
      case ExpertLevel.OBSERVER: return { next: ExpertLevel.ANALYST, target: 500 };
      case ExpertLevel.ANALYST: return { next: ExpertLevel.EXPERT, target: 2000 };
      case ExpertLevel.EXPERT: return { next: ExpertLevel.MASTER, target: 5000 };
      default: return { next: null, target: 0 };
    }
  };
  
  const levelInfo = getNextLevelInfo();
  const progressPercent = levelInfo.next ? Math.min(100, Math.max(0, (user.stats.reputationPoints / levelInfo.target) * 100)) : 100;

  // Badges Configuration
  const badgesConfig = [
    {
      key: 'certified',
      name: 'Vérificateur Certifié',
      description: 'Précision supérieure à 80%.',
      icon: Target,
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-100',
      borderClass: 'border-emerald-200 ring-emerald-50',
      condition: user.stats.accuracyRate > 80
    },
    {
      key: 'centurion',
      name: 'Centurion',
      description: 'Plus de 100 votes effectués.',
      icon: Award,
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-100',
      borderClass: 'border-amber-200 ring-amber-50',
      condition: user.stats.totalVerifications >= 100
    },
    {
      key: 'streak',
      name: 'Imbattable',
      description: 'Série de 10 votes corrects consécutifs.',
      icon: Zap,
      colorClass: 'text-rose-600',
      bgClass: 'bg-rose-100',
      borderClass: 'border-rose-200 ring-rose-50',
      condition: user.stats.currentStreak >= 10
    },
    {
      key: 'master',
      name: 'Maître Vérificateur',
      description: 'Atteindre le rang ultime d\'Expert.',
      icon: Star,
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-100',
      borderClass: 'border-purple-200 ring-purple-50',
      condition: user.expertLevel === ExpertLevel.MASTER
    }
  ];

  const acquiredBadgesCount = badgesConfig.filter(b => b.condition).length;

  // --- CHART LOGIC ---
  const chartData = useMemo(() => {
    if (!user.transactions) return [];

    // 1. Get transactions sorted by date (newest first)
    const sortedTxs = [...user.transactions].sort((a, b) => b.timestamp - a.timestamp);
    
    // 2. Filter last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentTxs = sortedTxs.filter(t => t.timestamp > thirtyDaysAgo);

    // 3. Reconstruct balance history
    // Start with current balance and work backwards
    let currentBalance = user.walletBalance;
    const history = [{ date: Date.now(), balance: currentBalance, type: 'CURRENT' }];

    // Loop through recent transactions (newest to oldest)
    for (const tx of recentTxs) {
      // Previous balance = Current Balance - Transaction Amount
      // (e.g. Current 100, Tx was +10, so Previous was 90)
      currentBalance = currentBalance - tx.amount;
      history.push({ date: tx.timestamp, balance: currentBalance, type: tx.type });
    }
    
    // Add a point for 30 days ago with the last calculated balance (start of period)
    history.push({ date: thirtyDaysAgo, balance: currentBalance, type: 'START' });

    // Return sorted oldest to newest for charting
    return history.sort((a, b) => a.date - b.date);
  }, [user.transactions, user.walletBalance]);

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedUser = {
      ...user,
      paymentConfig: {
        method: paymentMethod,
        paypalEmail: paymentMethod === PaymentMethod.PAYPAL ? paypalEmail : undefined,
        bankDetails: paymentMethod === PaymentMethod.BANK_TRANSFER ? {
          iban,
          bic,
          ownerName
        } : undefined
      }
    };

    onUpdateUser(updatedUser);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getShieldColor = (level: ExpertLevel) => {
    switch (level) {
      case ExpertLevel.MASTER: return 'text-purple-600 bg-purple-100 border-purple-200 dark:bg-purple-900/40 dark:border-purple-800 dark:text-purple-300';
      case ExpertLevel.EXPERT: return 'text-emerald-600 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-800 dark:text-emerald-300';
      case ExpertLevel.ANALYST: return 'text-blue-600 bg-blue-100 border-blue-200 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300';
      default: return 'text-slate-400 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
    }
  };

  const getTxDetails = (tx: Transaction) => {
    switch(tx.type) {
      case 'DEPOSIT': return { icon: ArrowDownLeft, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Dépôt' };
      case 'WITHDRAWAL': return { icon: ArrowUpRight, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Retrait' };
      case 'VOTE': return { icon: CheckCircle, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Vote' };
      case 'EARNING': return { icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Gain' };
      default: return { icon: Coins, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Transaction' };
    }
  };

  const renderBalanceChart = () => {
    if (chartData.length < 2) return <p className="text-center text-slate-400 py-10">Pas assez de données pour afficher le graphique.</p>;

    const width = 600;
    const height = 200;
    const padding = 20;

    const minTime = chartData[0].date;
    const maxTime = chartData[chartData.length - 1].date;
    const timeRange = maxTime - minTime || 1;

    const balances = chartData.map(d => d.balance);
    const minBal = Math.min(...balances);
    const maxBal = Math.max(...balances);
    const balRange = maxBal - minBal || 1;

    const getX = (time: number) => padding + ((time - minTime) / timeRange) * (width - 2 * padding);
    const getY = (bal: number) => height - padding - ((bal - minBal) / balRange) * (height - 2 * padding);

    let pathD = `M ${getX(chartData[0].date)} ${getY(chartData[0].balance)}`;
    chartData.forEach(p => {
      pathD += ` L ${getX(p.date)} ${getY(p.balance)}`;
    });

    const areaPathD = `${pathD} L ${getX(chartData[chartData.length - 1].date)} ${height - padding} L ${getX(chartData[0].date)} ${height - padding} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
        <path d={areaPathD} fill="url(#chartGradient)" />
        <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {chartData.map((p, i) => (
          <g key={i} className="group">
             <circle 
                cx={getX(p.date)} 
                cy={getY(p.balance)} 
                r="3" 
                className="fill-amber-500 stroke-white stroke-2 hover:r-5 transition-all cursor-pointer" 
             />
             <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <rect x={getX(p.date) - 40} y={getY(p.balance) - 35} width="80" height="25" rx="4" fill="#1e293b" />
                <text x={getX(p.date)} y={getY(p.balance) - 18} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                  {p.balance} VXT
                </text>
             </g>
          </g>
        ))}
        <text x={padding} y={height - 5} fontSize="10" fill="#94a3b8">{new Date(minTime).toLocaleDateString()}</text>
        <text x={width - padding} y={height - 5} textAnchor="end" fontSize="10" fill="#94a3b8">Aujourd'hui</text>
      </svg>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* SocialCard Preview Modal */}
      {showCardPreview && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowCardPreview(false)}
        >
          <div className="max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
             <button 
               onClick={() => setShowCardPreview(false)}
               className="absolute -top-12 right-0 text-white hover:text-slate-200 transition-colors"
             >
               <X className="w-8 h-8" />
             </button>
             <SocialCard user={user} currentUser={user} />
             <p className="text-center text-white mt-4 text-sm opacity-80">Voici comment votre profil apparaît aux autres membres.</p>
          </div>
        </div>
      )}

      {/* Chart Modal */}
      {showChartModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowChartModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                Évolution du Solde (30 jours)
              </h3>
              <button onClick={() => setShowChartModal(false)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
               <div className="flex justify-between items-end mb-6">
                 <div>
                   <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Solde Actuel</p>
                   <p className="text-3xl font-black text-slate-900 dark:text-white flex items-center">
                     {user.walletBalance} <span className="text-lg font-normal text-slate-500 ml-1">VXT</span>
                   </p>
                   <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                     ≈ ${(user.walletBalance * 0.01).toFixed(2)} USD
                   </p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-end">
                      <Calendar className="w-3 h-3 mr-1" />
                      Période: 30 derniers jours
                    </p>
                    {chartData.length > 1 && (
                      <p className={`text-sm font-bold flex items-center justify-end ${user.walletBalance >= chartData[0].balance ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {user.walletBalance >= chartData[0].balance ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {user.walletBalance - chartData[0].balance > 0 ? '+' : ''}{user.walletBalance - chartData[0].balance} VXT
                      </p>
                    )}
                 </div>
               </div>

               <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 p-4 h-64 w-full">
                  {renderBalanceChart()}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
        <div className="h-24 sm:h-32 bg-gradient-to-r from-indigo-600 to-violet-600 relative overflow-hidden">
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        <div className="px-4 sm:px-8 pb-8">
          <div className="relative flex flex-col md:flex-row justify-between items-center md:items-end -mt-10 sm:-mt-12 mb-6 gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end text-center sm:text-left">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-md bg-white dark:bg-slate-700 object-cover"
              />
              <div className="mt-2 sm:ml-4 sm:mb-1">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                   <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center">
                     {user.name}
                   </h1>
                   <button 
                     onClick={() => setShowCardPreview(true)}
                     className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-600 transition-colors"
                     title="Aperçu de votre carte publique"
                   >
                     <Eye className="w-4 h-4" />
                   </button>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                  <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase border ${getShieldColor(user.expertLevel)}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user.expertLevel}
                  </div>
                  {badgesConfig.filter(b => b.condition).map(badge => (
                    <div key={badge.key} className={`p-1 rounded-full ${badge.bgClass} ${badge.colorClass}`} title={badge.name}>
                      <badge.icon className="w-3 h-3" />
                    </div>
                  ))}
                </div>
                
                {user.bio && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 text-center sm:text-left leading-relaxed max-w-lg hidden sm:block">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>
            
            <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
               <div className="flex justify-between items-end mb-1">
                 <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Réputation</span>
                 <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{user.stats.reputationPoints} XP</span>
               </div>
               <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                 <div className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
               </div>
               {levelInfo.next && (
                 <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-right">
                   Prochain niveau: {levelInfo.next} ({levelInfo.target} XP)
                 </p>
               )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <button 
              onClick={() => setShowChartModal(true)}
              className="md:col-span-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800/50 hover:border-amber-300 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-2 mb-1">
                 <Wallet className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                 <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{user.walletBalance}</span>
                 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">VXT</span>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-500 uppercase font-bold tracking-wide">
                Solde Actuel
              </span>
            </button>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-bold text-slate-800 dark:text-white">{user.stats.accuracyRate}%</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Précision</span>
            </div>
            
             <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
               <span className="text-lg font-bold text-slate-800 dark:text-white">{user.socialStats?.followers || 0}</span>
               <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Abonnés</span>
            </div>

             <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
               <span className="text-lg font-bold text-slate-800 dark:text-white">{user.socialStats?.following || 0}</span>
               <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Suivis</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-bold text-slate-800 dark:text-white">{user.stats.totalVerifications}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Analyses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 -mx-4 px-4 sm:mx-0 sm:px-0">
        <nav className="-mb-px flex space-x-8 overflow-x-auto pb-1 hide-scrollbar">
          <button
            onClick={() => setActiveTab('posts')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'posts'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            Mes Publications
          </button>
          <button
            onClick={() => setActiveTab('votes')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'votes'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            Historique Votes
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'stats'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
              activeTab === 'badges'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <Award className="w-4 h-4 mr-1.5" />
            Badges
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
              activeTab === 'transactions'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <Coins className="w-4 h-4 mr-1.5" />
            Historique VXT
          </button>
          <button
            onClick={() => setActiveTab('affiliation')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
              activeTab === 'affiliation'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <Users className="w-4 h-4 mr-1.5" />
            Affiliation
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
              activeTab === 'payment'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <CreditCard className="w-4 h-4 mr-1.5" />
            Paiement
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {myClaims.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Aucune publication</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Vous n'avez pas encore soumis d'information à vérifier.</p>
                <button onClick={() => navigate('/submit')} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                  Créer ma première soumission
                </button>
              </div>
            ) : (
              myClaims.map(claim => (
                <ClaimCard
                  key={claim.id}
                  claim={claim}
                  onClick={() => navigate(`/claim/${claim.id}`)}
                  currentUser={user}
                  onUpdate={onUpdate}
                  onVote={onVote}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'votes' && (
          <div className="space-y-4">
             {myVotedClaims.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Aucun vote</h3>
                <p className="text-slate-500 dark:text-slate-400">Participez à la vérification des faits pour gagner des jetons.</p>
              </div>
            ) : (
              myVotedClaims.map(claim => (
                <div key={claim.id} className="relative">
                   <div className="absolute -left-2 top-4 z-10">
                      {claim.userVote === VoteType.TRUE && <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-full border border-emerald-200 shadow-sm" title="Vous avez voté VRAI"><CheckCircle className="w-5 h-5" /></div>}
                      {claim.userVote === VoteType.FALSE && <div className="bg-red-100 text-red-600 p-1.5 rounded-full border border-red-200 shadow-sm" title="Vous avez voté FAUX"><XCircle className="w-5 h-5" /></div>}
                      {claim.userVote === VoteType.MANIPULATED && <div className="bg-amber-100 text-amber-600 p-1.5 rounded-full border border-amber-200 shadow-sm" title="Vous avez voté MANIPULÉ"><AlertTriangle className="w-5 h-5" /></div>}
                   </div>
                   <div className="pl-6">
                      <ClaimCard
                        claim={claim}
                        onClick={() => navigate(`/claim/${claim.id}`)}
                        currentUser={user}
                        onUpdate={onUpdate}
                        onVote={onVote}
                      />
                   </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                   <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                     <Target className="w-5 h-5 mr-2 text-indigo-500" />
                     Précision des analyses
                   </h3>
                   <div className="flex items-center justify-center py-6">
                      <div className="relative w-32 h-32">
                         <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#e2e8f0"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#4f46e5"
                              strokeWidth="3"
                              strokeDasharray={`${user.stats.accuracyRate}, 100`}
                              className="animate-[spin_1s_ease-out_reverse]"
                            />
                         </svg>
                         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <span className="text-2xl font-bold text-slate-800 dark:text-white">{user.stats.accuracyRate}%</span>
                            <span className="block text-[8px] text-slate-500 dark:text-slate-400 uppercase">Succès</span>
                         </div>
                      </div>
                   </div>
                   <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                     Sur <strong>{user.stats.totalVerifications}</strong> verifications, <strong>{user.stats.correctVerifications}</strong> ont été validées par le consensus final.
                   </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                   <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                     <TrendingUp className="w-5 h-5 mr-2 text-rose-500" />
                     Série actuelle (Streak)
                   </h3>
                   <div className="flex items-center justify-center py-4">
                      <div className="text-center">
                         <span className="text-5xl font-black text-rose-500 drop-shadow-sm">{user.stats.currentStreak}</span>
                         <span className="block text-sm font-medium text-slate-600 dark:text-slate-300 mt-2">Votes corrects d'affilée</span>
                      </div>
                   </div>
                   <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-lg p-3 text-xs text-rose-800 dark:text-rose-300 mt-2 text-center">
                      🔥 Continuez comme ça ! Une série de 10 accorde un bonus de +50 VXT.
                   </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center">
                    <Filter className="w-5 h-5 mr-2 text-indigo-500" />
                    Filtrer mes publications par Précision IA
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setAccuracyFilter('all')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${accuracyFilter === 'all' ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
                    >
                      Toutes
                    </button>
                    <button 
                      onClick={() => setAccuracyFilter('high')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${accuracyFilter === 'high' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
                    >
                      Haute {'>'} 80%
                    </button>
                    <button 
                      onClick={() => setAccuracyFilter('medium')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${accuracyFilter === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
                    >
                      Moyenne 50-80%
                    </button>
                    <button 
                      onClick={() => setAccuracyFilter('low')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${accuracyFilter === 'low' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-red-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
                    >
                      Faible {'<'} 50%
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredStatsClaims.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm italic">
                      Aucune publication ne correspond à ce critère.
                    </div>
                  ) : (
                    filteredStatsClaims.map(claim => (
                      <div key={claim.id} className="relative group">
                        <ClaimCard
                          claim={claim}
                          onClick={() => navigate(`/claim/${claim.id}`)}
                          currentUser={user}
                          onUpdate={onUpdate}
                          onVote={onVote}
                        />
                        <div className="absolute top-4 right-4 z-10">
                            {claim.aiAnalysis ? (
                              <span className={`px-2 py-1 rounded text-xs font-bold shadow-sm ${
                                  claim.aiAnalysis.confidence >= 80 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                  claim.aiAnalysis.confidence >= 50 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                  'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                IA: {claim.aiAnalysis.confidence}%
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 shadow-sm">
                                IA: N/A
                              </span>
                            )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {badgesConfig.map(badge => (
              <div 
                key={badge.key} 
                className={`bg-white dark:bg-slate-800 p-6 rounded-xl border shadow-sm flex flex-col items-center text-center transition-all ${
                  badge.condition 
                    ? `border-2 ${badge.borderClass} dark:border-opacity-50` 
                    : 'border-slate-200 dark:border-slate-700 opacity-60 grayscale'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${badge.condition ? badge.bgClass + ' ' + badge.colorClass : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                  <badge.icon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">{badge.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{badge.description}</p>
                {badge.condition ? (
                  <span className="mt-3 px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs font-bold rounded-full animate-in zoom-in">Acquis</span>
                ) : (
                  <span className="mt-3 px-2 py-1 bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 text-xs font-bold rounded-full">Verrouillé</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             
             {/* Financial Summary Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                   <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Solde Actuel</p>
                   <p className="text-2xl font-black text-slate-900 dark:text-white">{user.walletBalance} <span className="text-sm font-normal text-slate-500">VXT</span></p>
                   <p className="text-xs text-emerald-600 mt-1">Disponible pour retrait</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                   <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Total Gagné</p>
                   <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+{financialStats.totalEarned} <span className="text-sm font-normal text-slate-500">VXT</span></p>
                   <p className="text-xs text-slate-400 mt-1">Cumulé sur la période</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                   <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Dépensé / Retiré</p>
                   <p className="text-2xl font-black text-orange-600 dark:text-orange-400">-{financialStats.totalSpent} <span className="text-sm font-normal text-slate-500">VXT</span></p>
                   <p className="text-xs text-slate-400 mt-1">Votes et retraits</p>
                </div>
             </div>

             {/* Filter & Sort Controls */}
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="relative w-full sm:w-64">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                   <input 
                     type="text" 
                     placeholder="Rechercher une transaction..." 
                     value={txFilter}
                     onChange={(e) => setTxFilter(e.target.value)}
                     className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                   />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                   <button 
                     onClick={() => setTxSort(prev => prev === 'desc' ? 'asc' : 'desc')}
                     className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center transition-colors border border-slate-200 dark:border-slate-600"
                   >
                      Date
                      {txSort === 'desc' ? <ArrowDown className="w-4 h-4 ml-1.5" /> : <ArrowUp className="w-4 h-4 ml-1.5" />}
                   </button>
                   <button 
                     className="px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg flex items-center transition-colors border border-indigo-200 dark:border-indigo-800"
                     title="Exporter en CSV (Simulation)"
                     onClick={() => alert("Fonctionnalité d'export CSV simulée.")}
                   >
                      <Download className="w-4 h-4 mr-1.5" />
                      Export
                   </button>
                </div>
             </div>

             {/* Transactions Table */}
             <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                         <tr>
                            <th className="px-6 py-3 font-bold">Type</th>
                            <th className="px-6 py-3 font-bold">Description</th>
                            <th className="px-6 py-3 font-bold">Date</th>
                            <th className="px-6 py-3 font-bold text-right">Montant</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                         {filteredTransactions.length === 0 ? (
                            <tr>
                               <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 italic">
                                  Aucune transaction trouvée.
                               </td>
                            </tr>
                         ) : (
                            filteredTransactions.map((tx) => {
                               const details = getTxDetails(tx);
                               const Icon = details.icon;
                               return (
                                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                     <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                           <div className={`p-1.5 rounded-full mr-3 ${details.bg} ${details.color} bg-opacity-50`}>
                                              <Icon className="w-4 h-4" />
                                           </div>
                                           <span className={`font-medium ${details.color} text-xs uppercase tracking-wide`}>
                                              {details.label}
                                           </span>
                                        </div>
                                     </td>
                                     <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                                        {tx.description}
                                     </td>
                                     <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-xs">
                                        {new Date(tx.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        <span className="ml-2 text-slate-400">{new Date(tx.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                     </td>
                                     <td className={`px-6 py-4 text-right font-bold ${tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount} VXT
                                     </td>
                                  </tr>
                               );
                            })
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'affiliation' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white relative overflow-hidden shadow-lg">
               <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10">
                  <Users className="w-48 h-48" />
               </div>
               <div className="relative z-10 max-w-lg">
                  <h3 className="text-2xl font-bold mb-2">Invitez des amis, gagnez des VXT</h3>
                  <p className="text-blue-100 mb-6">
                    Partagez la vérité. Recevez <strong>50 VXT</strong> pour chaque ami qui s'inscrit et participe à sa première vérification. Votre ami reçoit également un bonus de bienvenue.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                     <button 
                       onClick={() => copyToClipboard(referralLink, 'link')}
                       className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors flex items-center justify-center"
                     >
                        <Link className="w-4 h-4 mr-2" />
                        Copier le lien
                     </button>
                     <div className="bg-indigo-800/50 backdrop-blur-sm px-4 py-2 rounded-lg font-mono text-sm border border-indigo-500/50 flex items-center justify-center">
                        Code: <strong className="ml-2 text-white">{referralCode}</strong>
                     </div>
                  </div>
               </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
                  <Users className="w-8 h-8 text-blue-500 mb-3" />
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{referralStats.totalReferred}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">Amis Parrainés</span>
               </div>
               <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
                  <DollarSign className="w-8 h-8 text-emerald-500 mb-3" />
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{referralStats.totalEarnings}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">VXT Gagnés</span>
               </div>
               <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
                  <Clock className="w-8 h-8 text-amber-500 mb-3" />
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{referralStats.pendingEarnings}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">VXT En Attente</span>
               </div>
            </div>

            {/* Copy Tools */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-white">Vos outils de parrainage</h4>
               </div>
               <div className="p-6 space-y-6">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Votre lien unique</label>
                     <div className="flex">
                        <input 
                          type="text" 
                          readOnly 
                          value={referralLink} 
                          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-l-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm focus:outline-none min-w-0"
                        />
                        <button 
                          onClick={() => copyToClipboard(referralLink, 'link')}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 transition-colors flex items-center font-medium"
                        >
                           {copiedLink ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                           <span className="ml-2 hidden sm:inline">{copiedLink ? 'Copié' : 'Copier'}</span>
                        </button>
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Votre code parrain</label>
                     <div className="flex">
                        <input 
                          type="text" 
                          readOnly 
                          value={referralCode} 
                          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-l-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-mono focus:outline-none min-w-0"
                        />
                        <button 
                          onClick={() => copyToClipboard(referralCode, 'code')}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 transition-colors flex items-center font-medium"
                        >
                           {copiedCode ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                           <span className="ml-2 hidden sm:inline">{copiedCode ? 'Copié' : 'Copier'}</span>
                        </button>
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Partager sur les réseaux</label>
                     <div className="flex gap-3">
                        <button className="flex-1 py-2 bg-[#1DA1F2] text-white rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center">
                           Twitter
                        </button>
                        <button className="flex-1 py-2 bg-[#4267B2] text-white rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center">
                           Facebook
                        </button>
                        <button className="flex-1 py-2 bg-[#25D366] text-white rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center">
                           WhatsApp
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Configuration de retrait</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Choisissez comment vous souhaitez recevoir vos revenus VXT.</p>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleSavePayment}>
                  {/* Method Selection */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod(PaymentMethod.PAYPAL)}
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === PaymentMethod.PAYPAL 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm mb-2 text-2xl">
                        🅿️
                      </div>
                      <span className="font-bold">PayPal</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === PaymentMethod.BANK_TRANSFER 
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Landmark className={`w-8 h-8 mb-2 ${paymentMethod === PaymentMethod.BANK_TRANSFER ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      <span className="font-bold">Virement Bancaire</span>
                    </button>
                  </div>

                  {/* PayPal Form */}
                  {paymentMethod === PaymentMethod.PAYPAL && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adresse email PayPal</label>
                        <input 
                          type="email" 
                          required
                          value={paypalEmail}
                          onChange={(e) => setPaypalEmail(e.target.value)}
                          placeholder="votre.email@exemple.com"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-blue-800 dark:text-blue-300">
                        <p>Le paiement sera envoyé sous 48h après la demande de retrait. Des frais PayPal peuvent s'appliquer.</p>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Form */}
                  {paymentMethod === PaymentMethod.BANK_TRANSFER && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom du titulaire</label>
                        <input 
                          type="text" 
                          required
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="Jean Dupont"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">IBAN</label>
                        <input 
                          type="text" 
                          required
                          value={iban}
                          onChange={(e) => setIban(e.target.value)}
                          placeholder="FR76 ...."
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-mono bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">BIC / SWIFT</label>
                        <input 
                          type="text" 
                          required
                          value={bic}
                          onChange={(e) => setBic(e.target.value)}
                          placeholder="ABCDFRPP"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-mono bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod !== PaymentMethod.NONE && (
                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end">
                      {saveSuccess && (
                        <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mr-4 flex items-center animate-in fade-in">
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Sauvegardé avec succès
                        </span>
                      )}
                      <button 
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-md"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
