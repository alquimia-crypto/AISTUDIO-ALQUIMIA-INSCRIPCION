import React, { useState, useEffect } from 'react';
import { 
  getMockSchedules, 
  getMockRegistrations, 
  getMockStudents 
} from '../services/api';
import { SedeHorario, Inscripcion, AlumnaNivel } from '../types';
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
  KeyRound
} from 'lucide-react';
import { ChangePinModal } from './ChangePinModal';

export const AdminDashboard: React.FC = () => {
  const [schedules, setSchedules] = useState<SedeHorario[]>([]);
  const [registrations, setRegistrations] = useState<Inscripcion[]>([]);
  const [students, setStudents] = useState<AlumnaNivel[]>([]);
  const [selectedSedeFilter, setSelectedSedeFilter] = useState<string>('TODAS');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [showChangePinModal, setShowChangePinModal] = useState<boolean>(false);

  const loadData = () => {
    setSchedules(getMockSchedules());
    setRegistrations(getMockRegistrations());
    setStudents(getMockStudents());
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Metric computations
  const totalCapacidad = schedules.reduce((acc, curr) => acc + (curr.Cupo_Maximo || 0), 0);
  const totalOcupados = schedules.reduce((acc, curr) => acc + (curr.Cupos_Ocupados || 0), 0);
  const totalDisponibles = Math.max(0, totalCapacidad - totalOcupados);
  const tasaOcupacionGlobal = totalCapacidad > 0 ? ((totalOcupados / totalCapacidad) * 100).toFixed(1) : '0';

  const totalInscripciones = registrations.length;
  const inscripcionesConfirmadas = registrations.filter(r => r.Estado_Inscripcion === 'Confirmado').length;
  const inscripcionesPendientes = registrations.filter(r => r.Estado_Inscripcion === 'Pendiente').length;
  const alumnasActivas = students.filter(s => s.Estado === 'Activo').length;

  // Sedes list for filter & aggregation
  const sedesList: string[] = Array.from(new Set(schedules.map(s => s.Sede)));

  // Data for Chart 1: Sede Bar Chart (Ocupados vs Libres)
  const sedeChartData = sedesList.map(sedeName => {
    const sedeSchedules = schedules.filter(s => s.Sede === sedeName);
    const maxCap = sedeSchedules.reduce((acc, curr) => acc + curr.Cupo_Maximo, 0);
    const ocuCap = sedeSchedules.reduce((acc, curr) => acc + curr.Cupos_Ocupados, 0);
    const freeCap = Math.max(0, maxCap - ocuCap);
    const tasa = maxCap > 0 ? Math.round((ocuCap / maxCap) * 100) : 0;

    // Short name for better display on mobile/charts
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

  // Data for Chart 2: Occupancy by Level (Nivel)
  const nivelesList = Array.from(new Set(schedules.map(s => s.Nivel_Requerido)));
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

  // Data for Chart 3: Registration Status Pie Chart
  const pieStatusData = [
    { name: 'Cupos Confirmados', value: totalOcupados, color: '#6366f1' },
    { name: 'Cupos Disponibles', value: totalDisponibles, color: '#ec4899' },
  ];

  const pieRegistrationData = [
    { name: 'Confirmadas', value: inscripcionesConfirmadas, color: '#10b981' },
    { name: 'Pendientes', value: inscripcionesPendientes, color: '#f59e0b' },
  ];

  // Colors
  const COLORS = ['#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

  // Filtered schedules table
  const filteredSchedules = selectedSedeFilter === 'TODAS'
    ? schedules
    : schedules.filter(s => s.Sede === selectedSedeFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Dashboard Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/90 via-indigo-800/90 to-slate-900/90 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-xl border border-white/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center space-x-1.5 bg-white/15 text-indigo-100 text-xs px-3 py-1 rounded-full font-semibold mb-3 backdrop-blur-md border border-white/20">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Panel de Control de Secretaría</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard & Métricas</h2>
            <p className="text-indigo-100 text-sm mt-1 max-w-2xl">
              Monitoreo en tiempo real de la capacidad de las sedes, tasa de ocupación por nivel y estado de solicitudes de inscripción.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowChangePinModal(true)}
              className="bg-white/15 hover:bg-white/25 text-white text-xs px-3.5 py-2.5 rounded-2xl border border-white/20 transition-all flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs shadow-sm font-semibold"
              title="Cambiar PIN de Administrador"
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-200" />
              <span>Cambiar PIN</span>
            </button>

            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="bg-white/15 hover:bg-white/25 text-white text-xs px-3.5 py-2.5 rounded-2xl border border-white/20 transition-all flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar Métricas</span>
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
              De un total global de <strong className="text-slate-900">{totalCapacidad}</strong> cupos habilitados.
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
              Disponibles para nuevas estudiantes en el sistema.
            </p>
          </div>
        </div>

        {/* Stat 4: Tasa de Ocupación Global */}
        <div className="glass-panel p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tasa de Ocupación</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-indigo-600 tracking-tight">{tasaOcupacionGlobal}%</div>
            <div className="w-full bg-slate-200/80 rounded-full h-2 mt-2 overflow-hidden">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${tasaOcupacionGlobal}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

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
              {sedesList.length} Sedes Activas
            </span>
          </div>

          <div className="h-72 w-full pt-2">
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
                  formatter={(value: any, name: any) => [`${value} cupos`, name]}
                  labelFormatter={(label) => `Sede: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Ocupados" fill="#6366f1" radius={[8, 8, 0, 0]} name="Cupos Ocupados" />
                <Bar dataKey="Disponibles" fill="#ec4899" radius={[8, 8, 0, 0]} name="Cupos Libres" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Donut Chart - Estado General de Cupos */}
        <div className="glass-panel p-6 space-y-4 flex flex-col justify-between">
          <div className="border-b border-white/60 pb-3">
            <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5 text-indigo-600" />
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

      {/* Detailed Schedules Table Breakdown */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/60 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <span>Detalle de Horarios por Sede</span>
            </h3>
            <p className="text-xs text-slate-500">Estado individual de cada curso y cupo ocupado.</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedSedeFilter('TODAS')}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedSedeFilter === 'TODAS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'glass-panel-sm text-slate-700 hover:bg-white'
              }`}
            >
              Todas ({schedules.length})
            </button>
            {sedesList.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSedeFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedSedeFilter === s
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'glass-panel-sm text-slate-700 hover:bg-white'
                }`}
              >
                {s.replace(' (Principal)', '')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-white/60 border-b border-white/60 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <th className="p-3">Código</th>
                <th className="p-3">Sede</th>
                <th className="p-3">Nivel</th>
                <th className="p-3">Día & Horario</th>
                <th className="p-3 text-center">Cupos</th>
                <th className="p-3 text-center">% Ocupación</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {filteredSchedules.map((item) => {
                const pct = Math.min(100, Math.round((item.Cupos_Ocupados / item.Cupo_Maximo) * 100));
                const isFull = item.Cupos_Ocupados >= item.Cupo_Maximo;

                return (
                  <tr key={item.ID_Horario} className="hover:bg-white/40 transition-colors">
                    <td className="p-3 font-mono text-xs font-bold text-slate-600">{item.ID_Horario}</td>
                    <td className="p-3 font-semibold text-slate-900">{item.Sede}</td>
                    <td className="p-3">
                      <span className="bg-indigo-100/80 text-indigo-800 text-xs px-2.5 py-0.5 rounded-md font-medium border border-indigo-200/50">
                        {item.Nivel_Requerido}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900">{item.Dia}</div>
                      <div className="text-xs text-slate-500">{item.Horario}</div>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800">
                      {item.Cupos_Ocupados} / {item.Cupo_Maximo}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-200/80 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full ${isFull ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-700 min-w-[32px]">{pct}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {isFull ? (
                        <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>Lleno</span>
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Disponible</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ChangePinModal
        isOpen={showChangePinModal}
        onClose={() => setShowChangePinModal(false)}
      />

    </div>
  );
};
