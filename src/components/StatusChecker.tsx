import React, { useState } from 'react';
import { Inscripcion } from '../types';
import { getRegistrationsByStudentId, formatFriendlyTime } from '../services/api';
import { getWhatsAppUrl } from '../utils/pricing';
import { 
  Search, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink, 
  Calendar, 
  MapPin, 
  FileText,
  User,
  MessageSquare,
  Mail,
  Bell,
  X,
  Sparkles,
  AlertOctagon,
  Info,
  ShieldCheck,
  Award
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface ToastNotification {
  id: string;
  type: 'approved' | 'rejected' | 'pending';
  title: string;
  message: string;
  regId: string;
  registration: Inscripcion;
}

export const StatusChecker: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [registrations, setRegistrations] = useState<Inscripcion[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [selectedRegForModal, setSelectedRegForModal] = useState<Inscripcion | null>(null);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleSearch = async (query?: string) => {
    const term = query !== undefined ? query : searchInput;
    if (!term.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const results = await getRegistrationsByStudentId(term);
      setRegistrations(results);

      // Generar notificaciones Toast basadas en el estado proveniente del backend
      const newToasts: ToastNotification[] = [];

      const approvedList = results.filter(r => r.Estado_Inscripcion === 'Confirmado');
      const rejectedList = results.filter(r => r.Estado_Inscripcion === 'Rechazado');
      const pendingList = results.filter(r => r.Estado_Inscripcion === 'Pendiente' || !r.Estado_Inscripcion);

      if (approvedList.length > 0) {
        approvedList.forEach(reg => {
          newToasts.push({
            id: `toast-app-${reg.ID_Registro}-${Date.now()}`,
            type: 'approved',
            title: '¡Solicitud Aprobada por Administración!',
            message: `Tu inscripción (${reg.ID_Registro}) para ${reg.Sede} ha sido validada y confirmada oficialmente.`,
            regId: reg.ID_Registro,
            registration: reg
          });
        });
      }

      if (rejectedList.length > 0) {
        rejectedList.forEach(reg => {
          newToasts.push({
            id: `toast-rej-${reg.ID_Registro}-${Date.now()}`,
            type: 'rejected',
            title: 'Solicitud Rechazada por Administración',
            message: `Tu inscripción (${reg.ID_Registro}) no pudo ser confirmada. Revisa los detalles para comunicarte con administración.`,
            regId: reg.ID_Registro,
            registration: reg
          });
        });
      }

      if (pendingList.length > 0 && approvedList.length === 0 && rejectedList.length === 0) {
        newToasts.push({
          id: `toast-pen-${Date.now()}`,
          type: 'pending',
          title: 'Solicitud en Proceso de Revisión',
          message: `Tienes ${pendingList.length} registro(s) pendiente(s) de validación por parte del equipo administrativo.`,
          regId: pendingList[0].ID_Registro,
          registration: pendingList[0]
        });
      }

      setToasts(newToasts);
    } catch (e) {
      console.error(e);
      setRegistrations([]);
      setToasts([]);
    } finally {
      setLoading(false);
    }
  };

  const getRegistrationWhatsAppMessage = (reg: Inscripcion) => {
    return (
      `¡Hola Alquimia Danza Aérea! Quisiera consultar sobre el estado de la inscripción:\n\n` +
      `👤 Alumna: ${reg.Nombre_Alumna}\n` +
      `📌 ID de Registro: ${reg.ID_Registro}\n` +
      `📍 Sede: ${reg.Sede}\n` +
      `⏰ Horario: ${formatFriendlyTime(reg.Horario_Seleccionado)}\n` +
      `📊 Estado Actual: ${reg.Estado_Inscripcion}\n\n` +
      `¿Podrían brindarme asistencia sobre este registro? Muchas gracias.`
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      
      {/* Toast Notifications System */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full px-4 sm:px-0 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3.5 backdrop-blur-md transition-all ${
                t.type === 'approved' 
                  ? 'bg-emerald-950/95 text-emerald-50 border-emerald-500/50 shadow-emerald-950/30' 
                  : t.type === 'rejected'
                  ? 'bg-rose-950/95 text-rose-50 border-rose-500/50 shadow-rose-950/30'
                  : 'bg-slate-900/95 text-slate-100 border-slate-700 shadow-slate-950/40'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                t.type === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                t.type === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                'bg-indigo-500/20 text-indigo-400'
              }`}>
                {t.type === 'approved' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : t.type === 'rejected' ? (
                  <XCircle className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm leading-tight text-white">{t.title}</h4>
                </div>
                <p className="text-xs mt-1 text-slate-200 leading-relaxed">{t.message}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRegForModal(t.registration);
                      dismissToast(t.id);
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      t.type === 'approved'
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        : t.type === 'rejected'
                        ? 'bg-rose-500 hover:bg-rose-400 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    Ver resolución completa
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissToast(t.id)}
                    className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 transition-colors cursor-pointer"
                  >
                    Descartar
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center space-x-1.5 bg-purple-500/30 text-purple-200 text-xs px-3 py-1 rounded-full font-medium mb-3 backdrop-blur-xs">
            <Search className="w-3.5 h-3.5" />
            <span>Consulta Pública de Cupos</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Consulta el Estado de tu Inscripción</h2>
          <p className="text-purple-200 text-sm mt-1 max-w-2xl">
            Ingresa tu correo electrónico registrado para verificar las resoluciones y notificaciones oficiales del administrador sobre tu solicitud.
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-slate-800 flex items-center space-x-2">
            <Mail className="w-4 h-4 text-purple-600" />
            <span>Correo Electrónico Registrado</span>
          </label>
          <span className="text-xs text-slate-500 font-medium">Ejemplo: maria.torres@gmail.com</span>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-500">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ingresa tu correo electrónico (ej. maria.torres@gmail.com)"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-base transition-all font-medium"
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-7 py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md shadow-purple-200 cursor-pointer disabled:opacity-50 text-sm sm:text-base shrink-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            <span>Consultar Registros</span>
          </button>
        </form>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center justify-between">
            <span>Resultados de Búsqueda ({registrations.length})</span>
          </h3>

          {registrations.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm space-y-4">
              <Clock className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <h4 className="font-bold text-slate-800 text-base">No hay inscripciones registradas para este correo</h4>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Verifica que la dirección coincida con el correo ingresado durante el registro, o consúltanos directamente por WhatsApp.
                </p>
              </div>
              <a
                href={getWhatsAppUrl(
                  `¡Hola Alquimia Danza Aérea! Quisiera consultar sobre el estado de una inscripción para el correo: ${searchInput.trim() || 'No especificado'}.`
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-white" />
                <span>Consultar por WhatsApp</span>
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => (
                <div key={reg.ID_Registro} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{reg.Nombre_Alumna}</h4>
                        <span className="text-xs text-slate-500 font-mono">Código: {reg.ID_Registro} • {reg.Fecha_Registro}</span>
                      </div>
                    </div>

                    {/* Status Badge & Resolution Modal Trigger */}
                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      {reg.Estado_Inscripcion === 'Confirmado' ? (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-3 py-1.5 rounded-xl font-bold inline-flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>¡Cupo Aprobado!</span>
                        </span>
                      ) : reg.Estado_Inscripcion === 'Rechazado' ? (
                        <span className="bg-red-100 text-red-800 border border-red-200 text-xs px-3 py-1.5 rounded-xl font-bold inline-flex items-center space-x-1.5">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>Rechazado</span>
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-900 border border-amber-200 text-xs px-3 py-1.5 rounded-xl font-bold inline-flex items-center space-x-1.5">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Pendiente de Revisión</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedRegForModal(reg)}
                        className="bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 border border-slate-200 hover:border-purple-300 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                        title="Ver notificación detallada"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Ver Notificación</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span>Sede: <strong>{reg.Sede}</strong></span>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-700">
                      <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span>Horario: <strong>{formatFriendlyTime(reg.Horario_Seleccionado)}</strong></span>
                    </div>
                  </div>

                  {/* Highlight Resolution Banner inside Card */}
                  {reg.Estado_Inscripcion === 'Confirmado' && (
                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-950">
                        <strong className="font-bold text-emerald-900 block">¡Inscripción validada por administración!</strong>
                        Tu comprobante de pago fue verificado y tu lugar en clase ha sido asegurado. Haz clic en <em>"Ver Notificación"</em> para ver las instrucciones de tu primera clase.
                      </div>
                    </div>
                  )}

                  {reg.Estado_Inscripcion === 'Rechazado' && (
                    <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2.5">
                      <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-red-950">
                        <strong className="font-bold text-red-900 block">Solicitud no aprobada por administración</strong>
                        El comprobante adjunto no pudo ser procesado o el cupo no se completó a tiempo. Comunícate directamente con soporte para resolver la asignación.
                      </div>
                    </div>
                  )}

                  {reg.URL_Comprobante_Drive && reg.URL_Comprobante_Drive !== 'Sin comprobante' && (
                    <div className="pt-2 flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-600 flex items-center space-x-1.5 font-medium">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span>Comprobante de Pago de la Inscripción:</span>
                      </span>
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Registrado en Sistema</span>
                      </span>
                    </div>
                  )}

                  {/* WhatsApp Inquiry Button at bottom of card */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      ¿Necesitas asistencia o validar tu cupo de inmediato?
                    </span>
                    <a
                      href={getWhatsAppUrl(getRegistrationWhatsAppMessage(reg))}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-white" />
                      <span>Consultar por WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Notificación y Resolución Detallada */}
      <AnimatePresence>
        {selectedRegForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
            >
              {/* Modal Header con Status Dynamic Theme */}
              <div className={`p-6 text-white relative ${
                selectedRegForModal.Estado_Inscripcion === 'Confirmado'
                  ? 'bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900'
                  : selectedRegForModal.Estado_Inscripcion === 'Rechazado'
                  ? 'bg-gradient-to-br from-red-800 via-rose-900 to-slate-900'
                  : 'bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-900'
              }`}>
                <button
                  type="button"
                  onClick={() => setSelectedRegForModal(null)}
                  className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md">
                    {selectedRegForModal.Estado_Inscripcion === 'Confirmado' ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-300" />
                    ) : selectedRegForModal.Estado_Inscripcion === 'Rechazado' ? (
                      <XCircle className="w-7 h-7 text-rose-300" />
                    ) : (
                      <Clock className="w-7 h-7 text-amber-300" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold opacity-80">
                      Notificación Oficial de Inscripción
                    </span>
                    <h3 className="text-xl font-bold">
                      {selectedRegForModal.Estado_Inscripcion === 'Confirmado'
                        ? '¡Solicitud Aprobada y Confirmada!'
                        : selectedRegForModal.Estado_Inscripcion === 'Rechazado'
                        ? 'Solicitud Declinada / Rechazada'
                        : 'Solicitud en Revisión Administrativa'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                
                {/* Status Callout Box */}
                {selectedRegForModal.Estado_Inscripcion === 'Confirmado' ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 space-y-2">
                    <div className="flex items-center space-x-2 font-bold text-emerald-900 text-sm">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Validación completada con éxito</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      La administración de <strong>Alquimia Danza Aérea</strong> ha revisado y aprobado tu comprobante de pago. Tu lugar en el horario seleccionado está 100% asegurado.
                    </p>
                  </div>
                ) : selectedRegForModal.Estado_Inscripcion === 'Rechazado' ? (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-950 space-y-2">
                    <div className="flex items-center space-x-2 font-bold text-red-900 text-sm">
                      <AlertOctagon className="w-4 h-4 text-red-600" />
                      <span>Motivo de Rechazo o Inconsistencia</span>
                    </div>
                    <p className="text-xs text-red-800 leading-relaxed">
                      Tu solicitud no pudo ser aprobada automáticamente. Las causas usuales incluyen: comprobante ilegible, monto incorrecto, o falta de cupo antes de registrar el pago. Comunícate con el equipo por WhatsApp para reasignar tu clase.
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-950 space-y-2">
                    <div className="flex items-center space-x-2 font-bold text-amber-900 text-sm">
                      <Info className="w-4 h-4 text-amber-600" />
                      <span>En cola de revisión</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Hemos recibido tu comprobante. El equipo administrativo revisa los comprobantes en un plazo promedio de 1 a 24 horas hábiles.
                    </p>
                  </div>
                )}

                {/* Enrollment Key Details */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Alumna:</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedRegForModal.Nombre_Alumna}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Código de Registro:</span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded-md">
                      {selectedRegForModal.ID_Registro}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Sede:</span>
                    <span className="font-bold text-slate-800">{selectedRegForModal.Sede}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Horario Elegido:</span>
                    <span className="font-bold text-slate-800">{formatFriendlyTime(selectedRegForModal.Horario_Seleccionado)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-medium">Fecha de Envío:</span>
                    <span className="font-medium text-slate-700">{selectedRegForModal.Fecha_Registro}</span>
                  </div>
                </div>

                {/* What to bring / Recommendations */}
                {selectedRegForModal.Estado_Inscripcion === 'Confirmado' && (
                  <div className="border border-purple-100 bg-purple-50/60 rounded-2xl p-4 space-y-2">
                    <h5 className="font-bold text-purple-950 text-xs flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                      <span>Recomendaciones para tu clase:</span>
                    </h5>
                    <ul className="text-xs text-purple-900 space-y-1 list-disc list-inside">
                      <li>Llevar ropa deportiva cómoda y ajustada (sin cierres ni joyas).</li>
                      <li>Llegar 10 minutos antes del inicio de la sesión.</li>
                      <li>Llevar botella de agua personal para hidratación.</li>
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <a
                    href={getWhatsAppUrl(getRegistrationWhatsAppMessage(selectedRegForModal))}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-white" />
                    <span>Contactar Administración por WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedRegForModal(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3.5 px-5 rounded-xl transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

