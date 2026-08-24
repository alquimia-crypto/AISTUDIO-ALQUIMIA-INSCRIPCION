/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlumnaNivel, SedeHorario, AppSettings } from './types';
import { getAppSettings } from './services/api';
import { Navbar } from './components/Navbar';
import { Step1Identification } from './components/Step1Identification';
import { Step2ScheduleSelection } from './components/Step2ScheduleSelection';
import { Step3ReceiptUpload } from './components/Step3ReceiptUpload';
import { Step4Confirmation } from './components/Step4Confirmation';
import { AdminDashboard } from './components/AdminDashboard';
import { StatusChecker } from './components/StatusChecker';
import { GasScriptModal } from './components/GasScriptModal';
import { SheetInspector } from './components/SheetInspector';
import { GraduationCap, Heart } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'form' | 'dashboard' | 'status' | 'code' | 'sheets'>('form');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedStudent, setSelectedStudent] = useState<AlumnaNivel | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<SedeHorario | null>(null);
  const [lastRegistrationId, setLastRegistrationId] = useState<string>('');
  const [lastDriveUrl, setLastDriveUrl] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());

  const handleStudentVerified = (student: AlumnaNivel) => {
    setSelectedStudent(student);
    setStep(2);
  };

  const handleScheduleSelected = (schedule: SedeHorario) => {
    setSelectedSchedule(schedule);
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
    setLastRegistrationId('');
    setLastDriveUrl('');
    setStep(1);
    setCurrentTab('form');
  };

  return (
    <div className="min-h-screen text-slate-900 flex flex-col font-sans antialiased relative">
      
      {/* Mesh Gradient Background for Frosted Glass Theme */}
      <div className="mesh-bg"></div>

      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        settings={settings}
        onOpenSettings={() => setCurrentTab('code')}
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
                onScheduleSelected={handleScheduleSelected}
              />
            )}

            {/* Step 3 View */}
            {step === 3 && selectedStudent && selectedSchedule && (
              <Step3ReceiptUpload
                student={selectedStudent}
                schedule={selectedSchedule}
                onBack={() => setStep(2)}
                onSuccess={handleRegistrationSuccess}
              />
            )}

            {/* Step 4 View */}
            {step === 4 && selectedStudent && selectedSchedule && (
              <Step4Confirmation
                student={selectedStudent}
                schedule={selectedSchedule}
                idRegistro={lastRegistrationId}
                driveUrl={lastDriveUrl}
                onNewRegistration={handleResetForm}
                onGoToStatus={() => setCurrentTab('status')}
              />
            )}

          </div>
        )}

        {/* TAB: Admin Dashboard */}
        {currentTab === 'dashboard' && <AdminDashboard />}

        {/* TAB: Consultar Estado */}
        {currentTab === 'status' && <StatusChecker />}

        {/* TAB: Code.gs & Netlify Setup */}
        {currentTab === 'code' && (
          <GasScriptModal
            settings={settings}
            onSettingsUpdated={(newSet) => setSettings(newSet)}
          />
        )}

        {/* TAB: Google Sheets Data Inspector */}
        {currentTab === 'sheets' && <SheetInspector />}

      </main>

      {/* Footer */}
      <footer className="bg-white/40 backdrop-blur-md border-t border-white/50 py-6 mt-12 text-xs text-slate-600 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-800">Plataforma de Inscripción & Reserva de Cupos</span>
            <span>・ Backend Google Sheets & Google Drive</span>
          </div>

          <div className="flex items-center space-x-1 text-slate-400">
            <span>Diseñado con</span>
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
            <span>para Netlify & Google Apps Script</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

