
import React from 'react';
import { User, ExpertLevel } from '../types';
import { Shield, Globe, QrCode, Cpu, Fingerprint, ScanLine } from 'lucide-react';

interface MemberIdCardProps {
  user: User;
}

export const MemberIdCard: React.FC<MemberIdCardProps> = ({ user }) => {
  
  const getTheme = (level: ExpertLevel) => {
    switch (level) {
      case ExpertLevel.MASTER: 
        return {
          bg: 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900',
          border: 'border-purple-500/30',
          accent: 'text-purple-400',
          glow: 'group-hover:shadow-purple-500/40',
          badge: 'bg-purple-500/20 text-purple-200 border-purple-500/50'
        };
      case ExpertLevel.EXPERT: 
        return {
          bg: 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900',
          border: 'border-emerald-500/30',
          accent: 'text-emerald-400',
          glow: 'group-hover:shadow-emerald-500/40',
          badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50'
        };
      case ExpertLevel.ANALYST: 
        return {
          bg: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900',
          border: 'border-blue-500/30',
          accent: 'text-blue-400',
          glow: 'group-hover:shadow-blue-500/40',
          badge: 'bg-blue-500/20 text-blue-200 border-blue-500/50'
        };
      default: 
        return {
          bg: 'bg-gradient-to-br from-slate-800 to-slate-900',
          border: 'border-slate-600/30',
          accent: 'text-slate-400',
          glow: 'group-hover:shadow-slate-500/40',
          badge: 'bg-slate-500/20 text-slate-300 border-slate-500/50'
        };
    }
  };

  const theme = getTheme(user.expertLevel);

  // Génération d'un code unique déterministe basé sur l'ID et le nom
  // Cela crée une fausse "clé unique" qui reste la même pour un utilisateur donné
  const generateUniqueSerial = () => {
    const str = user.id + user.name + (user.memberSince || 0);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `VTS-${hex.substring(0, 4)}-${hex.substring(4, 8)}-${user.country ? user.country.substring(0, 2).toUpperCase() : 'GL'}`;
  };

  const uniqueSerial = generateUniqueSerial();

  // Génération d'un motif "ADN" visuel unique
  const renderDigitalDNA = () => {
    const seed = uniqueSerial.length;
    const blocks = [];
    for(let i=0; i<12; i++) {
      const opacity = (uniqueSerial.charCodeAt(i % seed) % 10) / 10;
      blocks.push(
        <div key={i} className="w-1 h-3 mb-0.5 rounded-sm bg-current" style={{ opacity: Math.max(0.2, opacity) }}></div>
      );
    }
    return blocks;
  };

  return (
    <div className="relative group perspective-1000 w-full max-w-sm mx-auto transform transition-transform duration-500 hover:-translate-y-2">
      {/* Card Container */}
      <div className={`relative h-60 w-full rounded-2xl shadow-xl overflow-hidden border ${theme.border} ${theme.bg} transition-all duration-500 ${theme.glow} shadow-lg`}>
        
        {/* Holographic Sheen Animation */}
        <div className="absolute -inset-[100%] top-0 block z-[5] bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 group-hover:animate-shine pointer-events-none"></div>
        <style>{`
          @keyframes shine {
            100% { left: 125%; }
          }
          .group:hover .group-hover\\:animate-shine {
            animation: shine 1.5s;
          }
        `}</style>

        {/* Background Texture & Watermark */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-0"></div>
        <Shield className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 rotate-12 z-0" />
        
        {/* Top Header Strip */}
        <div className="relative z-10 flex justify-between items-center px-5 py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="bg-white/10 p-1 rounded-md border border-white/20">
               <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
               <span className="block text-[8px] text-slate-400 leading-none tracking-widest uppercase">Protocol</span>
               <span className="text-xs font-black tracking-widest text-white uppercase">Veritas ID</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <div className="flex flex-col items-end">
                <span className="text-[8px] text-slate-400 uppercase tracking-wider">Region</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center">
                   {user.country || 'GLOBAL'}
                </span>
             </div>
             <Globe className={`w-4 h-4 ${theme.accent} opacity-80`} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 p-5 flex gap-5 items-center">
          
          {/* Photo Section with Digital DNA */}
          <div className="flex-shrink-0 flex items-start space-x-2">
            <div className="flex flex-col items-center space-y-2">
              <div className={`w-20 h-24 rounded-lg p-0.5 bg-gradient-to-b from-white/20 to-transparent relative group-hover:scale-105 transition-transform duration-300`}>
                <div className="w-full h-full rounded border border-black/50 overflow-hidden relative">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-full h-full object-cover bg-slate-800 filter contrast-125"
                  />
                  {/* Holographic Overlay on Photo */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent mix-blend-overlay opacity-50"></div>
                  
                  {/* Scan Line Effect */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 animate-[scan_2s_linear_infinite]"></div>
                  <style>{`
                    @keyframes scan {
                      0% { transform: translateY(-100%); }
                      100% { transform: translateY(100%); }
                    }
                  `}</style>
                </div>
              </div>
            </div>
            
            {/* Unique Digital DNA Strip */}
            <div className={`flex flex-col pt-1 ${theme.accent}`}>
               {renderDigitalDNA()}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
             <div className="mb-3">
               <h3 className="text-lg font-bold text-white leading-tight truncate tracking-wide drop-shadow-md font-sans">
                 {user.name.toUpperCase()}
               </h3>
               <div className={`inline-flex items-center mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${theme.badge}`}>
                 {user.expertLevel}
               </div>
             </div>

             <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[10px]">
                <div className="group/field col-span-2">
                   <span className="block text-[7px] text-slate-400 uppercase tracking-widest mb-0.5 flex items-center">
                     <Fingerprint className="w-2 h-2 mr-1" />
                     Unique Identity Serial
                   </span>
                   <span className="font-mono text-white tracking-widest bg-black/30 px-2 py-1 rounded border border-white/10 block w-full">
                     {uniqueSerial}
                   </span>
                </div>
                <div className="group/field">
                   <span className="block text-[7px] text-slate-400 uppercase tracking-widest mb-0.5">Valid Thru</span>
                   <span className="font-mono text-slate-200 tracking-wider">12/28</span>
                </div>
                <div className="pt-1 border-t border-white/5 col-span-2 flex justify-between items-end mt-1">
                    <div>
                       <span className="block text-[7px] text-slate-400 uppercase tracking-widest mb-0.5">Accuracy</span>
                       <span className={`text-sm font-bold ${theme.accent} font-mono`}>{user.stats.accuracyRate}.0%</span>
                    </div>
                    <div>
                       <span className="block text-[7px] text-slate-400 uppercase tracking-widest mb-0.5 text-right">Reputation</span>
                       <span className="text-xs font-bold text-white font-mono">{user.stats.reputationPoints} XP</span>
                    </div>
                </div>
             </div>
          </div>
        </div>

        {/* Footer Barcode Strip */}
        <div className="absolute bottom-0 left-0 w-full h-8 bg-black/40 backdrop-blur-md border-t border-white/5 flex items-center justify-between px-5 z-20">
           <div className="flex items-center space-x-2">
             <Cpu className="w-4 h-4 text-slate-500" />
             <div className="h-2 w-24 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-current animate-pulse w-2/3 opacity-50"></div>
             </div>
           </div>
           
           <div className="flex items-center space-x-1 opacity-70">
              <span className="text-[8px] text-slate-400 font-mono tracking-tighter">{uniqueSerial.replace(/-/g, '')}</span>
              <QrCode className="w-5 h-5 text-white" />
           </div>
        </div>

        {/* Decorative Corner Accents */}
        <div className={`absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 ${theme.border} rounded-tl-2xl opacity-50`}></div>
        <div className={`absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 ${theme.border} rounded-br-2xl opacity-50`}></div>

      </div>
    </div>
  );
};
