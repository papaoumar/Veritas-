
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ClaimCard } from './components/ClaimCard';
import { ClaimDetail } from './components/ClaimDetail';
import { SubmitClaim } from './components/SubmitClaim';
import { Profile } from './components/Profile';
import { Login } from './components/Login';
import { Settings } from './components/Settings';
import { Leaderboard } from './components/Leaderboard';
import { Network } from './components/Network';
import { Claim, User, VoteType, PaymentMethod, ExpertLevel, Transaction } from './types';
import { TrendingUp, Award, Zap, Coins, Wallet, X, CreditCard, Landmark, CheckCircle, ArrowRight, Shield } from 'lucide-react';
import { StorageService } from './storageService';

// Helpers
const calculateExpertLevel = (reputation: number): ExpertLevel => {
  if (reputation >= 5000) return ExpertLevel.MASTER;
  if (reputation >= 2000) return ExpertLevel.EXPERT;
  if (reputation >= 500) return ExpertLevel.ANALYST;
  return ExpertLevel.OBSERVER;
};

const VOTE_COST_STANDARD = 5; 
const VOTE_COST_UNCERTAIN = 3;
const VXT_EXCHANGE_RATE = 0.01; // 1 VXT = 0.01 € (100 VXT = 1€)

// Helper Component for Protected Routes
interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children?: React.ReactNode;
}

