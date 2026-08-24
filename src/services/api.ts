import { 
  AlumnaNivel, 
  SedeHorario, 
  Inscripcion, 
  AppSettings, 
  ApiSearchResponse, 
  ApiSchedulesResponse, 
  ApiRegistrationResponse 
} from '../types';
import { INITIAL_STUDENTS, INITIAL_SCHEDULES, INITIAL_REGISTRATIONS } from '../data/mockData';

const SETTINGS_KEY = 'app_gas_settings_v1';
const MOCK_STUDENTS_KEY = 'app_mock_students_v1';
const MOCK_SCHEDULES_KEY = 'app_mock_schedules_v1';
const MOCK_REGISTRATIONS_KEY = 'app_mock_registrations_v1';
const ADMIN_PIN_KEY = 'app_admin_pin_v1';
const ADMIN_SESSION_KEY = 'app_admin_session_v1';

const DEFAULT_ADMIN_PIN = '1234';

// Admin Authentication & Session helpers
export function getAdminPin(): string {
  const saved = localStorage.getItem(ADMIN_PIN_KEY);
  return saved || DEFAULT_ADMIN_PIN;
}

export function setAdminPin(newPin: string): boolean {
  if (!newPin || newPin.trim().length < 4) {
    return false;
  }
  localStorage.setItem(ADMIN_PIN_KEY, newPin.trim());
  return true;
}

export function checkAdminPin(enteredPin: string): boolean {
  const currentPin = getAdminPin();
  return enteredPin.trim() === currentPin;
}

