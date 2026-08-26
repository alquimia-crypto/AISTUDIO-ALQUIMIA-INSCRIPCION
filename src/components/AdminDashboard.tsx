import React, { useState, useEffect } from 'react';
import { 
  getMockSchedules, 
  getMockRegistrations, 
  getMockStudents,
  getMockWaitingList,
  updateWaitingListStatusApi,
  deleteWaitingListEntryApi,
  getAppSettings,
  saveScheduleApi,
  deleteScheduleApi,
  bulkSyncSchedulesApi,
  fetchLiveSchedulesFromSheetApi,
  formatFriendlyTime
} from '../services/api';
import { SedeHorario, Inscripcion, AlumnaNivel, WaitingListEntry } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  BarChart3, 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  MapPin, 
  RefreshCw, 
  Sparkles, 
  Building2, 
  PieChart as PieChartIcon,
  Layers,
  Award,
  AlertTriangle,
  KeyRound,
  Plus,
  Edit3,
  Trash2,
  Save,
  Upload,
  Download,
  Database,
  FileSpreadsheet,
  Check,
  X,
  Search,
  Filter,
  SlidersHorizontal,
  CloudCheck,
  Calendar,
  AlertCircle,
  BellRing,
  Mail,
  Phone
} from 'lucide-react';
import { ChangePinModal } from './ChangePinModal';
import { SyncModal } from './SyncModal';