const ProtectedRoute = ({ isAuthenticated, children }: ProtectedRouteProps) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  // Init state with empty values, will load from StorageService
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sortOption, setSortOption] = useState('Récents');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Withdraw Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawStep, setWithdrawStep] = useState<'input' | 'processing' | 'success'>('input');

  // INITIALIZATION
  useEffect(() => {
    // Initialize DB seed if needed
    StorageService.init();

    // Load Data
    setClaims(StorageService.getClaims());
    
    // Check Session
    const currentUser = StorageService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
    }
  }, []);

  // Handle Dark Mode
  useEffect(() => {
    if (user?.preferences?.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.preferences?.darkMode]);

  // Recalculate level whenever reputation changes
  useEffect(() => {
    if (user) {
      const newLevel = calculateExpertLevel(user.stats.reputationPoints);
      if (newLevel !== user.expertLevel) {
        const updatedUser = { ...user, expertLevel: newLevel };
        setUser(updatedUser);
        StorageService.saveUser(updatedUser);
      }
    }
  }, [user?.stats.reputationPoints]);

  const handleCreateClaim = (newClaim: Claim) => {
    const updatedClaims = [newClaim, ...claims];
    setClaims(updatedClaims);
    StorageService.saveClaims(updatedClaims);
    navigate('/');
  };

  const handleUpdateClaim = (updatedClaim: Claim) => {
    const updatedClaims = claims.map(c => c.id === updatedClaim.id ? updatedClaim : c);
    setClaims(updatedClaims);
    StorageService.saveClaims(updatedClaims);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    StorageService.saveUser(updatedUser);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
    navigate('/');
  };

  const handleLogout = () => {
    StorageService.logout();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    if (user) {
      StorageService.deleteUser(user.id);
      handleLogout();
    }
  };

  // Gestion du vote avec logique économique et historique
  const handleVote = (claimId: string, voteType: VoteType) => {
    if (!user) return;

    const claimIndex = claims.findIndex(c => c.id === claimId);
    if (claimIndex === -1) return;

    const claim = claims[claimIndex];
    const now = Date.now();
    
    let newWalletBalance = user.walletBalance;
    let newBountyAmount = claim.bountyAmount;
    let transaction: Transaction | null = null;

    // Check cost logic based on vote type
    const voteCost = voteType === VoteType.UNCERTAIN ? VOTE_COST_UNCERTAIN : VOTE_COST_STANDARD;
    
    // All votes now have a cost (even uncertain)
    if (user.walletBalance < voteCost) {
      alert(`Solde insuffisant ! Il vous faut ${voteCost} VXT pour voter.`);
      return;
    }
    
    newWalletBalance -= voteCost;
    newBountyAmount += voteCost;
    
    transaction = {
      id: `tx_${Date.now()}`,
      type: 'VOTE',
      amount: -voteCost,
      description: `Vote sur: ${claim.title.substring(0, 25)}...`,
      timestamp: now
    };

    // Mise à jour de l'utilisateur
    const updatedUser = { 
      ...user, 
      walletBalance: newWalletBalance,
      transactions: transaction ? [transaction, ...(user.transactions || [])] : user.transactions,
      stats: {
        ...user.stats,
        totalVerifications: user.stats.totalVerifications + 1,
        reputationPoints: user.stats.reputationPoints + 5
      }
    };
    setUser(updatedUser);
    StorageService.saveUser(updatedUser);

    // Mise à jour de l'historique des votes
    let newVoteHistory = [...(claim.voteHistory || [])];
    const existingEntryIndex = newVoteHistory.findIndex(v => v.userId === user.id);
    
    if (existingEntryIndex >= 0) {
      newVoteHistory[existingEntryIndex] = {
        userId: user.id,
        voteType: voteType,
        timestamp: now
      };
    } else {
      newVoteHistory.push({
        userId: user.id,
        voteType: voteType,
        timestamp: now
      });
    }

    // Legacy counters update (optional but good for syncing)
    const updatedVotes = { ...claim.votes };
    if (claim.userVote) {
      updatedVotes[claim.userVote] = Math.max(0, updatedVotes[claim.userVote] - 1);
    }
    updatedVotes[voteType] = updatedVotes[voteType] + 1;

    // Mise à jour de la revendication
    const updatedClaim = { 
      ...claim, 
      votes: updatedVotes,
      voteHistory: newVoteHistory,
      bountyAmount: newBountyAmount,
      userVote: voteType,
      userVoteTimestamp: now
    };

    const newClaims = [...claims];
    newClaims[claimIndex] = updatedClaim;
    setClaims(newClaims);
    StorageService.saveClaims(newClaims);
  };

  // Withdrawal Logic
  const handleOpenWithdraw = () => {
    if (!user) return;
    if (user.paymentConfig?.method === PaymentMethod.NONE) {
      const confirmProfile = window.confirm("Vous n'avez pas configuré de méthode de paiement. Voulez-vous aller sur votre profil pour le faire ?");
      if (confirmProfile) {
        navigate('/profile');
      }
      return;
    }
    setShowWithdrawModal(true);
    setWithdrawStep('input');
    setWithdrawAmount('');
  };

  const handleConfirmWithdraw = () => {
    if (!user) return;
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > user.walletBalance) return;

    setWithdrawStep('processing');
    
    // Simulate API call
    setTimeout(() => {
      const transaction: Transaction = {
        id: `tx_${Date.now()}`,
        type: 'WITHDRAWAL',
        amount: -amount,
        description: `Retrait vers ${user.paymentConfig?.method === PaymentMethod.PAYPAL ? 'PayPal' : 'Banque'}`,
        timestamp: Date.now()
      };

      const updatedUser = { 
        ...user, 
        walletBalance: user.walletBalance - amount,
        transactions: [transaction, ...(user.transactions || [])]
      };
      setUser(updatedUser);
      StorageService.saveUser(updatedUser);
      
      setWithdrawStep('success');
      setTimeout(() => {
        setShowWithdrawModal(false);
      }, 3000);
    }, 2000);
  };

  const getSortedClaims = () => {
    let sorted = [...claims];
    
    // Filter by user preferences (blocked categories)
    if (user?.preferences?.blockedCategories) {
      sorted = sorted.filter(c => !user.preferences!.blockedCategories.includes(c.category));
    }

    switch (sortOption) {
      case 'Populaires':
        sorted.sort((a, b) => {
          const totalA = (Object.values(a.votes) as number[]).reduce((sum, v) => sum + v, 0);
          const totalB = (Object.values(b.votes) as number[]).reduce((sum, v) => sum + v, 0);
          return totalB - totalA;
        });
        break;
      case 'Controversés':
         sorted.sort((a, b) => {
           const commentsDiff = b.comments.length - a.comments.length;
           if (commentsDiff !== 0) return commentsDiff;
           return b.timestamp - a.timestamp;
         });
         break;
      case 'Mieux rémunérés':
        sorted.sort((a, b) => b.bountyAmount - a.bountyAmount);
        break;
      case 'Récents':
      default:
        sorted.sort((a, b) => b.timestamp - a.timestamp);
    }
    return sorted;
  };

  const FeedContent = () => {
    const sortedClaims = getSortedClaims();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Actualités à vérifier</h2>
          <div className="flex space-x-2">
            <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg p-2 focus:ring-indigo-500 hidden sm:block text-slate-700 dark:text-slate-200">
              <option>Toutes catégories</option>
              <option>Politique</option>
              <option>Tech</option>
            </select>
            <select 
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg p-2 focus:ring-indigo-500 cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <option value="Récents">Récents</option>
              <option value="Populaires">Populaires</option>
              <option value="Controversés">Controversés</option>
              <option value="Mieux rémunérés">Mieux rémunérés</option>
            </select>
          </div>
        </div>
        
        {sortedClaims.map(claim => (
          <ClaimCard 
            key={claim.id} 
            claim={{
              ...claim,
              // Map user vote from history for current user view
              userVote: user ? claim.voteHistory?.find(v => v.userId === user.id)?.voteType : undefined,
              userVoteTimestamp: user ? claim.voteHistory?.find(v => v.userId === user.id)?.timestamp : undefined
            }} 
            onClick={() => navigate(`/claim/${claim.id}`)}
            currentUser={user || { id: 'guest', name: 'Guest', walletBalance: 0 } as User}
            onUpdate={handleUpdateClaim}
            onVote={handleVote}
          />
        ))}
      </div>
    );
  };

  // Safe user object for child components that require it, fallback to minimal object if null
  // (Though protected routes prevent accessing those components if user is null)
  const safeUser = user!;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans relative transition-colors duration-300">
      <Navbar user={user || { id: 'guest', name: 'Visiteur', avatar: '', expertLevel: ExpertLevel.OBSERVER } as User} isAuthenticated={isAuthenticated} onLogout={handleLogout} />

      {/* Withdraw Modal */}
      {showWithdrawModal && user && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-indigo-600" />
                Retirer des fonds
              </h3>
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {withdrawStep === 'input' && (
                <>
                  <div className="mb-6">
                    <p className="text-sm text-slate-500 mb-4">
                      Convertissez vos jetons VXT en devise réelle.
                      <br />
                      <span className="font-bold text-indigo-600">Taux actuel : 100 VXT = 1.00 €</span>
                    </p>
                    
                    <div className="bg-indigo-50 rounded-xl p-4 mb-4 border border-indigo-100">
                       <div className="flex justify-between items-center text-sm mb-1">
                         <span className="text-indigo-800 font-medium">Méthode de réception</span>
                         <span className="text-indigo-600 font-bold flex items-center">
                           {user.paymentConfig?.method === PaymentMethod.PAYPAL ? 'PayPal' : 'Virement'}
                           {user.paymentConfig?.method === PaymentMethod.PAYPAL ? <CreditCard className="w-4 h-4 ml-1" /> : <Landmark className="w-4 h-4 ml-1" />}
                         </span>
                       </div>
                       <div className="text-xs text-indigo-500 truncate font-mono">
                         {user.paymentConfig?.method === PaymentMethod.PAYPAL 
                           ? user.paymentConfig?.paypalEmail 
                           : user.paymentConfig?.bankDetails?.iban}
                       </div>
                    </div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Montant à retirer (VXT)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Ex: 500"
                        className="block w-full pl-4 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-lg font-bold"
                        max={user.walletBalance}
                        min="100"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-bold">VXT</span>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                       <span className="text-slate-500">Disponibles : {user.walletBalance} VXT</span>
                       <span className="text-emerald-600 font-bold">
                         Montant estimé : {((parseInt(withdrawAmount) || 0) * VXT_EXCHANGE_RATE).toFixed(2)} €
                       </span>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmWithdraw}
                    disabled={!withdrawAmount || parseInt(withdrawAmount) > user.walletBalance || parseInt(withdrawAmount) < 100}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    Confirmer le retrait <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                  {parseInt(withdrawAmount) < 100 && withdrawAmount !== '' && (
                    <p className="text-center text-xs text-red-500 mt-2">Minimum de retrait : 100 VXT</p>
                  )}
                </>
              )}

              {withdrawStep === 'processing' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <h4 className="text-lg font-bold text-slate-800 mb-2">Traitement en cours...</h4>
                  <p className="text-slate-500 text-sm">Nous validons votre transaction.</p>
                </div>
              )}

              {withdrawStep === 'success' && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 animate-in zoom-in">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Retrait confirmé !</h4>
                  <p className="text-slate-600 text-sm mb-6">
                    Vos fonds ont été envoyés vers votre compte.
                    <br/>Vous recevrez une notification une fois le virement effectué.
                  </p>
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8">
            <Routes>
              <Route path="/" element={<FeedContent />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/leaderboard" element={<Leaderboard users={StorageService.getUsers()} />} />
              <Route path="/network" element={<Network users={StorageService.getUsers()} />} />
              <Route path="/submit" element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <SubmitClaim 
                    onSubmit={handleCreateClaim} 
                    onCancel={() => navigate('/')}
                    currentUser={safeUser}
                  />
                </ProtectedRoute>
              } />
              <Route path="/claim/:id" element={
                <ClaimDetail 
                  claims={claims}
                  onUpdateClaim={handleUpdateClaim}
                  currentUser={user}
                />
              } />
              <Route path="/profile" element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Profile 
                    user={safeUser}
                    claims={claims}
                    onUpdate={handleUpdateClaim}
                    onVote={handleVote}
                    onUpdateUser={handleUpdateUser}
                  />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Settings 
                    user={safeUser}
                    onUpdateUser={handleUpdateUser}
                    onDeleteAccount={handleDeleteAccount}
                  />
                </ProtectedRoute>
              } />
            </Routes>
          </div>

          {/* Right Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-4 space-y-6">
            
            {/* Wallet / Remuneration Widget - Only if authenticated */}
            {isAuthenticated && user && (user.preferences?.showBalance ?? true) && (
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-6 text-white shadow-md relative overflow-hidden animate-in fade-in slide-in-from-right-4">
                 <div className="absolute top-0 right-0 p-4 opacity-20">
                   <Coins className="w-24 h-24" />
                 </div>
                 <div className="relative z-10">
                   <h3 className="font-bold text-lg mb-1 flex items-center">
                     <Wallet className="w-5 h-5 mr-2" />
                     Mon Portefeuille
                   </h3>
                   <div className="mt-4">
                     <p className="text-amber-100 text-xs uppercase tracking-wide">Solde Actuel</p>
                     <p className="text-3xl font-black">{user.walletBalance} <span className="text-lg font-normal">VXT</span></p>
                   </div>
                   <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-sm">
                     <div>
                       <p className="opacity-80">En attente</p>
                       <p className="font-bold">45 VXT</p>
                     </div>
                     <button 
                       onClick={handleOpenWithdraw}
                       className="bg-white text-orange-600 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-orange-50 transition-colors shadow-sm"
                     >
                       Retirer
                     </button>
                   </div>
                 </div>
              </div>
            )}

            {!isAuthenticated && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 text-center">
                 <Shield className="w-12 h-12 mx-auto text-indigo-600 dark:text-indigo-400 mb-4" />
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white">Rejoignez Veritas</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Contribuez à la vérité et gagnez des récompenses.</p>
                 <button 
                   onClick={() => navigate('/login')}
                   className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                 >
                   Se connecter
                 </button>
              </div>
            )}

            {/* Premium CTA */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1">Veritas Premium</h3>
                  <p className="text-indigo-100 text-sm mb-4">Accès illimité à l'IA, historique complet et mode expert.</p>
                </div>
                <Award className="w-8 h-8 text-yellow-300 opacity-80" />
              </div>
              <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors">
                Essayer gratuitement
              </button>
            </div>

            {/* Trending Topics */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center mb-4">
                <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" />
                Tendances
              </h3>
              <ul className="space-y-3">
                {['Élections 2025', 'IA Générative', 'Réforme Retraites', 'Mission Mars', 'Vaccins ARNm'].map((topic, i) => (
                  <li key={i} className="flex items-center justify-between text-sm group cursor-pointer">
                    <span className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">#{topic.replace(/\s/g, '')}</span>
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full">{120 - i * 10} posts</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Fact Checkers Link (Mini Widget) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-amber-500" />
                  Top Vérificateurs
                </h3>
                <button onClick={() => navigate('/leaderboard')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Voir tout</button>
              </div>
              <div className="space-y-4">
                {StorageService.getUsers().sort((a,b) => b.stats.reputationPoints - a.stats.reputationPoints).slice(0, 3).map((u, i) => (
                  <div key={u.id} className="flex items-center space-x-3">
                    <img src={u.avatar} alt="User" className="w-8 h-8 rounded-full border border-slate-100 dark:border-slate-600" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate w-24">{u.name}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Score: {u.credibilityScore}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-500 font-bold">{u.stats.reputationPoints} XP</p>
                      </div>
                    </div>
                    {i === 0 && <Award className="w-4 h-4 text-yellow-500" />}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
