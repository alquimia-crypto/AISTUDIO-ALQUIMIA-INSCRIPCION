import React, { useState } from 'react';
import { 
  getMockStudents, 
  saveMockStudents, 
  getMockSchedules, 
  saveMockSchedules, 
  getMockRegistrations, 
  saveMockRegistrations,
  resetMockDataToDefault 
} from '../services/api';
import { AlumnaNivel, SedeHorario, Inscripcion } from '../types';
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
  MailCheck
} from 'lucide-react';

export const SheetInspector: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inscripciones' | 'alumnas' | 'horarios'>('inscripciones');
  const [students, setStudents] = useState<AlumnaNivel[]>(getMockStudents());
  const [schedules, setSchedules] = useState<SedeHorario[]>(getMockSchedules());
  const [registrations, setRegistrations] = useState<Inscripcion[]>(getMockRegistrations());
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  const refreshLocalState = () => {
    setStudents(getMockStudents());
    setSchedules(getMockSchedules());
    setRegistrations(getMockRegistrations());
  };

  const handleReset = () => {
    if (confirm('¿Deseas reiniciar los datos de prueba a su estado original?')) {
      resetMockDataToDefault();
      refreshLocalState();
      showBanner('Datos del simulador reiniciados a valores iniciales.');
    }
  };

  const showBanner = (msg: string) => {
    setNotificationBanner(msg);
    setTimeout(() => setNotificationBanner(null), 4000);
  };

  /**
   * Simulates the Apps Script trigger `enviarConfirmacionFinal()`
   * When admin updates status to 'Confirmado', Notificado_Confirmacion updates to 'SI' and fires email
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
      showBanner(`Trigger simulado: Estado cambiado a 'Confirmado'. Se ha enviado el correo de confirmación final y marcado Notificado_Confirmacion='SI'.`);
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center space-x-1.5 bg-purple-500/30 text-purple-200 text-xs px-3 py-1 rounded-full font-medium mb-2 border border-purple-500/30">
            <Database className="w-3.5 h-3.5" />
            <span>Simulador de Google Sheets en Vivo</span>
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Inspector de Pestañas y Trigger de Correo</h2>
        </div>

        <button
          onClick={handleReset}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reiniciar Datos de Prueba</span>
        </button>
      </div>

      {/* Simulated Email Trigger Banner */}
      {notificationBanner && (
        <div className="bg-emerald-900 text-emerald-100 p-4 rounded-2xl border border-emerald-700 shadow-lg text-xs font-medium flex items-center space-x-2 animate-fade-in">
          <MailCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{notificationBanner}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('inscripciones')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 px-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'inscripciones' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Inscripciones ({registrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('alumnas')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 px-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'alumnas' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Alumnas_Niveles ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('horarios')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 px-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'horarios' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Sedes_Horarios ({schedules.length})</span>
        </button>
      </div>

      {/* TAB 1: INSCRIPCIONES (Includes state toggling to test trigger enviarConfirmacionFinal) */}
      {activeTab === 'inscripciones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
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
              💡 Cambia el estado a <strong>"Confirmado"</strong> para simular el trigger de correo automático.
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
                    <th className="p-3 border-b">Notificado</th>
                    <th className="p-3 border-b">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegistrations.map((row) => (
                    <tr key={row.ID_Registro} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{row.ID_Registro}</td>
                      <td className="p-3 text-slate-600">{row.Fecha_Registro}</td>
                      <td className="p-3 font-mono text-slate-700">{row.ID_Cliente}</td>
                      <td className="p-3 font-bold text-slate-900">{row.Nombre_Alumna}</td>
                      <td className="p-3 text-slate-700">{row.Sede}</td>
                      <td className="p-3 text-slate-700">{row.Horario_Seleccionado}</td>
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
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-800 font-bold font-mono">
                <tr>
                  <th className="p-3 border-b">ID_Cliente</th>
                  <th className="p-3 border-b">Nombre_Representante</th>
                  <th className="p-3 border-b">Telefono_WhatsApp</th>
                  <th className="p-3 border-b">Email</th>
                  <th className="p-3 border-b">Nombre_Alumna</th>
                  <th className="p-3 border-b">Nivel_Asignado</th>
                  <th className="p-3 border-b">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.ID_Cliente} className="hover:bg-slate-50">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SEDES_HORARIOS */}
      {activeTab === 'horarios' && (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((sch) => (
                  <tr key={sch.ID_Horario} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{sch.ID_Horario}</td>
                    <td className="p-3 font-medium text-slate-800">{sch.Sede}</td>
                    <td className="p-3 font-semibold text-purple-900">{sch.Nivel_Requerido}</td>
                    <td className="p-3 text-slate-700">{sch.Dia}</td>
                    <td className="p-3 text-slate-700">{sch.Horario}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
