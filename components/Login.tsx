
import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';
import { StorageService } from '../storageService';
import { User, ExpertLevel, PaymentMethod } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const users = StorageService.getUsers();

      if (isRegistering) {
        // --- REGISTRATION LOGIC ---
        if (password !== confirmPassword) {
          setError("Les mots de passe ne correspondent pas.");
          setLoading(false);
          return;
        }

        if (users.find(u => u.email === email)) {
          setError("Cet email est déjà utilisé.");
          setLoading(false);
          return;
        }

        const newUser: User = {
          id: `u_${Date.now()}`,
          name,
          email,
          password,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`, // Generate random avatar
          isExpert: false,
          expertLevel: ExpertLevel.OBSERVER,
          stats: { totalVerifications: 0, correctVerifications: 0, accuracyRate: 0, currentStreak: 0, reputationPoints: 0 },
          credibilityScore: 50,
          walletBalance: 50, // Welcome bonus
          paymentConfig: { method: PaymentMethod.NONE },
          preferences: { 
            language: 'fr',
            emailNotifications: true, 
            marketingEmails: false,
            publicProfile: true, 
            showBalance: true, 
            darkMode: false,
            blockedCategories: []
          },
          security: { twoFactorEnabled: false, lastPasswordChange: Date.now() }
        };

        StorageService.saveUser(newUser);
        StorageService.login(newUser.id);
        onLogin(newUser);

      } else {
        // --- LOGIN LOGIC ---
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
          StorageService.login(user.id);
          onLogin(user);
        } else {
          setError("Email ou mot de passe incorrect.");
        }
      }
      
      setLoading(false);
    }, 1000);
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-xl flex items-center justify-center transform rotate-3 shadow-lg">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">
            Veritas
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isRegistering ? "Créez votre compte pour participer." : "La vérité est un effort collectif."}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center text-sm">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isRegistering && (
              <div className="animate-in fade-in slide-in-from-top-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Jean Dupont"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="nom@exemple.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isRegistering && (
              <div className="animate-in fade-in slide-in-from-top-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {isRegistering ? <UserPlus className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" /> : <ArrowRight className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" />}
                </span>
              )}
              {loading ? 'Traitement...' : (isRegistering ? "S'inscrire" : 'Se connecter')}
            </button>
          </div>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-sm text-slate-600 mb-3">
            {isRegistering ? "Déjà un compte ?" : "Pas encore de compte ?"}
          </p>
          <button 
            onClick={toggleMode}
            className="text-indigo-600 hover:text-indigo-800 font-bold text-sm hover:underline transition-colors"
          >
            {isRegistering ? "Se connecter" : "Créer un compte gratuitement"}
          </button>
        </div>
        
        {!isRegistering && (
          <div className="text-center mt-4 bg-slate-50 p-3 rounded text-xs text-slate-500">
             <p>Comptes démo : <b>alex@test.com</b> ou <b>sarah@test.com</b></p>
             <p>Mot de passe : <b>password123</b></p>
          </div>
        )}
      </div>
    </div>
  );
};
