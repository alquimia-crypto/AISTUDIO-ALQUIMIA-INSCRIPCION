import React, { useState } from 'react';
import { Inscripcion } from '../types';
import { getRegistrationsByStudentId } from '../services/api';
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
  Sparkles
} from 'lucide-react';

export const StatusChecker: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [registrations, setRegistrations] = useState<Inscripcion[]>([]);

  const handleSearch = async (query?: string) => {
    const term = query !== undefined ? query : searchInput;
    if (!term.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const results = await getRegistrationsByStudentId(term);
      setRegistrations(results);
    } catch (e) {
      console.error(e);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center space-x-1.5 bg-purple-500/30 text-purple-200 text-xs px-3 py-1 rounded-full font-medium mb-3 backdrop-blur-xs">
            <Search className="w-3.5 h-3.5" />
            <span>Consulta Pública de Cupos</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Consulta el Estado de tu Inscripción</h2>
          <p className="text-purple-200 text-sm mt-1 max-w-2xl">
            Ingresa la Cédula/ID del representante o el número de WhatsApp para ver tus reservas y el estado de confirmación por tesorería.
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ingresa tu Cédula / Identificación o WhatsApp"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-base transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md shadow-purple-200 cursor-pointer disabled:opacity-50"
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
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm space-y-3">
              <Clock className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-base">No hay inscripciones registradas para esta identificación</h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Verifica que el número coincida con la Cédula/ID ingresada durante el registro de la alumna.
              </p>
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

                    {/* Status Badge */}
                    {reg.Estado_Inscripcion === 'Confirmado' ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-3 py-1.5 rounded-xl font-bold inline-flex items-center space-x-1.5 self-start sm:self-auto">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>¡Cupo Confirmado!</span>
                      </span>
                    ) : reg.Estado_Inscripcion === 'Rechazado' ? (
                      <span className="bg-red-100 text-red-800 border border-red-200 text-xs px-3 py-1.5 rounded-xl font-bold inline-flex items-center space-x-1.5 self-start sm:self-auto">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Rechazado</span>
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-900 border border-amber-200 text-xs px-3 py-1.5 rounded-xl font-bold inline-flex items-center space-x-1.5 self-start sm:self-auto">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Pendiente de Revisión</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span>Sede: <strong>{reg.Sede}</strong></span>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-700">
                      <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span>Horario: <strong>{reg.Horario_Seleccionado}</strong></span>
                    </div>
                  </div>

                  {reg.URL_Comprobante_Drive && reg.URL_Comprobante_Drive !== 'Sin comprobante' && (
                    <div className="pt-2 flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-600 flex items-center space-x-1.5 font-medium">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span>Comprobante de Pago de la Inscripción:</span>
                      </span>
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Registrado</span>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
