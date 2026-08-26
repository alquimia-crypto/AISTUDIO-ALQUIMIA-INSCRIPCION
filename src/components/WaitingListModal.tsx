import React, { useState } from 'react';
import { AlumnaNivel, SedeHorario, WaitingListEntry } from '../types';
import { submitWaitingListApi, formatFriendlyTime } from '../services/api';
import { 
  Clock, 
  Sparkles, 
  BellRing, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Mail, 
  Phone, 
  User, 
  Building2, 
  Calendar, 
  Send,
  Loader2,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

interface WaitingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: AlumnaNivel;
  schedule: SedeHorario | null;
  onSuccess?: (entry: WaitingListEntry) => void;
}

export const WaitingListModal: React.FC<WaitingListModalProps> = ({
  isOpen,
  onClose,
  student,
  schedule,
  onSuccess
}) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultEntry, setResultEntry] = useState<WaitingListEntry | null>(null);

  if (!isOpen || !schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await submitWaitingListApi({
        student,
        schedule,
        notas: notes.trim()
      });

      if (res.success) {
        setSubmitted(true);
        if (res.entry) {
          setResultEntry(res.entry);
          if (onSuccess) onSuccess(res.entry);
        }
      } else {
        setErrorMessage(res.message || 'No fue posible registrar en la lista de espera.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setSubmitted(false);
    setNotes('');
    setErrorMessage(null);
    setResultEntry(null);
    onClose();
  };

  const friendlyTime = formatFriendlyTime(schedule.Horario);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-purple-100 relative overflow-hidden max-h-[92vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={handleModalClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          /* Success Screen */
          <div className="text-center py-6 space-y-5 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md shadow-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                ¡Registro en Lista de Espera Confirmado!
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                Quedas en Lista de Espera Prioritaria
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
                Apenas un cupo se libere en este horario o se abra un nuevo paralelo, nuestro equipo de secretaría se comunicará contigo vía WhatsApp y Correo Electrónico.
              </p>
            </div>

            {/* Schedule Summary Card */}
            <div className="bg-purple-50/80 rounded-2xl p-4 border border-purple-100 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-purple-200/60">
                <span className="font-bold text-purple-950 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <span>{schedule.Dia} • {friendlyTime}</span>
                </span>
                <span className="font-mono font-bold text-purple-800 bg-white px-2 py-0.5 rounded shadow-xs">
                  {resultEntry?.ID_Espera || 'ESP-2026-REG'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Alumna</span>
                  <span className="font-semibold text-slate-900">{student.Nombre_Alumna}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sede</span>
                  <span className="font-semibold text-slate-900">{schedule.Sede}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Notificación enviará a</span>
                  <span className="font-medium text-slate-900">{student.Email} • {student.Telefono_WhatsApp}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleModalClose}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-purple-200 cursor-pointer text-sm"
              >
                Entendido, Continuar Seleccionando
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="space-y-4">
            <div>
              <span className="inline-flex items-center space-x-1.5 bg-amber-100 text-amber-900 text-xs px-3 py-1 rounded-full font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>Horario Completo ・ Lista de Espera</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                Unirme a la Lista de Espera
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Este horario no cuenta con cupos inmediatos disponibles. Regístrate para ser la primera en recibir una notificación cuando se libere un lugar.
              </p>
            </div>

            {/* Target Schedule Pill */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                    {schedule.Sede}
                  </span>
                  <h4 className="text-base font-black text-slate-900">
                    {schedule.Dia} • {friendlyTime}
                  </h4>
                </div>
                <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-rose-200 shrink-0">
                  Cupos Llenos ({schedule.Cupo_Maximo}/{schedule.Cupo_Maximo})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-1">
                {schedule.Salon && (
                  <span className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                    <Building2 className="w-3 h-3 text-indigo-600" />
                    <span>{schedule.Salon}</span>
                  </span>
                )}
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                  Nivel {schedule.Nivel_Requerido}
                </span>
              </div>
            </div>

            {/* Student Info Card */}
            <div className="bg-purple-50/70 rounded-2xl p-3.5 border border-purple-100 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-950 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-purple-700" />
                  <span>Datos de Contacto para Notificación:</span>
                </span>
                <span className="text-[11px] text-purple-700 font-semibold">Alumna: {student.Nombre_Alumna}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
                <div className="flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{student.Email}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium">{student.Telefono_WhatsApp}</span>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                  <span>Comentarios o Preferencia de Horario (Opcional):</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. También tengo disponibilidad los miércoles a la misma hora..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 flex items-center space-x-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BellRing className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Registrando...' : 'Confirmar en Lista de Espera'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
