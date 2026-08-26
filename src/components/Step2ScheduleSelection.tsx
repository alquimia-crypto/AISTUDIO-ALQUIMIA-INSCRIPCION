import React, { useState, useEffect, useMemo } from 'react';
import { AlumnaNivel, SedeHorario, SelectedPlanInfo } from '../types';
import { getSchedulesApi, formatFriendlyTime } from '../services/api';
import { 
  calculatePlanSummary, 
  DEFAULT_BANK_DETAILS, 
  PRICING_PLANS,
  getScheduleDurationHours,
  countDaysInSchedule
} from '../utils/pricing';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Sparkles,
  Check,
  Building2,
  Copy,
  ChevronRight,
  HelpCircle,
  RefreshCw,
  Info,
  CalendarDays,
  BellRing
} from 'lucide-react';
import { WaitingListModal } from './WaitingListModal';

interface Step2Props {
  student: AlumnaNivel;
  onBack: () => void;
  onPlanSelected: (plan: SelectedPlanInfo) => void;
}

// Orden estándar de días de la semana
const DAYS_ORDER: Record<string, number> = {
  'lunes': 1,
  'martes': 2,
  'miercoles': 3,
  'miércoles': 3,
  'jueves': 4,
  'viernes': 5,
  'sabado': 6,
  'sábado': 6,
  'sabados': 6,
  'sábados': 6,
  'domingo': 7,
  'lunes y miercoles': 1.1,
  'lunes y miércoles': 1.1,
  'martes y jueves': 2.1,
  'lunes, miercoles y viernes': 1.2,
  'lunes, miércoles y viernes': 1.2,
};

function getDayOrder(dia: string): number {
  const norm = dia.toLowerCase().trim();
  if (DAYS_ORDER[norm] !== undefined) return DAYS_ORDER[norm];
  for (const [key, order] of Object.entries(DAYS_ORDER)) {
    if (norm.includes(key)) return order;
  }
  return 99;
}

