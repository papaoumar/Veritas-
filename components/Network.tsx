
import React, { useState } from 'react';
import { User, ExpertLevel } from '../types';
import { MemberIdCard } from './MemberIdCard';
import { Search, Filter, Globe, MapPin } from 'lucide-react';

interface NetworkProps {
  users: User[];
}

export const Network: React.FC<NetworkProps> = ({ users }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('All');
  const [filterCountry, setFilterCountry] = useState<string>('All');

  // Calculate counts per country
  const countryStats = users.reduce((acc, user) => {
    const country = user.country || 'International';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countries = Object.keys(countryStats).sort();

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'All' || user.expertLevel === filterLevel;
    const matchesCountry = filterCountry === 'All' || (user.country || 'International') === filterCountry;
    
    return matchesSearch && matchesLevel && matchesCountry;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Hero Section */}
      <div className="bg-slate-900 rounded-2xl p-8 mb-8 text-center text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-indigo-900/50"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 flex items-center justify-center">
            <Globe className="w-8 h-8 mr-3 text-blue-400" />
            Réseau Vérifié International
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Accédez à l'annuaire officiel des membres certifiés Veritas. 
            Ces experts garantissent la fiabilité de l'information à travers le monde.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
           <input 
             type="text" 
             placeholder="Rechercher un membre..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
           />
        </div>

        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 items-center">
           <div className="flex items-center hidden md:flex">
             <Filter className="w-4 h-4 mr-2 text-slate-400" />
             <span className="text-sm font-medium text-slate-700 mr-2">Filtres:</span>
           </div>
           
           <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
             </div>
             <select 
               value={filterCountry}
               onChange={(e) => setFilterCountry(e.target.value)}
               className="border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-sm bg-slate-50 focus:ring-indigo-500 min-w-[180px] appearance-none"
             >
               <option value="All">🌍 Tous les pays ({users.length})</option>
               {countries.map(c => (
                 <option key={c} value={c}>{c} ({countryStats[c]})</option>
               ))}
             </select>
           </div>

           <select 
             value={filterLevel}
             onChange={(e) => setFilterLevel(e.target.value)}
             className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:ring-indigo-500"
           >
             <option value="All">Tous niveaux</option>
             <option value={ExpertLevel.OBSERVER}>{ExpertLevel.OBSERVER}</option>
             <option value={ExpertLevel.ANALYST}>{ExpertLevel.ANALYST}</option>
             <option value={ExpertLevel.EXPERT}>{ExpertLevel.EXPERT}</option>
             <option value={ExpertLevel.MASTER}>{ExpertLevel.MASTER}</option>
           </select>
        </div>
      </div>

      {/* Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Aucun membre trouvé pour ces critères.</p>
          <button 
            onClick={() => {setFilterCountry('All'); setFilterLevel('All'); setSearchTerm('');}}
            className="mt-2 text-indigo-600 text-sm hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(user => (
            <MemberIdCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
};
