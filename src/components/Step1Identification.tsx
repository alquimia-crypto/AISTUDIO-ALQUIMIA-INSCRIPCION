import React, { useState, useEffect } from 'react';
import { AlumnaNivel } from '../types';
import { searchStudentApi, saveStudentApi, getMockStudents, normalizeEmail } from '../services/api';
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
  MessageSquare,
  UserPlus,
  X,
  CreditCard,
  Layers
} from 'lucide-react';

interface Step1Props {
  onStudentVerified: (student: AlumnaNivel) => void;
}

// Funciones auxiliares de privacidad (Protección de datos personales)
function maskPhone(phone: any): string {
  if (phone === null || phone === undefined) return '';
  const clean = String(phone).trim();
  if (!clean) return '';
  if (clean.length <= 5) return clean;
  const start = clean.slice(0, 4);
  const end = clean.slice(-3);
  return `${start}••••${end}`;
}

function maskEmail(email: any): string {
  if (email === null || email === undefined) return '';
  const clean = String(email).trim();
  if (!clean || !clean.includes('@')) return clean;
  const [user, domain] = clean.split('@');
  if (user.length <= 2) return `${user.charAt(0)}•••@${domain}`;
  const visible = user.slice(0, 2);
  return `${visible}•••••@${domain}`;
}

