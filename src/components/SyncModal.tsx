import React, { useState } from 'react';
import { 
  syncWithGoogleSheetUrl, 
  syncWithAppsScript, 
  getAppSettings, 
  parseStudentsFromCsv, 
  parseSchedulesFromCsv,
  saveMockStudents,
  saveMockSchedules,
  getMockStudents,
  getMockSchedules,
  saveAppSettings
} from '../services/api';
import { AppSettings } from '../types';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Link2, 
  Code2, 
  ClipboardPaste, 
  X, 
  HelpCircle,
  Sparkles,
  Users,
  Calendar,
  Layers
} from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, onSyncComplete }) => {
  const settings = getAppSettings();
  const [activeTab, setActiveTab] = useState<'url' | 'gas' | 'paste'>('url');
  
  // Tab 1: Google Sheet URL / ID
  const [sheetUrlInput, setSheetUrlInput] = useState(settings.googleSheetUrlOrId || '');
  
  // Tab 2: Apps Script URL
  const [gasUrlInput, setGasUrlInput] = useState(settings.gasWebAppUrl || '');
  
  // Tab 3: Direct Paste
  const [pasteType, setPasteType] = useState<'alumnas' | 'horarios'>('alumnas');
  const [pasteContent, setPasteContent] = useState('');

  // Loading & feedback states
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSyncByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrlInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor ingresa el enlace o ID de tu Google Sheet.' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: 'info', text: 'Descargando y leyendo pestañas de Google Sheets...' });

    try {
      const res = await syncWithGoogleSheetUrl(sheetUrlInput.trim());
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        onSyncComplete();
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Error de sincronización: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncByGas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gasUrlInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Ingresa la URL de la Web App de Apps Script.' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: 'info', text: 'Conectando con la Web App de Google Apps Script...' });

    try {
      const res = await syncWithAppsScript(gasUrlInput.trim());
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        onSyncComplete();
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPaste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteContent.trim()) {
      setStatusMessage({ type: 'error', text: 'Pega las filas copiadas desde tu hoja de cálculo.' });
      return;
    }

    try {
      if (pasteType === 'alumnas') {
        const students = parseStudentsFromCsv(pasteContent);
        if (students.length === 0) {
          setStatusMessage({ type: 'error', text: 'No se reconocieron filas válidas de alumnas. Verifica que contenga Cédula/ID y Nombre.' });
          return;
        }
        saveMockStudents(students);
        
        const cur = getAppSettings();
        saveAppSettings({
          ...cur,
          useMockMode: false,
          lastSyncDate: new Date().toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }),
          lastSyncSource: 'manual',
          lastSyncCounts: {
            students: students.length,
            schedules: cur.lastSyncCounts?.schedules || getMockSchedules().length,
            registrations: cur.lastSyncCounts?.registrations || 0
          }
        });

        setStatusMessage({ type: 'success', text: `¡Listo! Se guardaron ${students.length} alumnas en el sistema.` });
        onSyncComplete();
        setTimeout(() => onClose(), 1500);
      } else {
        const schedules = parseSchedulesFromCsv(pasteContent);
        if (schedules.length === 0) {
          setStatusMessage({ type: 'error', text: 'No se reconocieron filas válidas de horarios. Verifica que contenga Sede, Día, Horario.' });
          return;
        }
        saveMockSchedules(schedules);
        
        const cur = getAppSettings();
        saveAppSettings({
          ...cur,
          useMockMode: false,
          lastSyncDate: new Date().toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }),
          lastSyncSource: 'manual',
          lastSyncCounts: {
            students: cur.lastSyncCounts?.students || getMockStudents().length,
            schedules: schedules.length,
            registrations: cur.lastSyncCounts?.registrations || 0
          }
        });

        setStatusMessage({ type: 'success', text: `¡Listo! Se guardaron ${schedules.length} horarios en el sistema.` });
        onSyncComplete();
        setTimeout(() => onClose(), 1500);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Error al procesar los datos: ${err.message}` });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <RefreshCw className="w-4 h-4 text-purple-400" />
            <span>Sincronización de Base de Datos</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Conectar & Traer Datos de Google Sheets
          </h2>
          <p className="text-slate-300 text-xs mt-1">
            Carga en tiempo real tu lista de alumnas, niveles y horarios desde tu hoja de cálculo.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('url'); setStatusMessage(null); }}
            className={`flex items-center space-x-2 py-2.5 px-4 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white text-purple-900 border-t-2 border-purple-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Link2 className="w-4 h-4 text-purple-600" />
            <span>Enlace de Google Sheet</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">Recomendado</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('gas'); setStatusMessage(null); }}
            className={`flex items-center space-x-2 py-2.5 px-4 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'gas'
                ? 'bg-white text-purple-900 border-t-2 border-purple-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-4 h-4 text-indigo-600" />
            <span>Apps Script Web App</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('paste'); setStatusMessage(null); }}
            className={`flex items-center space-x-2 py-2.5 px-4 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-white text-purple-900 border-t-2 border-purple-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardPaste className="w-4 h-4 text-amber-600" />
            <span>Copiar / Pegar Celdas</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Status Message Notification */}
          {statusMessage && (
            <div className={`p-4 rounded-2xl text-xs sm:text-sm flex items-start space-x-3 border ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-indigo-50 text-indigo-900 border-indigo-200'
            }`}>
              {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 animate-spin" />}
              <div className="font-medium leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {/* TAB 1: SYNC VIA GOOGLE SHEET URL / ID */}
          {activeTab === 'url' && (
            <form onSubmit={handleSyncByUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Enlace completo o ID de tu Google Sheet:
                </label>
                <div className="relative">
                  <FileSpreadsheet className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRrGz.../edit"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              {/* Instructions Box */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 text-xs text-purple-950 space-y-2">
                <div className="font-bold flex items-center space-x-1.5 text-purple-900">
                  <HelpCircle className="w-4 h-4 text-purple-700" />
                  <span>¿Cómo permitir que la app lea tu Google Sheet? (1 solo paso):</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-slate-700 font-medium">
                  <li>En tu Google Sheet, haz clic en el botón verde <strong>"Compartir"</strong> (arriba a la derecha).</li>
                  <li>En <em>"Acceso general"</em>, cambia de "Restringido" a <strong>"Cualquier persona con el enlace"</strong> (Rol: <strong>Lector</strong>).</li>
                  <li>Copia el enlace de la barra de direcciones de tu navegador y pégalo aquí arriba.</li>
                  <li>Asegúrate de que tus pestañas se llamen <code>Alumnas_Niveles</code> y <code>Sedes_Horarios</code>.</li>
                </ol>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !sheetUrlInput.trim()}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-all flex items-center space-x-2 shadow-md cursor-pointer text-xs"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Traer Alumnas y Horarios Ahora</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SYNC VIA GOOGLE APPS SCRIPT WEB APP */}
          {activeTab === 'gas' && (
            <form onSubmit={handleSyncByGas} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  URL de la Web App de Google Apps Script:
                </label>
                <div className="relative">
                  <Code2 className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={gasUrlInput}
                    onChange={(e) => setGasUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-950 space-y-2">
                <div className="font-bold flex items-center space-x-1.5 text-indigo-900">
                  <HelpCircle className="w-4 h-4 text-indigo-700" />
                  <span>Para usar la API de Apps Script:</span>
                </div>
                <p className="text-slate-700">
                  Pega el código de <code>Code.gs</code> en <em>Extensiones &gt; Apps Script</em> de tu hoja de cálculo, realiza un <strong>Nuevo Despliegue como Aplicación Web</strong> con acceso para <em>"Cualquier persona" (Anyone)</em>, y pega aquí la URL generada.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !gasUrlInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-all flex items-center space-x-2 shadow-md cursor-pointer text-xs"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sincronizando con Web App...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Sincronizar vía Apps Script</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: COPY & PASTE CELLS FROM SHEETS */}
          {activeTab === 'paste' && (
            <form onSubmit={handleProcessPaste} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Selecciona la tabla que deseas pegar:
                </span>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPasteType('alumnas')}
                    className={`text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      pasteType === 'alumnas'
                        ? 'bg-white text-purple-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Alumnas_Niveles</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasteType('horarios')}
                    className={`text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      pasteType === 'horarios'
                        ? 'bg-white text-purple-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Sedes_Horarios</span>
                  </button>
                </div>
              </div>

              <div>
                <textarea
                  rows={6}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder={
                    pasteType === 'alumnas'
                      ? 'Copia todas las filas de tu hoja Alumnas_Niveles en Google Sheets (Ctrl+C) y pégalas aquí (Ctrl+V)...'
                      : 'Copia todas las filas de tu hoja Sedes_Horarios en Google Sheets (Ctrl+C) y pégalas aquí (Ctrl+V)...'
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all leading-relaxed"
                />
              </div>

              <div className="text-[11px] text-slate-500">
                💡 Consejo: Puedes seleccionar todas las celdas directamente en Google Sheets o Excel, presionar <strong>Ctrl+C</strong> y pegarlas aquí directamente. El sistema detecta automáticamente columnas y formatos.
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!pasteContent.trim()}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-all flex items-center space-x-2 shadow-md cursor-pointer text-xs"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  <span>Guardar {pasteType === 'alumnas' ? 'Alumnas' : 'Horarios'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
