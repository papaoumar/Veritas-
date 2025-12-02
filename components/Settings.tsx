
import React, { useState } from 'react';
import { User, UserPreferences } from '../types';
import { Shield, Lock, Bell, Eye, Save, Smartphone, Mail, Globe, CheckCircle, Moon, Trash2, Sliders, HelpCircle, AlertTriangle, FileText, ExternalLink } from 'lucide-react';

interface SettingsProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteAccount?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onDeleteAccount }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'privacy' | 'notifications' | 'appearance' | 'help'>('general');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // General
  const [language, setLanguage] = useState<'fr' | 'en'>(user.preferences?.language || 'fr');
  const [country, setCountry] = useState<string>(user.country || 'France');
  const [blockedCategories, setBlockedCategories] = useState<string[]>(user.preferences?.blockedCategories || []);

  // Security
  const [twoFactor, setTwoFactor] = useState(user.security?.twoFactorEnabled || false);
  
  // Privacy
  const [publicProfile, setPublicProfile] = useState(user.preferences?.publicProfile ?? true);
  const [showBalance, setShowBalance] = useState(user.preferences?.showBalance ?? true);

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(user.preferences?.emailNotifications ?? true);
  const [marketingEmails, setMarketingEmails] = useState(user.preferences?.marketingEmails ?? false);

  // Appearance
  const [darkMode, setDarkMode] = useState(user.preferences?.darkMode || false);

  const handleSave = () => {
    const updatedUser: User = {
      ...user,
      country,
      security: {
        ...user.security,
        twoFactorEnabled: twoFactor,
        lastPasswordChange: user.security?.lastPasswordChange || Date.now()
      },
      preferences: {
        language,
        blockedCategories,
        emailNotifications: emailNotifs,
        marketingEmails,
        publicProfile,
        showBalance,
        darkMode
      }
    };

    onUpdateUser(updatedUser);
    setSuccessMsg("Paramètres mis à jour avec succès");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const toggleCategory = (category: string) => {
    if (blockedCategories.includes(category)) {
      setBlockedCategories(blockedCategories.filter(c => c !== category));
    } else {
      setBlockedCategories([...blockedCategories, category]);
    }
  };

  const categories = ['Politique', 'Science', 'Économie', 'Santé', 'International', 'Tech'];

  return (
    <div className="max-w-4xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Paramètres & Configuration</h1>
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 p-4">
          <nav className="space-y-1">
             <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'general' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4 mr-3" />
              Général
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'security' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4 mr-3" />
              Sécurité
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'privacy' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Eye className="w-4 h-4 mr-3" />
              Confidentialité
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4 mr-3" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'appearance' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Moon className="w-4 h-4 mr-3" />
              Apparence
            </button>
             <button
              onClick={() => setActiveTab('help')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'help' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4 mr-3" />
              Aide & Support
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {successMsg && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="w-5 h-5 mr-2" />
              {successMsg}
            </div>
          )}

          {activeTab === 'general' && (
             <div className="space-y-8 animate-in fade-in duration-300">
               <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-indigo-500" />
                  Langue & Région
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                   <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Langue</label>
                       <select 
                          value={language} 
                          onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-indigo-500"
                       >
                          <option value="fr">Français (France)</option>
                          <option value="en">English (US)</option>
                       </select>
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pays</label>
                       <select 
                          value={country} 
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-indigo-500"
                       >
                          <option value="France">France</option>
                          <option value="Mali">Mali</option>
                          <option value="Burkina Faso">Burkina Faso</option>
                          <option value="Niger">Niger</option>
                          <option value="Sénégal">Sénégal</option>
                          <option value="USA">USA</option>
                          <option value="Japon">Japon</option>
                          <option value="International">International</option>
                          <option value="Autre">Autre</option>
                       </select>
                   </div>
                </div>
               </div>

               <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                    <Sliders className="w-5 h-5 mr-2 text-indigo-500" />
                    Préférences de Contenu
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Sélectionnez les catégories que vous souhaitez <strong>masquer</strong> de votre flux d'actualité.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                     {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            blockedCategories.includes(cat)
                              ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 line-through'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                          }`}
                        >
                          {cat}
                        </button>
                     ))}
                  </div>
               </div>
             </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-indigo-500" />
                  Mot de passe
                </h3>
                <div className="grid gap-4 max-w-md">
                  <input type="password" placeholder="Mot de passe actuel" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-indigo-500" />
                  <input type="password" placeholder="Nouveau mot de passe" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-indigo-500" />
                  <input type="password" placeholder="Confirmer le nouveau mot de passe" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:ring-indigo-500" />
                  <button className="w-fit px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm">
                    Mettre à jour le mot de passe
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Smartphone className="w-5 h-5 mr-2 text-indigo-500" />
                  Authentification à deux facteurs (2FA)
                </h3>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Activer le 2FA</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Ajoute une couche de sécurité supplémentaire à votre compte.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-red-100 dark:border-red-900/50">
                 <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Zone de danger
                </h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center justify-between">
                   <div>
                      <p className="font-bold text-red-700 dark:text-red-400">Supprimer le compte</p>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80">Cette action est irréversible. Toutes vos données seront effacées.</p>
                   </div>
                   <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-700 text-red-600 font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                   >
                     Supprimer
                   </button>
                </div>
                
                {showDeleteConfirm && (
                   <div className="mt-4 p-4 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-700 rounded-xl animate-in zoom-in">
                      <p className="font-bold text-slate-800 dark:text-white mb-2">Êtes-vous absolument sûr ?</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        En confirmant, votre profil, votre portefeuille VXT et tout votre historique seront définitivement supprimés.
                      </p>
                      <div className="flex gap-3">
                         <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
                         >
                            Annuler
                         </button>
                         <button 
                            onClick={() => onDeleteAccount && onDeleteAccount()}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center"
                         >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Confirmer la suppression
                         </button>
                      </div>
                   </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-indigo-500" />
                  Visibilité
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Profil Public</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Permettre aux autres utilisateurs de voir votre historique et vos badges.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={publicProfile} onChange={(e) => setPublicProfile(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Afficher le solde VXT</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Montrer votre solde de jetons sur votre profil public.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={showBalance} onChange={(e) => setShowBalance(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-indigo-500" />
                  Préférences Email
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Emails Transactionnels</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Recevoir des emails pour les résultats de vote et les récompenses (Important).</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={emailNotifs} onChange={(e) => setEmailNotifs(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Emails Marketing & Newsletters</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Recevoir les actualités de la plateforme et les offres partenaires.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={marketingEmails} onChange={(e) => setMarketingEmails(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Moon className="w-5 h-5 mr-2 text-indigo-500" />
                  Thème
                </h3>
                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Mode Sombre</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Activer le thème sombre pour une expérience visuelle plus confortable la nuit.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
             <div className="space-y-6 animate-in fade-in duration-300">
               <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">À propos de Veritas</h3>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                     <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                        Veritas est une plateforme de vérification des faits pilotée par la communauté et assistée par l'intelligence artificielle. Notre mission est de lutter contre la désinformation en récompensant l'analyse critique et le consensus.
                     </p>
                     <div className="flex items-center text-xs text-slate-500 space-x-4">
                        <span>Version 1.0.0 (Beta)</span>
                        <span>•</span>
                        <span>Build 2024.05.28</span>
                     </div>
                  </div>
               </div>

               <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Liens Utiles</h3>
                  <div className="grid gap-3">
                     <a href="#" className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Centre d'aide & FAQ</span>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                     </a>
                     <a href="#" className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Conditions Générales d'Utilisation (CGU)</span>
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                     </a>
                     <a href="#" className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Politique de Confidentialité</span>
                        <Shield className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                     </a>
                  </div>
               </div>
             </div>
          )}

          {activeTab !== 'help' && (
            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md transition-all flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer les modifications
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
