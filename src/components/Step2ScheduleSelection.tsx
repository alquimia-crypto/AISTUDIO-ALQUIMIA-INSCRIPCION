import React, { useState, useEffect } from 'react';
import { AlumnaNivel, SedeHorario } from '../types';
import { getSchedulesApi } from '../services/api';
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
  Layers
} from 'lucide-react';

interface Step2Props {
  student: AlumnaNivel;
  onBack: () => void;
  onScheduleSelected: (schedule: SedeHorario) => void;
}

export const Step2ScheduleSelection: React.FC<Step2Props> = ({
  student,
  onBack,
  onScheduleSelected
}) => {
  const [schedules, setSchedules] = useState<SedeHorario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHorario, setSelectedHorario] = useState<SedeHorario | null>(null);
  const [selectedSedeFilter, setSelectedSedeFilter] = useState<string>('Todas');

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

  // Extract unique sedes for filter tabs
  const sedesList = ['Todas', ...Array.from(new Set(schedules.map(s => s.Sede)))];

  const filteredSchedules = schedules.filter(s => {
    if (selectedSedeFilter === 'Todas') return true;
    return s.Sede === selectedSedeFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center space-x-1.5 bg-purple-500/30 text-purple-200 text-xs px-3 py-1 rounded-full font-medium backdrop-blur-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>Paso 2 de 3 ・ Selección de Cupo</span>
          </span>
          <button
            onClick={onBack}
            className="text-xs text-purple-200 hover:text-white flex items-center space-x-1 transition-colors cursor-pointer bg-white/10 px-3 py-1 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cambiar Alumna</span>
          </button>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Selección de Sede y Horario</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-purple-200">
          <span>Alumna: <strong className="text-white">{student.Nombre_Alumna}</strong></span>
          <span>•</span>
          <span>Nivel Filtro: <strong className="bg-purple-500/40 text-white px-2 py-0.5 rounded-md">{student.Nivel_Asignado}</strong></span>
        </div>
      </div>

      {/* Sede Filters */}
      {sedesList.length > 2 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-500 font-medium flex items-center space-x-1 pl-1">
            <MapPin className="w-3.5 h-3.5 text-purple-600" />
            <span>Sede:</span>
          </span>
          {sedesList.map((sede) => (
            <button
              key={sede}
              onClick={() => setSelectedSedeFilter(sede)}
              className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedSedeFilter === sede
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {sede}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-600 font-medium">Cargando cupos disponibles para el nivel {student.Nivel_Asignado}...</p>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No hay horarios disponibles en este nivel</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            En este momento todos los grupos para el nivel <strong>{student.Nivel_Asignado}</strong> están llenos o no tienen horarios asignados en esta sede.
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Regresar</span>
          </button>
        </div>
      ) : (
        /* Schedule Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchedules.map((item) => {
            const cuposRestantes = Math.max(0, item.Cupo_Maximo - item.Cupos_Ocupados);
            const isFull = item.Cupos_Ocupados >= item.Cupo_Maximo || item.Estado_Horario === 'Lleno';
            const isSelected = selectedHorario?.ID_Horario === item.ID_Horario;
            const percent = Math.min(100, Math.round((item.Cupos_Ocupados / item.Cupo_Maximo) * 100));

            return (
              <div
                key={item.ID_Horario}
                onClick={() => {
                  if (!isFull) setSelectedHorario(item);
                }}
                className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer ${
                  isFull
                    ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-purple-50/70 border-purple-600 shadow-md ring-2 ring-purple-600/20'
                    : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-sm'
                }`}
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1.5 text-xs text-purple-700 font-semibold bg-purple-100 px-2.5 py-1 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    <span>{item.Sede}</span>
                  </div>

                  {isFull ? (
                    <span className="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-lg">
                      SIN CUPOS (LLENO)
                    </span>
                  ) : cuposRestantes <= 2 ? (
                    <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>¡Últimos {cuposRestantes} cupos!</span>
                    </span>
                  ) : (
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-lg">
                      {cuposRestantes} Cupos Disponibles
                    </span>
                  )}
                </div>

                {/* Day & Time */}
                <div className="space-y-1 my-3">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-lg">
                    <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span>{item.Dia}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-700 font-medium text-sm pl-6">
                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{item.Horario}</span>
                  </div>
                </div>

                {/* Cupos Bar */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ocupación de la clase:</span>
                    </span>
                    <span className="font-semibold text-slate-700">
                      {item.Cupos_Ocupados} / {item.Cupo_Maximo} inscritas
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull
                          ? 'bg-red-500'
                          : percent > 80
                          ? 'bg-amber-500'
                          : 'bg-purple-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && !isFull && (
                  <div className="absolute top-4 right-4 bg-purple-600 text-white rounded-full p-1 shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
        <button
          onClick={onBack}
          className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Identificación</span>
        </button>

        <button
          disabled={!selectedHorario}
          onClick={() => selectedHorario && onScheduleSelected(selectedHorario)}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-purple-200 cursor-pointer"
        >
          <span>Continuar a Carga de Comprobante</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
