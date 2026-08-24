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
  PlusCircle
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'form' | 'dashboard' | 'status' | 'code' | 'sheets';
  setCurrentTab: (tab: 'form' | 'dashboard' | 'status' | 'code' | 'sheets') => void;
  settings: AppSettings;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  settings,
  onOpenSettings
}) => {
  return (
    <header className="bg-white/60 backdrop-blur-md border-b border-white/50 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('form')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">Academia Danza & Artes</span>
                <span className="bg-indigo-100/80 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-indigo-200/60 hidden sm:inline-block">
                  GAS Backend
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Inscripciones y Reserva de Cupos</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto">
            <button
              onClick={() => setCurrentTab('form')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentTab === 'form'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden md:inline">Inscripción</span>
            </button>

            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentTab('status')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentTab === 'status'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Consultar Estado</span>
            </button>

            <button
              onClick={() => setCurrentTab('sheets')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentTab === 'sheets'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden md:inline">Google Sheets Data</span>
            </button>

            <button
              onClick={() => setCurrentTab('code')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentTab === 'code'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span className="hidden md:inline">Code.gs & Netlify</span>
            </button>
          </nav>

          {/* Settings / Backend Connection Indicator */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenSettings}
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                settings.useMockMode || !settings.gasWebAppUrl
                  ? 'bg-amber-50/80 text-amber-800 border-amber-200/80 hover:bg-amber-100/80 backdrop-blur-xs'
                  : 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/80 backdrop-blur-xs'
              }`}
              title="Configurar URL de Google Apps Script Web App"
            >
              {settings.useMockMode || !settings.gasWebAppUrl ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span className="font-medium hidden lg:inline">Modo Simulador</span>
                  <span className="font-medium lg:hidden">Simulador</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium hidden lg:inline">GAS Conectado</span>
                  <span className="font-medium lg:hidden">Live GAS</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