export const Step1Identification: React.FC<Step1Props> = ({ onStudentVerified }) => {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [foundStudent, setFoundStudent] = useState<AlumnaNivel | null>(null);
  const [registeredStudents, setRegisteredStudents] = useState<AlumnaNivel[]>([]);
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState<string | null>(null);

  // Formulario de registro rápido
  const [newStudentData, setNewStudentData] = useState({
    Nombre_Alumna: '',
    Nombre_Representante: '',
    Email: '',
    Telefono_WhatsApp: '+593 ',
    ID_Cliente: '',
    Nivel_Asignado: 'Básico' as 'Básico' | 'Intermedio/Avanzado' | 'Avanzado'
  });

  useEffect(() => {
    setRegisteredStudents(getMockStudents());
  }, []);

  const handleSearch = async (queryToSearch?: string) => {
    const term = queryToSearch !== undefined ? queryToSearch : searchInput;
    if (!term.trim()) {
      setErrorMsg('Por favor ingresa tu correo electrónico registrado.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setFoundStudent(null);
    setRegisterSuccessMsg(null);

    try {
      const res = await searchStudentApi(term);
      if (res.success && res.data) {
        setFoundStudent(res.data);
      } else {
        setErrorMsg(res.message || 'No se encontró la alumna en el sistema.');
        // Pre-cargar el correo en el formulario de registro rápido
        const norm = normalizeEmail(term);
        setNewStudentData(prev => ({
          ...prev,
          Email: norm || term.trim().toLowerCase(),
          ID_Cliente: prev.ID_Cliente || `${Math.floor(1700000000 + Math.random() * 900000000)}`
        }));
      }
    } catch (err: any) {
      setErrorMsg('Error de conexión al consultar el servidor. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.Nombre_Alumna.trim()) {
      alert('Por favor ingresa el nombre de la alumna.');
      return;
    }
    const cleanRegEmail = normalizeEmail(newStudentData.Email);
    if (!cleanRegEmail || !cleanRegEmail.includes('@')) {
      alert('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setRegisterLoading(true);
    try {
      const studentToCreate: AlumnaNivel = {
        ID_Cliente: newStudentData.ID_Cliente.trim() || `${Math.floor(1700000000 + Math.random() * 900000000)}`,
        Nombre_Alumna: newStudentData.Nombre_Alumna.trim(),
        Nombre_Representante: newStudentData.Nombre_Representante.trim() || newStudentData.Nombre_Alumna.trim(),
        Email: cleanRegEmail,
        Telefono_WhatsApp: newStudentData.Telefono_WhatsApp.trim() || '+593999999999',
        Nivel_Asignado: newStudentData.Nivel_Asignado,
        Estado: 'Activo'
      };

      const res = await saveStudentApi(studentToCreate);
      if (res.success && res.data) {
        setRegisteredStudents(getMockStudents());
        setShowQuickRegister(false);
        setErrorMsg(null);
        setSearchInput(res.data.Email);
        setFoundStudent(res.data);
        setRegisterSuccessMsg(`¡Ficha de ${res.data.Nombre_Alumna} registrada con éxito en el sistema!`);
      } else {
        alert(res.message || 'Error al registrar la ficha.');
      }
    } catch (err) {
      alert('Ocurrió un error al guardar la ficha.');
    } finally {
      setRegisterLoading(false);
    }
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
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ingreso con Correo Electrónico</h2>
          <p className="text-purple-200 text-sm mt-1 max-w-2xl">
            Ingresa tu correo electrónico registrado como representante o alumna para consultar tu ficha académica y nivel asignado.
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
          <button
            type="button"
            onClick={() => {
              setNewStudentData(prev => ({
                ...prev,
                Email: searchInput.trim().toLowerCase(),
                ID_Cliente: prev.ID_Cliente || `${Math.floor(1700000000 + Math.random() * 900000000)}`
              }));
              setShowQuickRegister(true);
            }}
            className="text-xs text-purple-700 font-bold hover:text-purple-900 flex items-center space-x-1 cursor-pointer bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>¿Alumna nueva o prueba? Crear Ficha Rápida</span>
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-500">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="text"
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
            className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold px-7 py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md shadow-purple-200 disabled:opacity-60 cursor-pointer text-sm sm:text-base shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Ingresar al Sistema</span>
              </>
            )}
          </button>
        </form>

        {/* Sugerencias rápidas para pruebas locales */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Cuentas de prueba rápidas:</span>
          </span>
          {registeredStudents.slice(0, 5).map((st) => (
            <button
              key={st.ID_Cliente || st.Email}
              type="button"
              onClick={() => {
                setSearchInput(st.Email);
                handleSearch(st.Email);
              }}
              className="bg-purple-50 hover:bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg font-medium border border-purple-200 transition-colors cursor-pointer"
            >
              {st.Email} ({st.Nivel_Asignado})
            </button>
          ))}
        </div>
      </div>

      {/* Success Notification if just registered */}
      {registerSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-900 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{registerSuccessMsg}</p>
        </div>
      )}

      {/* Modal / Panel: Registrar Ficha Rápida */}
      {showQuickRegister && (
        <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 border-2 border-purple-300 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-purple-600 text-white shadow-sm">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Registrar Ficha de Alumna</h3>
                <p className="text-xs text-slate-500">
                  Agrega los datos de la alumna para ingresar de inmediato al selector de horarios.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickRegister(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleQuickRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Nombre Completo de la Alumna <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Paula Rodríguez"
                  value={newStudentData.Nombre_Alumna}
                  onChange={(e) => setNewStudentData({ ...newStudentData, Nombre_Alumna: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Nombre del Representante o Titular
                </label>
                <input
                  type="text"
                  placeholder="Ej. María Elena Torres (o el mismo de la alumna)"
                  value={newStudentData.Nombre_Representante}
                  onChange={(e) => setNewStudentData({ ...newStudentData, Nombre_Representante: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ej. paula.rodriguez@gmail.com"
                  value={newStudentData.Email}
                  onChange={(e) => setNewStudentData({ ...newStudentData, Email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Teléfono WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="Ej. +593991234567"
                  value={newStudentData.Telefono_WhatsApp}
                  onChange={(e) => setNewStudentData({ ...newStudentData, Telefono_WhatsApp: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Nivel Asignado
                </label>
                <select
                  value={newStudentData.Nivel_Asignado}
                  onChange={(e) => setNewStudentData({ ...newStudentData, Nivel_Asignado: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none text-sm font-medium cursor-pointer"
                >
                  <option value="Básico">Básico</option>
                  <option value="Intermedio/Avanzado">Intermedio/Avanzado</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Cédula / Identificación
                </label>
                <input
                  type="text"
                  placeholder="Ej. 1720304050"
                  value={newStudentData.ID_Cliente}
                  onChange={(e) => setNewStudentData({ ...newStudentData, ID_Cliente: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-purple-100">
              <button
                type="button"
                onClick={() => setShowQuickRegister(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={registerLoading}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-md shadow-purple-200 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {registerLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando Ficha...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Guardar Ficha e Ingresar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error / Not Found Message */}
      {errorMsg && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 space-y-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 text-base">Alumna no encontrada con este correo</h4>
              <p className="text-sm text-amber-800">{errorMsg}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setNewStudentData(prev => ({
                  ...prev,
                  Email: searchInput.trim().toLowerCase(),
                  ID_Cliente: prev.ID_Cliente || `${Math.floor(1700000000 + Math.random() * 900000000)}`
                }));
                setShowQuickRegister(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md shadow-purple-200 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>✨ Registrar Ficha Rápida con "{searchInput.trim() || 'este correo'}"</span>
            </button>

            <a
              href={`https://wa.me/593983944951?text=${encodeURIComponent(`Hola Alquimia Danza Aérea, necesito ayuda para verificar el correo de registro de mi alumna (correo ingresado: ${searchInput.trim() || 'no especificado'})`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center space-x-1.5 text-xs font-semibold bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contactar Secretaría (WhatsApp 0983944951)</span>
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
              <p className="font-semibold text-slate-900 mt-1 font-mono">{maskPhone(foundStudent.Telefono_WhatsApp)}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-xs text-slate-500 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Correo Electrónico</span>
              </span>
              <p className="font-semibold text-slate-900 mt-1 truncate font-mono">{maskEmail(foundStudent.Email)}</p>
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

