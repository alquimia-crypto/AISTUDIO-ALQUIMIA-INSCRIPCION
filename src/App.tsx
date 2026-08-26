/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlumnaNivel, SedeHorario, SelectedPlanInfo, AppSettings } from './types';
import { getAppSettings, isAdminSessionActive, setAdminSession, touchAdminSession } from './services/api';
import { Navbar } from './components/Navbar';
import { Step1Identification } from './components/Step1Identification';
import { Step2ScheduleSelection } from './components/Step2ScheduleSelection';
import { Step3ReceiptUpload } from './components/Step3ReceiptUpload';
import { Step4Confirmation } from './components/Step4Confirmation';
import { AdminDashboard } from './components/AdminDashboard';
import { StatusChecker } from './components/StatusChecker';
import { GasScriptModal } from './components/GasScriptModal';
import { SheetInspector } from './components/SheetInspector';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ChangePinModal } from './components/ChangePinModal';
import { GraduationCap, Heart, Lock, ShieldCheck, LogOut, ArrowRight, KeyRound } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'form' | 'dashboard' | 'status' | 'code' | 'sheets'>('form');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedStudent, setSelectedStudent] = useState<AlumnaNivel | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<SedeHorario | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlanInfo | null>(null);
  const [lastRegistrationId, setLastRegistrationId] = useState<string>('');
  const [lastDriveUrl, setLastDriveUrl] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());
  
  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(isAdminSessionActive());
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [showChangePinModal, setShowChangePinModal] = useState<boolean>(false);
  const [pendingAdminTab, setPendingAdminTab] = useState<'dashboard' | 'code' | 'sheets'>('dashboard');

  // Monitor session expiration periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const active = isAdminSessionActive();
      if (isAdmin && !active) {
        setIsAdmin(false);
        if (['dashboard', 'code', 'sheets'].includes(currentTab)) {
          setCurrentTab('form');
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [isAdmin, currentTab]);

  // Refresh active session on user interaction in admin mode
  useEffect(() => {
    if (!isAdmin) return;
    const handleUserActivity = () => {
      touchAdminSession();
    };

    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    return () => {
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, [isAdmin]);

  // Route protection for internal admin tabs
  const handleTabChange = (tab: 'form' | 'dashboard' | 'status' | 'code' | 'sheets') => {
    if (['dashboard', 'code', 'sheets'].includes(tab) && !isAdmin) {
      setPendingAdminTab(tab as 'dashboard' | 'code' | 'sheets');
      setShowAdminLoginModal(true);
      return;
    }
    setCurrentTab(tab);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setShowAdminLoginModal(false);
    setCurrentTab(pendingAdminTab);
  };

  const handleLogoutAdmin = () => {
    setAdminSession(false);
    setIsAdmin(false);
    if (['dashboard', 'code', 'sheets'].includes(currentTab)) {
      setCurrentTab('form');
    }
  };

  const handleStudentVerified = (student: AlumnaNivel) => {
    setSelectedStudent(student);
    setStep(2);
  };

  const handlePlanSelected = (plan: SelectedPlanInfo) => {
    setSelectedPlan(plan);
    setSelectedSchedule(plan.schedules[0] || null);
    setStep(3);
  };

  const handleRegistrationSuccess = (idRegistro: string, driveUrl: string) => {
    setLastRegistrationId(idRegistro);
    setLastDriveUrl(driveUrl);
    setStep(4);
  };

  const handleResetForm = () => {
    setSelectedStudent(null);
    setSelectedSchedule(null);
    setSelectedPlan(null);
    setLastRegistrationId('');
    setLastDriveUrl('');
    setStep(1);
    setCurrentTab('form');
  };

  return (
    <div className="min-h-screen text-slate-900 flex flex-col font-sans antialiased relative">
      
      {/* Mesh Gradient Background for Frosted Glass Theme */}
      <div className="mesh-bg"></div>

      {/* Admin Mode Top Banner (When active) */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white text-xs py-2 px-4 shadow-md sticky top-0 z-40 border-b border-purple-800/40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                <span>Modo Administrativo Activo</span>
              </span>
              <span className="text-purple-200 hidden sm:inline">
                ・ Los paneles internos (Dashboard, Sheets y Backend) están desbloqueados.
              </span>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="hover:text-purple-200 underline font-medium cursor-pointer"
              >
                Dashboard
              </button>
              
              <button
                onClick={() => setShowChangePinModal(true)}
                className="bg-purple-700/60 hover:bg-purple-600/80 text-purple-100 hover:text-white px-2.5 py-1 rounded-md transition-colors font-medium flex items-center space-x-1 cursor-pointer border border-purple-400/30"
                title="Cambiar PIN de Administrador"
              >
                <KeyRound className="w-3 h-3 text-purple-300" />
                <span>Cambiar PIN</span>
              </button>

              <button
                onClick={handleLogoutAdmin}
                className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-md transition-colors font-medium flex items-center space-x-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        settings={settings}
        onOpenSettings={() => {
          if (!isAdmin) {
            setPendingAdminTab('code');
            setShowAdminLoginModal(true);
          } else {
            setCurrentTab('code');
          }
        }}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => {
          setPendingAdminTab('dashboard');
          setShowAdminLoginModal(true);
        }}
        onLogoutAdmin={handleLogoutAdmin}
        onOpenChangePin={() => setShowChangePinModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB: Enrollment Form */}
        {currentTab === 'form' && (
          <div className="space-y-6">
            
            {/* Step Progress Tracker Bar */}
            <div className="max-w-3xl mx-auto glass-panel p-3 mb-6">
              <div className="grid grid-cols-3 gap-2 text-center">
                
                {/* Step 1 Pill */}
                <div
                  onClick={() => { if (step > 1) setStep(1); }}
                  className={`step-pill justify-center cursor-pointer ${
                    step === 1
                      ? 'step-active'
                      : step > 1
                      ? 'bg-indigo-100/80 text-indigo-900 border border-indigo-200/50'
                      : 'step-inactive'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-white text-indigo-600' : 'bg-slate-200/80 text-slate-600'}`}>1</span>
                  <span className="truncate">Identificación</span>
                </div>

                {/* Step 2 Pill */}
                <div
                  onClick={() => { if (step > 2 && selectedStudent) setStep(2); }}
                  className={`step-pill justify-center ${
                    step === 2
                      ? 'step-active'
                      : step > 2
                      ? 'bg-indigo-100/80 text-indigo-900 border border-indigo-200/50 cursor-pointer'
                      : 'step-inactive cursor-not-allowed opacity-70'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-white text-indigo-600' : 'bg-slate-200/80 text-slate-600'}`}>2</span>
                  <span className="truncate">Sede y Horario</span>
                </div>

                {/* Step 3 & 4 Pill */}
                <div
                  className={`step-pill justify-center ${
                    step >= 3
                      ? 'step-active'
                      : 'step-inactive cursor-not-allowed opacity-70'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 3 ? 'bg-white text-indigo-600' : 'bg-slate-200/80 text-slate-600'}`}>3</span>
                  <span className="truncate">{step === 4 ? 'Confirmación' : 'Comprobante'}</span>
                </div>

              </div>
            </div>

            {/* Step 1 View */}
            {step === 1 && (
              <Step1Identification onStudentVerified={handleStudentVerified} />
            )}

            {/* Step 2 View */}
            {step === 2 && selectedStudent && (
              <Step2ScheduleSelection
                student={selectedStudent}
                onBack={() => setStep(1)}
                onPlanSelected={handlePlanSelected}
              />
            )}

            {/* Step 3 View */}
            {step === 3 && selectedStudent && (selectedPlan || selectedSchedule) && (
              <Step3ReceiptUpload
                student={selectedStudent}
                schedule={selectedSchedule || undefined}
                planInfo={selectedPlan || undefined}
                onBack={() => setStep(2)}
                onSuccess={handleRegistrationSuccess}
              />
            )}

            {/* Step 4 View */}
            {step === 4 && selectedStudent && (selectedPlan || selectedSchedule) && (
              <Step4Confirmation
                student={selectedStudent}
                schedule={selectedSchedule || undefined}
                planInfo={selectedPlan || undefined}
                idRegistro={lastRegistrationId}
                driveUrl={lastDriveUrl}
                onNewRegistration={handleResetForm}
                onGoToStatus={() => setCurrentTab('status')}
              />
            )}

          </div>
        )}

        {/* TAB: Admin Dashboard (Protected) */}
        {currentTab === 'dashboard' && (
          isAdmin ? <AdminDashboard /> : (
            <div className="text-center py-16 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Panel Restringido</h3>
              <p className="text-sm text-slate-600">
                Debes iniciar sesión con tu clave de administrador para acceder a las métricas y gestión de inscripciones.
              </p>
              <button
                onClick={() => {
                  setPendingAdminTab('dashboard');
                  setShowAdminLoginModal(true);
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer inline-flex items-center space-x-2"
              >
                <span>Ingresar PIN de Administrador</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )
        )}

        {/* TAB: Consultar Estado (Public) */}
        {currentTab === 'status' && <StatusChecker />}

        {/* TAB: Code.gs & Netlify Setup (Protected) */}
        {currentTab === 'code' && (
          isAdmin ? (
            <GasScriptModal
              settings={settings}
              onSettingsUpdated={(newSet) => setSettings(newSet)}
            />
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Configuración Restringida</h3>
              <p className="text-sm text-slate-600">
                El código backend y la configuración del servidor solo están disponibles para el equipo técnico y directores.
              </p>
              <button
                onClick={() => {
                  setPendingAdminTab('code');
                  setShowAdminLoginModal(true);
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer inline-flex items-center space-x-2"
              >
                <span>Ingresar PIN de Administrador</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )
        )}

        {/* TAB: Google Sheets Data Inspector (Protected) */}
        {currentTab === 'sheets' && (
          isAdmin ? <SheetInspector /> : (
            <div className="text-center py-16 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Datos Internos Restringidos</h3>
              <p className="text-sm text-slate-600">
                La base de datos cruda de Google Sheets está protegida para resguardar la privacidad de las alumnas.
              </p>
              <button
                onClick={() => {
                  setPendingAdminTab('sheets');
                  setShowAdminLoginModal(true);
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer inline-flex items-center space-x-2"
              >
                <span>Ingresar PIN de Administrador</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white/40 backdrop-blur-md border-t border-white/50 py-6 mt-12 text-xs text-slate-600 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-800">Plataforma de Inscripción & Reserva de Cupos</span>
            <span className="hidden md:inline">・ Alquimia Danza Aérea</span>
          </div>

          <div className="flex items-center space-x-4">
            {!isAdmin ? (
              <button
                onClick={() => {
                  setPendingAdminTab('dashboard');
                  setShowAdminLoginModal(true);
                }}
                className="inline-flex items-center space-x-1 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Panel Administrativo</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowChangePinModal(true)}
                  className="inline-flex items-center space-x-1 text-purple-700 hover:text-purple-900 font-semibold cursor-pointer text-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Cambiar PIN</span>
                </button>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center space-x-1 text-purple-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sesión Admin Activa</span>
                </span>
              </div>
            )}

            <div className="flex items-center space-x-1 text-slate-400">
              <span>Diseñado con</span>
              <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
              <span>para Netlify & Google Apps Script</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Change Admin PIN Modal */}
      <ChangePinModal
        isOpen={showChangePinModal}
        onClose={() => setShowChangePinModal(false)}
      />

    </div>
  );
}

