import React, { useState } from 'react';
import { APPS_SCRIPT_CODE, GOOGLE_SHEETS_STRUCTURE } from '../data/appsScriptCode';
import { AppSettings } from '../types';
import { saveAppSettings, getAdminPin, setAdminPin } from '../services/api';
import { 
  Code2, 
  Copy, 
  Check, 
  Database, 
  Globe, 
  Terminal, 
  FileSpreadsheet, 
  CheckCircle2, 
  ExternalLink, 
  Play, 
  Sparkles,
  Server,
  Layers,
  HelpCircle,
  KeyRound,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface GasScriptModalProps {
  settings: AppSettings;
  onSettingsUpdated: (newSettings: AppSettings) => void;
}

export const GasScriptModal: React.FC<GasScriptModalProps> = ({
  settings,
  onSettingsUpdated
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'code' | 'sheets' | 'gas_setup' | 'netlify' | 'security'>('code');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTabHeaders, setCopiedTabHeaders] = useState<string | null>(null);
  
  // URL testing state
  const [webAppUrlInput, setWebAppUrlInput] = useState(settings.gasWebAppUrl);
  const [useMockModeInput, setUseMockModeInput] = useState(settings.useMockMode);
  const [testingPing, setTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; message: string } | null>(null);

  // Admin PIN management state
  const [adminPinInput, setAdminPinInput] = useState(getAdminPin());
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleUpdateAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPinInput || adminPinInput.trim().length < 4) {
      setPinMessage({ type: 'error', text: 'El PIN debe tener al menos 4 caracteres.' });
      return;
    }
    const success = setAdminPin(adminPinInput.trim());
    if (success) {
      setPinMessage({ type: 'success', text: '¡PIN de administrador actualizado exitosamente!' });
      setTimeout(() => setPinMessage(null), 3500);
    } else {
      setPinMessage({ type: 'error', text: 'No se pudo guardar el PIN.' });
    }
  };

  const handleCopyCsvHeaders = (tabName: string, headers: string[]) => {
    const csv = headers.join(',');
    navigator.clipboard.writeText(csv);
    setCopiedTabHeaders(tabName);
    setTimeout(() => setCopiedTabHeaders(null), 2000);
  };

  const handleSaveSettings = () => {
    const updated: AppSettings = {
      gasWebAppUrl: webAppUrlInput.trim(),
      useMockMode: useMockModeInput
    };
    saveAppSettings(updated);
    onSettingsUpdated(updated);
  };

  const handleTestPing = async () => {
    if (!webAppUrlInput.trim()) {
      setPingResult({ success: false, message: 'Ingresa una URL de Google Apps Script primero.' });
      return;
    }
    setTestingPing(true);
    setPingResult(null);

    try {
      const url = `${webAppUrlInput.trim()}?action=ping`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setPingResult({ success: true, message: '¡Conexión exitosa! El backend de Apps Script respondió correctamente.' });
      } else {
        setPingResult({ success: false, message: json.message || 'El script no devolvió success=true.' });
      }
    } catch (err: any) {
      setPingResult({
        success: false,
        message: 'No se pudo conectar con la Web App de Apps Script. Verifica que el despliegue tenga acceso "Cualquier persona" (Anyone).'
      });
    } finally {
      setTestingPing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center space-x-1.5 bg-purple-500/30 text-purple-200 text-xs px-3 py-1 rounded-full font-medium mb-2 border border-purple-500/30">
              <Code2 className="w-3.5 h-3.5" />
              <span>Entregable Tecnológico Full-Stack</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Google Apps Script & Despliegue Netlify</h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCode}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shadow-md cursor-pointer text-sm"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Code.gs Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Code.gs Completo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Backend Live Connection Panel */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
          <Server className="w-5 h-5 text-purple-600" />
          <span>Conexión con tu Web App Pública de Apps Script</span>
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL de la Web App de Google Apps Script (Ej: https://script.google.com/macros/s/.../exec)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={webAppUrlInput}
                onChange={(e) => setWebAppUrlInput(e.target.value)}
                placeholder="Pega aquí la URL pública del despliegue en Apps Script"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white focus:outline-none"
              />
              <button
                onClick={handleTestPing}
                disabled={testingPing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {testingPing ? <Sparkles className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>Probar Conexión (Ping)</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useMockModeInput}
                onChange={(e) => setUseMockModeInput(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded-md border-slate-300 focus:ring-purple-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 font-medium">
                Usar modo simulador local (Recomendado para pruebas sin haber desplegado aún el script)
              </span>
            </label>

            <button
              onClick={handleSaveSettings}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Guardar Configuración
            </button>
          </div>

          {pingResult && (
            <div className={`p-3 rounded-xl text-xs border ${
              pingResult.success ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'
            }`}>
              {pingResult.message}
            </div>
          )}
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveSubTab('code')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 px-3 transition-colors cursor-pointer ${
            activeSubTab === 'code' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>1. Código Code.gs</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sheets')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 px-3 transition-colors cursor-pointer ${
            activeSubTab === 'sheets' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>2. Estructura Google Sheets</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gas_setup')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 px-3 transition-colors cursor-pointer ${
            activeSubTab === 'gas_setup' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>3. Configurar Apps Script</span>
        </button>

        <button
          onClick={() => setActiveSubTab('netlify')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 px-3 transition-colors cursor-pointer ${
            activeSubTab === 'netlify' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>4. Despliegue Netlify</span>
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`pb-3 text-sm font-semibold flex items-center space-x-2 border-b-2 px-3 transition-colors cursor-pointer ${
            activeSubTab === 'security' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>5. Seguridad & Clave Admin</span>
        </button>
      </div>

      {/* SUB-TAB 1: Code.gs Viewer */}
      {activeSubTab === 'code' && (
        <div className="bg-slate-950 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-3 font-mono text-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-slate-400">📄 Code.gs — Listo para copiar en Apps Script Editor</span>
            <button
              onClick={handleCopyCode}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-sans px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer font-semibold"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
            </button>
          </div>
          <pre className="max-h-[500px] overflow-y-auto pr-2 text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
            {APPS_SCRIPT_CODE}
          </pre>
        </div>
      )}

      {/* SUB-TAB 2: Sheets Structure */}
      {activeSubTab === 'sheets' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-lg">Requisitos de la Hoja de Cálculo en Google Sheets</h3>
            <p className="text-sm text-slate-600">
              Crea un libro de cálculo en tu Google Drive con exactamente las siguientes 3 pestañas y nombres de columna:
            </p>
          </div>

          {/* Tab 1 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-md text-xs font-mono">Pestaña 1</span>
                <span>{GOOGLE_SHEETS_STRUCTURE.tab1.name}</span>
              </span>
              <button
                onClick={() => handleCopyCsvHeaders(GOOGLE_SHEETS_STRUCTURE.tab1.name, GOOGLE_SHEETS_STRUCTURE.tab1.headers)}
                className="text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 cursor-pointer"
              >
                {copiedTabHeaders === GOOGLE_SHEETS_STRUCTURE.tab1.name ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Encabezados CSV</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-800 font-bold font-mono">
                  <tr>
                    {GOOGLE_SHEETS_STRUCTURE.tab1.headers.map(h => <th key={h} className="p-2 border border-slate-200">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {GOOGLE_SHEETS_STRUCTURE.tab1.sampleRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {row.map((val, cIdx) => <td key={cIdx} className="p-2 border border-slate-100 text-slate-700">{val}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tab 2 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-md text-xs font-mono">Pestaña 2</span>
                <span>{GOOGLE_SHEETS_STRUCTURE.tab2.name}</span>
              </span>
              <button
                onClick={() => handleCopyCsvHeaders(GOOGLE_SHEETS_STRUCTURE.tab2.name, GOOGLE_SHEETS_STRUCTURE.tab2.headers)}
                className="text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 cursor-pointer"
              >
                {copiedTabHeaders === GOOGLE_SHEETS_STRUCTURE.tab2.name ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Encabezados CSV</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-800 font-bold font-mono">
                  <tr>
                    {GOOGLE_SHEETS_STRUCTURE.tab2.headers.map(h => <th key={h} className="p-2 border border-slate-200">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {GOOGLE_SHEETS_STRUCTURE.tab2.sampleRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {row.map((val, cIdx) => <td key={cIdx} className="p-2 border border-slate-100 text-slate-700">{val}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tab 3 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <span className="bg-pink-100 text-pink-800 px-2.5 py-0.5 rounded-md text-xs font-mono">Pestaña 3</span>
                <span>{GOOGLE_SHEETS_STRUCTURE.tab3.name}</span>
              </span>
              <button
                onClick={() => handleCopyCsvHeaders(GOOGLE_SHEETS_STRUCTURE.tab3.name, GOOGLE_SHEETS_STRUCTURE.tab3.headers)}
                className="text-xs text-pink-700 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 cursor-pointer"
              >
                {copiedTabHeaders === GOOGLE_SHEETS_STRUCTURE.tab3.name ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Encabezados CSV</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-800 font-bold font-mono">
                  <tr>
                    {GOOGLE_SHEETS_STRUCTURE.tab3.headers.map(h => <th key={h} className="p-2 border border-slate-200">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {GOOGLE_SHEETS_STRUCTURE.tab3.sampleRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {row.map((val, cIdx) => <td key={cIdx} className="p-2 border border-slate-100 text-slate-700">{val}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Apps Script Step-by-Step Instructions */}
      {activeSubTab === 'gas_setup' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-800">
          <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
            Paso a Paso: Configuración de Google Cloud / Apps Script
          </h3>

          <ol className="space-y-4 list-decimal pl-5">
            <li className="space-y-1">
              <strong>Obtener ID de Google Sheets y Google Drive:</strong>
              <p className="text-xs text-slate-600">
                Abre tu hoja de cálculo y copia el ID de la URL (la cadena entre `/d/` y `/edit`). Haz lo mismo con la carpeta de Drive donde se guardarán los comprobantes de pago.
              </p>
            </li>

            <li className="space-y-1">
              <strong>Abrir Apps Script:</strong>
              <p className="text-xs text-slate-600">
                En tu Google Sheet, ve al menú <strong>Extensiones &gt; Apps Script</strong>. Elimina el código existente y pega el contenido completo de <code>Code.gs</code>.
              </p>
            </li>

            <li className="space-y-1">
              <strong>Reemplazar IDs en las constantes:</strong>
              <p className="text-xs text-slate-600">
                Reemplaza <code>REEMPLAZAR_CON_TU_SPREADSHEET_ID</code> y <code>REEMPLAZAR_CON_TU_DRIVE_FOLDER_ID</code> con los valores reales copiados en el paso 1.
              </p>
            </li>

            <li className="space-y-1">
              <strong>Desplegar como Aplicación Web (CRÍTICO):</strong>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p>・ Haz clic en <strong>Desplegar &gt; Nuevo despliegue</strong>.</p>
                <p>・ Selecciona el ícono de engranaje ⚙️ y elige <strong>Aplicación web</strong>.</p>
                <p>・ <strong>Ejecutar como:</strong> <code>Yo (tu email)</code>.</p>
                <p>・ <strong>Quién tiene acceso:</strong> <code>Cualquier persona</code> (Anyone).</p>
                <p>・ Haz clic en <strong>Desplegar</strong> y concede los permisos de Google Drive y Gmail.</p>
              </div>
            </li>

            <li className="space-y-1">
              <strong>Configurar el Trigger de Confirmación Automática:</strong>
              <p className="text-xs text-slate-600">
                En el menú lateral izquierdo de Apps Script, haz clic en el ícono de reloj <strong>(Activadores)</strong>. Añade un activador para la función <code>enviarConfirmacionFinal</code> ejecutándose según el tiempo (cada 15 minutos) o al editar la hoja.
              </p>
            </li>
          </ol>
        </div>
      )}

      {/* SUB-TAB 4: Netlify Hosting Instructions */}
      {activeSubTab === 'netlify' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-800">
          <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
            Paso a Paso: Despliegue Estático en Netlify
          </h3>

          <ol className="space-y-4 list-decimal pl-5">
            <li className="space-y-1">
              <strong>Exportar el Proyecto / Código:</strong>
              <p className="text-xs text-slate-600">
                Puedes subir el repositorio a GitHub o generar la carpeta de compilación estática ejecutando <code>npm run build</code>.
              </p>
            </li>

            <li className="space-y-1">
              <strong>Crear nuevo sitio en Netlify:</strong>
              <p className="text-xs text-slate-600">
                Inicia sesión en <a href="https://netlify.com" target="_blank" rel="noreferrer" className="text-purple-600 underline">Netlify.com</a> y haz clic en <strong>"Add new site" &gt; "Import an existing project"</strong>.
              </p>
            </li>

            <li className="space-y-1">
              <strong>Parámetros de Build en Netlify:</strong>
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-2">
                <p>Build Command: <span className="text-emerald-400">npm run build</span></p>
                <p>Publish directory: <span className="text-emerald-400">dist</span></p>
              </div>
            </li>

            <li className="space-y-1">
              <strong>Despliegue de Single Page Application:</strong>
              <p className="text-xs text-slate-600">
                La aplicación utiliza React con Vite optimizado para móviles y Netlify sirve los archivos estáticos desde la CDN global con redirección automática SPA.
              </p>
            </li>
          </ol>
        </div>
      )}

      {/* SUB-TAB 5: Security & Admin PIN Settings */}
      {activeSubTab === 'security' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <span className="inline-flex items-center space-x-1.5 bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacidad & Restricción de Acceso</span>
            </span>
            <h3 className="text-xl font-bold text-slate-900">Seguridad y PIN de Administrador</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Las alumnas y visitantes solo ven el formulario de inscripción y la consulta de estado. Las opciones internas (Dashboard, Sheets y Backend) están protegidas por este PIN.
            </p>
          </div>

          <form onSubmit={handleUpdateAdminPin} className="max-w-lg space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                PIN de Acceso al Panel de Control
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder="Ej: 1234 o tu contraseña personal"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Mínimo 4 dígitos o letras. Cámbialo cuando lo necesites.
              </p>
            </div>

            {pinMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                pinMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {pinMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{pinMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Guardar Nuevo PIN</span>
            </button>
          </form>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold">💡 Consejo para el despliegue en Netlify:</p>
            <p>
              Cuando compartes el enlace de Netlify a tus alumnas, ellas verán una interfaz limpia y profesional únicamente con la inscripción y la verificación. Tú podrás ingresar en cualquier momento haciendo clic en el enlace <strong>"Acceso Admin"</strong> con este PIN.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
