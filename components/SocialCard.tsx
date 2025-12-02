
import React, { useState } from 'react';
import { User, ExpertLevel } from '../types';
import { UserPlus, UserCheck, Shield, MapPin, Target, Award, Zap, Star } from 'lucide-react';

interface SocialCardProps {
  user: User;
  currentUser?: User | null;
  onFollow?: () => void;
  className?: string;
}

export const SocialCard: React.FC<SocialCardProps> = ({ user, currentUser, onFollow, className = '' }) => {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowing(!isFollowing);
    if (onFollow) onFollow();
  };

  const getLevelColor = (level: ExpertLevel) => {
    switch (level) {
      case ExpertLevel.MASTER: return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case ExpertLevel.EXPERT: return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case ExpertLevel.ANALYST: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getShieldColor = (level: ExpertLevel) => {
    switch (level) {
      case ExpertLevel.MASTER: return 'text-purple-600 dark:text-purple-400';
      case ExpertLevel.EXPERT: return 'text-emerald-600 dark:text-emerald-400';
      case ExpertLevel.ANALYST: return 'text-blue-600 dark:text-blue-400';
      default: return 'text-slate-400 dark:text-slate-500';
    }
  };

  // Badge Logic for Card
  const badges = [
    { icon: Target, condition: user.stats.accuracyRate > 80, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Vérificateur Certifié' },
    { icon: Award, condition: user.stats.totalVerifications >= 100, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Centurion' },
    { icon: Zap, condition: user.stats.currentStreak >= 10, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', label: 'Imbattable' },
    { icon: Star, condition: user.expertLevel === ExpertLevel.MASTER, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Maître' }
  ].filter(b => b.condition);

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-300 group ${className}`}>
      {/* Banner */}
      <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 relative overflow-hidden">
        {user.bannerUrl ? (
          <img src={user.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-slate-200 dark:bg-slate-700 opacity-50 flex items-center justify-center">
             <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          </div>
        )}
      </div>

      <div className="px-5 pb-5">
        <div className="flex justify-between items-start">
          {/* Avatar */}
          <div className="-mt-10 relative">
            <div className="p-1 bg-white dark:bg-slate-800 rounded-full inline-block">
               <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-20 h-20 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm object-cover bg-slate-50 dark:bg-slate-700" 
              />
            </div>
            <div className="absolute bottom-1 right-1 bg-white dark:bg-slate-800 rounded-full p-1 border border-slate-100 dark:border-slate-600 shadow-sm" title={`Niveau: ${user.expertLevel}`}>
               <Shield className={`w-3.5 h-3.5 ${getShieldColor(user.expertLevel)} fill-current`} />
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-3">
             {currentUser?.id !== user.id && (
               <button 
                 onClick={handleFollowClick}
                 className={`flex items-center px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                   isFollowing 
                     ? 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600' 
                     : 'bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent hover:shadow-md'
                 }`}
               >
                 {isFollowing ? (
                   <>
                     <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                     Suivi
                   </>
                 ) : (
                   <>
                     <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                     Suivre
                   </>
                 )}
               </button>
             )}
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate pr-2">{user.name}</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
             <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getLevelColor(user.expertLevel)}`}>
               {user.expertLevel}
             </span>
             {user.country && (
               <span className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                 <MapPin className="w-3 h-3 mr-0.5 opacity-70" />
                 {user.country}
               </span>
             )}
          </div>
          
          {user.bio ? (
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 line-clamp-2 leading-relaxed">
              {user.bio}
            </p>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-3 italic">
              Aucune biographie disponible.
            </p>
          )}

          {/* Badges Section */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {badges.map((badge, idx) => (
                <div key={idx} className={`p-1.5 rounded-full ${badge.bg} ${badge.color}`} title={badge.label}>
                  <badge.icon className="w-3.5 h-3.5" />
                </div>
              ))}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
             <div className="text-center">
                <span className="block text-sm font-bold text-slate-900 dark:text-white">{user.socialStats?.followers || 0}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Abonnés</span>
             </div>
             <div className="text-center border-l border-slate-100 dark:border-slate-700">
                <span className="block text-sm font-bold text-slate-900 dark:text-white">{user.socialStats?.following || 0}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Suivis</span>
             </div>
             <div className="text-center border-l border-slate-100 dark:border-slate-700">
                <span className="block text-sm font-bold text-slate-900 dark:text-white">{user.stats.totalVerifications}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Analyses</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
