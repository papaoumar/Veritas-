import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ClaimCard } from './components/ClaimCard';
import { ClaimDetail } from './components/ClaimDetail';
import { SubmitClaim } from './components/SubmitClaim';
import { Profile } from './components/Profile';
import { Claim, User, VoteType, PaymentMethod } from './types';
import { TrendingUp, Award, Zap, Coins, Wallet, X, CreditCard, Landmark, CheckCircle, ArrowRight } from 'lucide-react';

// Mock Data
const INITIAL_USER: User = {
  id: 'u1',
  name: 'Alex D.',
  avatar: 'https://picsum.photos/100/100',
  isExpert: false,
  credibilityScore: 85,
  walletBalance: 1250, // VXT tokens
  paymentConfig: {
    method: PaymentMethod.NONE
  }
};

const VOTE_COST = 5; // Coût en VXT pour un vote Vrai/Faux
const VXT_EXCHANGE_RATE = 0.01; // 1 VXT = 0.01 € (100 VXT = 1€)

const INITIAL_CLAIMS: Claim[] = [
  {
    id: 'c3',
    title: "Deepfake : Le président annonce sa démission ?",
    content: "Une vidéo très réaliste circule sur Telegram montrant le président annonçant sa démission immédiate. L'analyse labiale semble suspecte et aucune source officielle ne confirme.",
    category: 'Politique',
    author: {
      id: 'u4',
      name: 'Veritas Watch',
      avatar: 'https://picsum.photos/103/103',
      isExpert: true,
      credibilityScore: 95,
      walletBalance: 8000,
    },
    timestamp: Date.now() - 7200000,
    votes: { TRUE: 2, FALSE: 89, MANIPULATED: 150, UNCERTAIN: 10 },
    userVote: VoteType.FALSE, // Exemple: l'utilisateur a déjà voté Faux
    userVoteTimestamp: Date.now() - 3600000, // Voté il y a 1 heure
    comments: [],
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    bountyAmount: 100,
  },
  {
    id: 'c1',
    title: "L'intelligence artificielle a créé une nouvelle langue indéchiffrable",
    content: "Des chercheurs affirment que deux modèles d'IA ont commencé à communiquer entre eux dans une langue inconnue que les développeurs ne peuvent pas désactiver. Cela pose un risque existentiel immédiat.",
    category: 'Tech',
    author: {
      id: 'u2',
      name: 'Sarah Connor',
      avatar: 'https://picsum.photos/101/101',
      isExpert: true,
      credibilityScore: 92,
      walletBalance: 4500,
    },
    timestamp: Date.now() - 86400000 * 2,
    votes: { TRUE: 12, FALSE: 45, MANIPULATED: 8, UNCERTAIN: 5 },
    comments: [
      {
        id: 'cm1',
        userId: 'u3',
        userName: 'Jean Bon',
        text: 'C\'est une vieille rumeur de 2017 concernant les bots de Facebook, ça a été debunké.',
        timestamp: Date.now() - 86000000 * 2,
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=60',
    bountyAmount: 50,
  },
  {
    id: 'c2',
    title: "Le gouvernement va interdire les voitures thermiques en 2028",
    content: "Une nouvelle loi secrète serait en préparation pour avancer l'interdiction de vente de véhicules thermiques à 2028 au lieu de 2035, sans compensation pour les propriétaires actuels.",
    category: 'Politique',
    author: {
      id: 'u3',
      name: 'Jean Bon',
      avatar: 'https://picsum.photos/102/102',
      isExpert: false,
      credibilityScore: 45,
      walletBalance: 120,
    },
    timestamp: Date.now() - 3600000 * 4,
    votes: { TRUE: 5, FALSE: 12, MANIPULATED: 30, UNCERTAIN: 2 },
    comments: [],
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=60',
    bountyAmount: 20,
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [claims, setClaims] = useState<Claim[]>(INITIAL_CLAIMS);
  const [sortOption, setSortOption] = useState('Récents');
  const navigate = useNavigate();

  // Withdraw Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawStep, setWithdrawStep] = useState<'input' | 'processing' | 'success'>('input');

  const handleCreateClaim = (newClaim: Claim) => {
    setClaims([newClaim, ...claims]);
    navigate('/');
  };

  const handleUpdateClaim = (updatedClaim: Claim) => {
    setClaims(claims.map(c => c.id === updatedClaim.id ? updatedClaim : c));
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Gestion du vote avec logique économique
  const handleVote = (claimId: string, voteType: VoteType) => {
    const claimIndex = claims.findIndex(c => c.id === claimId);
    if (claimIndex === -1) return;

    const claim = claims[claimIndex];
    
    // Empêcher de voter plusieurs fois si on veut (optionnel, ici on permet de changer de vote ou revoter pour l'exemple)
    // Pour simplifier l'exemple Play-to-Earn, on facture à chaque clic pour l'instant
    
    let newWalletBalance = user.walletBalance;
    let newBountyAmount = claim.bountyAmount;

    // Si le vote est VRAI, FAUX ou MANIPULÉ, on applique le coût
    if (voteType === VoteType.TRUE || voteType === VoteType.FALSE || voteType === VoteType.MANIPULATED) {
      if (user.walletBalance < VOTE_COST) {
        alert(`Solde insuffisant ! Il vous faut ${VOTE_COST} VXT pour voter.`);
        return;
      }
      newWalletBalance -= VOTE_COST;
      newBountyAmount += VOTE_COST;
    }

    // Mise à jour de l'utilisateur
    setUser({ ...user, walletBalance: newWalletBalance });

    // Mise à jour de la revendication
    const updatedVotes = { ...claim.votes, [voteType]: claim.votes[voteType] + 1 };
    const updatedClaim = { 
      ...claim, 
      votes: updatedVotes,
      bountyAmount: newBountyAmount,
      userVote: voteType, // Enregistre le vote de l'utilisateur
      userVoteTimestamp: Date.now() // Enregistre l'heure du vote
    };

    const newClaims = [...claims];
    newClaims[claimIndex] = updatedClaim;
    setClaims(newClaims);
  };

  // Withdrawal Logic
  const handleOpenWithdraw = () => {
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
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > user.walletBalance) return;

    setWithdrawStep('processing');
    
    // Simulate API call
    setTimeout(() => {
      setUser(prev => ({ ...prev, walletBalance: prev.walletBalance - amount }));
      setWithdrawStep('success');
      
      // Close modal after delay
      setTimeout(() => {
        setShowWithdrawModal(false);
      }, 3000);
    }, 2000);
  };

  const getSortedClaims = () => {
    let sorted = [...claims];
    switch (sortOption) {
      case 'Populaires':
        // Tri par nombre total de votes
        sorted.sort((a, b) => {
          const totalA = (Object.values(a.votes) as number[]).reduce((sum, v) => sum + v, 0);
          const totalB = (Object.values(b.votes) as number[]).reduce((sum, v) => sum + v, 0);
          return totalB - totalA;
        });
        break;
      case 'Controversés':
         // Tri par nombre de commentaires (indicateur de débat)
         // En cas d'égalité, on trie par date (plus récent en premier)
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
          <h2 className="text-xl font-bold text-slate-800">Actualités à vérifier</h2>
          <div className="flex space-x-2">
            <select className="bg-white border border-slate-200 text-sm rounded-lg p-2 focus:ring-indigo-500 hidden sm:block">
              <option>Toutes catégories</option>
              <option>Politique</option>
              <option>Tech</option>
            </select>
            <select 
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-white border border-slate-200 text-sm rounded-lg p-2 focus:ring-indigo-500 cursor-pointer"
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
            claim={claim} 
            onClick={() => navigate(`/claim/${claim.id}`)}
            currentUser={user}
            onUpdate={handleUpdateClaim}
            onVote={handleVote}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative">
      <Navbar user={user} />

      {/* Withdraw Modal */}
      {showWithdrawModal && (
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
              <Route path="/submit" element={
                <SubmitClaim 
                  onSubmit={handleCreateClaim} 
                  onCancel={() => navigate('/')}
                  currentUser={user}
                />
              } />
              <Route path="/claim/:id" element={
                <ClaimDetail 
                  claims={claims}
                  onUpdateClaim={handleUpdateClaim}
                  currentUser={user}
                />
              } />
              <Route path="/profile" element={
                <Profile 
                  user={user}
                  claims={claims}
                  onUpdate={handleUpdateClaim}
                  onVote={handleVote}
                  onUpdateUser={handleUpdateUser}
                />
              } />
            </Routes>
          </div>

          {/* Right Sidebar (Desktop) */}
          <div className="hidden lg:block lg:col-span-4 space-y-6">
            
            {/* Wallet / Remuneration Widget */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 flex items-center mb-4">
                <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" />
                Tendances
              </h3>
              <ul className="space-y-3">
                {['Élections 2025', 'IA Générative', 'Réforme Retraites', 'Mission Mars', 'Vaccins ARNm'].map((topic, i) => (
                  <li key={i} className="flex items-center justify-between text-sm group cursor-pointer">
                    <span className="text-slate-600 group-hover:text-indigo-600 transition-colors">#{topic.replace(/\s/g, '')}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{120 - i * 10} posts</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Fact Checkers */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 flex items-center mb-4">
                <Zap className="w-4 h-4 mr-2 text-amber-500" />
                Top Vérificateurs
              </h3>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <img src={`https://picsum.photos/3${i}/3${i}`} alt="User" className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">User_{99 + i}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">Score: {98 - i}</p>
                        <p className="text-xs text-amber-600 font-bold">{(3 - i) * 500} VXT</p>
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