export function isAdminSessionActive(): boolean {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function setAdminSession(active: boolean): void {
  if (active) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

// Default settings
export function getAppSettings(): AppSettings {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return {
    gasWebAppUrl: '',
    useMockMode: true
  };
}

export function saveAppSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Data store helpers for local simulation
export function getMockStudents(): AlumnaNivel[] {
  const saved = localStorage.getItem(MOCK_STUDENTS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  localStorage.setItem(MOCK_STUDENTS_KEY, JSON.stringify(INITIAL_STUDENTS));
  return INITIAL_STUDENTS;
}

export function saveMockStudents(data: AlumnaNivel[]): void {
  localStorage.setItem(MOCK_STUDENTS_KEY, JSON.stringify(data));
}

export function getMockSchedules(): SedeHorario[] {
  const saved = localStorage.getItem(MOCK_SCHEDULES_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  localStorage.setItem(MOCK_SCHEDULES_KEY, JSON.stringify(INITIAL_SCHEDULES));
  return INITIAL_SCHEDULES;
}

export function saveMockSchedules(data: SedeHorario[]): void {
  localStorage.setItem(MOCK_SCHEDULES_KEY, JSON.stringify(data));
}

export function getMockRegistrations(): Inscripcion[] {
  const saved = localStorage.getItem(MOCK_REGISTRATIONS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  localStorage.setItem(MOCK_REGISTRATIONS_KEY, JSON.stringify(INITIAL_REGISTRATIONS));
  return INITIAL_REGISTRATIONS;
}

export function saveMockRegistrations(data: Inscripcion[]): void {
  localStorage.setItem(MOCK_REGISTRATIONS_KEY, JSON.stringify(data));
}

export function resetMockDataToDefault(): void {
  localStorage.setItem(MOCK_STUDENTS_KEY, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(MOCK_SCHEDULES_KEY, JSON.stringify(INITIAL_SCHEDULES));
  localStorage.setItem(MOCK_REGISTRATIONS_KEY, JSON.stringify(INITIAL_REGISTRATIONS));
}

/**
 * 🔍 API: Buscar Alumna por ID o Teléfono
 */
export async function searchStudentApi(idOrPhone: string): Promise<ApiSearchResponse> {
  const settings = getAppSettings();
  const cleanSearch = idOrPhone.trim().replace(/\D/g, '');

  if (!cleanSearch) {
    return { success: false, message: 'Ingrese una cédula o número de teléfono válido.' };
  }

  // Si está configurada la URL de GAS y no está forzado el modo simulador
  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const url = `${settings.gasWebAppUrl}?action=getStudent&id=${encodeURIComponent(cleanSearch)}`;
      const res = await fetch(url);
      const json = await res.json();
      return json;
    } catch (error) {
      console.warn('Error llamando al Apps Script Web App live. Usando modo simulador local.', error);
      // Fallback a simulador local
    }
  }

  // Simulador Local
  await new Promise((resolve) => setTimeout(resolve, 400)); // Latencia realista
  const students = getMockStudents();

  const found = students.find((s) => {
    const sId = s.ID_Cliente.replace(/\D/g, '');
    const sPhone = s.Telefono_WhatsApp.replace(/\D/g, '');
    return sId === cleanSearch || sPhone.endsWith(cleanSearch);
  });

  if (!found) {
    return {
      success: false,
      message: 'No encontramos una alumna registrada con la identificación o teléfono ingresado. Verifique el número o comuníquese con secretaría.'
    };
  }

  if (found.Estado === 'Inactivo') {
    return {
      success: false,
      message: 'La alumna figura como inactiva en la base de datos. Por favor contáctanos directamente para reactivar su ficha.'
    };
  }

  return {
    success: true,
    data: found
  };
}

/**
 * 📅 API: Obtener Horarios filtrados por Nivel
 */
export async function getSchedulesApi(nivelRequerido: string): Promise<ApiSchedulesResponse> {
  const settings = getAppSettings();

  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const url = `${settings.gasWebAppUrl}?action=getSchedules&nivel=${encodeURIComponent(nivelRequerido)}`;
      const res = await fetch(url);
      const json = await res.json();
      return json;
    } catch (error) {
      console.warn('Error llamando al Apps Script Web App live. Usando simulador local.', error);
    }
  }

  // Simulador local
  await new Promise((resolve) => setTimeout(resolve, 300));
  const schedules = getMockSchedules();

  const filtered = schedules.filter(
    (s) => !nivelRequerido || s.Nivel_Requerido.toLowerCase().trim() === nivelRequerido.toLowerCase().trim()
  );

  return {
    success: true,
    data: filtered.map((s) => ({
      ...s,
      Estado_Horario: s.Cupos_Ocupados >= s.Cupo_Maximo ? 'Lleno' : 'Disponible'
    }))
  };
}

/**
 * 📤 API: Registrar Inscripción y guardar Comprobante
 */
export async function submitRegistrationApi(payload: {
  idCliente: string;
  nombreAlumna: string;
  sede: string;
  horarioSeleccionado: string;
  idHorario?: string;
  fileBase64?: string;
  fileName?: string;
  fileMimeType?: string;
}): Promise<ApiRegistrationResponse> {
  const settings = getAppSettings();

  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      // GAS exige enviar POST con JSON
      const res = await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // evita preflight estricto en GAS
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return json;
    } catch (error) {
      console.warn('Error registrando en Apps Script live. Guardando en modo simulador.', error);
    }
  }

  // Simulador Local
  await new Promise((resolve) => setTimeout(resolve, 800));

  const registrations = getMockRegistrations();
  const schedules = getMockSchedules();

  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
  const idRegistro = `INS-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Simular guardado de archivo en Drive
  const mockDriveUrl = payload.fileBase64 
    ? `https://drive.google.com/file/d/mock-drive-${Date.now()}/view`
    : 'Sin comprobante';

  const newReg: Inscripcion = {
    ID_Registro: idRegistro,
    Fecha_Registro: dateStr,
    ID_Cliente: payload.idCliente,
    Nombre_Alumna: payload.nombreAlumna,
    Sede: payload.sede,
    Horario_Seleccionado: payload.horarioSeleccionado,
    URL_Comprobante_Drive: mockDriveUrl,
    Estado_Inscripcion: 'Pendiente',
    Notificado_Confirmacion: 'NO',
    Comprobante_Nombre: payload.fileName,
    Comprobante_Base64: payload.fileBase64
  };

  registrations.unshift(newReg);
  saveMockRegistrations(registrations);

  // Actualizar cupo ocupado en horarios
  let scheduleUpdated = false;
  const updatedSchedules = schedules.map((sch) => {
    if ((payload.idHorario && sch.ID_Horario === payload.idHorario) || 
        (sch.Sede === payload.sede && payload.horarioSeleccionado.includes(sch.Horario))) {
      scheduleUpdated = true;
      const newOccupied = Math.min(sch.Cupos_Ocupados + 1, sch.Cupo_Maximo);
      return {
        ...sch,
        Cupos_Ocupados: newOccupied,
        Estado_Horario: newOccupied >= sch.Cupo_Maximo ? ('Lleno' as const) : ('Disponible' as const)
      };
    }
    return sch;
  });

  if (scheduleUpdated) {
    saveMockSchedules(updatedSchedules);
  }

  return {
    success: true,
    message: '¡Inscripción recibida con éxito! Tu comprobante fue guardado y está en revisión.',
    ID_Registro: idRegistro,
    URL_Comprobante_Drive: mockDriveUrl
  };
}

/**
 * 📋 Consultar Inscripciones guardadas por ID_Cliente
 */
