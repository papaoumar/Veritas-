import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, PlusCircle, LayoutGrid, Coins } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  user: UserType;
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    return currentPath === path ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-900';
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <Link to="/" className="flex items-center cursor-pointer">
            <div className="bg-indigo-600 p-1.5 rounded-lg mr-2">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black text-indigo-900 tracking-tight">Veritas</span>
          </Link>
          
          <div className="flex items-center space-x-2 md:space-x-6">
            <Link 
              to="/"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/')}`}
            >
              <LayoutGrid className="w-4 h-4 mr-1.5 md:mr-2" />
              <span className="hidden md:inline">Flux</span>
            </Link>

            <Link 
              to="/submit"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/submit')}`}
            >
              <PlusCircle className="w-4 h-4 mr-1.5 md:mr-2" />
              <span className="hidden md:inline">Vérifier une info</span>
            </Link>

            <div className="h-6 w-px bg-slate-200 mx-2"></div>

            <div className="flex items-center bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full">
              <Coins className="w-4 h-4 mr-1.5 text-amber-600" />
              <span className="text-xs font-bold">{user.walletBalance} VXT</span>
            </div>

            <Link 
              to="/profile"
              className={`flex items-center space-x-2 p-1 pl-2 pr-3 rounded-full border transition-colors ${currentPath === '/profile' ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <img src={user.avatar} alt="Profile" className="h-7 w-7 rounded-full bg-slate-200" />
              <div className="flex flex-col items-start leading-none hidden md:flex">
                <span className="text-xs font-bold text-slate-700">{user.name}</span>
                <span className="text-[10px] text-slate-500">Score: {user.credibilityScore}</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
