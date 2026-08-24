import React from 'react';
import { AppSettings } from '../types';
import { 
  GraduationCap, 
  Search, 
  Code2, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  BarChart3,
  PlusCircle,
  Lock,
  LogOut,
  ShieldCheck,
  KeyRound
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'form' | 'dashboard' | 'status' | 'code' | 'sheets';
  setCurrentTab: (tab: 'form' | 'dashboard' | 'status' | 'code' | 'sheets') => void;
  settings: AppSettings;
  onOpenSettings: () => void;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenChangePin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  settings,
  onOpenSettings,
  isAdmin,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenChangePin
}) => {
  return (
    <header className="bg-white/70 backdrop-blur-md border-b border-white/50 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('form')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">Academia Danza & Artes</span>
                {isAdmin && (
                  <span className="bg-purple-100 text-purple-700 text-[11px] px-2 py-0.5 rounded-full font-semibold border border-purple-200 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Admin</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Inscripciones y Reserva de Cupos</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto">
            {/* 1. Inscripción (Siempre visible) */}
            <button
              onClick={() => setCurrentTab('form')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentTab === 'form'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Inscripción</span>
            </button>

            {/* 2. Consultar Estado (Siempre visible para alumnas y representantes) */}
            <button
              onClick={() => setCurrentTab('status')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentTab === 'status'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Consultar Estado</span>
            </button>

            {/* PANELES INTERNOS - Solo visibles si el usuario ha iniciado sesión como Administrador */}
            {isAdmin && (
              <>
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    currentTab === 'dashboard'
                      ? 'bg-purple-600 text-white shadow-xs font-semibold'
                      : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden md:inline">Dashboard</span>
                </button>

                <button
                  onClick={() => setCurrentTab('sheets')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    currentTab === 'sheets'
                      ? 'bg-purple-600 text-white shadow-xs font-semibold'
                      : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span className="hidden md:inline">Datos Sheets</span>
                </button>

                <button
                  onClick={() => setCurrentTab('code')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    currentTab === 'code'
                      ? 'bg-purple-600 text-white shadow-xs font-semibold'
                      : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  <span className="hidden md:inline">Backend & GAS</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Action: Admin Access / Logout */}
          <div className="flex items-center space-x-2">
            {isAdmin ? (
              <div className="flex items-center space-x-2">
                {/* Live GAS Indicator (Only for Admin) */}
                <button
                  onClick={onOpenSettings}
                  className={`hidden sm:flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                    settings.useMockMode || !settings.gasWebAppUrl
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                  title="Configurar Backend GAS"
                >
                  {settings.useMockMode || !settings.gasWebAppUrl ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      <span className="font-medium">Modo Simulador</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-medium">Live GAS</span>
                    </>
                  )}
                </button>

                {/* Change PIN button */}
                {onOpenChangePin && (
                  <button
                    onClick={onOpenChangePin}
                    className="flex items-center space-x-1 text-xs px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-colors cursor-pointer font-medium"
                    title="Cambiar PIN de Acceso"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                    <span className="hidden sm:inline">PIN</span>
                  </button>
                )}

                {/* Logout button */}
                <button
                  onClick={onLogoutAdmin}
                  className="flex items-center space-x-1 text-xs px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg border border-slate-200 transition-colors cursor-pointer font-medium"
                  title="Cerrar Sesión Administrativa"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Salir Admin</span>
                </button>
              </div>
            ) : (
              /* Discreto botón de Acceso Admin para el personal */
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100/70 border border-slate-200/80 transition-colors cursor-pointer"
                title="Acceso exclusivo para directores y administradores"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Acceso Admin</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
