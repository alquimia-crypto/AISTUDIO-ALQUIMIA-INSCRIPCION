import React, { useState } from 'react';
import { 
  getMockStudents, 
  saveMockStudents, 
  getMockSchedules, 
  saveMockSchedules, 
  getMockRegistrations, 
  saveMockRegistrations,
  resetMockDataToDefault,
  saveScheduleApi,
  deleteScheduleApi,
  getAppSettings,
  syncWithGoogleSheetUrl,
  syncWithAppsScript,
  formatFriendlyTime
} from '../services/api';
import { AlumnaNivel, SedeHorario, Inscripcion, AppSettings } from '../types';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Plus, 
  ExternalLink, 
  Search, 
  Users, 
  Calendar, 
  Sparkles, 
  MailCheck, 
  Trash2, 
  X, 
  FileSpreadsheet, 
  HelpCircle, 
  Sparkle,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Layers,
  Settings2
} from 'lucide-react';
import { SyncModal } from './SyncModal';

export const SheetInspector: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inscripciones' | 'alumnas' | 'horarios'>('inscripciones');
  const [students, setStudents] = useState<AlumnaNivel[]>(getMockStudents());
  const [schedules, setSchedules] = useState<SedeHorario[]>(getMockSchedules());
  const [registrations, setRegistrations] = useState<Inscripcion[]>(getMockRegistrations());
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isQuickSyncing, setIsQuickSyncing] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(getAppSettings());

  // Modals for adding new student & schedule
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState<AlumnaNivel>({
    ID_Cliente: '',
    Nombre_Representante: '',
    Telefono_WhatsApp: '',
    Email: '',
    Nombre_Alumna: '',
    Nivel_Asignado: 'Principiante',
    Estado: 'Activo'
  });

  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState<SedeHorario>({
    ID_Horario: '',
    Sede: 'Sede Principal (Norte)',
    Nivel_Requerido: 'Principiante',
    Dia: 'Lunes y Miércoles',
    Horario: '16:00 - 17:30',
    Cupo_Maximo: 10,
    Cupos_Ocupados: 0,
    Estado_Horario: 'Disponible'
  });

  const refreshLocalState = () => {
    setStudents(getMockStudents());
    setSchedules(getMockSchedules());
    setRegistrations(getMockRegistrations());
    setAppSettings(getAppSettings());
  };

  const handleQuickSync = async () => {
    const current = getAppSettings();
    if (current.googleSheetUrlOrId) {
      setIsQuickSyncing(true);
      try {
        const res = await syncWithGoogleSheetUrl(current.googleSheetUrlOrId);
        if (res.success) {
          refreshLocalState();
          showBanner(res.message);
        } else {
          showBanner(res.message);
          setShowSyncModal(true);
        }
      } catch (err: any) {
        showBanner(`Error: ${err.message}`);
        setShowSyncModal(true);
      } finally {
        setIsQuickSyncing(false);
      }
    } else if (current.gasWebAppUrl) {
      setIsQuickSyncing(true);
      try {
        const res = await syncWithAppsScript(current.gasWebAppUrl);
        if (res.success) {
          refreshLocalState();
          showBanner(res.message);
        } else {
          showBanner(res.message);
          setShowSyncModal(true);
        }
      } catch (err: any) {
        showBanner(`Error: ${err.message}`);
        setShowSyncModal(true);
      } finally {
        setIsQuickSyncing(false);
      }
    } else {
      setShowSyncModal(true);
    }
  };

  const handleReset = () => {
    if (confirm('¿Deseas reiniciar los datos a los valores de ejemplo iniciales?')) {
      resetMockDataToDefault();
      refreshLocalState();
      showBanner('Datos reiniciados a los valores de ejemplo.');
    }
  };

  const showBanner = (msg: string) => {
    setNotificationBanner(msg);
    setTimeout(() => setNotificationBanner(null), 4000);
  };

  // Add new student
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.ID_Cliente || !newStudent.Nombre_Alumna) {
      alert('Por favor ingresa al menos la Cédula/ID y el Nombre de la Alumna.');
      return;
    }

    const updated = [newStudent, ...students];
    setStudents(updated);
    saveMockStudents(updated);
    setShowAddStudentModal(false);
    showBanner(`¡Alumna "${newStudent.Nombre_Alumna}" guardada exitosamente! Ya puede buscarse en el formulario.`);
    setNewStudent({
      ID_Cliente: '',
      Nombre_Representante: '',
      Telefono_WhatsApp: '',
      Email: '',
      Nombre_Alumna: '',
      Nivel_Asignado: 'Principiante',
      Estado: 'Activo'
    });
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm(`¿Eliminar a la alumna con ID ${id}?`)) {
      const updated = students.filter(s => s.ID_Cliente !== id);
      setStudents(updated);
      saveMockStudents(updated);
      showBanner(`Alumna eliminada.`);
    }
  };

  // Add new schedule
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = newSchedule.ID_Horario.trim() || `HOR-00${schedules.length + 1}`;
    const scheduleToSave = {
      ...newSchedule,
      ID_Horario: id
    };

    const res = await saveScheduleApi(scheduleToSave);
    setSchedules(getMockSchedules());
    setShowAddScheduleModal(false);
    showBanner(res.message || `¡Horario "${scheduleToSave.Dia} ${scheduleToSave.Horario}" guardado exitosamente!`);
    setNewSchedule({
      ID_Horario: '',
      Sede: 'Sede Principal (Norte)',
      Nivel_Requerido: 'Principiante',
      Dia: 'Lunes y Miércoles',
      Horario: '16:00 - 17:30',
      Cupo_Maximo: 10,
      Cupos_Ocupados: 0,
      Estado_Horario: 'Disponible'
    });
  };

  const handleDeleteSchedule = async (id: string) => {
    if (confirm(`¿Eliminar el horario ${id}?`)) {
      const res = await deleteScheduleApi(id);
      setSchedules(getMockSchedules());
      showBanner(res.message || `Horario ${id} eliminado.`);
    }
  };

  /**
   * Simulates the Apps Script trigger `enviarConfirmacionFinal()`
   */
  const handleUpdateStatus = (idRegistro: string, newStatus: 'Pendiente' | 'Confirmado' | 'Rechazado') => {
    const updated = registrations.map(reg => {
      if (reg.ID_Registro === idRegistro) {
        const notif: 'SI' | 'NO' = newStatus === 'Confirmado' ? 'SI' : reg.Notificado_Confirmacion;
        return {
          ...reg,
          Estado_Inscripcion: newStatus,
          Notificado_Confirmacion: notif
        };
      }
      return reg;
    });

    setRegistrations(updated);
    saveMockRegistrations(updated);

    if (newStatus === 'Confirmado') {
      showBanner(`Trigger: Estado cambiado a 'Confirmado'. Se ha enviado el correo de confirmación final y marcado Notificado_Confirmacion='SI'.`);
    } else {
      showBanner(`Estado de registro ${idRegistro} actualizado a ${newStatus}.`);
    }
  };

  const filteredRegistrations = registrations.filter(r => 
    !searchTerm || 
    r.Nombre_Alumna.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.ID_Cliente.includes(searchTerm) ||
    r.ID_Registro.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = students.filter(s =>
    !searchTerm ||
    s.Nombre_Alumna.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.Nombre_Representante.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ID_Cliente.includes(searchTerm) ||
    s.Nivel_Asignado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSchedules = schedules.filter(sch =>
    !searchTerm ||
    sch.Sede.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sch.Nivel_Requerido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sch.Dia.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center space-x-1.5 bg-purple-500/30 text-purple-200 text-xs px-3 py-1 rounded-full font-medium mb-2 border border-purple-500/30">
            <Database className="w-3.5 h-3.5" />
            <span>Gestión de Base de Datos & Google Sheets</span>
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Alumnas, Horarios e Inscripciones</h2>
          <p className="text-purple-200 text-xs sm:text-sm mt-1 max-w-2xl">
            Gestiona la información de <strong>Alquimia Danza Aérea</strong>. Sincroniza en tiempo real tus alumnas y horarios desde Google Sheets o añade registros aquí.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleQuickSync}
            disabled={isQuickSyncing}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-purple-950/40 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isQuickSyncing ? 'animate-spin' : ''}`} />
            <span>{isQuickSyncing ? 'Sincronizando...' : 'Sincronizar con Sheets'}</span>
          </button>

          <button
            onClick={handleReset}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shrink-0"
            title="Reiniciar a datos de ejemplo locales"
          >
            <span>Restablecer</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Sync Connection Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        appSettings.googleSheetUrlOrId || appSettings.gasWebAppUrl
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-xs'
          : 'bg-amber-50/80 border-amber-200 text-amber-950 shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
              appSettings.googleSheetUrlOrId || appSettings.gasWebAppUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-bold text-sm text-slate-900">
                  {appSettings.googleSheetUrlOrId || appSettings.gasWebAppUrl
                    ? 'Conexión Activa con Google Sheets'
                    : 'Modo Local / Datos de Ejemplo'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  appSettings.googleSheetUrlOrId || appSettings.gasWebAppUrl
                    ? 'bg-emerald-200 text-emerald-800'
                    : 'bg-amber-200 text-amber-800'
                }`}>
                  {appSettings.googleSheetUrlOrId || appSettings.gasWebAppUrl ? 'Sincronizado' : 'Sin vincular'}
                </span>
              </div>
              
              <p className="text-xs text-slate-600 mt-1">
                {appSettings.googleSheetUrlOrId || appSettings.gasWebAppUrl ? (
                  <>
                    Tus datos están conectados.{' '}
                    {appSettings.lastSyncDate && (
                      <span className="font-medium text-slate-700">
                        Última actualización: <strong>{appSettings.lastSyncDate}</strong>.
                      </span>
                    )}
                    {' '}({students.length} alumnas y {schedules.length} horarios cargados).
                  </>
                ) : (
                  <>
                    ¿Ya actualizaste tus alumnas y horarios en Google Sheets? Haz clic en <strong>"Traer Datos de Google Sheets"</strong> para cargarlos aquí al instante.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowSyncModal(true)}
              className="w-full md:w-auto bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
              <span>{appSettings.googleSheetUrlOrId || appSettings.gasWebAppUrl ? 'Actualizar / Cambiar Hoja' : 'Traer Datos de Google Sheets'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulated Email Trigger Banner */}
      {notificationBanner && (
        <div className="bg-emerald-900 text-emerald-100 p-4 rounded-2xl border border-emerald-700 shadow-lg text-xs font-medium flex items-center space-x-2 animate-fadeIn">
          <MailCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{notificationBanner}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('inscripciones'); setSearchTerm(''); }}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 px-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'inscripciones' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Inscripciones ({registrations.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('alumnas'); setSearchTerm(''); }}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 px-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'alumnas' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Alumnas_Niveles ({students.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('horarios'); setSearchTerm(''); }}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 px-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'horarios' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Sedes_Horarios ({schedules.length})</span>
        </button>
      </div>

      {/* TAB 1: INSCRIPCIONES */}
      {activeTab === 'inscripciones' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Filtrar inscripciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <p className="text-xs text-slate-500">
              💡 Cambia el estado a <strong>"Confirmado"</strong> para simular el envío del correo de confirmación final.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-800 font-bold font-mono">
                  <tr>
                    <th className="p-3 border-b">ID_Registro</th>
                    <th className="p-3 border-b">Fecha_Registro</th>
                    <th className="p-3 border-b">ID_Cliente</th>
                    <th className="p-3 border-b">Nombre_Alumna</th>
                    <th className="p-3 border-b">Sede</th>
                    <th className="p-3 border-b">Horario_Seleccionado</th>
                    <th className="p-3 border-b">Estado_Inscripcion</th>
                    <th className="p-3 border-b">Notificado_Confirmacion</th>
                    <th className="p-3 border-b">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegistrations.map((row, idx) => (
                    <tr key={`reg-row-${row.ID_Registro || 'reg'}-${idx}`} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{row.ID_Registro}</td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">{row.Fecha_Registro}</td>
                      <td className="p-3 font-mono">{row.ID_Cliente}</td>
                      <td className="p-3 font-bold text-purple-900">{row.Nombre_Alumna}</td>
                      <td className="p-3">{row.Sede}</td>
                      <td className="p-3">{formatFriendlyTime(row.Horario_Seleccionado)}</td>
                      <td className="p-3">
                        <select
                          value={row.Estado_Inscripcion}
                          onChange={(e) => handleUpdateStatus(row.ID_Registro, e.target.value as any)}
                          className={`px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                            row.Estado_Inscripcion === 'Confirmado'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : row.Estado_Inscripcion === 'Rechazado'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Confirmado">Confirmado</option>
                          <option value="Rechazado">Rechazado</option>
                        </select>
                      </td>
                      <td className="p-3 font-mono font-bold">
                        {row.Notificado_Confirmacion === 'SI' ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            SI (Enviado)
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            NO
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {row.URL_Comprobante_Drive && row.URL_Comprobante_Drive !== 'Sin comprobante' ? (
                          <a href={row.URL_Comprobante_Drive} target="_blank" rel="noreferrer" className="text-purple-700 font-medium underline inline-flex items-center space-x-1">
                            <span>Ver Drive</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400">Sin archivo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALUMNAS_NIVELES */}
      {activeTab === 'alumnas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Buscar alumna, representante o nivel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <button
              onClick={() => setShowAddStudentModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Alumna</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-800 font-bold font-mono">
                  <tr>
                    <th className="p-3 border-b">ID_Cliente (Cédula/Código)</th>
                    <th className="p-3 border-b">Nombre_Representante</th>
                    <th className="p-3 border-b">Telefono_WhatsApp</th>
                    <th className="p-3 border-b">Email</th>
                    <th className="p-3 border-b">Nombre_Alumna</th>
                    <th className="p-3 border-b">Nivel_Asignado</th>
                    <th className="p-3 border-b">Estado</th>
                    <th className="p-3 border-b text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st, idx) => (
                    <tr key={`st-row-${st.ID_Cliente || 'st'}-${idx}`} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{st.ID_Cliente}</td>
                      <td className="p-3 font-medium text-slate-800">{st.Nombre_Representante}</td>
                      <td className="p-3 text-slate-600">{st.Telefono_WhatsApp}</td>
                      <td className="p-3 text-slate-600">{st.Email}</td>
                      <td className="p-3 font-bold text-purple-900">{st.Nombre_Alumna}</td>
                      <td className="p-3 font-semibold text-slate-800">{st.Nivel_Asignado}</td>
                      <td className="p-3 font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                          st.Estado === 'Activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {st.Estado}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteStudent(st.ID_Cliente)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-md transition-colors cursor-pointer"
                          title="Eliminar alumna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SEDES_HORARIOS */}
      {activeTab === 'horarios' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Buscar por sede o nivel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <button
              onClick={() => setShowAddScheduleModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Horario</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-800 font-bold font-mono">
                  <tr>
                    <th className="p-3 border-b">ID_Horario</th>
                    <th className="p-3 border-b">Sede</th>
                    <th className="p-3 border-b">Nivel_Requerido</th>
                    <th className="p-3 border-b">Dia</th>
                    <th className="p-3 border-b">Horario</th>
                    <th className="p-3 border-b">Cupo_Maximo</th>
                    <th className="p-3 border-b">Cupos_Ocupados</th>
                    <th className="p-3 border-b">Estado_Horario</th>
                    <th className="p-3 border-b text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSchedules.map((sch, idx) => (
                    <tr key={`sch-row-${sch.ID_Horario || 'sch'}-${idx}`} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{sch.ID_Horario}</td>
                      <td className="p-3 font-medium text-slate-800">{sch.Sede}</td>
                      <td className="p-3 font-semibold text-purple-900">{sch.Nivel_Requerido}</td>
                      <td className="p-3 text-slate-700">{sch.Dia}</td>
                      <td className="p-3 text-slate-700">{formatFriendlyTime(sch.Horario)}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{sch.Cupo_Maximo}</td>
                      <td className="p-3 font-mono font-bold text-purple-700">{sch.Cupos_Ocupados}</td>
                      <td className="p-3 font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                          sch.Cupos_Ocupados >= sch.Cupo_Maximo || sch.Estado_Horario === 'Lleno' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {sch.Cupos_Ocupados >= sch.Cupo_Maximo ? 'Lleno' : 'Disponible'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteSchedule(sch.ID_Horario)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-md transition-colors cursor-pointer"
                          title="Eliminar horario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD STUDENT */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowAddStudentModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                Tabla Alumnas_Niveles
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">Registrar Nueva Alumna</h3>
              <p className="text-xs text-slate-500">
                La alumna podrá identificarse en el Paso 1 con su Cédula/ID o Teléfono WhatsApp.
              </p>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cédula / ID Cliente *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 1723456789"
                    value={newStudent.ID_Cliente}
                    onChange={(e) => setNewStudent({ ...newStudent, ID_Cliente: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Alumna *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Valentina Morales"
                    value={newStudent.Nombre_Alumna}
                    onChange={(e) => setNewStudent({ ...newStudent, Nombre_Alumna: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Representante</label>
                  <input
                    type="text"
                    placeholder="Ej: Gabriela Castro"
                    value={newStudent.Nombre_Representante}
                    onChange={(e) => setNewStudent({ ...newStudent, Nombre_Representante: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ej: +593998765432"
                    value={newStudent.Telefono_WhatsApp}
                    onChange={(e) => setNewStudent({ ...newStudent, Telefono_WhatsApp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="Ej: representante@gmail.com"
                  value={newStudent.Email}
                  onChange={(e) => setNewStudent({ ...newStudent, Email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nivel Asignado</label>
                  <select
                    value={newStudent.Nivel_Asignado}
                    onChange={(e) => setNewStudent({ ...newStudent, Nivel_Asignado: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  >
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                    <option value="Infantil A">Infantil A</option>
                    <option value="Danza Aérea">Danza Aérea</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                  <select
                    value={newStudent.Estado}
                    onChange={(e) => setNewStudent({ ...newStudent, Estado: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200"
                >
                  Guardar Alumna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SCHEDULE */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowAddScheduleModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                Tabla Sedes_Horarios
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">Crear Nuevo Horario</h3>
              <p className="text-xs text-slate-500">
                Se mostrará únicamente a las alumnas cuyo nivel coincida con este horario.
              </p>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sede *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sede Principal (Norte)"
                    value={newSchedule.Sede}
                    onChange={(e) => setNewSchedule({ ...newSchedule, Sede: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nivel Requerido *</label>
                  <select
                    value={newSchedule.Nivel_Requerido}
                    onChange={(e) => setNewSchedule({ ...newSchedule, Nivel_Requerido: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  >
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                    <option value="Infantil A">Infantil A</option>
                    <option value="Danza Aérea">Danza Aérea</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Días *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Lunes y Miércoles"
                    value={newSchedule.Dia}
                    onChange={(e) => setNewSchedule({ ...newSchedule, Dia: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Horario *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 16:30 - 18:00"
                    value={newSchedule.Horario}
                    onChange={(e) => setNewSchedule({ ...newSchedule, Horario: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cupo Máximo</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newSchedule.Cupo_Maximo}
                    onChange={(e) => setNewSchedule({ ...newSchedule, Cupo_Maximo: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cupos Ocupados Iniciales</label>
                  <input
                    type="number"
                    min="0"
                    value={newSchedule.Cupos_Ocupados}
                    onChange={(e) => setNewSchedule({ ...newSchedule, Cupos_Ocupados: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200"
                >
                  Guardar Horario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sync with Google Sheets Modal */}
      <SyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onSyncComplete={refreshLocalState}
      />

    </div>
  );
};
