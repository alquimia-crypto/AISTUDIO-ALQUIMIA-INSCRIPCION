import React, { useState } from 'react';
import { AlumnaNivel } from '../types';
import { searchStudentApi } from '../services/api';
import { 
  Search, 
  User, 
  Phone, 
  Mail, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';

interface Step1Props {
  onStudentVerified: (student: AlumnaNivel) => void;
}

export const Step1Identification: React.FC<Step1Props> = ({ onStudentVerified }) => {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [foundStudent, setFoundStudent] = useState<AlumnaNivel | null>(null);

  const handleSearch = async (queryToSearch?: string) => {
    const term = queryToSearch !== undefined ? queryToSearch : searchInput;
    if (!term.trim()) {
      setErrorMsg('Por favor ingresa un número de cédula o teléfono de registro.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setFoundStudent(null);

    try {
      const res = await searchStudentApi(term);
      if (res.success && res.data) {
        setFoundStudent(res.data);
      } else {
        setErrorMsg(res.message || 'No se encontró la alumna en el sistema.');
      }
    } catch (err: any) {
      setErrorMsg('Error de conexión al consultar el servidor. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (val: string) => {
    setSearchInput(val);
    handleSearch(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
          <span className="inline-flex items-center space-x-1.5 bg-purple-500/30 text-purple-200 text-xs px-3 py-1 rounded-full font-medium mb-3 backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Paso 1 de 3 ・ Verificación de Ficha</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Identificación de la Alumna</h2>
          <p className="text-purple-200 text-sm mt-1 max-w-2xl">
            Ingresa el número de Cédula/ID del representante o el teléfono registrado para verificar el nivel asignado a la estudiante.
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <label className="block text-sm font-semibold text-slate-800">
          Cédula / Identificación / WhatsApp del Representante
        </label>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ej: 1726354490 o 0998765432"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-base transition-all"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md shadow-purple-200 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Consultando...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Buscar Alumna</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Test Fillers */}
        <div className="pt-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>IDs de prueba rápida (Datos de ejemplo en Google Sheets):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickFill('1726354490')}
              className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors font-medium flex items-center space-x-1 cursor-pointer"
            >
              <span>Sofia Torres (Principiante)</span>
              <span className="text-purple-400 font-mono text-[10px]">1726354490</span>
            </button>
            <button
              onClick={() => handleQuickFill('0991234567')}
              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors font-medium flex items-center space-x-1 cursor-pointer"
            >
              <span>Camila Mendoza (Intermedio)</span>
              <span className="text-indigo-400 font-mono text-[10px]">0991234567</span>
            </button>
            <button
              onClick={() => handleQuickFill('0987654321')}
              className="text-xs bg-pink-50 hover:bg-pink-100 text-pink-700 px-3 py-1.5 rounded-lg border border-pink-200 transition-colors font-medium flex items-center space-x-1 cursor-pointer"
            >
              <span>Isabella Benítez (Avanzado)</span>
              <span className="text-pink-400 font-mono text-[10px]">0987654321</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error / Not Found Message */}
      {errorMsg && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 space-y-3">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 text-base">Alumna no encontrada en la base de datos</h4>
              <p className="text-sm text-amber-800 mt-1">{errorMsg}</p>
            </div>
          </div>
          <div className="bg-white/80 rounded-xl p-4 border border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-amber-900">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>¿Es tu primera vez o necesitas actualizar tus datos?</span>
            </div>
            <a
              href="https://wa.me/593998765432?text=Hola,%20necesito%20ayuda%20para%20registrar%20a%20mi%20alumna%20en%20el%20sistema"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contactar Secretaría vía WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* Student Found Verified Card */}
      {foundStudent && (
        <div className="bg-gradient-to-b from-white to-purple-50/40 border-2 border-purple-200 rounded-2xl p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-5">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-purple-200">
                {foundStudent.Nombre_Alumna.charAt(0)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Alumna Activa</span>
                  </span>
                  <span className="text-xs text-slate-500 font-mono">ID: {foundStudent.ID_Cliente}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{foundStudent.Nombre_Alumna}</h3>
              </div>
            </div>

            {/* Level Badge */}
            <div className="bg-purple-100 border border-purple-200 rounded-xl p-3 text-right">
              <span className="text-xs text-purple-700 font-medium block">Nivel Asignado:</span>
              <span className="text-lg font-bold text-purple-900">{foundStudent.Nivel_Asignado}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-xs text-slate-500 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Representante</span>
              </span>
              <p className="font-semibold text-slate-900 mt-1">{foundStudent.Nombre_Representante}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-xs text-slate-500 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Teléfono WhatsApp</span>
              </span>
              <p className="font-semibold text-slate-900 mt-1">{foundStudent.Telefono_WhatsApp}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-xs text-slate-500 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Correo Electrónico</span>
              </span>
              <p className="font-semibold text-slate-900 mt-1 truncate">{foundStudent.Email}</p>
            </div>
          </div>

          {/* Proceed Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onStudentVerified(foundStudent)}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-purple-200 cursor-pointer"
            >
              <span>Continuar a Selección de Horario</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
