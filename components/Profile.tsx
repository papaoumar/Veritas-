
import React, { useState, useMemo } from 'react';
import { User, Claim, VoteType, PaymentMethod, ExpertLevel } from '../types';
import { ClaimCard } from './ClaimCard';
import { Shield, Award, Activity, Clock, Wallet, CheckCircle, XCircle, AlertTriangle, FileText, CreditCard, Landmark, Save, TrendingUp, Target, Star, X, TrendingDown, Calendar, Zap, Users, Copy, Share2, DollarSign, Link } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'posts' | 'votes' | 'stats' | 'badges' | 'payment' | 'affiliation'>('posts');
  const [showChartModal, setShowChartModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(user.paymentConfig?.method || PaymentMethod.NONE);
  const [paypalEmail, setPaypalEmail] = useState(user.paymentConfig?.paypalEmail || '');
  const [iban, setIban] = useState(user.paymentConfig?.bankDetails?.iban || '');
  const [bic, setBic] = useState(user.paymentConfig?.bankDetails?.bic || '');
  const [ownerName, setOwnerName] = useState(user.paymentConfig?.bankDetails?.ownerName || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const myClaims = claims.filter(c => c.author.id === user.id);
  const myVotedClaims = claims.filter(c => c.userVote !== undefined);

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
      case ExpertLevel.MASTER: return 'text-purple-600 bg-purple-100 border-purple-200';
      case ExpertLevel.EXPERT: return 'text-emerald-600 bg-emerald-100 border-emerald-200';
      case ExpertLevel.ANALYST: return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-slate-400 bg-slate-100 border-slate-200';
    }
  };

  // Helper for Chart SVG
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

    // Helper to get coordinates
    const getX = (time: number) => padding + ((time - minTime) / timeRange) * (width - 2 * padding);
    const getY = (bal: number) => height - padding - ((bal - minBal) / balRange) * (height - 2 * padding);

    // Build path
    let pathD = `M ${getX(chartData[0].date)} ${getY(chartData[0].balance)}`;
    chartData.forEach(p => {
      pathD += ` L ${getX(p.date)} ${getY(p.balance)}`;
    });

    // Gradient area path
    const areaPathD = `${pathD} L ${getX(chartData[chartData.length - 1].date)} ${height - padding} L ${getX(chartData[0].date)} ${height - padding} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Axes Lines (Simplified) */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
        
        {/* Area Fill */}
        <path d={areaPathD} fill="url(#chartGradient)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data Points */}
        {chartData.map((p, i) => (
          <g key={i} className="group">
             <circle 
                cx={getX(p.date)} 
                cy={getY(p.balance)} 
                r="3" 
                className="fill-amber-500 stroke-white stroke-2 hover:r-5 transition-all cursor-pointer" 
             />
             {/* Simple Tooltip on Hover via CSS group */}
             <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <rect x={getX(p.date) - 40} y={getY(p.balance) - 35} width="80" height="25" rx="4" fill="#1e293b" />
                <text x={getX(p.date)} y={getY(p.balance) - 18} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                  {p.balance} VXT
                </text>
             </g>
          </g>
        ))}

        {/* Axis Labels */}
        <text x={padding} y={height - 5} fontSize="10" fill="#94a3b8">{new Date(minTime).toLocaleDateString()}</text>
        <text x={width - padding} y={height - 5} textAnchor="end" fontSize="10" fill="#94a3b8">Aujourd'hui</text>
      </svg>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Chart Modal */}
      {showChartModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowChartModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                Évolution du Solde (30 jours)
              </h3>
              <button onClick={() => setShowChartModal(false)} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
               <div className="flex justify-between items-end mb-6">
                 <div>
                   <p className="text-sm text-slate-500 mb-1">Solde Actuel</p>
                   <p className="text-3xl font-black text-slate-900 flex items-center">
                     {user.walletBalance} <span className="text-lg font-normal text-slate-500 ml-1">VXT</span>
                   </p>
                   <p className="text-xs text-emerald-600 font-bold mt-1">
                     ≈ ${(user.walletBalance * 0.01).toFixed(2)} USD
                   </p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-slate-500 flex items-center justify-end">
                      <Calendar className="w-3 h-3 mr-1" />
                      Période: 30 derniers jours
                    </p>
                    {chartData.length > 1 && (
                      <p className={`text-sm font-bold flex items-center justify-end ${user.walletBalance >= chartData[0].balance ? 'text-emerald-600' : 'text-red-500'}`}>
                        {user.walletBalance >= chartData[0].balance ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {user.walletBalance - chartData[0].balance > 0 ? '+' : ''}{user.walletBalance - chartData[0].balance} VXT
                      </p>
                    )}
                 </div>
               </div>

               {/* Chart Container */}
               <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 h-64 w-full">
                  {renderBalanceChart()}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row justify-between items-end -mt-12 mb-6 gap-4">
            <div className="flex items-end">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white object-cover"
              />
              <div className="ml-4 mb-1">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                  {user.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getShieldColor(user.expertLevel)}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user.expertLevel}
                  </div>
                  {/* Mini Badges Display */}
                  {badgesConfig.filter(b => b.condition).map(badge => (
                    <div key={badge.key} className={`p-1 rounded-full ${badge.bgClass} ${badge.colorClass}`} title={badge.name}>
                      <badge.icon className="w-3 h-3" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Level Progress */}
            <div className="w-full md:w-1/3 bg-slate-50 p-3 rounded-xl border border-slate-100">
               <div className="flex justify-between items-end mb-1">
                 <span className="text-xs font-bold text-slate-500 uppercase">Réputation</span>
                 <span className="text-sm font-bold text-indigo-700">{user.stats.reputationPoints} XP</span>
               </div>
               <div className="w-full bg-slate-200 rounded-full h-2">
                 <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
               </div>
               {levelInfo.next && (
                 <p className="text-[10px] text-slate-400 mt-1 text-right">
                   Prochain niveau: {levelInfo.next} ({levelInfo.target} XP)
                 </p>
               )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Clickable Balance Card */}
            <button 
              onClick={() => setShowChartModal(true)}
              className="bg-amber-50 hover:bg-amber-100 p-4 rounded-xl border border-amber-200 hover:border-amber-300 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
            >
              <Wallet className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
              <div className="flex items-center space-x-1">
                 <span className="text-xl font-bold text-slate-800">{user.walletBalance}</span>
                 <span className="text-xs font-normal text-slate-500">(${(user.walletBalance * 0.01).toFixed(2)})</span>
              </div>
              <span className="text-xs text-amber-700 uppercase font-semibold flex items-center mt-1">
                Solde VXT <TrendingUp className="w-3 h-3 ml-1" />
              </span>
            </button>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <Target className="w-6 h-6 text-indigo-500 mb-2" />
              <span className="text-xl font-bold text-slate-800">{user.stats.accuracyRate}%</span>
              <span className="text-xs text-slate-500 uppercase font-semibold">Précision</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <Activity className="w-6 h-6 text-emerald-500 mb-2" />
              <span className="text-xl font-bold text-slate-800">{user.stats.totalVerifications}</span>
              <span className="text-xs text-slate-500 uppercase font-semibold">Analyses</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <TrendingUp className="w-6 h-6 text-rose-500 mb-2" />
              <span className="text-xl font-bold text-slate-800">{user.stats.currentStreak}</span>
              <span className="text-xs text-slate-500 uppercase font-semibold">Série</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <Star className="w-6 h-6 text-purple-500 mb-2" />
              <span className="text-xl font-bold text-slate-800">{acquiredBadgesCount}</span>
              <span className="text-xs text-slate-500 uppercase font-semibold">Badges</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('posts')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'posts'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Mes Publications
          </button>
          <button
            onClick={() => setActiveTab('votes')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'votes'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Historique Votes
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'stats'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Performance Analyste
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
              activeTab === 'badges'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Award className="w-4 h-4 mr-1.5" />
            Badges
          </button>
          <button
            onClick={() => setActiveTab('affiliation')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
              activeTab === 'affiliation'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Users className="w-4 h-4 mr-1.5" />
            Affiliation
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
              activeTab === 'payment'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
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
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900">Aucune publication</h3>
                <p className="text-slate-500 mb-6">Vous n'avez pas encore soumis d'information à vérifier.</p>
                <button onClick={() => navigate('/submit')} className="text-indigo-600 font-medium hover:underline">
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
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900">Aucun vote</h3>
                <p className="text-slate-500">Participez à la vérification des faits pour gagner des jetons.</p>
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
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center">
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
                            <span className="text-2xl font-bold text-slate-800">{user.stats.accuracyRate}%</span>
                            <span className="block text-[8px] text-slate-500 uppercase">Succès</span>
                         </div>
                      </div>
                   </div>
                   <p className="text-center text-sm text-slate-500">
                     Sur <strong>{user.stats.totalVerifications}</strong> verifications, <strong>{user.stats.correctVerifications}</strong> ont été validées par le consensus final.
                   </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                     <TrendingUp className="w-5 h-5 mr-2 text-rose-500" />
                     Série actuelle (Streak)
                   </h3>
                   <div className="flex items-center justify-center py-4">
                      <div className="text-center">
                         <span className="text-5xl font-black text-rose-500 drop-shadow-sm">{user.stats.currentStreak}</span>
                         <span className="block text-sm font-medium text-slate-600 mt-2">Votes corrects d'affilée</span>
                      </div>
                   </div>
                   <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-xs text-rose-800 mt-2">
                      🔥 Continuez comme ça ! Une série de 10 accorde un bonus de +50 VXT.
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {badgesConfig.map(badge => (
              <div 
                key={badge.key} 
                className={`bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center text-center transition-all ${
                  badge.condition 
                    ? `border-2 ${badge.borderClass}` 
                    : 'border-slate-200 opacity-60 grayscale'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${badge.condition ? badge.bgClass + ' ' + badge.colorClass : 'bg-slate-100 text-slate-400'}`}>
                  <badge.icon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900">{badge.name}</h3>
                <p className="text-xs text-slate-500 mt-2">{badge.description}</p>
                {badge.condition ? (
                  <span className="mt-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full animate-in zoom-in">Acquis</span>
                ) : (
                  <span className="mt-3 px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">Verrouillé</span>
                )}
              </div>
            ))}
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
                  <div className="flex gap-3">
                     <button 
                       onClick={() => copyToClipboard(referralLink, 'link')}
                       className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors flex items-center"
                     >
                        <Link className="w-4 h-4 mr-2" />
                        Copier le lien
                     </button>
                     <div className="bg-indigo-800/50 backdrop-blur-sm px-4 py-2 rounded-lg font-mono text-sm border border-indigo-500/50 flex items-center">
                        Code: <strong className="ml-2 text-white">{referralCode}</strong>
                     </div>
                  </div>
               </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <Users className="w-8 h-8 text-blue-500 mb-3" />
                  <span className="text-3xl font-black text-slate-900">{referralStats.totalReferred}</span>
                  <span className="text-xs text-slate-500 uppercase font-semibold mt-1">Amis Parrainés</span>
               </div>
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <DollarSign className="w-8 h-8 text-emerald-500 mb-3" />
                  <span className="text-3xl font-black text-slate-900">{referralStats.totalEarnings}</span>
                  <span className="text-xs text-slate-500 uppercase font-semibold mt-1">VXT Gagnés</span>
               </div>
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                  <Clock className="w-8 h-8 text-amber-500 mb-3" />
                  <span className="text-3xl font-black text-slate-900">{referralStats.pendingEarnings}</span>
                  <span className="text-xs text-slate-500 uppercase font-semibold mt-1">VXT En Attente</span>
               </div>
            </div>

            {/* Copy Tools */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900">Vos outils de parrainage</h4>
               </div>
               <div className="p-6 space-y-6">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Votre lien unique</label>
                     <div className="flex">
                        <input 
                          type="text" 
                          readOnly 
                          value={referralLink} 
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-l-lg bg-slate-50 text-slate-600 text-sm focus:outline-none"
                        />
                        <button 
                          onClick={() => copyToClipboard(referralLink, 'link')}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 transition-colors flex items-center font-medium"
                        >
                           {copiedLink ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                           <span className="ml-2">{copiedLink ? 'Copié' : 'Copier'}</span>
                        </button>
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Votre code parrain</label>
                     <div className="flex">
                        <input 
                          type="text" 
                          readOnly 
                          value={referralCode} 
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-l-lg bg-slate-50 text-slate-600 text-sm font-mono focus:outline-none"
                        />
                        <button 
                          onClick={() => copyToClipboard(referralCode, 'code')}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 transition-colors flex items-center font-medium"
                        >
                           {copiedCode ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                           <span className="ml-2">{copiedCode ? 'Copié' : 'Copier'}</span>
                        </button>
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Partager sur les réseaux</label>
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
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Configuration de retrait</h3>
                <p className="text-slate-500 text-sm">Choisissez comment vous souhaitez recevoir vos revenus VXT.</p>
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
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-500'
                      }`}
                    >
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-2xl">
                        🅿️
                      </div>
                      <span className="font-bold">PayPal</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === PaymentMethod.BANK_TRANSFER 
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-500'
                      }`}
                    >
                      <Landmark className={`w-8 h-8 mb-2 ${paymentMethod === PaymentMethod.BANK_TRANSFER ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="font-bold">Virement Bancaire</span>
                    </button>
                  </div>

                  {/* PayPal Form */}
                  {paymentMethod === PaymentMethod.PAYPAL && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Adresse email PayPal</label>
                        <input 
                          type="email" 
                          required
                          value={paypalEmail}
                          onChange={(e) => setPaypalEmail(e.target.value)}
                          placeholder="votre.email@exemple.com"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg text-blue-800">
                        <p>Le paiement sera envoyé sous 48h après la demande de retrait. Des frais PayPal peuvent s'appliquer.</p>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Form */}
                  {paymentMethod === PaymentMethod.BANK_TRANSFER && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nom du titulaire</label>
                        <input 
                          type="text" 
                          required
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="Jean Dupont"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">IBAN</label>
                        <input 
                          type="text" 
                          required
                          value={iban}
                          onChange={(e) => setIban(e.target.value)}
                          placeholder="FR76 ...."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">BIC / SWIFT</label>
                        <input 
                          type="text" 
                          required
                          value={bic}
                          onChange={(e) => setBic(e.target.value)}
                          placeholder="ABCDFRPP"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod !== PaymentMethod.NONE && (
                    <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end">
                      {saveSuccess && (
                        <span className="text-emerald-600 text-sm font-medium mr-4 flex items-center animate-in fade-in">
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
