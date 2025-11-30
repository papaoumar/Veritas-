import React, { useState } from 'react';
import { User, Claim, VoteType, PaymentMethod } from '../types';
import { ClaimCard } from './ClaimCard';
import { Shield, Award, Activity, Clock, Wallet, CheckCircle, XCircle, AlertTriangle, FileText, CreditCard, Landmark, Save, Check } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'posts' | 'votes' | 'badges' | 'payment'>('posts');
  
  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(user.paymentConfig?.method || PaymentMethod.NONE);
  const [paypalEmail, setPaypalEmail] = useState(user.paymentConfig?.paypalEmail || '');
  const [iban, setIban] = useState(user.paymentConfig?.bankDetails?.iban || '');
  const [bic, setBic] = useState(user.paymentConfig?.bankDetails?.bic || '');
  const [ownerName, setOwnerName] = useState(user.paymentConfig?.bankDetails?.ownerName || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const myClaims = claims.filter(c => c.author.id === user.id);
  const myVotedClaims = claims.filter(c => c.userVote !== undefined);

  // Stats simulées
  const totalVotes = myVotedClaims.length;
  const accuracyScore = 88; // Pourrait être calculé basé sur la coïncidence avec le verdict final

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white"
              />
              <div className="ml-4 mb-1">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                  {user.name}
                  {user.isExpert && <Shield className="w-5 h-5 ml-2 text-blue-500" fill="currentColor" fillOpacity={0.2} />}
                </h1>
                <p className="text-slate-500 text-sm">Membre depuis 2024 • ID: {user.id}</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="inline-flex flex-col items-end">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Crédibilité</span>
                 <span className={`text-3xl font-black ${user.credibilityScore > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                   {user.credibilityScore}/100
                 </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <Wallet className="w-6 h-6 text-amber-500 mb-2" />
              <span className="text-xl font-bold text-slate-800">{user.walletBalance}</span>
              <span className="text-xs text-slate-500 uppercase font-semibold">Solde VXT</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <FileText className="w-6 h-6 text-indigo-500 mb-2" />
              <span className="text-xl font-bold text-slate-800">{myClaims.length}</span>
              <span className="text-xs text-slate-500 uppercase font-semibold">Soumissions</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <Activity className="w-6 h-6 text-emerald-500 mb-2" />
              <span className="text-xl font-bold text-slate-800">{totalVotes}</span>
              <span className="text-xs text-slate-500 uppercase font-semibold">Votes</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <Award className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-xl font-bold text-slate-800">{accuracyScore}%</span>
              <span className="text-xs text-slate-500 uppercase font-semibold">Précision</span>
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
            Mes Publications ({myClaims.length})
          </button>
          <button
            onClick={() => setActiveTab('votes')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'votes'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Historique des Votes ({myVotedClaims.length})
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'badges'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Badges & Succès
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

        {activeTab === 'badges' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Badges Statiques pour l'exemple */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center opacity-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900">Vérificateur Certifié</h3>
              <p className="text-xs text-slate-500 mt-2">Avoir un score de crédibilité supérieur à 80.</p>
              <span className="mt-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Acquis</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900">Pionnier</h3>
              <p className="text-xs text-slate-500 mt-2">Inscrit lors de la phase Beta de Veritas.</p>
              <span className="mt-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Acquis</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center grayscale opacity-60">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-600">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900">Top 100 Influenceur</h3>
              <p className="text-xs text-slate-500 mt-2">Faire partie des 100 meilleurs fact-checkers.</p>
              <span className="mt-3 px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">Verrouillé</span>
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