export const AdminDashboard: React.FC = () => {
  const [schedules, setSchedules] = useState<SedeHorario[]>([]);
  const [registrations, setRegistrations] = useState<Inscripcion[]>([]);
  const [students, setStudents] = useState<AlumnaNivel[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'schedules' | 'waitingList' | 'metrics'>('schedules');
  const [selectedSedeFilter, setSelectedSedeFilter] = useState<string>('TODAS');
  const [selectedNivelFilter, setSelectedNivelFilter] = useState<string>('TODOS');
  const [searchScheduleTerm, setSearchScheduleTerm] = useState<string>('');
  const [searchWaitingTerm, setSearchWaitingTerm] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [showChangePinModal, setShowChangePinModal] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [isSyncingWithSheets, setIsSyncingWithSheets] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modal State for Add / Edit Schedule
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [scheduleForm, setScheduleForm] = useState<SedeHorario>({
    ID_Horario: '',
    Sede: 'Sede Principal (Norte)',
    Nivel_Requerido: 'Principiante',
    Dia: 'Lunes y Miércoles',
    Horario: '16:00 - 17:30',
    Cupo_Maximo: 10,
    Cupos_Ocupados: 0,
    Estado_Horario: 'Disponible'
  });

  // Modal State for Bulk CSV Import
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');

  const appSettings = getAppSettings();
  const isGoogleSheetsConfigured = !appSettings.useMockMode && Boolean(appSettings.gasWebAppUrl);

  const loadData = () => {
    setSchedules(getMockSchedules());
    setRegistrations(getMockRegistrations());
    setStudents(getMockStudents());
    setWaitingList(getMockWaitingList());
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Metric computations
  const totalCapacidad = schedules.reduce((acc, curr) => acc + (curr.Cupo_Maximo || 0), 0);
  const totalOcupados = schedules.reduce((acc, curr) => acc + (curr.Cupos_Ocupados || 0), 0);
  const totalDisponibles = Math.max(0, totalCapacidad - totalOcupados);
  const tasaOcupacionGlobal = totalCapacidad > 0 ? ((totalOcupados / totalCapacidad) * 100).toFixed(1) : '0';

  const totalInscripciones = registrations.length;
  const inscripcionesConfirmadas = registrations.filter(r => r.Estado_Inscripcion === 'Confirmado').length;
  const inscripcionesPendientes = registrations.filter(r => r.Estado_Inscripcion === 'Pendiente').length;

  // Sedes list for filter & aggregation
  const sedesList: string[] = Array.from(new Set(schedules.map(s => s.Sede)));
  const nivelesList: string[] = Array.from(new Set(schedules.map(s => s.Nivel_Requerido)));

  // Data for Chart 1: Sede Bar Chart
  const sedeChartData = sedesList.map(sedeName => {
    const sedeSchedules = schedules.filter(s => s.Sede === sedeName);
    const maxCap = sedeSchedules.reduce((acc, curr) => acc + curr.Cupo_Maximo, 0);
    const ocuCap = sedeSchedules.reduce((acc, curr) => acc + curr.Cupos_Ocupados, 0);
    const freeCap = Math.max(0, maxCap - ocuCap);
    const tasa = maxCap > 0 ? Math.round((ocuCap / maxCap) * 100) : 0;
    const shortName = sedeName.replace(' (Principal)', '');

    return {
      nombre: shortName,
      fullName: sedeName,
      Ocupados: ocuCap,
      Disponibles: freeCap,
      Capacidad: maxCap,
      Tasa: tasa
    };
  });

  // Data for Chart 2: Occupancy by Level
  const nivelChartData = nivelesList.map(nivelName => {
    const levelSchedules = schedules.filter(s => s.Nivel_Requerido === nivelName);
    const maxCap = levelSchedules.reduce((acc, curr) => acc + curr.Cupo_Maximo, 0);
    const ocuCap = levelSchedules.reduce((acc, curr) => acc + curr.Cupos_Ocupados, 0);
    const freeCap = Math.max(0, maxCap - ocuCap);

    return {
      nivel: nivelName,
      Ocupados: ocuCap,
      Disponibles: freeCap,
      Total: maxCap
    };
  });

  // Pie chart data
  const pieStatusData = [
    { name: 'Cupos Confirmados', value: totalOcupados, color: '#6366f1' },
    { name: 'Cupos Disponibles', value: totalDisponibles, color: '#ec4899' },
  ];

  // Filtered schedules table
  const filteredSchedules = schedules.filter(item => {
    const matchesSede = selectedSedeFilter === 'TODAS' || item.Sede === selectedSedeFilter;
    const matchesNivel = selectedNivelFilter === 'TODOS' || item.Nivel_Requerido === selectedNivelFilter;
    const matchesSearch = !searchScheduleTerm || 
      item.ID_Horario.toLowerCase().includes(searchScheduleTerm.toLowerCase()) ||
      item.Sede.toLowerCase().includes(searchScheduleTerm.toLowerCase()) ||
      item.Nivel_Requerido.toLowerCase().includes(searchScheduleTerm.toLowerCase()) ||
      item.Dia.toLowerCase().includes(searchScheduleTerm.toLowerCase()) ||
      item.Horario.toLowerCase().includes(searchScheduleTerm.toLowerCase());

    return matchesSede && matchesNivel && matchesSearch;
  });

  // --- SCHEDULE HANDLERS ---

  const handleOpenCreateModal = () => {
    setModalMode('create');
    const nextNum = schedules.length + 1;
    const autoId = `HOR-${nextNum < 10 ? '00' : nextNum < 100 ? '0' : ''}${nextNum}`;
    setScheduleForm({
      ID_Horario: autoId,
      Sede: sedesList[0] || 'Sede Principal (Norte)',
      Nivel_Requerido: 'Principiante',
      Dia: 'Lunes y Miércoles',
      Horario: '16:00 - 17:30',
      Cupo_Maximo: 10,
      Cupos_Ocupados: 0,
      Estado_Horario: 'Disponible'
    });
    setShowScheduleModal(true);
  };

  const handleOpenEditModal = (schedule: SedeHorario) => {
    setModalMode('edit');
    setScheduleForm({ ...schedule });
    setShowScheduleModal(true);
  };

  const handleSaveScheduleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.ID_Horario.trim() || !scheduleForm.Sede.trim() || !scheduleForm.Horario.trim()) {
      showToast('Por favor completa los campos obligatorios del horario.', 'error');
      return;
    }

    const estadoFinal = scheduleForm.Cupos_Ocupados >= scheduleForm.Cupo_Maximo ? 'Lleno' : scheduleForm.Estado_Horario;
    const finalizedSchedule: SedeHorario = {
      ...scheduleForm,
      ID_Horario: scheduleForm.ID_Horario.trim().toUpperCase(),
      Estado_Horario: estadoFinal
    };

    setIsSyncingWithSheets(true);
    try {
      const res = await saveScheduleApi(finalizedSchedule);
      loadData();
      setShowScheduleModal(false);
      showToast(res.message || 'Horario guardado correctamente.', 'success');
    } catch (err) {
      showToast('Error al guardar el horario.', 'error');
    } finally {
      setIsSyncingWithSheets(false);
    }
  };

  const handleDeleteSchedule = async (idHorario: string) => {
    if (confirm(`¿Estás seguro de eliminar el horario ${idHorario}? Esta acción también lo removerá de Google Sheets.`)) {
      setIsSyncingWithSheets(true);
      try {
        const res = await deleteScheduleApi(idHorario);
        loadData();
        showToast(res.message || `Horario ${idHorario} eliminado.`, 'info');
      } catch (err) {
        showToast('Error al eliminar horario.', 'error');
      } finally {
        setIsSyncingWithSheets(false);
      }
    }
  };

  // Quick Cupo Adjustment (+1 / -1)
  const handleQuickCupoChange = async (schedule: SedeHorario, delta: number) => {
    const newOccupied = Math.max(0, Math.min(schedule.Cupo_Maximo, schedule.Cupos_Ocupados + delta));
    const newEstado = newOccupied >= schedule.Cupo_Maximo ? 'Lleno' : 'Disponible';
    
    const updated: SedeHorario = {
      ...schedule,
      Cupos_Ocupados: newOccupied,
      Estado_Horario: newEstado
    };

    await saveScheduleApi(updated);
    loadData();
    showToast(`Cupos de ${schedule.ID_Horario} actualizados a ${newOccupied}/${schedule.Cupo_Maximo}.`);
  };

  // Quick State Toggle (Disponible <-> Lleno)
  const handleToggleEstado = async (schedule: SedeHorario) => {
    const newEstado = schedule.Estado_Horario === 'Disponible' ? 'Lleno' : 'Disponible';
    const updated: SedeHorario = {
      ...schedule,
      Estado_Horario: newEstado
    };

    await saveScheduleApi(updated);
    loadData();
    showToast(`Estado de ${schedule.ID_Horario} cambiado a "${newEstado}".`);
  };

  // Fetch Live from Google Sheets
  const handleFetchFromGoogleSheets = async () => {
    setIsSyncingWithSheets(true);
    try {
      const res = await fetchLiveSchedulesFromSheetApi();
      if (res.success && res.data) {
        setSchedules(res.data);
        showToast(res.message || 'Datos descargados desde Google Sheets.', 'success');
      } else {
        showToast(res.message || 'No se pudieron descargar los datos en vivo.', 'error');
      }
    } catch (error) {
      showToast('Error de comunicación con Google Sheets.', 'error');
    } finally {
      setIsSyncingWithSheets(false);
    }
  };

  // Sincronizar todos los horarios locales hacia Google Sheets
  const handleSyncAllToGoogleSheets = async () => {
    if (!confirm('¿Deseas enviar y sincronizar todos los horarios actuales directamente a tu hoja de cálculo Google Sheets?')) {
      return;
    }
    setIsSyncingWithSheets(true);
    try {
      const res = await bulkSyncSchedulesApi(schedules);
      if (res.success) {
        showToast(res.message || '¡Horarios sincronizados con Google Sheets!', 'success');
      } else {
        showToast(res.message || 'Error al sincronizar con Google Sheets.', 'error');
      }
    } catch (error) {
      showToast('Error de conexión al sincronizar con Google Sheets.', 'error');
    } finally {
      setIsSyncingWithSheets(false);
    }
  };

  // Actualizar estado de registro en Lista de Espera
  const handleUpdateWaitingListStatus = async (idEspera: string, newStatus: WaitingListEntry['Estado_Espera']) => {
    try {
      const res = await updateWaitingListStatusApi(idEspera, newStatus);
      loadData();
      showToast(res.message, 'success');
    } catch {
      showToast('Error al actualizar estado en la lista de espera.', 'error');
    }
  };

  // Eliminar registro de Lista de Espera
  const handleDeleteWaitingListEntry = async (idEspera: string) => {
    if (confirm(`¿Estás seguro de eliminar el registro ${idEspera} de la lista de espera?`)) {
      try {
        const res = await deleteWaitingListEntryApi(idEspera);
        loadData();
        showToast(res.message, 'info');
      } catch {
        showToast('Error al eliminar registro.', 'error');
      }
    }
  };

  // Bulk Import CSV / Text
  const handleProcessBulkImport = async () => {
    if (!bulkText.trim()) {
      showToast('Por favor pega el texto o filas CSV a importar.', 'error');
      return;
    }

    const lines = bulkText.trim().split('\n');
    const newParsedSchedules: SedeHorario[] = [];

    lines.forEach((line, index) => {
      // Ignore header if present
      if (index === 0 && (line.toLowerCase().includes('sede') || line.toLowerCase().includes('id_horario'))) {
        return;
      }
      const parts = line.split(/[,\t|]/).map(p => p.trim());
      if (parts.length >= 4) {
        const id = parts[0].startsWith('HOR-') ? parts[0] : `HOR-${100 + index}`;
        const sede = parts[1] || 'Sede Principal (Norte)';
        const nivel = parts[2] || 'Principiante';
        const dia = parts[3] || 'Lunes y Miércoles';
        const horario = parts[4] || '16:00 - 17:30';
        const cupoMax = parseInt(parts[5], 10) || 10;
        const cuposOcupados = parseInt(parts[6], 10) || 0;
        const estado = cuposOcupados >= cupoMax ? 'Lleno' : (parts[7] === 'Lleno' ? 'Lleno' : 'Disponible');

        newParsedSchedules.push({
          ID_Horario: id,
          Sede: sede,
          Nivel_Requerido: nivel,
          Dia: dia,
          Horario: horario,
          Cupo_Maximo: cupoMax,
          Cupos_Ocupados: cuposOcupados,
          Estado_Horario: estado
        });
      }
    });

    if (newParsedSchedules.length === 0) {
      showToast('No se pudieron reconocer filas válidas. Revisa el formato.', 'error');
      return;
    }

    setIsSyncingWithSheets(true);
    try {
      const merged = [...schedules];
      newParsedSchedules.forEach(item => {
        const existingIdx = merged.findIndex(m => m.ID_Horario === item.ID_Horario);
        if (existingIdx >= 0) {
          merged[existingIdx] = item;
        } else {
          merged.push(item);
        }
      });

      const res = await bulkSyncSchedulesApi(merged);
      loadData();
      setShowBulkModal(false);
      setBulkText('');
      showToast(`¡${newParsedSchedules.length} horarios procesados y sincronizados exitosamente!`, 'success');
    } catch (e) {
      showToast('Error procesando la importación masiva.', 'error');
    } finally {
      setIsSyncingWithSheets(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-2xl border flex items-center space-x-3 text-xs font-semibold animate-fadeIn max-w-md ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-900 text-emerald-100 border-emerald-700' 
            : toastMessage.type === 'error'
            ? 'bg-red-900 text-red-100 border-red-700'
            : 'bg-indigo-900 text-indigo-100 border-indigo-700'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
          {toastMessage.type === 'info' && <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />}
          <span className="flex-1">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dashboard Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/95 via-purple-900/95 to-slate-900/95 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-xl border border-white/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center space-x-1.5 bg-white/15 text-indigo-100 text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-md border border-white/20">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Panel de Control & Horarios</span>
              </span>

              {isGoogleSheetsConfigured ? (
                <span className="inline-flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-200 text-xs px-3 py-1 rounded-full font-semibold border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Google Sheets Conectado</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 bg-amber-500/20 text-amber-200 text-xs px-3 py-1 rounded-full font-semibold border border-amber-500/30">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Modo Local / Simulador</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestión de Horarios & Métricas</h2>
            <p className="text-indigo-100 text-sm mt-1 max-w-2xl">
              Carga, edita y ajusta los horarios de las alumnas con sincronización en tiempo real a Google Sheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleOpenCreateModal}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-purple-900/50 transition-all flex items-center space-x-1.5 cursor-pointer font-bold border border-purple-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Horario</span>
            </button>

            <button
              onClick={() => setShowChangePinModal(true)}
              className="bg-white/15 hover:bg-white/25 text-white text-xs px-3.5 py-2.5 rounded-2xl border border-white/20 transition-all flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs shadow-sm font-semibold"
              title="Cambiar PIN de Administrador"
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-200" />
              <span>PIN</span>
            </button>

            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="bg-white/15 hover:bg-white/25 text-white text-xs px-3.5 py-2.5 rounded-2xl border border-white/20 transition-all flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs shadow-sm"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWithSheets ? 'animate-spin' : ''}`} />
              <span>Refrescar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Total Inscritos */}
        <div className="glass-panel p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Inscripciones</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalInscripciones}</div>
            <div className="flex items-center space-x-2 mt-1 text-xs">
              <span className="text-emerald-700 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded-md flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{inscripcionesConfirmadas} Confirmadas</span>
              </span>
              <span className="text-amber-700 font-semibold bg-amber-100/80 px-2 py-0.5 rounded-md flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>{inscripcionesPendientes} Pendientes</span>
              </span>
            </div>
          </div>
        </div>

        {/* Stat 2: Cupos Ocupados */}
        <div className="glass-panel p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cupos Reservados</span>
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalOcupados}</div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              De un total de <strong className="text-slate-900">{totalCapacidad}</strong> cupos habilitados.
            </p>
          </div>
        </div>

        {/* Stat 3: Cupos Disponibles */}
        <div className="glass-panel p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cupos Libres</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalDisponibles}</div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Listos para ser reservados por las alumnas.
            </p>
          </div>
        </div>

        {/* Stat 4: Lista de Espera y Ocupación */}
        <div className="glass-panel p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lista de Espera</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-200">
              <BellRing className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-purple-700 tracking-tight">{waitingList.length}</div>
            <p className="text-xs text-slate-600 mt-1 font-medium flex items-center space-x-1">
              <span>{waitingList.filter(w => w.Estado_Espera === 'Pendiente').length} en espera activa</span>
              <span>• Ocupación {tasaOcupacionGlobal}%</span>
            </p>
          </div>
        </div>

      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200/80 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'schedules'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Gestión de Horarios ({schedules.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('waitingList')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'waitingList'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Lista de Espera ({waitingList.length})</span>
          {waitingList.filter(w => w.Estado_Espera === 'Pendiente').length > 0 && (
            <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 text-[10px] font-black rounded-full">
              {waitingList.filter(w => w.Estado_Espera === 'Pendiente').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'metrics'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
              : 'bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Gráficos y Métricas</span>
        </button>
      </div>

      {/* TAB 1: GESTIÓN DE HORARIOS */}
      {activeTab === 'schedules' && (
      <div className="glass-panel p-6 space-y-5">
        
        {/* Header & Controls Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/60 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg sm:text-xl">
                  Administrador de Horarios & Google Sheets
                </h3>
                <p className="text-xs text-slate-500">
                  Crea, modifica cupos, cambia estados y sincroniza directamente con la hoja <code className="bg-purple-100/70 text-purple-900 px-1 py-0.5 rounded font-mono font-bold">Sedes_Horarios</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons for Sheets */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenCreateModal}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Horario</span>
            </button>

            <button
              onClick={() => setShowBulkModal(true)}
              className="glass-panel-sm hover:bg-white text-slate-700 text-xs px-3 py-2 rounded-xl font-semibold transition-all border border-slate-200/80 flex items-center space-x-1.5 cursor-pointer"
              title="Importar varios horarios juntos"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Carga Masiva</span>
            </button>

            <button
              onClick={handleSyncAllToGoogleSheets}
              disabled={isSyncingWithSheets}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs px-3.5 py-2 rounded-xl font-bold transition-all border border-indigo-200 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="Guardar todos los horarios a la hoja de Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Guardar en Sheets</span>
            </button>

            <button
              onClick={() => setShowSyncModal(true)}
              className="bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs px-3.5 py-2 rounded-xl font-bold transition-all border border-purple-200 flex items-center space-x-1.5 cursor-pointer shadow-xs"
              title="Descargar o sincronizar datos desde Google Sheets"
            >
              <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
              <span>Sincronizar Sheets</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-white/40 p-3 rounded-2xl border border-white/60">
          
          {/* Search Box */}
          <div className="relative sm:col-span-1 lg:col-span-2">
            <input
              type="text"
              placeholder="Buscar por código, sede, día o nivel..."
              value={searchScheduleTerm}
              onChange={(e) => setSearchScheduleTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/90 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searchScheduleTerm && (
              <button 
                onClick={() => setSearchScheduleTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sede Filter */}
          <div>
            <select
              value={selectedSedeFilter}
              onChange={(e) => setSelectedSedeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white/90 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
            >
              <option value="TODAS">📍 Todas las Sedes ({schedules.length})</option>
              {sedesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Nivel Filter */}
          <div>
            <select
              value={selectedNivelFilter}
              onChange={(e) => setSelectedNivelFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white/90 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
            >
              <option value="TODOS">🎓 Todos los Niveles</option>
              {nivelesList.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Schedules Interactive Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/60 shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm bg-white/70">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <th className="p-3.5">Código</th>
                <th className="p-3.5">Sede</th>
                <th className="p-3.5">Nivel Requerido</th>
                <th className="p-3.5">Día y Horario</th>
                <th className="p-3.5 text-center">Cupos Ocupados</th>
                <th className="p-3.5 text-center">Disponibilidad</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold">No se encontraron horarios con los filtros seleccionados.</p>
                    <button 
                      onClick={() => { setSelectedSedeFilter('TODAS'); setSelectedNivelFilter('TODOS'); setSearchScheduleTerm(''); }}
                      className="mt-2 text-xs text-purple-700 font-bold hover:underline"
                    >
                      Limpiar filtros
                    </button>
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((item) => {
                  const pct = item.Cupo_Maximo > 0 ? Math.min(100, Math.round((item.Cupos_Ocupados / item.Cupo_Maximo) * 100)) : 0;
                  const isFull = item.Cupos_Ocupados >= item.Cupo_Maximo || item.Estado_Horario === 'Lleno';

                  return (
                    <tr key={item.ID_Horario} className="hover:bg-white transition-colors group">
                      
                      {/* Código */}
                      <td className="p-3.5 font-mono text-xs font-bold text-indigo-950 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          {item.ID_Horario}
                        </span>
                      </td>

                      {/* Sede */}
                      <td className="p-3.5 font-semibold text-slate-900">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{item.Sede}</span>
                        </div>
                        {item.Salon && (
                          <div className="text-[11px] font-medium text-indigo-700 mt-0.5 flex items-center space-x-1">
                            <span className="bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-bold">{item.Salon}</span>
                          </div>
                        )}
                      </td>

                      {/* Nivel */}
                      <td className="p-3.5">
                        <span className="bg-purple-100/90 text-purple-800 text-xs px-2.5 py-0.5 rounded-md font-bold border border-purple-200">
                          {item.Nivel_Requerido}
                        </span>
                      </td>

                      {/* Día & Horario */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{item.Dia}</div>
                        <div className="text-xs text-slate-500 font-mono flex items-center space-x-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatFriendlyTime(item.Horario)}</span>
                        </div>
                      </td>

                      {/* Cupos + Quick Delta Adjuster (+1 / -1) */}
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center space-x-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                          <button
                            onClick={() => handleQuickCupoChange(item, -1)}
                            disabled={item.Cupos_Ocupados <= 0}
                            className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center font-bold text-xs disabled:opacity-30 cursor-pointer"
                            title="Restar 1 cupo ocupado"
                          >
                            -
                          </button>
                          
                          <span className="font-extrabold text-slate-900 min-w-[45px] text-center font-mono">
                            {item.Cupos_Ocupados} / {item.Cupo_Maximo}
                          </span>

                          <button
                            onClick={() => handleQuickCupoChange(item, 1)}
                            disabled={item.Cupos_Ocupados >= item.Cupo_Maximo}
                            className="w-5 h-5 rounded-md bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center font-bold text-xs disabled:opacity-30 cursor-pointer shadow-xs"
                            title="Sumar 1 cupo ocupado"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Progreso / Disponibilidad */}
                      <td className="p-3.5 text-center min-w-[120px]">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isFull ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-700 font-mono min-w-[32px]">{pct}%</span>
                        </div>
                      </td>

                      {/* Estado Toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleEstado(item)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-transform hover:scale-105 cursor-pointer inline-flex items-center space-x-1 ${
                            isFull
                              ? 'bg-red-100 text-red-800 border border-red-200' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                          title="Haz clic para alternar entre Disponible y Lleno"
                        >
                          {isFull ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              <span>Lleno</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Disponible</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action Buttons: Edit, Delete */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 transition-colors cursor-pointer"
                            title="Editar horario completo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteSchedule(item.ID_Horario)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors cursor-pointer"
                            title="Eliminar horario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info banner */}
        <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-purple-950">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              <strong>Filtro inteligente activo:</strong> Las alumnas solo verán en el formulario los horarios que coincidan con su <em>Nivel Asignado</em> y tengan estado <em>Disponible</em>.
            </span>
          </div>
          <span className="font-mono text-purple-700 font-bold whitespace-nowrap">
            {filteredSchedules.length} de {schedules.length} horarios visibles
          </span>
        </div>

      </div>
      )}

      {/* TAB 2: LISTA DE ESPERA */}
      {activeTab === 'waitingList' && (
        <div className="glass-panel p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/60 pb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg sm:text-xl">
                  Alumnas en Lista de Espera por Horarios Llenos
                </h3>
                <p className="text-xs text-slate-500">
                  Alumnas que solicitaron turno para horarios que estaban al 100% de su capacidad.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full">
                {waitingList.filter(w => w.Estado_Espera === 'Pendiente').length} Pendientes de Notificación
              </span>
            </div>
          </div>

          {/* Search bar for Waiting List */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar en lista de espera por nombre de alumna, correo, cédula o sede..."
              value={searchWaitingTerm}
              onChange={(e) => setSearchWaitingTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white/90 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {searchWaitingTerm && (
              <button 
                onClick={() => setSearchWaitingTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Waiting list Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Código / Fecha</th>
                  <th className="p-3.5">Alumna & Contacto</th>
                  <th className="p-3.5">Horario Solicitado</th>
                  <th className="p-3.5">Sede & Nivel</th>
                  <th className="p-3.5">Notas / Preferencias</th>
                  <th className="p-3.5 text-center">Estado</th>
                  <th className="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waitingList
                  .filter((item) => {
                    if (!searchWaitingTerm.trim()) return true;
                    const q = searchWaitingTerm.toLowerCase();
                    return (
                      item.Nombre_Alumna.toLowerCase().includes(q) ||
                      item.Email.toLowerCase().includes(q) ||
                      item.ID_Cliente.includes(q) ||
                      item.Sede.toLowerCase().includes(q) ||
                      item.Dia.toLowerCase().includes(q) ||
                      item.ID_Espera.toLowerCase().includes(q)
                    );
                  })
                  .map((item) => {
                    const friendlyTime = formatFriendlyTime(item.Horario);
                    return (
                      <tr key={item.ID_Espera} className="hover:bg-purple-50/40 transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-purple-900 block">{item.ID_Espera}</span>
                          <span className="text-[10px] text-slate-400">{item.Fecha_Registro}</span>
                        </td>
                        <td className="p-3.5 space-y-1">
                          <span className="font-bold text-slate-900 block">{item.Nombre_Alumna}</span>
                          <div className="flex flex-col gap-0.5 text-[11px] text-slate-600">
                            <span className="flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{item.Email}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{item.Telefono_WhatsApp}</span>
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{item.Dia}</span>
                          <span className="text-purple-700 font-semibold">{friendlyTime}</span>
                        </td>
                        <td className="p-3.5 space-y-1">
                          <span className="font-medium text-slate-800 block">{item.Sede}</span>
                          <span className="inline-block bg-slate-100 text-slate-700 font-semibold text-[10px] px-2 py-0.5 rounded">
                            {item.Nivel_Requerido}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-[200px]">
                          <p className="text-[11px] text-slate-600 italic">
                            {item.Notas || 'Sin notas adicionales'}
                          </p>
                        </td>
                        <td className="p-3.5 text-center">
                          <select
                            value={item.Estado_Espera}
                            onChange={(e) => handleUpdateWaitingListStatus(item.ID_Espera, e.target.value as any)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                              item.Estado_Espera === 'Pendiente'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : item.Estado_Espera === 'Contactado'
                                ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                                : item.Estado_Espera === 'Cupo_Asignado'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Contactado">Contactado</option>
                            <option value="Cupo_Asignado">Cupo Asignado</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            <a
                              href={`https://wa.me/${item.Telefono_WhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `¡Hola ${item.Nombre_Alumna}! Te saludamos desde Alquimia Danza Aérea. Tenemos novedades sobre tu solicitud de cupo para el horario ${item.Dia} (${friendlyTime}) en ${item.Sede}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Escribir por WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDeleteWaitingListEntry(item.ID_Espera)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                              title="Eliminar registro de lista de espera"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {waitingList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No hay registros en la lista de espera actualmente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GRÁFICOS Y MÉTRICAS */}
      {(activeTab === 'metrics' || activeTab === 'schedules') && (
      <>
      {/* Visual Charts Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Bar Chart - Ocupación por Sede */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/60 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Capacidad y Cupos por Sede</span>
              </h3>
              <p className="text-xs text-slate-500">Comparativa de cupos ocupados vs disponibles en cada sede.</p>
            </div>
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full border border-indigo-200/60 self-start sm:self-auto">
              {sedesList.length} Sedes Registradas
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sedeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
                <XAxis dataKey="nombre" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
                    padding: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Ocupados" fill="#6366f1" radius={[6, 6, 0, 0]} name="Cupos Reservados" />
                <Bar dataKey="Disponibles" fill="#ec4899" radius={[6, 6, 0, 0]} name="Cupos Libres" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Donut Chart - Estado Global de Cupos */}
        <div className="glass-panel p-6 space-y-4 flex flex-col justify-between">
          <div className="border-b border-white/60 pb-3">
            <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5 text-pink-600" />
              <span>Distribución de Capacidad</span>
            </h3>
            <p className="text-xs text-slate-500">Proporción general de cupos ocupados vs libres.</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel-sm p-3 text-center bg-white/60">
            <span className="text-xs text-slate-500 block">Ocupación Promedio Global</span>
            <span className="text-lg font-bold text-indigo-900">{tasaOcupacionGlobal}%</span>
          </div>
        </div>

      </div>

      {/* Chart 3: Level Occupancy Breakdown (Niveles) */}
      <div className="glass-panel p-6 space-y-4">
        <div className="border-b border-white/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Demanda de Cupos por Nivel Académico</span>
            </h3>
            <p className="text-xs text-slate-500">Ocupación desglosada por Principiante, Intermedio, Avanzado e Infantil.</p>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={nivelChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOcupados" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorDisponibles" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.5} />
              <XAxis dataKey="nivel" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
                  padding: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="Ocupados" stroke="#6366f1" fillOpacity={1} fill="url(#colorOcupados)" name="Cupos Reservados" />
              <Area type="monotone" dataKey="Disponibles" stroke="#ec4899" fillOpacity={1} fill="url(#colorDisponibles)" name="Cupos Libres" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT SCHEDULE */}
      {/* ========================================================================= */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowScheduleModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{modalMode === 'create' ? 'Crear Nuevo Horario' : 'Editar Horario Existente'}</span>
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">
                {modalMode === 'create' ? 'Configurar Nuevo Horario' : `Editar Horario ${scheduleForm.ID_Horario}`}
              </h3>
              <p className="text-xs text-slate-500">
                Los cambios se guardan y se sincronizan con la pestaña <code>Sedes_Horarios</code> de tu Google Sheet.
              </p>
            </div>

            <form onSubmit={handleSaveScheduleForm} className="space-y-3.5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ID Horario */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código ID Horario *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: HOR-001"
                    value={scheduleForm.ID_Horario}
                    disabled={modalMode === 'edit'}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, ID_Horario: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-purple-600 focus:bg-white disabled:opacity-60"
                  />
                </div>

                {/* Nivel Requerido */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nivel Requerido *</label>
                  <select
                    value={scheduleForm.Nivel_Requerido}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, Nivel_Requerido: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  >
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                    <option value="Infantil A">Infantil A</option>
                    <option value="Danza Aérea">Danza Aérea</option>
                  </select>
                </div>
              </div>

              {/* Sede */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sede *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sede Principal (Norte), Sede Cumbayá..."
                  value={scheduleForm.Sede}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, Sede: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Dia */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Días *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Lunes y Miércoles"
                    value={scheduleForm.Dia}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, Dia: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>

                {/* Horario */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Horario (Hora) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 16:30 - 18:00"
                    value={scheduleForm.Horario}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, Horario: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cupo Maximo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cupo Máximo</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={scheduleForm.Cupo_Maximo}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, Cupo_Maximo: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>

                {/* Cupos Ocupados */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cupos Ocupados</label>
                  <input
                    type="number"
                    min="0"
                    value={scheduleForm.Cupos_Ocupados}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, Cupos_Ocupados: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-purple-700 focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                  <select
                    value={scheduleForm.Estado_Horario}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, Estado_Horario: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-600 focus:bg-white"
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Lleno">Lleno / Bloqueado</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSyncingWithSheets}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{modalMode === 'create' ? 'Crear y Guardar' : 'Actualizar Horario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK CSV IMPORT */}
      {/* ========================================================================= */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowBulkModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Carga Masiva de Horarios</span>
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">Pegar filas o CSV de Horarios</h3>
              <p className="text-xs text-slate-500 mt-1">
                Pega múltiples filas separadas por comas o tabulaciones. Se cargarán directamente a la hoja <code>Sedes_Horarios</code>.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 font-mono mb-3">
              <span className="text-indigo-800 font-bold block mb-1">Formato por fila:</span>
              ID_Horario, Sede, Nivel, Dia, Horario, CupoMax, CuposOcupados
              <span className="text-slate-400 block mt-1">
                Ej: HOR-010, Sede Principal, Principiante, Martes y Jueves, 17:00 - 18:30, 10, 2
              </span>
            </div>

            <textarea
              rows={7}
              placeholder={`HOR-010, Sede Principal (Norte), Principiante, Martes y Jueves, 16:30 - 18:00, 10, 0\nHOR-011, Sede Cumbayá, Intermedio, Sábados, 09:00 - 10:30, 8, 3`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />

            <div className="pt-3 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcessBulkImport}
                disabled={isSyncingWithSheets}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Procesar e Importar a Sheets</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Change Modal */}
      <ChangePinModal
        isOpen={showChangePinModal}
        onClose={() => setShowChangePinModal(false)}
      />

      {/* Google Sheets Sync Modal */}
      <SyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onSyncComplete={() => {
          loadData();
          setRefreshKey(k => k + 1);
        }}
      />

    </div>
  );
};
