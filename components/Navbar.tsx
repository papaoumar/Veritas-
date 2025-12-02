
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, PlusCircle, LayoutGrid, Coins, Shield, LogOut, Settings, User as UserIcon, Menu, AlertCircle, Globe, Sun, Moon, Home, Plus } from 'lucide-react';
import { User as UserType, ExpertLevel } from '../types';

interface NavbarProps {
  user: UserType;
  isAuthenticated: boolean;
  onLogout: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, isAuthenticated, onLogout, isDarkMode, onToggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isActive = (path: string) => {
    return currentPath === path ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100';
  };

  const getShieldColor = (level: ExpertLevel) => {
    switch (level) {
      case ExpertLevel.MASTER: return 'text-purple-600 dark:text-purple-400';
      case ExpertLevel.EXPERT: return 'text-emerald-600 dark:text-emerald-400';
      case ExpertLevel.ANALYST: return 'text-blue-600 dark:text-blue-400';
      default: return 'text-slate-400 dark:text-slate-500';
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
      {/* Desktop & Tablet Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 transition-colors duration-500 ease-in-out">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo Area */}
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center group transition-opacity hover:opacity-90 flex-shrink-0"
                aria-label="Retour à l'accueil Veritas"
              >
                <div className="bg-indigo-600 p-1.5 rounded-lg mr-2 group-hover:bg-indigo-700 transition-colors shadow-sm">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-black text-indigo-900 dark:text-white tracking-tight">Veritas</span>
              </Link>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-6">
              <Link 
                to="/"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/')}`}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                <span>Flux</span>
              </Link>

              <Link 
                to="/network"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/network')}`}
              >
                <Globe className="w-4 h-4 mr-2" />
                <span>Réseau</span>
              </Link>

              {/* Theme Toggle */}
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title={isDarkMode ? "Passer en mode clair" : "Passer en mode sombre"}
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-amber-500 animate-in spin-in-90 zoom-in fade-in duration-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-indigo-500 animate-in spin-in-90 zoom-in fade-in duration-500" />
                  )}
                </button>
              )}

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

              {isAuthenticated ? (
                <>
                  <Link 
                    to="/submit"
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/submit')}`}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    <span>Vérifier une info</span>
                  </Link>

                  {/* Solde VXT */}
                  {(user.preferences?.showBalance ?? true) && (
                    <div 
                      className="flex items-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 px-3 py-1.5 rounded-full cursor-default whitespace-nowrap"
                      title="Votre solde VXT actuel"
                    >
                      <Coins className="w-4 h-4 mr-1.5 text-amber-600 dark:text-amber-500" />
                      <span className="text-xs font-bold">{user.walletBalance}</span>
                    </div>
                  )}

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowDropdown(!showDropdown)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      className={`flex items-center space-x-2 p-1 pl-2 pr-3 rounded-full border transition-colors ${showDropdown || currentPath === '/profile' ? 'border-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-800' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <img src={user.avatar} alt="Profile" className="h-7 w-7 rounded-full bg-slate-200 object-cover" />
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[100px]">{user.name}</span>
                        <span className={`text-[10px] font-semibold flex items-center mt-0.5 ${getShieldColor(user.expertLevel)}`}>
                          <Shield className="w-3 h-3 mr-0.5 fill-current" />
                          {user.expertLevel}
                        </span>
                      </div>
                    </button>

                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1 animate-in fade-in slide-in-from-top-2 overflow-hidden z-50">
                        <Link to="/profile" className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <UserIcon className="w-4 h-4 mr-2" />
                          Mon Profil
                        </Link>
                        <Link to="/settings" className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <Settings className="w-4 h-4 mr-2" />
                          Paramètres
                        </Link>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                        <button 
                          onClick={handleLogoutClick}
                          className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
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

            {/* Mobile Header Right Actions (Theme + Auth) */}
            <div className="flex md:hidden items-center space-x-3">
              {(user.preferences?.showBalance ?? true) && isAuthenticated && (
                <div className="flex items-center text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full text-xs font-bold border border-amber-100 dark:border-amber-800">
                  <Coins className="w-3.5 h-3.5 mr-1" />
                  {user.walletBalance}
                </div>
              )}
               
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-amber-500 animate-in spin-in-90 duration-300" />
                  ) : (
                    <Moon className="w-5 h-5 text-indigo-500 animate-in spin-in-90 duration-300" />
                  )}
                </button>
              )}
              
              {!isAuthenticated && (
                 <Link to="/login" className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Login</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe transition-colors duration-500 ease-in-out">
        <div className="flex justify-around items-center h-16">
          <Link 
            to="/" 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentPath === '/' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <Home className={`w-6 h-6 ${currentPath === '/' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Flux</span>
          </Link>

          <Link 
            to="/network" 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentPath === '/network' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <Globe className="w-6 h-6" />
            <span className="text-[10px] font-medium">Réseau</span>
          </Link>

          <div className="relative -top-5">
            <Link 
              to={isAuthenticated ? "/submit" : "/login"}
              className="flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/30 text-white transform active:scale-95 transition-transform"
            >
              <Plus className="w-8 h-8" />
            </Link>
          </div>

          <Link 
            to="/leaderboard" 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentPath === '/leaderboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <Shield className={`w-6 h-6 ${currentPath === '/leaderboard' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Classement</span>
          </Link>

          <Link 
            to={isAuthenticated ? "/profile" : "/login"} 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentPath === '/profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
          >
            {isAuthenticated ? (
               <img src={user.avatar} alt="Me" className={`w-6 h-6 rounded-full border ${currentPath === '/profile' ? 'border-indigo-600' : 'border-slate-300'}`} />
            ) : (
               <UserIcon className="w-6 h-6" />
            )}
            <span className="text-[10px] font-medium">Profil</span>
          </Link>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-500">
              <LogOut className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Se déconnecter ?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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