export async function getRegistrationsByStudentId(idCliente: string): Promise<Inscripcion[]> {
  const settings = getAppSettings();
  const cleanId = idCliente.trim().replace(/\D/g, '');

  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const url = `${settings.gasWebAppUrl}?action=getRegistrations&id=${encodeURIComponent(cleanId)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    } catch (e) {
      console.warn('Error fetching registrations live', e);
    }
  }

  // Simulador local
  const all = getMockRegistrations();
  return all.filter((r) => r.ID_Cliente.replace(/\D/g, '') === cleanId);
}

/**
 * 🗓️ Guardar o Editar un Horario (Conecta con Google Sheets / Apps Script)
 */
export async function saveScheduleApi(schedule: SedeHorario): Promise<{ success: boolean; message: string; ID_Horario?: string }> {
  const settings = getAppSettings();
  
  // 1. Siempre actualizar el estado local para reactividad inmediata
  const schedules = getMockSchedules();
  const index = schedules.findIndex((s) => s.ID_Horario === schedule.ID_Horario);
  let updatedList: SedeHorario[];
  
  if (index >= 0) {
    updatedList = [...schedules];
    updatedList[index] = schedule;
  } else {
    updatedList = [schedule, ...schedules];
  }
  saveMockSchedules(updatedList);

  // 2. Si Google Sheets está conectado en vivo, enviar la petición POST
  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const payload = {
        action: 'saveSchedule',
        ID_Horario: schedule.ID_Horario,
        Sede: schedule.Sede,
        Nivel_Requerido: schedule.Nivel_Requerido,
        Dia: schedule.Dia,
        Horario: schedule.Horario,
        Cupo_Maximo: schedule.Cupo_Maximo,
        Cupos_Ocupados: schedule.Cupos_Ocupados,
        Estado_Horario: schedule.Cupos_Ocupados >= schedule.Cupo_Maximo ? 'Lleno' : schedule.Estado_Horario
      };

      const res = await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return {
        success: json.success ?? true,
        message: json.message || 'Horario guardado y sincronizado con Google Sheets.',
        ID_Horario: schedule.ID_Horario
      };
    } catch (error) {
      console.warn('Error sincronizando horario con Apps Script en vivo:', error);
      return {
        success: true,
        message: 'Guardado localmente. (Error de red al sincronizar con Google Sheets)',
        ID_Horario: schedule.ID_Horario
      };
    }
  }

  return {
    success: true,
    message: index >= 0 
      ? `Horario ${schedule.ID_Horario} actualizado correctamente.` 
      : `Nuevo horario ${schedule.ID_Horario} creado correctamente.`,
    ID_Horario: schedule.ID_Horario
  };
}

/**
 * 🗑️ Eliminar un Horario (Conecta con Google Sheets / Apps Script)
 */
export async function deleteScheduleApi(idHorario: string): Promise<{ success: boolean; message: string }> {
  const settings = getAppSettings();

  // 1. Actualizar estado local
  const schedules = getMockSchedules();
  const updatedList = schedules.filter((s) => s.ID_Horario !== idHorario);
  saveMockSchedules(updatedList);

  // 2. Si Google Sheets está conectado en vivo, enviar acción deleteSchedule
  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const payload = {
        action: 'deleteSchedule',
        idHorario: idHorario
      };

      const res = await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return {
        success: json.success ?? true,
        message: json.message || `Horario ${idHorario} eliminado en Google Sheets.`
      };
    } catch (error) {
      console.warn('Error eliminando horario en Apps Script:', error);
      return {
        success: true,
        message: `Eliminado localmente. (Error de red con Google Sheets)`
      };
    }
  }

  return {
    success: true,
    message: `Horario ${idHorario} eliminado correctamente.`
  };
}

/**
 * 🔄 Sincronizar Masivamente Todos los Horarios con Google Sheets
 */
export async function bulkSyncSchedulesApi(schedulesList: SedeHorario[]): Promise<{ success: boolean; message: string }> {
  const settings = getAppSettings();
  saveMockSchedules(schedulesList);

  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const payload = {
        action: 'syncAllSchedules',
        schedules: schedulesList
      };

      const res = await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return {
        success: json.success ?? true,
        message: json.message || `${schedulesList.length} horarios sincronizados con Google Sheets.`
      };
    } catch (error) {
      console.warn('Error sincronizando masivamente con Google Sheets:', error);
      return {
        success: false,
        message: 'No se pudo conectar con Google Apps Script. Se guardó copia local.'
      };
    }
  }

  return {
    success: true,
    message: `${schedulesList.length} horarios guardados y listos.`
  };
}

/**
 * 📥 Traer Horarios en Vivo desde Google Sheets
 */
export async function fetchLiveSchedulesFromSheetApi(): Promise<{ success: boolean; data?: SedeHorario[]; message?: string }> {
  const settings = getAppSettings();

  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const url = `${settings.gasWebAppUrl}?action=getAllSchedules`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        saveMockSchedules(json.data);
        return {
          success: true,
          data: json.data,
          message: `Se descargaron ${json.data.length} horarios en vivo desde tu Google Sheet.`
        };
      }
    } catch (error) {
      console.warn('Error al consultar horarios en vivo:', error);
      return {
        success: false,
        message: 'No se pudo conectar con Google Sheets. Mostrando datos locales.'
      };
    }
  }

  const local = getMockSchedules();
  return {
    success: true,
    data: local,
    message: `Cargados ${local.length} horarios (Modo Local / Sin URL configurada).`
  };
}