export const Step2ScheduleSelection: React.FC<Step2Props> = ({
  student,
  onBack,
  onPlanSelected
}) => {
  const [schedules, setSchedules] = useState<SedeHorario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSede, setSelectedSede] = useState<string | null>(null);
  const [selectedSchedules, setSelectedSchedules] = useState<SedeHorario[]>([]);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('Todos');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPlansModal, setShowPlansModal] = useState<boolean>(false);
  const [waitingListSchedule, setWaitingListSchedule] = useState<SedeHorario | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await getSchedulesApi(student.Nivel_Asignado);
        if (isMounted && res.success && res.data) {
          setSchedules(res.data);
        }
      } catch (err) {
        console.error('Error cargando horarios:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [student.Nivel_Asignado]);

  // Lista única de sedes disponibles con conteo de cupos y horarios para el nivel del alumno
  const sedesStats = useMemo(() => {
    const map = new Map<string, { totalSchedules: number; availableSpots: number; hasAvailable: boolean }>();
    schedules.forEach((item) => {
      const sedeName = item.Sede ? item.Sede.trim() : 'Sede Principal';
      const remaining = Math.max(0, item.Cupo_Maximo - item.Cupos_Ocupados);
      const isAvailable = remaining > 0 && item.Estado_Horario !== 'Lleno';

      const existing = map.get(sedeName) || { totalSchedules: 0, availableSpots: 0, hasAvailable: false };
      existing.totalSchedules += 1;
      existing.availableSpots += remaining;
      if (isAvailable) existing.hasAvailable = true;
      map.set(sedeName, existing);
    });

    return Array.from(map.entries()).map(([sede, stats]) => ({
      sede,
      ...stats
    }));
  }, [schedules]);

  // Horarios de la sede seleccionada
  const schedulesForCurrentSede = useMemo(() => {
    if (!selectedSede) return [];
    return schedules.filter((s) => s.Sede === selectedSede);
  }, [schedules, selectedSede]);

  // Días disponibles en la sede seleccionada
  const availableDaysInSede = useMemo(() => {
    const daysMap = new Map<string, { total: number; available: number }>();
    schedulesForCurrentSede.forEach((item) => {
      const dia = item.Dia ? item.Dia.trim() : 'Día a Coordinar';
      const remaining = Math.max(0, item.Cupo_Maximo - item.Cupos_Ocupados);
      const existing = daysMap.get(dia) || { total: 0, available: 0 };
      existing.total += 1;
      existing.available += remaining;
      daysMap.set(dia, existing);
    });

    return Array.from(daysMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => getDayOrder(a.name) - getDayOrder(b.name));
  }, [schedulesForCurrentSede]);

  // Horarios filtrados por día en la sede actual
  const displayedSchedules = useMemo(() => {
    let list = schedulesForCurrentSede;
    if (selectedDayFilter !== 'Todos') {
      list = list.filter((s) => s.Dia === selectedDayFilter);
    }
    return [...list].sort((a, b) => getDayOrder(a.Dia) - getDayOrder(b.Dia));
  }, [schedulesForCurrentSede, selectedDayFilter]);

  // Cálculo del Plan, horas al mes y valor a pagar
  const planSummary = useMemo(() => {
    return calculatePlanSummary(selectedSede || '', selectedSchedules);
  }, [selectedSede, selectedSchedules]);

  // Manejar selección/deselección de un horario
  const toggleSchedule = (sch: SedeHorario) => {
    const isFull = sch.Cupos_Ocupados >= sch.Cupo_Maximo || sch.Estado_Horario === 'Lleno';
    if (isFull) return;

    const alreadySelected = selectedSchedules.some((s) => s.ID_Horario === sch.ID_Horario);
    if (alreadySelected) {
      setSelectedSchedules(selectedSchedules.filter((s) => s.ID_Horario !== sch.ID_Horario));
    } else {
      setSelectedSchedules([...selectedSchedules, sch]);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2200);
  };

  const handleContinue = () => {
    if (selectedSchedules.length === 0) return;
    onPlanSelected(planSummary);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-purple-100 shadow-sm max-w-2xl mx-auto space-y-4">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Consultando Sedes y Horarios Disponibles...</h3>
        <p className="text-sm text-slate-500">Filtrando cupos para el nivel asignado: {student.Nivel_Asignado}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Encabezado Principal */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center space-x-1.5 bg-purple-500/30 text-purple-200 text-xs px-3 py-1 rounded-full font-medium backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paso 2 de 3 ・ Selección de Sede, Días y Plan</span>
          </span>
          <button
            onClick={onBack}
            className="text-xs text-purple-200 hover:text-white flex items-center space-x-1 transition-colors cursor-pointer bg-white/10 px-3 py-1 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cambiar Alumna</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {!selectedSede ? '1. Escoge tu Sede de Entrenamiento' : '2. Selecciona tus Días y Horarios'}
            </h2>
            <p className="text-purple-200 text-sm mt-1 max-w-2xl">
              Alumna: <strong>{student.Nombre_Alumna}</strong> ・ Nivel Asignado:{' '}
              <span className="bg-purple-800/80 px-2 py-0.5 rounded text-amber-300 font-semibold">{student.Nivel_Asignado}</span>
            </p>
          </div>

          {selectedSede && (
            <button
              onClick={() => {
                setSelectedSede(null);
                setSelectedSchedules([]);
              }}
              className="inline-flex items-center space-x-1.5 text-xs bg-white/15 hover:bg-white/25 text-white px-3.5 py-2 rounded-xl border border-white/20 transition-all font-medium cursor-pointer self-start md:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cambiar Sede ({selectedSede})</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================
          FASE 1: SELECCIÓN OBLIGATORIA DE SEDE
          (Se muestra si no se ha elegido sede todavía)
         ========================================================= */}
      {!selectedSede ? (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start space-x-3 text-amber-900 text-sm">
            <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Paso previo obligatorio:</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Por favor selecciona la sede donde la alumna va a asistir a sus clases de Danza Aérea. Te mostraremos exclusivamente los días y horarios con cupos para su nivel en esa ubicación.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sedesStats.map((item) => (
              <div
                key={item.sede}
                onClick={() => setSelectedSede(item.sede)}
                className="bg-white rounded-2xl p-6 border-2 border-slate-200/80 hover:border-purple-600 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Building2 className="w-5 h-5" />
                    </div>
                    {item.hasAvailable ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Cupos Libres</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                        Sin cupos
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-900 transition-colors">
                      {item.sede}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.totalSchedules} opciones de horarios para {student.Nivel_Asignado}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-700">
                    {item.availableSpots} cupos disponibles en total
                  </span>
                  <div className="flex items-center space-x-1 text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                    <span>Elegir Sede</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sedesStats.length === 0 && (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800">No hay sedes registradas para este nivel</h4>
              <p className="text-xs text-slate-500 mt-1">Consulta con secretaría o prueba con otra alumna.</p>
            </div>
          )}
        </div>
      ) : (
        /* =========================================================
           FASE 2: SELECCIÓN DE MÚLTIPLES DÍAS / HORARIOS
           ========================================================= */
        <div className="space-y-6">

          {/* Sede Activa Banner */}
          <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Sede Seleccionada:</span>
                  <span className="bg-purple-200/80 text-purple-900 text-xs font-bold px-2 py-0.5 rounded-full">Activa</span>
                </div>
                <h3 className="text-base font-extrabold text-purple-950">{selectedSede}</h3>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <span className="text-xs text-slate-600 hidden md:inline">
                Puedes seleccionar <strong>1 o varios días</strong> (ej: Lunes y Miércoles)
              </span>
              <button
                onClick={() => {
                  setSelectedSede(null);
                  setSelectedSchedules([]);
                }}
                className="text-xs font-semibold bg-white hover:bg-purple-100 text-purple-800 px-3 py-1.5 rounded-xl border border-purple-200 transition-colors cursor-pointer"
              >
                Cambiar de Sede
              </button>
            </div>
          </div>

          {/* Filtro Rápido por Día */}
          {availableDaysInSede.length > 1 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Filtrar por día de la semana:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDayFilter('Todos')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDayFilter === 'Todos'
                      ? 'bg-purple-900 text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Ver todos los días ({schedulesForCurrentSede.length})
                </button>
                {availableDaysInSede.map((day) => (
                  <button
                    key={day.name}
                    type="button"
                    onClick={() => setSelectedDayFilter(day.name)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                      selectedDayFilter === day.name
                        ? 'bg-purple-700 text-white shadow-md'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{day.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedDayFilter === day.name ? 'bg-purple-900 text-purple-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {day.total}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Barra Informativa de Salón y Duración */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-900 shadow-sm">
            <div className="flex items-center space-x-2.5">
              <Building2 className="w-4 h-4 text-purple-700 shrink-0" />
              <div>
                <span className="font-extrabold text-purple-950 block sm:inline">
                  Reglas de Horarios y Salones:
                </span>{' '}
                <span className="text-purple-800">
                  <strong>Nivel Básico:</strong> 1 hora de clase (Salón Alquimia • 8 cupos) | <strong>Nivel Intermedio/Avanzado:</strong> 1.5 horas de clase (Salón Evolve • 12 cupos).
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center space-x-1.5 self-start sm:self-auto bg-purple-200/60 px-2.5 py-1 rounded-lg font-bold text-purple-900 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-purple-700" />
              <span>Nivel Alumna: {student.Nivel_Asignado}</span>
            </div>
          </div>

          {/* Grid de Horarios Seleccionables (Selección Múltiple) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <CalendarDays className="w-4 h-4 text-purple-600" />
                <span>Horarios disponibles (Marca los días que deseas entrenar):</span>
              </h3>
              <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                {selectedSchedules.length} horario(s) seleccionado(s)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayedSchedules.map((sch) => {
                const isSelected = selectedSchedules.some((s) => s.ID_Horario === sch.ID_Horario);
                const isFull = sch.Cupos_Ocupados >= sch.Cupo_Maximo || sch.Estado_Horario === 'Lleno';
                const remaining = Math.max(0, sch.Cupo_Maximo - sch.Cupos_Ocupados);
                const friendlyTime = formatFriendlyTime(sch.Horario);
                const durationHrs = getScheduleDurationHours(sch.Horario, sch.Nivel_Requerido);
                const daysInSch = countDaysInSchedule(sch.Dia);
                const weeklyHours = durationHrs * daysInSch;

                return (
                  <div
                    key={sch.ID_Horario}
                    onClick={() => !isFull && toggleSchedule(sch)}
                    className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isFull
                        ? 'bg-slate-50/80 border-slate-200 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-purple-50/90 border-purple-600 shadow-md ring-2 ring-purple-600/20'
                        : 'bg-white border-slate-200/90 hover:border-purple-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="space-y-2.5">
                      
                      {/* Fila Superior: Día, Salón y Checkbox */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-md inline-block">
                              {sch.Dia}
                            </span>
                            {sch.Salon && (
                              <span className="text-[11px] font-bold text-indigo-900 bg-indigo-100/90 border border-indigo-200/80 px-2 py-0.5 rounded-md flex items-center space-x-1">
                                <Building2 className="w-3 h-3 text-indigo-600" />
                                <span>{sch.Salon}</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-lg font-black text-slate-900 mt-1">
                            {friendlyTime}
                          </h4>
                        </div>

                        {/* Checkbox Visual */}
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Duración y Horas */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-1">
                        <span className="flex items-center space-x-1 font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          <span>{durationHrs}h por clase ({weeklyHours}h/sem)</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{sch.Nivel_Requerido}</span>
                      </div>

                    </div>

                    {/* Fila Inferior: Cupos y Ocupación */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      {isFull ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                          <span className="font-bold text-rose-600 flex items-center space-x-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Sin cupos disponibles ({sch.Cupo_Maximo}/{sch.Cupo_Maximo})</span>
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWaitingListSchedule(sch);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-sm shadow-purple-200 cursor-pointer text-xs self-start sm:self-auto shrink-0"
                            title="Unirme a la lista de espera para este horario"
                          >
                            <BellRing className="w-3.5 h-3.5" />
                            <span>Unirme a Lista de Espera</span>
                          </button>
                        </div>
                      ) : remaining <= 3 ? (
                        <>
                          <span className="font-bold text-amber-700 flex items-center space-x-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>¡Últimos {remaining} cupos! ({sch.Cupo_Maximo} max)</span>
                          </span>
                          <span className={`font-bold text-xs ${isSelected ? 'text-purple-700' : 'text-slate-400'}`}>
                            {isSelected ? '✓ Seleccionado' : '+ Seleccionar'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-emerald-700 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{remaining} cupos disponibles ({sch.Cupos_Ocupados}/{sch.Cupo_Maximo})</span>
                          </span>
                          <span className={`font-bold text-xs ${isSelected ? 'text-purple-700' : 'text-slate-400'}`}>
                            {isSelected ? '✓ Seleccionado' : '+ Seleccionar'}
                          </span>
                        </>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

            {displayedSchedules.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                <p className="text-sm text-slate-500">No hay horarios registrados para este día.</p>
              </div>
            )}
          </div>

          {/* =========================================================
              FASE 3: CÁLCULO DE HORAS AL MES Y PLANES DE PAGO
             ========================================================= */}
          {selectedSchedules.length > 0 && (
            <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-500/30 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Plan y Horas Calculadas al Mes</span>
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    {planSummary.totalMonthlyHours} Horas al Mes
                  </h3>
                </div>

                {planSummary.isPopular && (
                  <span className="inline-flex items-center space-x-1 bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-full shadow-md self-start sm:self-auto">
                    <span>⭐ ¡El Plan Más Elegido!</span>
                  </span>
                )}
              </div>

              {/* Detalle de Horarios Seleccionados */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-2.5 border border-white/10 text-xs">
                <span className="font-bold text-purple-200 block uppercase tracking-wider">
                  Días y Horarios que elegiste:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedSchedules.map((item, idx) => (
                    <div key={idx} className="bg-white/10 rounded-xl p-2.5 flex items-center justify-between border border-white/5">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white block">{item.Dia}</span>
                          {item.Salon && (
                            <span className="text-[10px] text-purple-200 bg-purple-900/80 px-1.5 py-0.2 rounded font-medium">
                              {item.Salon}
                            </span>
                          )}
                        </div>
                        <span className="text-purple-200 text-[11px]">{formatFriendlyTime(item.Horario)}</span>
                      </div>
                      <span className="text-[11px] text-purple-300 font-semibold bg-purple-900/60 px-2 py-0.5 rounded">
                        {getScheduleDurationHours(item.Horario, item.Nivel_Requerido)}h / clase
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Métricas de Horas y Precio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-xs text-purple-300 block font-medium">Horas por Semana</span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    {planSummary.totalWeeklyHours} hrs / sem
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">({selectedSchedules.length} día/s por semana)</span>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-xs text-purple-300 block font-medium">Total Horas al Mes</span>
                  <span className="text-2xl font-black text-amber-300 mt-1 block">
                    {planSummary.totalMonthlyHours} hrs / mes
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">(4 semanas completas)</span>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4 shadow-lg border border-emerald-400/30 flex flex-col justify-center">
                  <span className="text-xs text-emerald-100 block font-bold uppercase tracking-wider">Total a Pagar</span>
                  <span className="text-3xl sm:text-4xl font-black text-white mt-0.5 block">
                    ${planSummary.monthlyPrice}.00 <span className="text-sm font-semibold text-emerald-200">USD</span>
                  </span>
                  <span className="text-[11px] text-emerald-100 mt-0.5 block font-medium">
                    {planSummary.planName}
                  </span>
                </div>

              </div>

              {/* Guía de Planes Oficiales */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-purple-200 flex items-center space-x-1">
                    <Info className="w-3.5 h-3.5 text-purple-400" />
                    <span>Planes Oficiales de Alquimia Danza Aérea:</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border text-center transition-all ${planSummary.totalMonthlyHours === 8 ? 'bg-purple-600/50 border-purple-400 ring-2 ring-purple-400' : 'bg-white/5 border-white/10'}`}>
                    <span className="block text-slate-300 font-medium text-xs">8 hrs / mes</span>
                    <span className="text-lg sm:text-xl font-black text-white">$75.00</span>
                    <span className="block text-[11px] text-purple-200 mt-0.5">Plan Estándar</span>
                  </div>
                  <div className={`p-3 rounded-xl border text-center relative transition-all ${planSummary.totalMonthlyHours === 12 ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-400' : 'bg-white/5 border-white/10'}`}>
                    <span className="text-[10px] text-amber-300 font-bold block leading-none mb-1">⭐ Más Elegido</span>
                    <span className="block text-slate-200 font-medium text-xs">12 hrs / mes</span>
                    <span className="text-lg sm:text-xl font-black text-amber-300">$90.00</span>
                    <span className="block text-[11px] text-amber-200/90 mt-0.5">2 clases de 1.5h / sem</span>
                  </div>
                  <div className={`p-3 rounded-xl border text-center transition-all ${planSummary.totalMonthlyHours === 16 ? 'bg-purple-600/50 border-purple-400 ring-2 ring-purple-400' : 'bg-white/5 border-white/10'}`}>
                    <span className="block text-slate-300 font-medium text-xs">16 hrs / mes</span>
                    <span className="text-lg sm:text-xl font-black text-white">$120.00</span>
                    <span className="block text-[11px] text-purple-200 mt-0.5">Plan Intensivo</span>
                  </div>
                </div>
              </div>

              {/* =========================================================
                  FASE 4: CUENTA BANCARIA PARA REALIZAR EL PAGO
                 ========================================================= */}
              <div className="bg-white text-slate-900 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-purple-700" />
                    <h4 className="font-extrabold text-slate-900 text-base">
                      Cuenta Bancaria para Realizar el Pago
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    Monto a Transferir: ${planSummary.monthlyPrice}.00 USD
                  </span>
                </div>

                {/* Datos de la empresa */}
                <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">Titular:</span>
                    <span className="font-bold text-slate-900">{DEFAULT_BANK_DETAILS.holder}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">RUC:</span>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="font-mono font-bold text-slate-900">{DEFAULT_BANK_DETAILS.ruc}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(DEFAULT_BANK_DETAILS.ruc, 'ruc')}
                        className="text-[10px] bg-white hover:bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200 font-medium cursor-pointer"
                      >
                        {copiedField === 'ruc' ? '✓' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Correo de Notificación:</span>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="font-medium text-slate-800">{DEFAULT_BANK_DETAILS.email}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(DEFAULT_BANK_DETAILS.email, 'email')}
                        className="text-[10px] bg-white hover:bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200 font-medium cursor-pointer"
                      >
                        {copiedField === 'email' ? '✓' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tarjetas de Cuentas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DEFAULT_BANK_DETAILS.accounts.map((acc, index) => (
                    <div key={index} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{acc.bank}</span>
                        <span className="text-[10px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                          {acc.type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Número de Cuenta:</span>
                          <span className="font-mono font-bold text-purple-950 text-base tracking-wide">{acc.number}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(acc.number, acc.bank)}
                          className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
                        >
                          {copiedField === acc.bank ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  * Realiza la transferencia por el valor de <strong>${planSummary.monthlyPrice}.00 USD</strong> y a continuación adjunta el comprobante (foto o PDF) para registrar tu inscripción.
                </p>
              </div>

              {/* Botón de Confirmar y Continuar */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedSchedules([])}
                  className="text-xs text-purple-300 hover:text-white underline cursor-pointer"
                >
                  Limpiar selección de horarios
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black px-8 py-4 rounded-2xl shadow-xl shadow-emerald-950/40 transition-all flex items-center justify-center space-x-2 text-base cursor-pointer transform hover:scale-[1.02]"
                >
                  <span>Continuar a Adjuntar Comprobante (${planSummary.monthlyPrice})</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Modal de Lista de Espera para Horarios Llenos */}
      <WaitingListModal
        isOpen={!!waitingListSchedule}
        onClose={() => setWaitingListSchedule(null)}
        student={student}
        schedule={waitingListSchedule}
      />

    </div>
  );
};
