
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, PlusCircle, LayoutGrid, Coins, Shield, LogOut, Settings, User as UserIcon, Menu, AlertCircle, Globe } from 'lucide-react';
import { User as UserType, ExpertLevel } from '../types';

interface NavbarProps {
  user: UserType;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, isAuthenticated, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isActive = (path: string) => {
    return currentPath === path ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-900';
  };

  const getShieldColor = (level: ExpertLevel) => {
    switch (level) {
      case ExpertLevel.MASTER: return 'text-purple-600';
      case ExpertLevel.EXPERT: return 'text-emerald-600';
      case ExpertLevel.ANALYST: return 'text-blue-600';
      default: return 'text-slate-400';
    }
  };

  const handleLogoutClick = () => {
    setShowDropdown(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  if (!isAuthenticated && currentPath === '/login') return null;

  return (
    <>
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
                to="/network"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/network')}`}
              >
                <Globe className="w-4 h-4 mr-1.5 md:mr-2" />
                <span className="hidden md:inline">Réseau</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <Link 
                    to="/submit"
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/submit')}`}
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5 md:mr-2" />
                    <span className="hidden md:inline">Vérifier une info</span>
                  </Link>

                  <div className="h-6 w-px bg-slate-200 mx-2"></div>

                  {(user.preferences?.showBalance ?? true) && (
                    <div className="flex items-center bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full">
                      <Coins className="w-4 h-4 mr-1.5 text-amber-600" />
                      <span className="text-xs font-bold">{user.walletBalance} VXT</span>
                    </div>
                  )}

                  <div className="relative">
                    <button 
                      onClick={() => setShowDropdown(!showDropdown)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      className={`flex items-center space-x-2 p-1 pl-2 pr-3 rounded-full border transition-colors ${showDropdown || currentPath === '/profile' ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <img src={user.avatar} alt="Profile" className="h-7 w-7 rounded-full bg-slate-200 object-cover" />
                      <div className="flex flex-col items-start leading-none hidden md:flex">
                        <span className="text-xs font-bold text-slate-700">{user.name}</span>
                        <span className={`text-[10px] font-semibold flex items-center mt-0.5 ${getShieldColor(user.expertLevel)}`}>
                          <Shield className="w-3 h-3 mr-0.5 fill-current" />
                          {user.expertLevel}
                        </span>
                      </div>
                    </button>

                    {/* User Dropdown */}
                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                        <Link to="/profile" className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                          <UserIcon className="w-4 h-4 mr-2" />
                          Mon Profil
                        </Link>
                        <Link to="/settings" className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                          <Settings className="w-4 h-4 mr-2" />
                          Paramètres
                        </Link>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button 
                          onClick={handleLogoutClick}
                          className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Déconnexion
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-200 border border-slate-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <LogOut className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Se déconnecter ?</h3>
            <p className="text-slate-500 mb-6">
              Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
